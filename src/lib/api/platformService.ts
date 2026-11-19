/**
 * Centralized Platform API Service Contract & Development Data Adapter.
 *
 * All UI views operate through typed contracts (`TenantStore`, `CatalogProduct`,
 * `StoreOrder`, `StoreCustomer`, `DiscountCode`, `SubscriptionPlan`).
 * In development mode, requests resolve against the persisted client-side tenant
 * store (`usePlatformStore`). Replacing this adapter with live REST/GraphQL
 * endpoints requires swapping only the implementation inside this module.
 */

import { usePlatformStore } from "@/stores/platformStore"
import { scopeByTenant } from "@/lib/commerce/engine"
import type {
  CatalogCategory,
  CatalogProduct,
  DiscountCode,
  PlatformMerchant,
  OrderLifecycleStatus,
  StoreCustomer,
  StoreOrder,
  SubscriptionPlan,
  SupportTicket,
  TenantStore,
} from "@/types/saas"

export interface ApiResult<T> {
  ok: boolean
  data?: T
  error?: string
  source: "dev-adapter" | "backend-api"
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ProductQueryParams {
  storeId: string
  query?: string
  categoryId?: string
  inStockOnly?: boolean
  maxPrice?: number
  sortBy?: "best-selling" | "newest" | "price-asc" | "price-desc"
  page?: number
  pageSize?: number
}

export const platformService = {
  /** Retrieve a single storefront by its public URL slug. */
  getStoreBySlug(slug: string): ApiResult<TenantStore> {
    const store = usePlatformStore
      .getState()
      .stores.find((s) => s.slug.toLowerCase() === slug.toLowerCase())
    if (!store) {
      return { ok: false, error: "STORE_NOT_FOUND", source: "dev-adapter" }
    }
    return { ok: true, data: store, source: "dev-adapter" }
  },

  /** Retrieve paginated & filtered products scoped strictly to a tenant store. */
  listStoreProducts(params: ProductQueryParams): ApiResult<PaginatedResult<CatalogProduct>> {
    const state = usePlatformStore.getState()
    const storeCategories = scopeByTenant(state.categories, params.storeId)
    const q = (params.query || "").trim().toLowerCase()

    const matchingCatIds =
      !params.categoryId || params.categoryId === "all"
        ? null
        : new Set([
            params.categoryId,
            ...storeCategories
              .filter((c) => c.parentId === params.categoryId)
              .map((c) => c.id),
          ])

    const filtered = scopeByTenant(state.products, params.storeId).filter((p) => {
      if (p.status !== "active") return false
      if (q && !p.nameEn.toLowerCase().includes(q) && !p.nameAr.toLowerCase().includes(q)) {
        return false
      }
      if (matchingCatIds && !matchingCatIds.has(p.categoryId)) return false
      if (params.maxPrice !== undefined && p.price > params.maxPrice) return false
      if (params.inStockOnly) {
        const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
        if (totalStock <= 0) return false
      }
      return true
    })

    const sorted = [...filtered].sort((a, b) => {
      if (params.sortBy === "price-asc") return a.price - b.price
      if (params.sortBy === "price-desc") return b.price - a.price
      if (params.sortBy === "newest") return b.createdAt.localeCompare(a.createdAt)
      return b.salesCount - a.salesCount
    })

    const pageSize = Math.max(1, params.pageSize ?? 12)
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
    const page = Math.min(Math.max(1, params.page ?? 1), totalPages)
    const start = (page - 1) * pageSize

    return {
      ok: true,
      source: "dev-adapter",
      data: {
        items: sorted.slice(start, start + pageSize),
        total: sorted.length,
        page,
        pageSize,
        totalPages,
      },
    }
  },

  /** List tenant-scoped categories ordered for navigation. */
  listStoreCategories(storeId: string): ApiResult<CatalogCategory[]> {
    const categories = scopeByTenant(usePlatformStore.getState().categories, storeId).sort(
      (a, b) => a.displayOrder - b.displayOrder
    )
    return { ok: true, data: categories, source: "dev-adapter" }
  },

  /** List tenant-scoped orders. */
  listStoreOrders(storeId: string): ApiResult<StoreOrder[]> {
    const orders = scopeByTenant(usePlatformStore.getState().orders, storeId)
    return { ok: true, data: orders, source: "dev-adapter" }
  },

  /** Update an order status through the store workflow. */
  transitionOrderStatus(
    orderId: string,
    status: OrderLifecycleStatus,
    actor: string,
    note?: string
  ): ApiResult<boolean> {
    usePlatformStore.getState().updateOrderStatus(orderId, status, actor, note)
    return { ok: true, data: true, source: "dev-adapter" }
  },

  /** List tenant-scoped customers. */
  listStoreCustomers(storeId: string): ApiResult<StoreCustomer[]> {
    const customers = scopeByTenant(usePlatformStore.getState().customers, storeId)
    return { ok: true, data: customers, source: "dev-adapter" }
  },

  /** List tenant-scoped discount codes. */
  listStoreDiscounts(storeId: string): ApiResult<DiscountCode[]> {
    const discounts = scopeByTenant(usePlatformStore.getState().discounts, storeId)
    return { ok: true, data: discounts, source: "dev-adapter" }
  },

  /** Super Admin overview snapshot. */
  getAdminSnapshot(): ApiResult<{
    merchants: PlatformMerchant[]
    stores: TenantStore[]
    plans: SubscriptionPlan[]
    tickets: SupportTicket[]
  }> {
    const state = usePlatformStore.getState()
    return {
      ok: true,
      source: "dev-adapter",
      data: {
        merchants: state.merchants,
        stores: state.stores,
        plans: state.plans,
        tickets: state.tickets,
      },
    }
  },
}
