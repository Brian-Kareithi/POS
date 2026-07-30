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
  getSubtotal: () => number
  getTaxTotal: () => number
  getDiscountTotal: () => number
  getTotal: () => number
  getItemCount: () => number
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
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? {
                      ...i,
                      quantity: i.quantity + quantity,
                      total: (i.quantity + quantity) * i.unitPrice - i.discount,
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
          items: state.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  quantity: Math.max(1, quantity),
                  total:
                    Math.max(1, quantity) * i.unitPrice -
                    i.discount +
                    (Math.max(1, quantity) * i.unitPrice * i.tax) / (i.unitPrice * i.quantity || 1),
                }
              : i
          ),
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
        }),

      setCustomer: (id, name) => set({ customerId: id, customerName: name }),
      setNotes: (notes) => set({ notes }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
      removeCoupon: () => set({ couponCode: undefined, couponDiscount: 0 }),

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
    }),
    {
      name: "pos-cart",
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
