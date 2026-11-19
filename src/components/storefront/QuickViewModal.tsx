"use client"

import React, { useState } from "react"
import Link from "next/link"
import { X, ShoppingBag, Heart, Check } from "lucide-react"
import { toast } from "sonner"
import type { CatalogProduct, TenantStore } from "@/types/saas"
import { useI18n } from "@/components/providers/LanguageProvider"
import { useStorefrontCartStore } from "@/stores/storefrontCartStore"
import { useAuthStore } from "@/stores/authStore"
import { usePlatformStore } from "@/stores/platformStore"
import { ProductVisual } from "@/components/common/ProductVisual"
import { formatVariantLabel } from "@/lib/commerce/engine"

interface QuickViewModalProps {
  product: CatalogProduct
  store: TenantStore
  onClose: () => void
}

export function QuickViewModal({ product, store, onClose }: QuickViewModalProps) {
  const { pick, formatCurrency } = useI18n()
  const addItem = useStorefrontCartStore((s) => s.addItem)
  const guestWishlists = useStorefrontCartStore((s) => s.guestWishlists)
  const toggleGuestWishlist = useStorefrontCartStore((s) => s.toggleGuestWishlist)

  const customerSession = useAuthStore((s) => s.customerSessions[store.slug])
  const customers = usePlatformStore((s) => s.customers)
  const toggleCustomerWishlist = usePlatformStore((s) => s.toggleCustomerWishlist)

  const defaultVariant =
    product.variants.find((v) => v.available && v.stock > 0) ?? product.variants[0]
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id || "")

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? defaultVariant

  if (!activeVariant) return null

  const customerRecord = customerSession
    ? customers.find((c) => c.id === customerSession.customerId)
    : null
  const isWishlisted = customerRecord
    ? customerRecord.wishlistProductIds.includes(product.id)
    : (guestWishlists[store.slug] ?? []).includes(product.id)

  const handleToggleWishlist = () => {
    if (customerRecord) {
      toggleCustomerWishlist(customerRecord.id, product.id)
    } else {
      toggleGuestWishlist(store.slug, product.id)
    }
    toast.success(
      isWishlisted
        ? pick("تمت الإزالة من المفضلة", "Removed from wishlist")
        : pick("تم الحفظ في المفضلة", "Saved to wishlist")
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={pick(product.nameAr, product.nameEn)}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl border shadow-2xl overflow-hidden grid sm:grid-cols-2 relative"
        style={{
          backgroundColor: "var(--sf-surface)",
          color: "var(--sf-text)",
          borderRadius: "var(--sf-radius)",
          borderColor: "color-mix(in srgb, var(--sf-text) 14%, transparent)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={pick("إغلاق المعاينة", "Close quick view")}
          className="absolute top-3 end-3 z-10 w-8 h-8 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center shadow hover:scale-105 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="aspect-square sm:aspect-auto">
          <ProductVisual
            type={product.visualType}
            palette={product.visualPalette}
            toneOverride={activeVariant.colorHex}
            label={pick(product.nameAr, product.nameEn)}
          />
        </div>

        <div className="p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pe-8">
              <span className="text-[11px] font-mono opacity-60">{activeVariant.sku}</span>
              <span
                className={`text-[11px] font-semibold inline-flex items-center gap-1 ${
                  activeVariant.stock > 0 ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {activeVariant.stock > 0 ? (
                  <>
                    <Check className="w-3 h-3" />
                    {pick(`متوفر (${activeVariant.stock})`, `In Stock (${activeVariant.stock})`)}
                  </>
                ) : (
                  pick("نفذ المخزون", "Out of Stock")
                )}
              </span>
            </div>

            <h2 className="text-lg font-bold leading-snug">
              {pick(product.nameAr, product.nameEn)}
            </h2>

            <div className="flex items-baseline gap-2.5 tabular-nums">
              <span className="text-base font-bold">
                {formatCurrency(activeVariant.price, store.localization.currency)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > activeVariant.price && (
                <span className="text-xs line-through opacity-55">
                  {formatCurrency(product.compareAtPrice, store.localization.currency)}
                </span>
              )}
            </div>

            <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--sf-muted)" }}>
              {pick(product.descriptionAr, product.descriptionEn)}
            </p>

            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-semibold">{pick("اختر الخيار:", "Select Option:")}</p>
              <div className="flex flex-wrap gap-1.5">
                {product.variants.map((v) => {
                  const selected = v.id === activeVariant.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={v.stock <= 0}
                      onClick={() => setSelectedVariantId(v.id)}
                      className="px-2.5 py-1.5 text-xs font-medium border disabled:opacity-40 inline-flex items-center gap-1.5 transition-colors"
                      style={{
                        borderRadius: "var(--sf-btn-radius)",
                        borderColor: selected
                          ? "var(--sf-primary)"
                          : "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                        backgroundColor: selected ? "var(--sf-primary)" : "transparent",
                        color: selected ? "#FFFFFF" : "var(--sf-text)",
                      }}
                    >
                      {v.colorHex && (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      <span>{formatVariantLabel(v)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeVariant.stock <= 0}
                onClick={() => {
                  addItem(store.slug, {
                    productId: product.id,
                    variantId: activeVariant.id,
                    categoryId: product.categoryId,
                    nameAr: product.nameAr,
                    nameEn: product.nameEn,
                    variantLabel: formatVariantLabel(activeVariant),
                    sku: activeVariant.sku,
                    unitPrice: activeVariant.price,
                    quantity: 1,
                    maxStock: Math.max(1, activeVariant.stock),
                    visualType: product.visualType,
                    visualPalette: product.visualPalette,
                  })
                  onClose()
                  toast.success(pick("تمت إضافة المنتج للسلة", "Added to your shopping bag"))
                }}
                className="flex-1 h-10 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{
                  backgroundColor: "var(--sf-primary)",
                  color: "#FFFFFF",
                  borderRadius: "var(--sf-btn-radius)",
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{pick("أضف للسلة", "Add to Bag")}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                aria-label={pick("حفظ في المفضلة", "Toggle wishlist")}
                className="w-10 h-10 border flex items-center justify-center shrink-0 hover:bg-black/5"
                style={{
                  borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                  borderRadius: "var(--sf-btn-radius)",
                }}
              >
                <Heart
                  className={`w-4 h-4 ${isWishlisted ? "fill-rose-600 text-rose-600" : ""}`}
                />
              </button>
            </div>

            <Link
              href={`/s/${store.slug}/products/${product.id}`}
              onClick={onClose}
              className="block text-center text-xs font-semibold hover:underline py-1"
              style={{ color: "var(--sf-muted)" }}
            >
              {pick("عرض كامل التفاصيل والمواصفات", "View Full Product Details")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
