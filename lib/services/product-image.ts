/**
 * Looks up a product photo online via our own /api/product-image route (Open Food Facts behind it).
 * Fails quietly: no network or no match just returns null.
 */
const cache = new Map<string, string | null>()

export async function fetchProductImage(barcode: string, name?: string): Promise<string | null> {
  const key = `${barcode}|${name ?? ""}`
  if (cache.has(key)) return cache.get(key) ?? null
  let image: string | null = null
  try {
    const params = new URLSearchParams({ barcode })
    if (name) params.set("name", name)
    const res = await fetch(`/api/product-image?${params}`, { signal: AbortSignal.timeout(12000) })
    if (res.ok) image = ((await res.json()) as { image?: string | null }).image ?? null
  } catch {
    image = null
  }
  if (image) cache.set(key, image)
  return image
}
