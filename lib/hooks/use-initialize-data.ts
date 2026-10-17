"use client"

import { useEffect } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { mockBusiness, mockBranches, mockWarehouses, mockCategories, mockBrands, mockSuppliers, mockProducts, mockCustomers, mockCustomerGroups, mockEmployees, mockUsers } from "@/lib/constants/mock-data"
import { seedSales, seedPurchaseOrders, seedTransfers, seedTransactions, seedNotifications, seedAdjustments, seedAuditLogs, seedShiftRecords, seedPromotions } from "@/lib/constants/mock-seed"

export function useInitializeData() {
  const setBusiness = useDataStore((s) => s.setBusiness)
  const setBranches = useDataStore((s) => s.setBranches)
  const setWarehouses = useDataStore((s) => s.setWarehouses)
  const setCategories = useDataStore((s) => s.setCategories)
  const setBrands = useDataStore((s) => s.setBrands)
  const setSuppliers = useDataStore((s) => s.setSuppliers)
  const setProducts = useDataStore((s) => s.setProducts)
  const setCustomers = useDataStore((s) => s.setCustomers)
  const setCustomerGroups = useDataStore((s) => s.setCustomerGroups)
  const setUsers = useDataStore((s) => s.setUsers)
  const setEmployees = useDataStore((s) => s.setEmployees)
  const setStockAdjustments = useDataStore((s) => s.setStockAdjustments)
  const setAuditLogs = useDataStore((s) => s.setAuditLogs)
  const setShiftRecords = useDataStore((s) => s.setShiftRecords)
  const setPromotions = useDataStore((s) => s.setPromotions)
  const setSales = useDataStore((s) => s.setSales)
  const setPurchaseOrders = useDataStore((s) => s.setPurchaseOrders)
  const setStockTransfers = useDataStore((s) => s.setStockTransfers)
  const setTransactions = useDataStore((s) => s.setTransactions)
  const setNotifications = useDataStore((s) => s.setNotifications)

  useEffect(() => {
    const state = useDataStore.getState()
    // Data is persisted, so only seed the fictional starter data on first run.
    if (state.products.length === 0) {
      setUsers(mockUsers)
      setBusiness(mockBusiness)
      setBranches(mockBranches)
      setWarehouses(mockWarehouses)
      setCategories(mockCategories)
      setBrands(mockBrands)
      setSuppliers(mockSuppliers)
      setProducts(mockProducts)
      setCustomers(mockCustomers)
      setCustomerGroups(mockCustomerGroups)
      setEmployees(mockEmployees)
      setStockAdjustments(seedAdjustments)
      setAuditLogs(seedAuditLogs)
      setShiftRecords(seedShiftRecords)
      setPromotions(seedPromotions)
    }
    if (state.sales.length === 0) setSales(seedSales)
    if (state.purchaseOrders.length === 0) setPurchaseOrders(seedPurchaseOrders)
    if (state.stockTransfers.length === 0) setStockTransfers(seedTransfers)
    if (state.transactions.length === 0) setTransactions(seedTransactions)
    if (state.notifications.length === 0) setNotifications(seedNotifications)
  }, [])
}
