import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { PublicSession } from "@/lib/api/self-checkout"

/** The self-checkout session the shopper is on. It lives on the server; this only remembers which one, for this tab. */
interface CheckoutState {
  session: PublicSession | null
  setSession: (session: PublicSession | null) => void
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({ session: null, setSession: (session) => set({ session }) }),
    { name: "pos-self-checkout", storage: createJSONStorage(() => sessionStorage) }
  )
)
