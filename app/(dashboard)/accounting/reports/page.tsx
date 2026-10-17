import { redirect } from "next/navigation"

// One profit calculation for the whole app: cost of goods sold, expenses and net profit live in the Profit Report.
export default function AccountingReportsPage() {
  redirect("/reports/profit")
}
