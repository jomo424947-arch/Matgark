"use client"

import React, { useState, useMemo, Suspense } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, FolderTree } from "lucide-react"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { scopeByTenant, getProductTotalStock } from "@/lib/commerce/engine"
import { StorefrontProductCard } from "@/components/storefront/StorefrontProductCard"
import { QuickViewModal } from "@/components/storefront/QuickViewModal"
import type { CatalogProduct } from "@/types/saas"

const PAGE_SIZE = 8

function StorefrontProductsInner() {
  const params = useParams<{ storeSlug: string }>()
  const searchParams = useSearchParams()
  const storeSlug = params.storeSlug
  const { locale, pick } = useI18n()

  const stores = usePlatformStore((s) => s.stores)
  const products = usePlatformStore((s) => s.products)
  const categories = usePlatformStore((s) => s.categories)

  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("category") || "all"
  )
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "best-selling")
  const [inStockOnly, setInStockOnly] = useState(false)
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [page, setPage] = useState(1)
  const [quickViewProduct, setQuickViewProduct] = useState<CatalogProduct | null>(null)

  const store = useMemo(
    () => stores.find((s) => s.slug.toLowerCase() === storeSlug.toLowerCase()),
    [stores, storeSlug]
  )

  const storeCategories = useMemo(
    () =>
      store
        ? scopeByTenant(categories, store.id).sort((a, b) => a.displayOrder - b.displayOrder)
        : [],
    [categories, store]
  )

  const filteredProducts = useMemo(() => {
    if (!store) return []
    const q = query.trim().toLowerCase()
    const maxPriceNum = maxPrice ? Number(maxPrice) : Infinity

    const matchingCatIds =
      categoryFilter === "all"
        ? null
        : new Set([
            categoryFilter,
            ...storeCategories
              .filter((c) => c.parentId === categoryFilter)
              .map((c) => c.id),
          ])

    const list = scopeByTenant(products, store.id).filter((p) => {
      if (p.status !== "active") return false
      if (q && !p.nameEn.toLowerCase().includes(q) && !p.nameAr.toLowerCase().includes(q)) {
        return false
      }
      if (matchingCatIds && !matchingCatIds.has(p.categoryId)) return false
      if (inStockOnly && getProductTotalStock(p) <= 0) return false
      if (p.price > maxPriceNum) return false
      return true
    })

    if (sortBy === "price-asc") return [...list].sort((a, b) => a.price - b.price)
    if (sortBy === "price-desc") return [...list].sort((a, b) => b.price - a.price)
    if (sortBy === "newest")
      return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return [...list].sort((a, b) => b.salesCount - a.salesCount)
  }, [store, products, storeCategories, query, categoryFilter, inStockOnly, maxPrice, sortBy])

  if (!store) return null

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedProducts = filteredProducts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  )

  const PrevIcon = locale === "ar" ? ChevronRight : ChevronLeft
  const NextIcon = locale === "ar" ? ChevronLeft : ChevronRight

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] font-semibold" style={{ color: "var(--sf-accent)" }}>
            {pick(store.nameAr, store.nameEn)}
          </p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">
            {pick("جميع المنتجات", "Shop All Products")}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`/s/${store.slug}/categories`}
            className="text-xs font-semibold inline-flex items-center gap-1.5 hover:underline"
            style={{ color: "var(--sf-primary)" }}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>{pick("تصفح الأقسام", "Browse Categories")}</span>
          </Link>
          <p className="text-xs font-medium tabular-nums" style={{ color: "var(--sf-muted)" }}>
            {filteredProducts.length} {pick("منتج متاح", "products")}
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 opacity-50 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder={pick("ابحث في الكتالوج...", "Search catalog...")}
            className="w-full h-10 ps-9 pe-3 text-sm border bg-transparent"
            style={{
              borderColor: "color-mix(in srgb, var(--sf-text) 16%, transparent)",
              borderRadius: "var(--sf-btn-radius)",
            }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(1)
          }}
          className="h-10 px-3 text-xs font-semibold border bg-transparent"
          style={{
            borderColor: "color-mix(in srgb, var(--sf-text) 16%, transparent)",
            borderRadius: "var(--sf-btn-radius)",
          }}
        >
          <option value="all">{pick("كل الأقسام", "All Categories")}</option>
          {storeCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parentId ? "— " : ""}
              {pick(c.nameAr, c.nameEn)}
            </option>
          ))}
        </select>

        <input
          type="number"
          min={0}
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(e.target.value)
            setPage(1)
          }}
          placeholder={pick("السعر الأقصى", "Max price")}
          className="w-28 h-10 px-3 text-xs border bg-transparent font-mono"
          style={{
            borderColor: "color-mix(in srgb, var(--sf-text) 16%, transparent)",
            borderRadius: "var(--sf-btn-radius)",
          }}
        />

        <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer px-2">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => {
              setInStockOnly(e.target.checked)
              setPage(1)
            }}
          />
          <span>{pick("المتوفر فقط", "In stock only")}</span>
        </label>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value)
            setPage(1)
          }}
          className="h-10 px-3 text-xs font-semibold border bg-transparent"
          style={{
            borderColor: "color-mix(in srgb, var(--sf-text) 16%, transparent)",
            borderRadius: "var(--sf-btn-radius)",
          }}
        >
          <option value="best-selling">{pick("الأكثر مبيعاً", "Best Selling")}</option>
          <option value="newest">{pick("الأحدث", "Newest")}</option>
          <option value="price-asc">{pick("السعر: من الأقل للأعلى", "Price: Low to High")}</option>
          <option value="price-desc">{pick("السعر: من الأعلى للأقل", "Price: High to Low")}</option>
        </select>

        {(query || categoryFilter !== "all" || inStockOnly || maxPrice) && (
          <button
            type="button"
            onClick={() => {
              setQuery("")
              setCategoryFilter("all")
              setInStockOnly(false)
              setMaxPrice("")
              setPage(1)
            }}
            className="h-10 px-3 text-xs font-semibold inline-flex items-center gap-1 opacity-75 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
            <span>{pick("مسح الفلاتر", "Reset")}</span>
          </button>
        )}
      </div>

      {/* Product Grid */}
      {paginatedProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {paginatedProducts.map((prod) => (
              <StorefrontProductCard
                key={prod.id}
                product={prod}
                storeSlug={store.slug}
                currency={store.localization.currency}
                theme={store.theme}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-9 px-3 border text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-40"
                style={{
                  borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                  borderRadius: "var(--sf-btn-radius)",
                }}
              >
                <PrevIcon className="w-3.5 h-3.5" />
                <span>{pick("السابق", "Previous")}</span>
              </button>
              <span className="text-xs font-semibold px-3 tabular-nums" style={{ color: "var(--sf-muted)" }}>
                {pick(`صفحة ${safePage} من ${totalPages}`, `Page ${safePage} of ${totalPages}`)}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-9 px-3 border text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-40"
                style={{
                  borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                  borderRadius: "var(--sf-btn-radius)",
                }}
              >
                <span>{pick("التالي", "Next")}</span>
                <NextIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center space-y-3 border" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)", borderRadius: "var(--sf-radius)" }}>
          <SlidersHorizontal className="w-8 h-8 mx-auto opacity-30" />
          <p className="text-base font-bold">
            {pick("لا توجد منتجات مطابقة للفلاتر المختارة", "No products match your filters")}
          </p>
          <p className="text-xs" style={{ color: "var(--sf-muted)" }}>
            {pick("جرّب تغيير كلمة البحث أو إزالة بعض شروط التصفية.", "Try broadening your search or clearing active filters.")}
          </p>
        </div>
      )}

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          store={store}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  )
}

export default function StorefrontProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-5 py-16 text-sm opacity-60">Loading catalog...</div>}>
      <StorefrontProductsInner />
    </Suspense>
  )
}

