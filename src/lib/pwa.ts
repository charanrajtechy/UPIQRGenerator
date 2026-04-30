// PWA registration + install prompt handling.
// IMPORTANT: Service worker is intentionally NOT registered inside the Lovable
// editor preview / iframe contexts to avoid stale builds and broken navigation.

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BIPEvent | null = null;
const listeners = new Set<(available: boolean) => void>();

let waitingWorker: ServiceWorker | null = null;
const updateListeners = new Set<(available: boolean) => void>();

function emitUpdate() {
  updateListeners.forEach((cb) => cb(!!waitingWorker));
}

export function onUpdateAvailable(cb: (available: boolean) => void) {
  updateListeners.add(cb);
  cb(!!waitingWorker);
  return () => updateListeners.delete(cb);
}

export function applyUpdate() {
  if (!waitingWorker) {
    window.location.reload();
    return;
  }
  // Tell the waiting SW to activate; controllerchange handler reloads the page
  waitingWorker.postMessage({ type: "SKIP_WAITING" });
}

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isPreviewHost(): boolean {
  const h = window.location.hostname;
  return (
    h.includes("id-preview--") ||
    h.includes("lovableproject.com") ||
    h === "localhost" ||
    h === "127.0.0.1"
  );
}

function emit() {
  listeners.forEach((cb) => cb(!!deferredPrompt));
}

export function onInstallAvailabilityChange(cb: (available: boolean) => void) {
  listeners.add(cb);
  cb(!!deferredPrompt);
  return () => listeners.delete(cb);
}

export function isInstallAvailable() {
  return !!deferredPrompt;
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) return "unavailable";
  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  emit();
  return choice.outcome;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function initPwa() {
  if (typeof window === "undefined") return;

  // Always listen for the install prompt — works everywhere except inside iframes.
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BIPEvent;
    emit();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emit();
  });

  // Guard service worker registration so the Lovable editor preview is never
  // poisoned by a cached build. SW only runs on real deployed origins.
  if (!("serviceWorker" in navigator)) return;

  if (isInIframe() || isPreviewHost()) {
    // Clean up any previously registered SW from this origin
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {
        /* silent */
      });
  });
}
