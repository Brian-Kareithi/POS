export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function generateSKU(name: string, category: string): string {
  const prefix = category.substring(0, 3).toUpperCase()
  const namePart = name.substring(0, 3).toUpperCase()
  const num = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  return `${prefix}-${namePart}-${num}`
}

export function generateBarcode(): string {
  return "2" + Math.random().toString().substring(2, 13)
}

export function generateOrderNumber(): string {
  const date = new Date()
  const y = date.getFullYear().toString().substring(2)
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const d = date.getDate().toString().padStart(2, "0")
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, "0")
  return `ORD-${y}${m}${d}-${seq}`
}
