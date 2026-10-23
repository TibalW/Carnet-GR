/* Carnet des GR — fonctionnement hors connexion.
   Pour publier une mise à jour, change le numéro de VERSION ci-dessous. */
const VERSION = "carnet-gr-11";
const SHELL = ["./", "index.html", "data.js", "config.js", "leaflet.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const put = (req, res) => { if (res && (res.ok || res.type === "opaque")) { const c = res.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return res; };
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    // page et réglages : réseau d'abord (pour recevoir les mises à jour), sinon copie locale
    if (req.mode === "navigate" || u.pathname.endsWith("/config.js") || u.pathname.endsWith("/index.html")) {
      e.respondWith(fetch(req).then(r => put(req, r)).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
      return;
    }
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(r2 => put(req, r2))));
    return;
  }
  if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(r2 => put(req, r2))));
  }
  // Google Drive / connexion Google : jamais mis en cache
});
