"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ArrowLeft, Mail, Check, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type {
  CatalogCategory,
  CatalogProduct,
  StoreSection,
  StoreTheme,
  TenantStore,
} from "@/types/saas"
import { themeToCssVariables } from "@/lib/themes/presets"
import { useI18n } from "@/components/providers/LanguageProvider"
import { usePlatformStore } from "@/stores/platformStore"
import { ProductVisual } from "@/components/common/ProductVisual"
import { StorefrontProductCard } from "@/components/storefront/StorefrontProductCard"

interface StorefrontHomeRendererProps {
  store: TenantStore
  theme: StoreTheme
  sections: StoreSection[]
  products: CatalogProduct[]
  categories: CatalogCategory[]
  previewMode?: boolean
  onQuickView?: (product: CatalogProduct) => void
}

/**
 * Shared dynamic storefront homepage renderer driven strictly by StoreTheme CSS variables
 * and ordered StoreSection blocks. Used identically by the public `/s/[storeSlug]` route
 * and the Visual Store Builder live preview canvas.
 */
export function StorefrontHomeRenderer({
  store,
  theme,
  sections,
  products,
  categories,
  previewMode = false,
  onQuickView,
}: StorefrontHomeRendererProps) {
  const { locale, pick } = useI18n()
  const subscribeStoreNewsletter = usePlatformStore((s) => s.subscribeStoreNewsletter)
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight
  const cssVars = useMemo(() => themeToCssVariables(theme), [theme])
  const visibleSections = useMemo(
    () =>
      [...sections]
        .filter((s) => s.visible)
        .sort((a, b) => a.order - b.order),
    [sections]
  )

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === "active"),
    [products]
  )
  const featuredCategories = useMemo(
    () => categories.filter((c) => c.featured || !c.parentId).slice(0, 4),
    [categories]
  )
  const bestSellers = useMemo(() => {
    const marked = activeProducts.filter((p) => p.bestSeller)
    return (marked.length > 0 ? marked : activeProducts).slice(0, 4)
  }, [activeProducts])
  const newArrivals = useMemo(() => {
    const marked = activeProducts.filter((p) => p.newArrival)
    return (marked.length > 0 ? marked : activeProducts).slice(0, 4)
  }, [activeProducts])

  const heroProduct = activeProducts[0]
  const currency = store.localization.currency

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (previewMode || !newsletterEmail.trim()) return
    subscribeStoreNewsletter(store.id, newsletterEmail)
    setNewsletterEmail("")
    setSubscribed(true)
    toast.success(pick("تم اشتراكك في القائمة البريدية بنجاح", "Subscribed to store updates"))
  }

  const resolveHref = (raw?: string) => {
    if (previewMode) return "#"
    if (!raw) return `/s/${store.slug}/products`
    if (raw.startsWith("/")) return raw
    return `/s/${store.slug}/${raw}`
  }

  const fontClass =
    theme.fontFamily === "technical"
      ? "tracking-tight"
      : theme.fontFamily === "editorial"
        ? "tracking-[-0.015em]"
        : ""

  return (
    <div
      style={{
        ...(cssVars as React.CSSProperties),
        backgroundColor: "var(--sf-bg)",
        color: "var(--sf-text)",
      }}
      className={`${fontClass} overflow-x-clip`}
    >
      {/* Preview-only mini storefront header so Visual Builder shows headerStyle live */}
      {previewMode && (
        <div
          className="border-b px-5 h-14 flex items-center justify-between gap-4"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
          }}
        >
          {theme.headerStyle === "centered" ? (
            <>
              <div className="flex items-center gap-3 text-xs opacity-75">
                {store.navigationLinks.slice(0, 2).map((l) => (
                  <span key={l.id}>{pick(l.labelAr, l.labelEn)}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span
                  className="w-7 h-7 flex items-center justify-center text-white text-xs font-bold overflow-hidden"
                  style={{
                    backgroundColor: "var(--sf-primary)",
                    borderRadius: "var(--sf-radius)",
                  }}
                >
                  {store.logoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={store.logoDataUrl}
                      alt={pick(store.nameAr, store.nameEn)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    store.logoMonogram
                  )}
                </span>
                <span>{pick(store.nameAr, store.nameEn)}</span>
              </div>
              <div className="text-xs opacity-75">{pick("السلة (0)", "Bag (0)")}</div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 font-bold text-sm">
                <span
                  className="w-7 h-7 flex items-center justify-center text-white text-xs font-bold overflow-hidden"
                  style={{
                    backgroundColor: "var(--sf-primary)",
                    borderRadius: "var(--sf-radius)",
                  }}
                >
                  {store.logoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={store.logoDataUrl}
                      alt={pick(store.nameAr, store.nameEn)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    store.logoMonogram
                  )}
                </span>
                <span>{pick(store.nameAr, store.nameEn)}</span>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs opacity-80">
                {store.navigationLinks.slice(0, 4).map((l) => (
                  <span key={l.id}>{pick(l.labelAr, l.labelEn)}</span>
                ))}
              </div>
              <div className="text-xs font-semibold">{pick("السلة (0)", "Bag (0)")}</div>
            </>
          )}
        </div>
      )}

      {visibleSections.map((sec) => {
        if (sec.type === "announcement") {
          return (
            <div
              key={sec.id}
              className="py-2.5 px-4 text-center text-xs font-medium"
              style={{
                backgroundColor: "var(--sf-primary)",
                color: "#FFFFFF",
              }}
            >
              {pick(sec.titleAr, sec.titleEn)}
            </div>
          )
        }

        if (sec.type === "hero") {
          return (
            <section
              key={sec.id}
              className="border-b"
              style={{
                backgroundColor: "var(--sf-secondary)",
                borderColor: "color-mix(in srgb, var(--sf-text) 8%, transparent)",
              }}
            >
              <div
                className={
                  previewMode
                    ? "max-w-7xl mx-auto px-5 sm:px-8 py-10 grid md:grid-cols-12 gap-8 items-center"
                    : "max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16 lg:py-20 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center"
                }
              >
                <div className={previewMode ? "md:col-span-6 space-y-4" : "lg:col-span-6 space-y-5"}>
                  {(sec.badgeAr || sec.badgeEn) && (
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.14em]"
                      style={{ color: "var(--sf-accent)" }}
                    >
                      {pick(sec.badgeAr || "", sec.badgeEn || "")}
                    </p>
                  )}
                  <h1
                    className={
                      previewMode
                        ? "text-2xl sm:text-3xl font-bold leading-[1.2] tracking-tight"
                        : "text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.14] tracking-tight"
                    }
                  >
                    {pick(sec.titleAr, sec.titleEn)}
                  </h1>
                  <p
                    className="text-sm sm:text-base leading-relaxed max-w-xl"
                    style={{ color: "var(--sf-muted)" }}
                  >
                    {pick(sec.subtitleAr, sec.subtitleEn)}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Link
                      href={resolveHref(sec.ctaHref)}
                      onClick={previewMode ? (e) => e.preventDefault() : undefined}
                      className="h-11 px-6 text-sm font-semibold inline-flex items-center gap-2 transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: "var(--sf-primary)",
                        color: "#FFFFFF",
                        borderRadius: "var(--sf-btn-radius)",
                      }}
                    >
                      <span>{pick(sec.ctaLabelAr || "تسوّق الآن", sec.ctaLabelEn || "Shop Collection")}</span>
                      <ArrowIcon className="w-4 h-4" />
                    </Link>
                    <Link
                      href={previewMode ? "#" : `/s/${store.slug}/products`}
                      onClick={previewMode ? (e) => e.preventDefault() : undefined}
                      className="h-11 px-5 text-sm font-semibold inline-flex items-center border transition-colors"
                      style={{
                        borderColor: "color-mix(in srgb, var(--sf-text) 20%, transparent)",
                        borderRadius: "var(--sf-btn-radius)",
                        color: "var(--sf-text)",
                      }}
                    >
                      {pick("تصفح الكتالوج", "Browse Catalog")}
                    </Link>
                  </div>
                </div>

                {/* Architectural Hero Showcase */}
                <div className={previewMode ? "md:col-span-6" : "lg:col-span-6"}>
                  <div
                    className="relative aspect-[4/3] overflow-hidden border"
                    style={{
                      borderRadius: "var(--sf-radius)",
                      backgroundColor: "var(--sf-surface)",
                      borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
                    }}
                  >
                    {store.category === "fashion" || store.slug === "menz-club" ? (
                      <Image
                        src="/images/nova-store-hero.jpg"
                        alt={pick(store.nameAr, store.nameEn)}
                        fill
                        priority={!previewMode}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        referrerPolicy="no-referrer"
                        className="object-cover"
                      />
                    ) : heroProduct ? (
                      <ProductVisual
                        type={heroProduct.visualType}
                        palette={heroProduct.visualPalette}
                        label={pick(heroProduct.nameAr, heroProduct.nameEn)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-12 h-12 opacity-20" />
                      </div>
                    )}
                    {heroProduct && (
                      <div
                        className="absolute bottom-4 start-4 end-4 sm:end-auto sm:min-w-[240px] p-3.5 backdrop-blur-md border shadow-lg"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--sf-surface) 92%, transparent)",
                          borderColor: "color-mix(in srgb, var(--sf-text) 14%, transparent)",
                          borderRadius: "var(--sf-radius)",
                        }}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--sf-accent)" }}>
                          {pick("القطعة المميزة · مقاسات S–XL", "Featured Piece · Sizes S–XL")}
                        </p>
                        <p className="text-sm font-bold truncate mt-0.5">
                          {pick(heroProduct.nameAr, heroProduct.nameEn)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )
        }

        if (sec.type === "featured_categories" && featuredCategories.length > 0) {
          return (
            <section key={sec.id} className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {pick(sec.titleAr, sec.titleEn)}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "var(--sf-muted)" }}>
                    {pick(sec.subtitleAr, sec.subtitleEn)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredCategories.map((cat) => {
                  const catProduct = activeProducts.find((p) => p.categoryId === cat.id)
                  return (
                    <Link
                      key={cat.id}
                      href={previewMode ? "#" : `/s/${store.slug}/products?category=${cat.id}`}
                      onClick={previewMode ? (e) => e.preventDefault() : undefined}
                      className="group relative overflow-hidden border p-5 flex flex-col justify-between min-h-[168px] transition-transform hover:-translate-y-0.5"
                      style={{
                        backgroundColor: "var(--sf-surface)",
                        borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
                        borderRadius: "var(--sf-radius)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="w-8 h-1.5 rounded-full"
                          style={{ backgroundColor: cat.accentColor }}
                        />
                        {catProduct && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden opacity-90">
                            <ProductVisual
                              type={catProduct.visualType}
                              palette={catProduct.visualPalette}
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <h3 className="text-base font-bold group-hover:underline">
                          {pick(cat.nameAr, cat.nameEn)}
                        </h3>
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--sf-muted)" }}>
                          {pick(cat.descriptionAr, cat.descriptionEn)}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        }

        if (sec.type === "best_sellers" || sec.type === "new_arrivals" || sec.type === "product_grid") {
          const list =
            sec.type === "new_arrivals"
              ? newArrivals
              : sec.type === "best_sellers"
                ? bestSellers
                : activeProducts.slice(0, 8)
          if (list.length === 0) return null
          return (
            <section key={sec.id} className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {pick(sec.titleAr, sec.titleEn)}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "var(--sf-muted)" }}>
                    {pick(sec.subtitleAr, sec.subtitleEn)}
                  </p>
                </div>
                <Link
                  href={resolveHref(sec.ctaHref)}
                  onClick={previewMode ? (e) => e.preventDefault() : undefined}
                  className="text-xs font-semibold inline-flex items-center gap-1.5 hover:underline"
                  style={{ color: "var(--sf-primary)" }}
                >
                  <span>{pick(sec.ctaLabelAr || "عرض الكل", sec.ctaLabelEn || "View All")}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {list.map((prod) => (
                  <StorefrontProductCard
                    key={prod.id}
                    product={prod}
                    storeSlug={store.slug}
                    currency={currency}
                    theme={theme}
                    previewMode={previewMode}
                    onQuickView={onQuickView}
                  />
                ))}
              </div>
            </section>
          )
        }

        if (sec.type === "promo_banner") {
          return (
            <section key={sec.id} className="max-w-7xl mx-auto px-5 sm:px-8 py-6">
              <div
                className="p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                style={{
                  backgroundColor: "var(--sf-primary)",
                  color: "#FFFFFF",
                  borderRadius: "var(--sf-radius)",
                }}
              >
                <div className="space-y-2 max-w-2xl">
                  {(sec.badgeAr || sec.badgeEn) && (
                    <p className="text-xs uppercase tracking-[0.16em] opacity-75 font-semibold">
                      {pick(sec.badgeAr || "", sec.badgeEn || "")}
                    </p>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {pick(sec.titleAr, sec.titleEn)}
                  </h2>
                  <p className="text-sm opacity-85 leading-relaxed">
                    {pick(sec.subtitleAr, sec.subtitleEn)}
                  </p>
                </div>
                <Link
                  href={resolveHref(sec.ctaHref)}
                  onClick={previewMode ? (e) => e.preventDefault() : undefined}
                  className="h-11 px-6 text-sm font-semibold inline-flex items-center gap-2 shrink-0"
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "var(--sf-primary)",
                    borderRadius: "var(--sf-btn-radius)",
                  }}
                >
                  <span>{pick(sec.ctaLabelAr || "اكتشف الآن", sec.ctaLabelEn || "Discover Now")}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Link>
              </div>
            </section>
          )
        }

        if (sec.type === "brand_story") {
          return (
            <section
              key={sec.id}
              className="border-y my-8"
              style={{
                backgroundColor: "var(--sf-secondary)",
                borderColor: "color-mix(in srgb, var(--sf-text) 8%, transparent)",
              }}
            >
              <div className="max-w-4xl mx-auto px-5 sm:px-8 py-14 sm:py-16 text-center space-y-4">
                {(sec.badgeAr || sec.badgeEn) && (
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.16em]"
                    style={{ color: "var(--sf-accent)" }}
                  >
                    {pick(sec.badgeAr || "", sec.badgeEn || "")}
                  </p>
                )}
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {pick(sec.titleAr, sec.titleEn)}
                </h2>
                <p
                  className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto"
                  style={{ color: "var(--sf-muted)" }}
                >
                  {pick(sec.subtitleAr, sec.subtitleEn)}
                </p>
              </div>
            </section>
          )
        }

        if (sec.type === "newsletter") {
          return (
            <section key={sec.id} className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
              <div
                className="p-8 sm:p-10 border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                style={{
                  backgroundColor: "var(--sf-surface)",
                  borderColor: "color-mix(in srgb, var(--sf-text) 12%, transparent)",
                  borderRadius: "var(--sf-radius)",
                }}
              >
                <div className="max-w-xl space-y-1.5">
                  <h2 className="text-xl font-bold">{pick(sec.titleAr, sec.titleEn)}</h2>
                  <p className="text-sm" style={{ color: "var(--sf-muted)" }}>
                    {pick(sec.subtitleAr, sec.subtitleEn)}
                  </p>
                </div>

                {subscribed ? (
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <Check className="w-4 h-4" />
                    <span>{pick("تم الاشتراك بنجاح!", "You are subscribed!")}</span>
                  </div>
                ) : (
                  <form
                    onSubmit={handleNewsletterSubmit}
                    className="flex w-full lg:w-auto gap-2"
                  >
                    <div className="relative flex-1 lg:w-72">
                      <Mail className="w-4 h-4 opacity-50 absolute top-1/2 -translate-y-1/2 start-3" />
                      <input
                        type="email"
                        required
                        disabled={previewMode}
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder={pick("بريدك الإلكتروني", "you@example.com")}
                        className="w-full h-11 ps-9 pe-3 text-sm border bg-transparent focus:outline-none"
                        style={{
                          borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                          borderRadius: "var(--sf-btn-radius)",
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={previewMode}
                      className="h-11 px-5 text-sm font-semibold shrink-0"
                      style={{
                        backgroundColor: "var(--sf-primary)",
                        color: "#FFFFFF",
                        borderRadius: "var(--sf-btn-radius)",
                      }}
                    >
                      {pick(sec.ctaLabelAr || "اشتراك", sec.ctaLabelEn || "Subscribe")}
                    </button>
                  </form>
                )}
              </div>
            </section>
          )
        }

        return null
      })}
    </div>
  )
}
