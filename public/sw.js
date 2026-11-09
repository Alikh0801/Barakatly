/*
 * Barakatly's service worker. It makes the site installable as an app and
 * will carry push notifications. It caches nothing and handles no
 * requests: every page and every request goes to the network as before,
 * so a deploy is never hidden behind an old copy.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
