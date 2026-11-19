"use client"

import React, { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { usePlatformStore } from "@/stores/platformStore"
import { StorefrontHomeRenderer } from "@/components/storefront/StorefrontHomeRenderer"
import { QuickViewModal } from "@/components/storefront/QuickViewModal"
import { scopeByTenant } from "@/lib/commerce/engine"
import type { CatalogProduct } from "@/types/saas"

export default function StorefrontHomePage() {
  const params = useParams<{ storeSlug: string }>()
  const storeSlug = params.storeSlug

  const stores = usePlatformStore((s) => s.stores)
  const products = usePlatformStore((s) => s.products)
  const categories = usePlatformStore((s) => s.categories)

  const [quickViewProduct, setQuickViewProduct] = useState<CatalogProduct | null>(null)

  const store = useMemo(
    () => stores.find((s) => s.slug.toLowerCase() === storeSlug.toLowerCase()),
    [stores, storeSlug]
  )

  const storeProducts = useMemo(
    () => (store ? scopeByTenant(products, store.id) : []),
    [products, store]
  )
  const storeCategories = useMemo(
    () =>
      store
        ? scopeByTenant(categories, store.id).sort((a, b) => a.displayOrder - b.displayOrder)
        : [],
    [categories, store]
  )

  if (!store) return null

  return (
    <>
      <StorefrontHomeRenderer
        store={store}
        theme={store.theme}
        sections={store.sections}
        products={storeProducts}
        categories={storeCategories}
        onQuickView={(prod) => setQuickViewProduct(prod)}
      />

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          store={store}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </>
  )
}
