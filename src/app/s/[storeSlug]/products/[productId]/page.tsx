"use client"

import React, { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ShoppingBag,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { toast } from "sonner"
import { usePlatformStore } from "@/stores/platformStore"
import { useStorefrontCartStore } from "@/stores/storefrontCartStore"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { formatVariantLabel, scopeByTenant } from "@/lib/commerce/engine"
import { ProductVisual } from "@/components/common/ProductVisual"
import { StorefrontProductCard } from "@/components/storefront/StorefrontProductCard"

export default function StorefrontProductDetailPage() {
  const params = useParams<{ storeSlug: string; productId: string }>()
  const router = useRouter()
  const { storeSlug, productId } = params
  const { locale, pick, formatCurrency } = useI18n()

  const stores = usePlatformStore((s) => s.stores)
  const products = usePlatformStore((s) => s.products)
  const categories = usePlatformStore((s) => s.categories)
  const customers = usePlatformStore((s) => s.customers)
  const addProductReview = usePlatformStore((s) => s.addProductReview)
  const toggleCustomerWishlist = usePlatformStore((s) => s.toggleCustomerWishlist)

  const addItem = useStorefrontCartStore((s) => s.addItem)
  const guestWishlists = useStorefrontCartStore((s) => s.guestWishlists)
  const toggleGuestWishlist = useStorefrontCartStore((s) => s.toggleGuestWishlist)
  const recentlyViewedMap = useStorefrontCartStore((s) => s.recentlyViewed)
  const recordRecentlyViewed = useStorefrontCartStore((s) => s.recordRecentlyViewed)

  const customerSession = useAuthStore((s) => s.customerSessions[storeSlug])

  const store = useMemo(
    () => stores.find((s) => s.slug.toLowerCase() === storeSlug.toLowerCase()),
    [stores, storeSlug]
  )
  const storeProducts = useMemo(
    () => (store ? scopeByTenant(products, store.id) : []),
    [products, store]
  )
  const product = useMemo(
    () => storeProducts.find((p) => p.id === productId || p.slug === productId),
    [storeProducts, productId]
  )

  const [selectedVariantId, setSelectedVariantId] = useState<string>("")
  const [activeTone, setActiveTone] = useState<string | undefined>(undefined)
  const [quantity, setQuantity] = useState(1)
  const [infoTab, setInfoTab] = useState<"specs" | "shipping" | "reviews">("specs")
  const [reviewName, setReviewName] = useState(customerSession?.name || "")
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")

  useEffect(() => {
    if (product?.id) {
      recordRecentlyViewed(storeSlug, product.id)
    }
  }, [storeSlug, product?.id, recordRecentlyViewed])

  if (!store || !product) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold">{pick("المنتج غير موجود", "Product Not Found")}</h1>
        <Link
          href={`/s/${storeSlug}/products`}
          className="inline-flex h-10 px-5 text-xs font-semibold items-center"
          style={{
            backgroundColor: "var(--sf-primary)",
            color: "#FFFFFF",
            borderRadius: "var(--sf-btn-radius)",
          }}
        >
          {pick("العودة للمنتجات", "Back to Products")}
        </Link>
      </div>
    )
  }

  const currency = store.localization.currency
  const SepIcon = locale === "ar" ? ChevronLeft : ChevronRight

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants.find((v) => v.available && v.stock > 0) ??
    product.variants[0]

  const currentPrice = activeVariant?.price ?? product.price
  const currentStock = activeVariant?.stock ?? 0
  const isOutOfStock = currentStock <= 0

  const category = categories.find((c) => c.id === product.categoryId)

  const customerRecord = customerSession
    ? customers.find((c) => c.id === customerSession.customerId)
    : null
  const isWishlisted = customerRecord
    ? customerRecord.wishlistProductIds.includes(product.id)
    : (guestWishlists[storeSlug] ?? []).includes(product.id)

  const avgRating =
    product.reviews.length > 0
      ? (
          product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
        ).toFixed(1)
      : "5.0"

  const relatedProducts = storeProducts
    .filter((p) => p.id !== product.id && p.status === "active")
    .sort((a, b) =>
      a.categoryId === product.categoryId && b.categoryId !== product.categoryId ? -1 : 0
    )
    .slice(0, 4)

  const recentlyViewedProducts = (recentlyViewedMap[storeSlug] ?? [])
    .filter((id) => id !== product.id)
    .map((id) => storeProducts.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4)

  const handleAdd = (goToCheckout = false) => {
    if (!activeVariant || isOutOfStock) {
      toast.error(pick("هذا الخيار غير متوفر حالياً", "Selected option is out of stock"))
      return
    }
    addItem(storeSlug, {
      productId: product.id,
      variantId: activeVariant.id,
      categoryId: product.categoryId,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      variantLabel: formatVariantLabel(activeVariant),
      sku: activeVariant.sku,
      unitPrice: activeVariant.price,
      quantity,
      maxStock: Math.max(1, activeVariant.stock),
      visualType: product.visualType,
      visualPalette: product.visualPalette,
    })
    if (goToCheckout) {
      router.push(`/s/${storeSlug}/checkout`)
    } else {
      toast.success(pick("تمت إضافة المنتج إلى السلة", "Added to your shopping bag"))
    }
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewName.trim() || !reviewComment.trim()) return
    addProductReview(product.id, {
      authorName: reviewName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
    })
    setReviewComment("")
    toast.success(pick("شكراً لتقييمك!", "Review published"))
  }

  const galleryOptions = Array.from(
    new Set([
      ...(activeVariant?.colorHex ? [activeVariant.colorHex] : []),
      ...product.galleryTones,
    ])
  ).slice(0, 4)

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 space-y-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs" style={{ color: "var(--sf-muted)" }}>
        <Link href={`/s/${storeSlug}`} className="hover:underline">
          {pick("الرئيسية", "Home")}
        </Link>
        <SepIcon className="w-3.5 h-3.5" />
        <Link href={`/s/${storeSlug}/products`} className="hover:underline">
          {pick("المنتجات", "Products")}
        </Link>
        {category && (
          <>
            <SepIcon className="w-3.5 h-3.5" />
            <Link href={`/s/${storeSlug}/products?category=${category.id}`} className="hover:underline">
              {pick(category.nameAr, category.nameEn)}
            </Link>
          </>
        )}
      </nav>

      {/* Main Split PDP */}
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Sticky Visual Gallery */}
        <div className="lg:col-span-6 space-y-3 lg:sticky lg:top-24">
          <div
            className="aspect-[4/5] overflow-hidden border"
            style={{
              borderRadius: "var(--sf-radius)",
              borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
            }}
          >
            <ProductVisual
              type={product.visualType}
              palette={product.visualPalette}
              toneOverride={activeTone || activeVariant?.colorHex}
              label={pick(product.nameAr, product.nameEn)}
            />
          </div>
          {galleryOptions.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {galleryOptions.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setActiveTone(tone)}
                  className="aspect-square overflow-hidden border-2 transition-all"
                  style={{
                    borderRadius: "var(--sf-radius)",
                    borderColor:
                      (activeTone || activeVariant?.colorHex) === tone
                        ? "var(--sf-primary)"
                        : "transparent",
                  }}
                >
                  <ProductVisual
                    type={product.visualType}
                    palette={product.visualPalette}
                    toneOverride={tone}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Buy Box & Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs" style={{ color: "var(--sf-muted)" }}>
              <span className="font-mono">{activeVariant?.sku || product.sku}</span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{avgRating}</span>
                <span>({product.reviews.length})</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {pick(product.nameAr, product.nameEn)}
            </h1>

            <div className="flex items-baseline gap-3 pt-1 tabular-nums">
              <span className="text-2xl font-bold">
                {formatCurrency(currentPrice, currency)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > currentPrice && (
                <span className="text-base line-through opacity-55">
                  {formatCurrency(product.compareAtPrice, currency)}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: "var(--sf-muted)" }}>
            {pick(product.descriptionAr, product.descriptionEn)}
          </p>

          {/* Variant Selector */}
          <div className="space-y-3 pt-2 border-t" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold">
                {pick("الخيار المختار:", "Selected Variant:")}{" "}
                <span className="font-normal">
                  {activeVariant ? formatVariantLabel(activeVariant) : "—"}
                </span>
              </span>
              <span
                className={`font-semibold ${
                  isOutOfStock
                    ? "text-rose-600"
                    : currentStock <= product.lowStockThreshold
                      ? "text-amber-600"
                      : "text-emerald-700"
                }`}
              >
                {isOutOfStock
                  ? pick("نفذت الكمية", "Out of stock")
                  : pick(`متوفر (${currentStock} قطعة)`, `In stock (${currentStock} left)`)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const selected = v.id === activeVariant?.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVariantId(v.id)
                      setActiveTone(v.colorHex)
                      setQuantity(1)
                    }}
                    className="h-10 px-3.5 text-xs font-semibold border inline-flex items-center gap-2 transition-all"
                    style={{
                      borderRadius: "var(--sf-btn-radius)",
                      borderColor: selected
                        ? "var(--sf-primary)"
                        : "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                      backgroundColor: selected ? "var(--sf-primary)" : "transparent",
                      color: selected ? "#FFFFFF" : "var(--sf-text)",
                      opacity: v.stock <= 0 ? 0.45 : 1,
                    }}
                  >
                    {v.colorHex && (
                      <span
                        className="w-3 h-3 rounded-full border border-white/50"
                        style={{ backgroundColor: v.colorHex }}
                      />
                    )}
                    <span>{formatVariantLabel(v)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantity + Add to Cart + Buy Now */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center border h-12"
                style={{
                  borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                  borderRadius: "var(--sf-btn-radius)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-full flex items-center justify-center hover:bg-black/5"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-mono font-bold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, currentStock), q + 1))}
                  className="w-10 h-full flex items-center justify-center hover:bg-black/5"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => handleAdd(false)}
                className="flex-1 h-12 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "var(--sf-primary)",
                  color: "#FFFFFF",
                  borderRadius: "var(--sf-btn-radius)",
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{pick("أضف إلى السلة", "Add to Bag")}</span>
              </button>

              <button
                type="button"
                aria-label={pick("حفظ في المفضلة", "Toggle wishlist")}
                onClick={() => {
                  if (customerRecord) {
                    toggleCustomerWishlist(customerRecord.id, product.id)
                  } else {
                    toggleGuestWishlist(storeSlug, product.id)
                  }
                  toast.success(
                    isWishlisted
                      ? pick("تمت الإزالة من المفضلة", "Removed from wishlist")
                      : pick("تم الحفظ في المفضلة", "Saved to wishlist")
                  )
                }}
                className="w-12 h-12 border flex items-center justify-center shrink-0 hover:bg-black/5"
                style={{
                  borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                  borderRadius: "var(--sf-btn-radius)",
                }}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-600 text-rose-600" : ""}`} />
              </button>
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => handleAdd(true)}
              className="w-full h-11 text-sm font-semibold border disabled:opacity-40 hover:bg-black/5 transition-colors"
              style={{
                borderColor: "var(--sf-primary)",
                color: "var(--sf-primary)",
                borderRadius: "var(--sf-btn-radius)",
              }}
            >
              {pick("شراء مباشر الآن", "Buy It Now")}
            </button>
          </div>

          {/* Trust Micro-line */}
          <div className="grid sm:grid-cols-2 gap-3 pt-2 text-xs" style={{ color: "var(--sf-muted)" }}>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 shrink-0" />
              <span>{pick("توصيل سريع مع متابعة مراحل الطلب", "Tracked delivery nationwide")}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{pick("استبدال واسترجاع مرن خلال 14 يوماً", "14-day hassle-free exchange")}</span>
            </div>
          </div>

          {/* Tabs: Specs / Shipping / Reviews */}
          <div className="pt-4 border-t" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
            <div className="flex gap-5 border-b mb-4 text-xs font-bold" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
              {(
                [
                  { id: "specs", ar: "المواصفات", en: "Specifications" },
                  { id: "shipping", ar: "الشحن والاسترجاع", en: "Shipping & Returns" },
                  { id: "reviews", ar: `التقييمات (${product.reviews.length})`, en: `Reviews (${product.reviews.length})` },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setInfoTab(t.id)}
                  className="pb-2.5 border-b-2 transition-colors"
                  style={{
                    borderColor: infoTab === t.id ? "var(--sf-primary)" : "transparent",
                    opacity: infoTab === t.id ? 1 : 0.6,
                  }}
                >
                  {pick(t.ar, t.en)}
                </button>
              ))}
            </div>

            {infoTab === "specs" && (
              <dl className="divide-y text-xs" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 8%, transparent)" }}>
                {product.specs.map((sp, i) => (
                  <div key={i} className="py-2.5 flex justify-between gap-4">
                    <dt style={{ color: "var(--sf-muted)" }}>{pick(sp.labelAr, sp.labelEn)}</dt>
                    <dd className="font-semibold">{pick(sp.valueAr, sp.valueEn)}</dd>
                  </div>
                ))}
                {product.dimensions && (
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt style={{ color: "var(--sf-muted)" }}>{pick("الأبعاد", "Dimensions")}</dt>
                    <dd className="font-mono font-semibold">{product.dimensions}</dd>
                  </div>
                )}
              </dl>
            )}

            {infoTab === "shipping" && (
              <div className="space-y-2.5 text-xs leading-relaxed" style={{ color: "var(--sf-muted)" }}>
                {store.shippingMethods
                  .filter((m) => m.enabled)
                  .map((m) => (
                    <p key={m.id} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        <strong style={{ color: "var(--sf-text)" }}>
                          {pick(m.nameAr, m.nameEn)}
                        </strong>{" "}
                        — {pick(m.estimatedDaysAr, m.estimatedDaysEn)} (
                        {m.rate === 0
                          ? pick("مجاني", "Free")
                          : formatCurrency(m.rate, currency)}
                        )
                      </span>
                    </p>
                  ))}
              </div>
            )}

            {infoTab === "reviews" && (
              <div className="space-y-5">
                <div className="space-y-3">
                  {product.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 border text-xs space-y-1"
                      style={{
                        borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
                        borderRadius: "var(--sf-radius)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{rev.authorName}</span>
                        <span className="inline-flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </span>
                      </div>
                      <p style={{ color: "var(--sf-muted)" }}>{rev.comment}</p>
                    </div>
                  ))}
                  {product.reviews.length === 0 && (
                    <p className="text-xs" style={{ color: "var(--sf-muted)" }}>
                      {pick("كن أول من يقيّم هذا المنتج.", "Be the first to review this product.")}
                    </p>
                  )}
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-2.5 pt-3 border-t" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
                  <p className="text-xs font-bold">{pick("أضف تقييمك", "Write a Review")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      required
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder={pick("اسمك", "Your Name")}
                      className="h-9 px-3 text-xs border bg-transparent"
                      style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 16%, transparent)" }}
                    />
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="h-9 px-3 text-xs border bg-transparent"
                      style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 16%, transparent)" }}
                    >
                      {[5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r}>
                          {r} / 5 ★
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    required
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={pick("شاركنا تجربتك مع المنتج...", "Share your thoughts on quality and fit...")}
                    className="w-full p-2.5 text-xs border bg-transparent"
                    style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 16%, transparent)" }}
                  />
                  <button
                    type="submit"
                    className="h-9 px-4 text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--sf-primary)",
                      color: "#FFFFFF",
                      borderRadius: "var(--sf-btn-radius)",
                    }}
                  >
                    {pick("نشر التقييم", "Submit Review")}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-6 border-t" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
          <h2 className="text-xl font-bold">{pick("منتجات مشابهة قد تعجبك", "Related Products")}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedProducts.map((rp) => (
              <StorefrontProductCard
                key={rp.id}
                product={rp}
                storeSlug={storeSlug}
                currency={currency}
                theme={store.theme}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      {recentlyViewedProducts.length > 0 && (
        <section className="space-y-6 pt-6 border-t" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
          <h2 className="text-xl font-bold">{pick("شوهدت مؤخراً", "Recently Viewed")}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {recentlyViewedProducts.map((rv) => (
              <StorefrontProductCard
                key={rv.id}
                product={rv}
                storeSlug={storeSlug}
                currency={currency}
                theme={store.theme}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
