// Service worker for Open UPI QR Generator
// Strategy:
//  - Precache the app shell on install
//  - Navigations: network-first, fall back to cached index.html (SPA offline)
//  - Same-origin GET assets: stale-while-revalidate so hashed Vite bundles
//    (JS/CSS/fonts/images) get cached on first load and served offline after
//  - Cross-origin GETs: try network, fall back to cache if present

const CACHE_VERSION = "v2";
const CACHE_NAME = `upi-qr-cache-${CACHE_VERSION}`;

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/favicon.ico",
  "/robots.txt",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Use individual puts so one missing file doesn't fail the whole install
      Promise.all(
        APP_SHELL.map((url) =>
          fetch(url, { cache: "no-cache" })
            .then((res) => (res && res.ok ? cache.put(url, res.clone()) : null))
            .catch(() => null)
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isCacheableAssetRequest(req, url) {
  if (req.method !== "GET") return false;
  if (url.origin !== self.location.origin) return false;
  // Skip the SW itself
  if (url.pathname === "/sw.js") return false;
  return true;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // SPA navigations: network-first, fall back to cached index.html
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Keep a fresh copy of index.html for offline navigations
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("/index.html").then((r) => r || caches.match("/")))
    );
    return;
  }

  // Same-origin assets (hashed JS/CSS/fonts/images): stale-while-revalidate
  if (isCacheableAssetRequest(req, url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200 && (res.type === "basic" || res.type === "default")) {
              cache.put(req, res.clone()).catch(() => {});
            }
            return res;
          })
          .catch(() => null);
        return cached || (await network) || new Response("", { status: 504 });
      })
    );
    return;
  }

  // Cross-origin GETs: network with cache fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req).then((r) => r || new Response("", { status: 504 })))
  );
});
