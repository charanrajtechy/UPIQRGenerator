import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { onInstallAvailabilityChange, promptInstall, isStandalone } from "@/lib/pwa";

const DISMISS_KEY = "pwa_install_banner_dismissed_until";
const DISMISS_DAYS = 7;

const InstallPrompt = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const dismissed = dismissedUntil && Date.now() < dismissedUntil;

    const off = onInstallAvailabilityChange((available) => {
      setCanInstall(available);
      if (available && !dismissed && !isStandalone()) {
        // Small delay so the banner feels intentional, not jarring
        setTimeout(() => setVisible(true), 600);
      } else {
        setVisible(false);
      }
    });
    return () => { off(); };
  }, []);

  const handleInstall = async () => {
    setBusy(true);
    const result = await promptInstall();
    setBusy(false);
    if (result === "accepted" || result === "dismissed") {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(until));
    setVisible(false);
  };

  if (!canInstall || !visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Open UPI QR Generator"
      className="w-full max-w-md mx-auto mb-3 px-3"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-card shadow-card p-3 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            Install Open UPI QR
          </p>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
            Add to your device for one-tap access. Works offline. No tracking.
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
