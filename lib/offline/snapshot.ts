import { useDataStore } from "@/lib/stores/data-store"

/**
 * A copy of what the till needs (catalogue, customers, branches, the open shift, the industry setup) kept on this device,
 * so the app can start and sell when the network is down. It is replaced after every successful load and wiped on sign-out.
 */
const DB = "pos-offline"
const STORE = "snapshots"
const KEYS = [
  "business", "industry", "branches", "warehouses", "categories", "brands", "suppliers", "products", "customers", "customerGroups",
  "promotions", "coupons", "shiftRecords", "employees", "users",
] as const

interface Snapshot { userId: string; savedAt: string; data: Record<string, unknown> }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"))
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const req = fn(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(req.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function saveSnapshot(userId: string): Promise<void> {
  try {
    const s = useDataStore.getState() as unknown as Record<string, unknown>
    const data: Record<string, unknown> = {}
    for (const k of KEYS) data[k] = s[k]
    const snap: Snapshot = { userId, savedAt: new Date().toISOString(), data }
    await run("readwrite", (store) => store.put(snap, "current"))
  } catch { /* the snapshot is a convenience; never break the app over it */ }
}

/** Puts the saved copy back into the data store. Only for the same signed-in person. Returns when it was saved, or null. */
export async function restoreSnapshot(userId: string): Promise<string | null> {
  try {
    const snap = await run<Snapshot | undefined>("readonly", (store) => store.get("current"))
    if (!snap || snap.userId !== userId || !snap.data.business) return null
    useDataStore.setState({ ...snap.data, offlineSnapshotAt: snap.savedAt })
    return snap.savedAt
  } catch {
    return null
  }
}

export async function clearSnapshot(): Promise<void> {
  try { await run("readwrite", (store) => store.delete("current")) } catch { /* nothing to clear */ }
}
