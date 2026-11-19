"use client"

import { useMemo } from "react"
import { useAuthStore } from "@/stores/authStore"
import { usePlatformStore } from "@/stores/platformStore"
import { scopeByTenant } from "@/lib/commerce/engine"

/**
 * Resolves the currently active merchant tenant store and all strictly scoped data slices.
 */
export function useActiveMerchantStore() {
  const merchantSession = useAuthStore((s) => s.merchantSession)
  const stores = usePlatformStore((s) => s.stores)
  const products = usePlatformStore((s) => s.products)
  const categories = usePlatformStore((s) => s.categories)
  const orders = usePlatformStore((s) => s.orders)
  const customers = usePlatformStore((s) => s.customers)
  const discounts = usePlatformStore((s) => s.discounts)
  const inventoryLogs = usePlatformStore((s) => s.inventoryLogs)

  const store = useMemo(() => {
    if (!merchantSession) return null
    return (
      stores.find((s) => s.id === merchantSession.storeId) ??
      stores.find((s) => s.merchantId === merchantSession.merchantId) ??
      null
    )
  }, [merchantSession, stores])

  const storeId = store?.id ?? ""

  const storeProducts = useMemo(
    () => (storeId ? scopeByTenant(products, storeId) : []),
    [products, storeId]
  )
  const storeCategories = useMemo(
    () =>
      storeId
        ? scopeByTenant(categories, storeId).sort(
            (a, b) => a.displayOrder - b.displayOrder
          )
        : [],
    [categories, storeId]
  )
  const storeOrders = useMemo(
    () => (storeId ? scopeByTenant(orders, storeId) : []),
    [orders, storeId]
  )
  const storeCustomers = useMemo(
    () => (storeId ? scopeByTenant(customers, storeId) : []),
    [customers, storeId]
  )
  const storeDiscounts = useMemo(
    () => (storeId ? scopeByTenant(discounts, storeId) : []),
    [discounts, storeId]
  )
  const storeInventoryLogs = useMemo(
    () => (storeId ? scopeByTenant(inventoryLogs, storeId) : []),
    [inventoryLogs, storeId]
  )

  return {
    merchantSession,
    store,
    storeProducts,
    storeCategories,
    storeOrders,
    storeCustomers,
    storeDiscounts,
    storeInventoryLogs,
  }
}
