import { useMemo } from "react"
import { useUIStore } from "@/lib/stores/ui-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"
import { can } from "@/lib/permissions"
import type { Sale, Transaction } from "@/lib/types"

/** Sales and expenses limited to the selected branch (staff without "all branches" access only ever see their own). */
export function useBranchFilter() {
  const stored = useUIStore((s) => s.branchId)
  const setBranchId = useUIStore((s) => s.setBranchId)
  const user = useAuthStore((s) => s.user)
  const branches = useDataStore((s) => s.branches)
  const sales = useDataStore((s) => s.sales)
  const transactions = useDataStore((s) => s.transactions)

  const allowAll = can(user?.role, "branches.all")
  const branchId = allowAll ? stored : user?.branchId ?? "all"
  const branchSales = useMemo<Sale[]>(() => (branchId === "all" ? sales : sales.filter((s) => s.branchId === branchId)), [sales, branchId])
  const branchTransactions = useMemo<Transaction[]>(
    () => (branchId === "all" ? transactions : transactions.filter((t) => !t.branchId || t.branchId === branchId)),
    [transactions, branchId]
  )
  const label = branchId === "all" ? "All branches" : branches.find((b) => b.id === branchId)?.name ?? "Branch"
  return { branchId, setBranchId, allowAll, branches, sales: branchSales, transactions: branchTransactions, label }
}
