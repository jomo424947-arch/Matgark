import { create } from "zustand"

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  size: string
  color: string
  quantity: number
  image?: string
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, "id">) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  totalAmount: () => number
  totalItems: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  addItem: (item) => {
    const id = `${item.productId}-${item.size}-${item.color}`
    const existing = get().items.find((i) => i.id === id)

    if (existing) {
      set({
        items: get().items.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i
        ),
      })
    } else {
      set({ items: [...get().items, { ...item, id }] })
    }
    set({ isOpen: true })
  },
  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) })
  },
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id)
      return
    }
    set({
      items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })
  },
  clearCart: () => set({ items: [] }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set({ isOpen: !get().isOpen }),
  totalAmount: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  totalItems: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),
}))

