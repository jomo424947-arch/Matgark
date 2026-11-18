import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  id: string
  storeSlug: string
  productId: string
  variantId?: string
  name: string
  price: number
  size: string
  color: string
  quantity: number
  image?: string
}

export type AddCartItemInput = Omit<CartItem, "id"> & {
  storeSlug?: string
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: AddCartItemInput) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: (storeSlug?: string) => void
  clearStoreCart: (storeSlug: string) => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  getItemsByStore: (storeSlug: string) => CartItem[]
  totalAmount: (storeSlug?: string) => number
  totalItems: (storeSlug?: string) => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const storeSlug = item.storeSlug || "cairo-couture"
        const size = item.size || "قياسي"
        const color = item.color || "افتراضي"
        const variantId = item.variantId || "novar"
        const quantityToAdd = Math.max(1, Math.floor(item.quantity || 1))

        // Compound unique key incorporating storeSlug, productId, variantId, size, and color
        const id = `${storeSlug}-${item.productId}-${variantId}-${size}-${color}`
        const existing = get().items.find((i) => i.id === id)

        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === id
                ? { ...i, quantity: i.quantity + quantityToAdd }
                : i
            ),
          })
        } else {
          const newItem: CartItem = {
            ...item,
            id,
            storeSlug,
            size,
            color,
            quantity: quantityToAdd,
          }
          set({ items: [...get().items, newItem] })
        }
        set({ isOpen: true })
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },

      updateQuantity: (id, quantity) => {
        const rounded = Math.floor(quantity)
        if (rounded <= 0) {
          get().removeItem(id)
          return
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: rounded } : i
          ),
        })
      },

      clearCart: (storeSlug?: string) => {
        if (storeSlug) {
          set({ items: get().items.filter((i) => i.storeSlug !== storeSlug) })
        } else {
          set({ items: [] })
        }
      },

      clearStoreCart: (storeSlug: string) => {
        set({ items: get().items.filter((i) => i.storeSlug !== storeSlug) })
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      getItemsByStore: (storeSlug: string) => {
        return get().items.filter(
          (i) => i.storeSlug === storeSlug || (!i.storeSlug && storeSlug === "cairo-couture")
        )
      },

      totalAmount: (storeSlug?: string) => {
        const relevantItems = storeSlug
          ? get().items.filter(
              (i) => i.storeSlug === storeSlug || (!i.storeSlug && storeSlug === "cairo-couture")
            )
          : get().items
        return relevantItems.reduce(
          (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
          0
        )
      },

      totalItems: (storeSlug?: string) => {
        const relevantItems = storeSlug
          ? get().items.filter(
              (i) => i.storeSlug === storeSlug || (!i.storeSlug && storeSlug === "cairo-couture")
            )
          : get().items
        return relevantItems.reduce(
          (sum, item) => sum + (Number(item.quantity) || 0),
          0
        )
      },
    }),
    {
      name: "matgarak-cart-storage",
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
    }
  )
)
