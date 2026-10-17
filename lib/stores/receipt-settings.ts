import { create } from "zustand"
import { persist } from "zustand/middleware"

export type PaperSize = "58mm" | "80mm" | "a4"

interface ReceiptSettings {
  headerText: string
  footerText: string
  terms: string
  kraPin: string
  paper: PaperSize
  /** Open the print dialog automatically after each completed sale. */
  autoPrint: boolean
  update: (changes: Partial<Omit<ReceiptSettings, "update">>) => void
}

export const PAPER_LABELS: Record<PaperSize, string> = {
  "58mm": "58 mm thermal roll",
  "80mm": "80 mm thermal roll",
  a4: "A4 sheet",
}

export const useReceiptSettings = create<ReceiptSettings>()(
  persist(
    (set) => ({
      headerText: "Thank you for shopping with us!",
      footerText: "Asante, karibu tena!",
      terms: "Goods once sold may be returned within 7 days with this receipt.",
      kraPin: "P051234567X",
      paper: "80mm",
      autoPrint: false,
      update: (changes) => set(changes),
    }),
    { name: "pos-receipt-settings" }
  )
)
