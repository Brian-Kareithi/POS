import { NextResponse } from "next/server"

interface OffProduct { image_front_url?: string; image_url?: string }
const pick = (p?: OffProduct) => p?.image_front_url || p?.image_url || null

function trustedImageUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" && (url.hostname === "openfoodfacts.org" || url.hostname.endsWith(".openfoodfacts.org"))
      ? url.toString()
      : null
  } catch {
    return null
  }
}

async function getJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "POS-Demo/1.0" } })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

/** Finds a product photo on Open Food Facts: by barcode first, then by name. Runs on the server so the browser has no CORS limits. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const barcode = (searchParams.get("barcode") ?? "").trim()
  const name = (searchParams.get("name") ?? "").trim().slice(0, 120)
  let image: string | null = null

  if (/^\d{6,14}$/.test(barcode)) {
    const data = (await getJson(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=image_front_url,image_url`
    )) as { status?: number; product?: OffProduct } | null
    if (data?.status === 1) image = trustedImageUrl(pick(data.product))
  }
  if (!image && name) {
    const data = (await getJson(
      `https://search.openfoodfacts.org/search?page_size=8&fields=image_front_url,image_url&q=${encodeURIComponent(name)}`
    )) as { hits?: OffProduct[] } | null
    image = data?.hits?.map((product) => trustedImageUrl(pick(product))).find(Boolean) ?? null
  }

  return NextResponse.json({ image }, { headers: { "Cache-Control": "public, max-age=86400" } })
}
