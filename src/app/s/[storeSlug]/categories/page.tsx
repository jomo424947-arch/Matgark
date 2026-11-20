"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ArrowRight, FolderTree, ShoppingBag } from "lucide-react"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { scopeByTenant } from "@/lib/commerce/engine"
import { ProductVisual } from "@/components/common/ProductVisual"

export default function StorefrontCategoriesPage() {
  const params = useParams<{ storeSlug: string }>()
  const storeSlug = params.storeSlug
  const { locale, pick } = useI18n()

  const stores = usePlatformStore((s) => s.stores)
  const categories = usePlatformStore((s) => s.categories)
  const products = usePlatformStore((s) => s.products)

  const store = useMemo(
    () => stores.find((s) => s.slug.toLowerCase() === storeSlug.toLowerCase()),
    [stores, storeSlug]
  )

  const storeCategories = useMemo(
    () =>
      store
        ? scopeByTenant(categories, store.id).sort(
            (a, b) => a.displayOrder - b.displayOrder
          )
        : [],
    [categories, store]
  )

  const activeProducts = useMemo(
    () =>
      store
        ? scopeByTenant(products, store.id).filter((p) => p.status === "active")
        : [],
    [products, store]
  )

  const parentCategories = useMemo(
    () => storeCategories.filter((c) => !c.parentId),
    [storeCategories]
  )

  if (!store) return null

  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-10">
      {/* Header */}
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{
          borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
        }}
      >
        <div>
          <p
            className="text-xs font-semibold tracking-wide"
            style={{ color: "var(--sf-accent)" }}
          >
            {pick(store.nameAr, store.nameEn)}
          </p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">
            {pick("الأقسام والمجموعات", "Categories & Collections")}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--sf-muted)" }}>
            {pick(
              "تصفح تشكيلات المتجر المنظمة حسب الفئة أو المجموعة الفرعية.",
              "Explore curated collections organized by category and subcategory."
            )}
          </p>
        </div>

        <Link
          href={`/s/${store.slug}/products`}
          className="h-10 px-4 text-xs font-semibold inline-flex items-center gap-2 transition-opacity hover:opacity-90 whitespace-nowrap"
          style={{
            backgroundColor: "var(--sf-primary)",
            color: "#FFFFFF",
            borderRadius: "var(--sf-btn-radius)",
          }}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{pick("عرض جميع المنتجات", "View All Products")}</span>
        </Link>
      </div>

      {/* Category Cards Grid */}
      {parentCategories.length === 0 ? (
        <div
          className="py-20 text-center space-y-3 border"
          style={{
            borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
            borderRadius: "var(--sf-radius)",
          }}
        >
          <FolderTree className="w-8 h-8 mx-auto opacity-30" />
          <p className="text-base font-bold">
            {pick("لا توجد أقسام مضافة حالياً", "No categories available yet")}
          </p>
          <Link
            href={`/s/${store.slug}/products`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold underline"
            style={{ color: "var(--sf-primary)" }}
          >
            <span>{pick("تصفح جميع المنتجات", "Browse all products")}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parentCategories.map((cat) => {
            const subcats = storeCategories.filter((c) => c.parentId === cat.id)
            const catIds = new Set([cat.id, ...subcats.map((s) => s.id)])
            const matchingProducts = activeProducts.filter((p) =>
              catIds.has(p.categoryId)
            )
            const coverProduct = matchingProducts[0]

            return (
              <div
                key={cat.id}
                className="border overflow-hidden flex flex-col justify-between transition-transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: "var(--sf-surface)",
                  borderColor:
                    "color-mix(in srgb, var(--sf-text) 10%, transparent)",
                  borderRadius: "var(--sf-radius)",
                }}
              >
                <div>
                  <Link
                    href={`/s/${store.slug}/products?category=${cat.id}`}
                    className="block relative h-44 overflow-hidden"
                    style={{ backgroundColor: "var(--sf-secondary)" }}
                  >
                    {coverProduct ? (
                      <ProductVisual
                        type={coverProduct.visualType}
                        palette={coverProduct.visualPalette}
                        label={pick(cat.nameAr, cat.nameEn)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-25">
                        <FolderTree className="w-10 h-10" />
                      </div>
                    )}
                    <span
                      className="absolute top-3 start-3 w-8 h-1.5 rounded-full"
                      style={{ backgroundColor: cat.accentColor }}
                    />
                  </Link>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/s/${store.slug}/products?category=${cat.id}`}
                          className="text-lg font-bold hover:underline"
                        >
                          {pick(cat.nameAr, cat.nameEn)}
                        </Link>
                        <p
                          className="text-xs mt-1 leading-relaxed"
                          style={{ color: "var(--sf-muted)" }}
                        >
                          {pick(cat.descriptionAr, cat.descriptionEn)}
                        </p>
                      </div>
                      <span
                        className="text-xs font-mono tabular-nums shrink-0"
                        style={{ color: "var(--sf-muted)" }}
                      >
                        {matchingProducts.length}{" "}
                        {pick("منتج", "items")}
                      </span>
                    </div>

                    {subcats.length > 0 && (
                      <div
                        className="pt-3 border-t flex flex-wrap gap-2"
                        style={{
                          borderColor:
                            "color-mix(in srgb, var(--sf-text) 8%, transparent)",
                        }}
                      >
                        {subcats.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/s/${store.slug}/products?category=${sub.id}`}
                            className="text-xs font-medium px-2.5 py-1 border hover:opacity-80 transition-opacity"
                            style={{
                              borderColor:
                                "color-mix(in srgb, var(--sf-text) 16%, transparent)",
                              borderRadius: "var(--sf-btn-radius)",
                            }}
                          >
                            {pick(sub.nameAr, sub.nameEn)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <Link
                    href={`/s/${store.slug}/products?category=${cat.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                    style={{ color: "var(--sf-primary)" }}
                  >
                    <span>
                      {pick("تصفح منتجات القسم", "Explore Collection")}
                    </span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
