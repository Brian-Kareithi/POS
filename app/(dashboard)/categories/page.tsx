import { redirect } from "next/navigation"

// Categories live under Products; this short address goes there.
export default function CategoriesRedirect() {
  redirect("/products/categories")
}
