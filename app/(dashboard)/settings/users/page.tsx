import { redirect } from "next/navigation"

// Staff, roles and permissions are managed in one place.
export default function UserManagementPage() {
  redirect("/employees")
}
