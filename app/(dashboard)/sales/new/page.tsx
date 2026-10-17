import { redirect } from "next/navigation"

// The POS terminal at "/" is the single place sales are made, so every sale gets
// the same stock, payment, credit and audit handling.
export default function NewSalePage() {
  redirect("/")
}
