/* Lets the till open and sell with no connection.
 *
 * - Built files (/_next/static, icons, fonts) never change for a given URL: served from the cache first.
 * - Pages and their data requests: network first, so people always get the newest version when online,
 *   falling back to the last copy seen when the network is down.
 * - Nothing that talks to the API is touched; the app handles those failures itself (it queues sales).
 *
 * Bump VERSION to drop everything cached by an older worker.
 */
const VERSION = "pos-shell-v1"

self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

const isStatic = (url) => url.pathname.startsWith("/_next/static/") || /\.(?:png|jpg|jpeg|svg|ico|webp|woff2?|webmanifest)$/.test(url.pathname)

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // the API lives elsewhere
  if (url.pathname.startsWith("/api/")) return
  if (url.pathname === "/sw.js") return

  if (isStatic(url)) {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const hit = await cache.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok) cache.put(req, res.clone())
        return res
      })
    )
    return
  }

  // pages (navigations) and Next's data requests for them
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone()
          caches.open(VERSION).then((cache) => cache.put(req, copy))
        }
        return res
      })
      .catch(async () => {
        const cache = await caches.open(VERSION)
        const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }))
        if (hit) return hit
        // Deliberately no "show the till instead" fallback: a page that renders as a different page is worse than a clear message.
        return new Response("You are offline and this page has not been opened on this device yet.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })
      })
  )
})
