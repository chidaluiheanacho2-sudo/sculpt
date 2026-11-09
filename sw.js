/* Offline cache for Sculpt. Bump CACHE when app files change. */
const CACHE = "sculpt-v1.5.0";
const SHELL = ["./", "index.html", "app.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (u.hostname.includes("fonts.g")) { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return res; }))); return; }
  if (u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return res; }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});
