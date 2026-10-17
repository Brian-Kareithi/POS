import { useEffect, useRef } from "react"

/**
 * Listens for hardware barcode scanners (USB / Bluetooth), which behave like a keyboard
 * that types the code very quickly and presses Enter. Ignored while a form field has focus
 * (fields handle Enter themselves) so normal typing is never hijacked.
 */
export function useScannerInput(onScan: (code: string) => void, enabled = true) {
  const handler = useRef(onScan)
  useEffect(() => {
    handler.current = onScan
  }, [onScan])

  useEffect(() => {
    if (!enabled) return
    let buffer = ""
    let last = 0
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const now = Date.now()
      if (now - last > 80) buffer = ""
      last = now
      if (e.key === "Enter") {
        if (buffer.length >= 4) handler.current(buffer)
        buffer = ""
      } else if (e.key.length === 1) {
        buffer += e.key
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [enabled])
}
