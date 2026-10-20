import { create } from "zustand"
import { api } from "@/lib/api/client"
import { notify } from "@/lib/toast"

export type PaperSize = "58mm" | "80mm" | "a4"

type Fields = { headerText: string; footerText: string; terms: string; kraPin: string; paper: PaperSize; autoPrint: boolean }

interface ReceiptSettings extends Fields {
  /** Replace the settings with what the server holds (does not save). */
  hydrate: (server: Fields) => void
  /** Change settings locally and save them to the server shortly after the last edit. */
  update: (changes: Partial<Fields>) => void
}

export const PAPER_LABELS: Record<PaperSize, string> = {
  "58mm": "58 mm thermal roll",
  "80mm": "80 mm thermal roll",
  a4: "A4 sheet",
}

let timer: ReturnType<typeof setTimeout> | undefined
let pending: Partial<Fields> = {}

export const useReceiptSettings = create<ReceiptSettings>()((set) => ({
  headerText: "",
  footerText: "",
  terms: "",
  kraPin: "",
  paper: "80mm",
  autoPrint: false,
  hydrate: (s) => set({ headerText: s.headerText, footerText: s.footerText, terms: s.terms, kraPin: s.kraPin, paper: s.paper, autoPrint: s.autoPrint }),
  update: (changes) => {
    set(changes)
    pending = { ...pending, ...changes }
    clearTimeout(timer)
    timer = setTimeout(async () => {
      const body = pending
      pending = {}
      try {
        await api("/settings/receipts", { method: "PATCH", body })
      } catch (e) {
        notify.error("Receipt settings were not saved", e instanceof Error ? e.message : undefined)
      }
    }, 600)
  },
}))
