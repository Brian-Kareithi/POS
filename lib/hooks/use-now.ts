import { useState } from "react"

/** The time when the page was opened. Keeps render pure while still letting pages compare against "now". */
export function useNow(): number {
  const [now] = useState(() => Date.now())
  return now
}
