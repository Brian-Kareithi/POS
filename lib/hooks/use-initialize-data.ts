"use client"

import { useEffect } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { mockBusiness, mockBranches, mockWarehouses, mockCategories, mockBrands, mockSuppliers, mockProducts, mockCustomers, mockCustomerGroups, mockEmployees } from "@/lib/constants/mock-data"

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
  const setEmployees = useDataStore((s) => s.setEmployees)

  useEffect(() => {
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
  }, [])
}
