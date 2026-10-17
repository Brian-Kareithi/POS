import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product, PaymentMethod } from "@/lib/types"

export interface CartItem {
  id: string
  productId: string
  name: string
  sku: string
  quantity: number
  unitPrice: number
  taxRate: number
  discount: number
  tax: number
  total: number
  image?: string
}

interface CartState {
  items: CartItem[]
  customerId?: string
  customerName?: string
  notes: string
  paymentMethod: PaymentMethod
  couponCode?: string
  couponDiscount: number
  activeCheckoutToken?: string
  addItem: (product: Product, quantity?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  updateDiscount: (id: string, discount: number) => void
  clearCart: () => void
  setCustomer: (id: string, name: string) => void
  setNotes: (notes: string) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setCoupon: (code: string, discount: number) => void
  removeCoupon: () => void
  setActiveCheckoutToken: (token?: string) => void
  getSubtotal: () => number
  getTaxTotal: () => number
  getDiscountTotal: () => number
  getTotal: () => number
  getItemCount: () => number
  getCheckoutItems: () => { productId: string; name: string; quantity: number; unitPrice: number; tax: number; discount: number; total: number }[]
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      notes: "",
      paymentMethod: "cash",
      couponDiscount: 0,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id)
          if (existing) {
            const newQuantity = existing.quantity + quantity
            const newTax = (newQuantity * existing.unitPrice * existing.taxRate) / 100
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? {
                      ...i,
                      quantity: newQuantity,
                      tax: newTax,
                      total: newQuantity * existing.unitPrice + newTax - i.discount,
                    }
                  : i
              ),
            }
          }
          const taxAmount = (product.sellingPrice * quantity * product.taxRate) / 100
          const newItem: CartItem = {
            id: crypto.randomUUID(),
            productId: product.id,
            name: product.name,
            sku: product.sku,
            quantity,
            unitPrice: product.sellingPrice,
            taxRate: product.taxRate,
            discount: 0,
            tax: taxAmount,
            total: product.sellingPrice * quantity + taxAmount,
            image: product.image,
          }
          return { items: [...state.items, newItem] }
        })
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id !== id) return i
            const nextQuantity = Math.max(1, quantity)
            if (i.quantity === nextQuantity) return i
            const newTax = (nextQuantity * i.unitPrice * i.taxRate) / 100
            return {
              ...i,
              quantity: nextQuantity,
              tax: newTax,
              total: nextQuantity * i.unitPrice + newTax - i.discount,
            }
          }),
        })),

      updateDiscount: (id, discount) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  discount,
                  total: i.quantity * i.unitPrice - discount + i.tax,
                }
              : i
          ),
        })),

      clearCart: () =>
        set({
          items: [],
          customerId: undefined,
          customerName: undefined,
          notes: "",
          paymentMethod: "cash",
          couponCode: undefined,
          couponDiscount: 0,
          activeCheckoutToken: undefined,
        }),

      setCustomer: (id, name) => set({ customerId: id, customerName: name }),
      setNotes: (notes) => set({ notes }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
      removeCoupon: () => set({ couponCode: undefined, couponDiscount: 0 }),
      setActiveCheckoutToken: (token) => set({ activeCheckoutToken: token }),

      getSubtotal: () => {
        const state = get()
        return state.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
      },

      getTaxTotal: () => {
        const state = get()
        return state.items.reduce((sum, i) => sum + i.tax, 0)
      },

      getDiscountTotal: () => {
        const state = get()
        return state.items.reduce((sum, i) => sum + i.discount, 0) + state.couponDiscount
      },

      getTotal: () => {
        const state = get()
        const subtotal = state.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
        const tax = state.items.reduce((sum, i) => sum + i.tax, 0)
        const discount = state.items.reduce((sum, i) => sum + i.discount, 0) + state.couponDiscount
        return subtotal + tax - discount
      },

      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      getCheckoutItems: () => {
        const state = get()
        return state.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          tax: i.tax,
          discount: i.discount,
          total: i.total,
        }))
      },
    }),
    {
      name: "pos-cart",
      version: 1,
      migrate: (persistedState, version) => {
        type LegacyItem = Omit<CartItem, "taxRate"> & { taxRate?: number }
        type Persisted = {
          items?: LegacyItem[]
          customerId?: string
          customerName?: string
          notes?: string
          paymentMethod?: PaymentMethod
          couponCode?: string
          couponDiscount?: number
        }
        const state = (persistedState ?? {}) as Persisted
        const needsMigration =
          version < 1 || !Array.isArray(state.items) || state.items.some((i) => typeof i.taxRate !== "number")
        if (!needsMigration) return state
        const items = (state.items || []).map((i) => {
          const oldTax = i.tax || 0
          const taxRate =
            typeof i.taxRate === "number"
              ? i.taxRate
              : i.quantity > 0 && i.unitPrice > 0
                ? Math.round((oldTax / (i.unitPrice * i.quantity)) * 10000) / 100
                : 0
          const tax = Math.round(i.quantity * i.unitPrice * taxRate) / 100
          return {
            ...i,
            taxRate,
            tax,
            total: i.quantity * i.unitPrice + tax - (i.discount || 0),
          }
        })
        return { ...state, items }
      },
      partialize: (state) => ({
        items: state.items,
        customerId: state.customerId,
        customerName: state.customerName,
        notes: state.notes,
        paymentMethod: state.paymentMethod,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
      }),
    }
  )
)
