import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CatalogProduct } from "@/types/saas"

export interface StorefrontCartItem {
  key: string
  productId: string
  variantId: string
  categoryId: string
  nameAr: string
  nameEn: string
  variantLabel: string
  sku: string
  unitPrice: number
  quantity: number
  maxStock: number
  visualType: CatalogProduct["visualType"]
  visualPalette: [string, string]
}

interface StorefrontCartState {
  carts: Record<string, StorefrontCartItem[]>
  coupons: Record<string, string>
  guestWishlists: Record<string, string[]>
  recentlyViewed: Record<string, string[]>
  drawerOpen: boolean

  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void

  addItem: (storeSlug: string, item: Omit<StorefrontCartItem, "key">) => void
  updateQuantity: (storeSlug: string, key: string, quantity: number) => void
  removeItem: (storeSlug: string, key: string) => void
  clearStoreCart: (storeSlug: string) => void
  setCouponCode: (storeSlug: string, code: string) => void
  toggleGuestWishlist: (storeSlug: string, productId: string) => void
  recordRecentlyViewed: (storeSlug: string, productId: string) => void
}

export const useStorefrontCartStore = create<StorefrontCartState>()(
  persist(
    (set, get) => ({
      carts: {},
      coupons: {},
      guestWishlists: {},
      recentlyViewed: {},
      drawerOpen: false,

      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),

      addItem: (storeSlug, item) => {
        const key = `${item.productId}::${item.variantId}`
        const current = get().carts[storeSlug] ?? []
        const existing = current.find((i) => i.key === key)
        const nextItems = existing
          ? current.map((i) =>
              i.key === key
                ? {
                    ...i,
                    quantity: Math.min(i.maxStock, i.quantity + item.quantity),
                  }
                : i
            )
          : [...current, { ...item, key }]

        set((state) => ({
          carts: { ...state.carts, [storeSlug]: nextItems },
          drawerOpen: true,
        }))
      },

      updateQuantity: (storeSlug, key, quantity) => {
        const current = get().carts[storeSlug] ?? []
        if (quantity <= 0) {
          set((state) => ({
            carts: {
              ...state.carts,
              [storeSlug]: current.filter((i) => i.key !== key),
            },
          }))
          return
        }
        set((state) => ({
          carts: {
            ...state.carts,
            [storeSlug]: current.map((i) =>
              i.key === key
                ? { ...i, quantity: Math.min(i.maxStock, quantity) }
                : i
            ),
          },
        }))
      },

      removeItem: (storeSlug, key) => {
        const current = get().carts[storeSlug] ?? []
        set((state) => ({
          carts: {
            ...state.carts,
            [storeSlug]: current.filter((i) => i.key !== key),
          },
        }))
      },

      clearStoreCart: (storeSlug) =>
        set((state) => ({
          carts: { ...state.carts, [storeSlug]: [] },
          coupons: { ...state.coupons, [storeSlug]: "" },
        })),

      setCouponCode: (storeSlug, code) =>
        set((state) => ({
          coupons: { ...state.coupons, [storeSlug]: code.trim().toUpperCase() },
        })),

      toggleGuestWishlist: (storeSlug, productId) => {
        const current = get().guestWishlists[storeSlug] ?? []
        const exists = current.includes(productId)
        set((state) => ({
          guestWishlists: {
            ...state.guestWishlists,
            [storeSlug]: exists
              ? current.filter((id) => id !== productId)
              : [...current, productId],
          },
        }))
      },

      recordRecentlyViewed: (storeSlug, productId) => {
        const current = get().recentlyViewed[storeSlug] ?? []
        const next = [productId, ...current.filter((id) => id !== productId)].slice(
          0,
          6
        )
        set((state) => ({
          recentlyViewed: { ...state.recentlyViewed, [storeSlug]: next },
        }))
      },
    }),
    {
      name: "matgarak-storefront-carts-v2",
      partialize: (state) => ({
        carts: state.carts,
        coupons: state.coupons,
        guestWishlists: state.guestWishlists,
        recentlyViewed: state.recentlyViewed,
      }),
    }
  )
)
