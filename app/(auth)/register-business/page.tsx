import { redirect } from "next/navigation"

// The owner sign-up form lives at /register; this old address keeps working.
export default function RegisterBusinessRedirect() {
  redirect("/register")
}
