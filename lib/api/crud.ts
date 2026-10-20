import { api, errorMessage } from "@/lib/api/client"
import { clean } from "@/lib/api/mappers"
import { useDataStore, type CollectionKey } from "@/lib/stores/data-store"
import { notify } from "@/lib/toast"

/** POSTs a new record, stores what the server returned, and reports failure with a toast. Returns true on success. */
export async function createRecord<T extends { id: string }>(
  path: string,
  collection: CollectionKey,
  body: Record<string, unknown>,
  what: string,
  map: (raw: unknown) => T = (raw) => clean<T>(raw)
): Promise<boolean> {
  try {
    const row = map(await api(path, { method: "POST", body: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== "" && v !== undefined)) }))
    useDataStore.getState().upsert(collection, row as never)
    return true
  } catch (e) {
    notify.error(`Could not add the ${what}`, errorMessage(e))
    return false
  }
}
