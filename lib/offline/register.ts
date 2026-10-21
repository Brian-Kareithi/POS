/**
 * Installs the service worker that lets the till start with no connection. Only in production builds: in development the
 * worker would serve stale files and fight hot reload, so any worker left from an earlier run is removed instead.
 */
export function registerOfflineSupport() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return
  if (process.env.NODE_ENV !== "production") {
    void navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => void r.unregister())).catch(() => {})
    return
  }
  navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .then(() => navigator.serviceWorker.ready)
    // open the till once while online so its page is on the device for the next time the line drops
    .then(() => { void fetch("/").catch(() => {}); void fetch("/sales/new").catch(() => {}) })
    .catch(() => { /* offline support is a bonus; the app works without it */ })
}
