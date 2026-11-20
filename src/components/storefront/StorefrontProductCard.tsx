"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Heart, ShoppingBag, Eye } from "lucide-react"
import { toast } from "sonner"
import type { CatalogProduct, StoreTheme } from "@/types/saas"
import { useI18n } from "@/components/providers/LanguageProvider"
import { ProductVisual } from "@/components/common/ProductVisual"
import { formatVariantLabel, getProductTotalStock } from "@/lib/commerce/engine"
import { useStorefrontCartStore } from "@/stores/storefrontCartStore"
import { useAuthStore } from "@/stores/authStore"
import { usePlatformStore } from "@/stores/platformStore"

interface StorefrontProductCardProps {
  product: CatalogProduct
  storeSlug: string
  currency: string
  theme: StoreTheme
  previewMode?: boolean
  onQuickView?: (product: CatalogProduct) => void
}

export function StorefrontProductCard({
  product,
  storeSlug,
  currency,
  theme,
  previewMode = false,
  onQuickView,
}: StorefrontProductCardProps) {
  const { pick, formatCurrency } = useI18n()
  const addItem = useStorefrontCartStore((s) => s.addItem)
  const guestWishlists = useStorefrontCartStore((s) => s.guestWishlists)
  const toggleGuestWishlist = useStorefrontCartStore((s) => s.toggleGuestWishlist)

  const customerSession = useAuthStore((s) => s.customerSessions[storeSlug])
  const customers = usePlatformStore((s) => s.customers)
  const toggleCustomerWishlist = usePlatformStore((s) => s.toggleCustomerWishlist)

  const defaultVariant =
    product.variants.find((v) => v.available && v.stock > 0) ?? product.variants[0]
  const [hoveredTone, setHoveredTone] = useState<string | undefined>(
    defaultVariant?.colorHex
  )

  const totalStock = getProductTotalStock(product)
  const isOutOfStock = totalStock <= 0

  const customerRecord = customerSession
    ? customers.find((c) => c.id === customerSession.customerId)
    : null
  const isWishlisted = customerRecord
    ? customerRecord.wishlistProductIds.includes(product.id)
    : (guestWishlists[storeSlug] ?? []).includes(product.id)

  const uniqueSwatches = Array.from(
    new Map(
      product.variants
        .filter((v) => v.colorHex)
        .map((v) => [v.colorHex!, v.color || v.colorHex!])
    ).entries()
  ).slice(0, 4)

  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (previewMode) return
    if (!defaultVariant || isOutOfStock) {
      toast.error(pick("نفذت الكمية من هذا المنتج", "This product is currently out of stock"))
      return
    }
    addItem(storeSlug, {
      productId: product.id,
      variantId: defaultVariant.id,
      categoryId: product.categoryId,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      variantLabel: formatVariantLabel(defaultVariant),
      sku: defaultVariant.sku,
      unitPrice: defaultVariant.price,
      quantity: 1,
      maxStock: Math.max(1, defaultVariant.stock),
      visualType: product.visualType,
      visualPalette: product.visualPalette,
    })
    toast.success(pick("تمت إضافة المنتج إلى السلة", "Added to your shopping bag"))
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (previewMode) return
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
  }

  const isEditorial = theme.productCardStyle === "editorial"
  const isSpecGrid = theme.productCardStyle === "spec-grid"

  const productHref = `/s/${storeSlug}/products/${product.id}`

  return (
    <div
      className="group flex flex-col transition-all"
      style={{
        backgroundColor: isEditorial ? "transparent" : "var(--sf-surface)",
        borderRadius: "var(--sf-radius)",
        border: isEditorial ? "none" : "1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)",
      }}
    >
      {/* Visual Frame */}
      <div
        className="relative overflow-hidden aspect-[4/5]"
        style={{
          borderRadius: isEditorial ? "var(--sf-radius)" : "var(--sf-radius) var(--sf-radius) 0 0",
          backgroundColor: "var(--sf-secondary)",
        }}
      >
        {previewMode ? (
          <div className="block w-full h-full">
            <ProductVisual
              type={product.visualType}
              palette={product.visualPalette}
              toneOverride={hoveredTone}
              label={pick(product.nameAr, product.nameEn)}
              className="group-hover:scale-[1.03] transition-transform duration-300"
            />
          </div>
        ) : (
          <Link href={productHref} className="block w-full h-full">
            <ProductVisual
              type={product.visualType}
              palette={product.visualPalette}
              toneOverride={hoveredTone}
              label={pick(product.nameAr, product.nameEn)}
              className="group-hover:scale-[1.03] transition-transform duration-300"
            />
          </Link>
        )}

        {/* Subtle Top-Start Sale / Out of Stock label */}
        {(discountPct > 0 || isOutOfStock) && (
          <span
            className="absolute top-3 start-3 text-[11px] font-semibold px-2 py-0.5 tracking-wide"
            style={{
              backgroundColor: isOutOfStock ? "#18181B" : "var(--sf-primary)",
              color: "#FFFFFF",
              borderRadius: "var(--sf-radius)",
            }}
          >
            {isOutOfStock ? pick("نفذ المخزون", "Sold Out") : `-${discountPct}%`}
          </span>
        )}

        {/* Quick Action Icons */}
        {!previewMode && (
          <div className="absolute top-3 end-3 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleWishlist}
              aria-label={pick("المفضلة", "Toggle wishlist")}
              className="w-8 h-8 rounded-full bg-white/90 text-zinc-900 shadow-sm flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Heart
                className={`w-3.5 h-3.5 ${isWishlisted ? "fill-rose-600 text-rose-600" : ""}`}
              />
            </button>
            {onQuickView && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onQuickView(product)
                }}
                aria-label={pick("معاينة سريعة", "Quick view")}
                className="w-8 h-8 rounded-full bg-white/90 text-zinc-900 shadow-sm flex items-center justify-center hover:scale-105 transition-transform opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Quick Add Button */}
        {!previewMode && !isOutOfStock && (
          <button
            type="button"
            onClick={handleAddToCart}
            className="absolute inset-x-3 bottom-3 h-9 text-xs font-semibold flex items-center justify-center gap-1.5 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm"
            style={{
              backgroundColor: "var(--sf-primary)",
              color: "#FFFFFF",
              borderRadius: "var(--sf-btn-radius)",
            }}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{pick("أضف للسلة", "Add to Bag")}</span>
          </button>
        )}
      </div>

      {/* Product Copy */}
      <div className={isEditorial ? "pt-3 space-y-1.5" : "p-3.5 space-y-1.5"}>
        {previewMode ? (
          <div className="block">
            <h3
              className="text-sm font-semibold leading-snug line-clamp-1"
              style={{ color: "var(--sf-text)" }}
            >
              {pick(product.nameAr, product.nameEn)}
            </h3>
          </div>
        ) : (
          <Link href={productHref} className="block">
            <h3
              className="text-sm font-semibold leading-snug line-clamp-1 hover:underline"
              style={{ color: "var(--sf-text)" }}
            >
              {pick(product.nameAr, product.nameEn)}
            </h3>
          </Link>
        )}

        {isSpecGrid && product.specs[0] && (
          <p className="text-[11px] line-clamp-1" style={{ color: "var(--sf-muted)" }}>
            {pick(product.specs[0].valueAr, product.specs[0].valueEn)}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-sm font-bold" style={{ color: "var(--sf-text)" }}>
              {formatCurrency(product.price, currency)}
            </span>
            {product.compareAtPrice && (
              <span
                className="text-xs line-through opacity-60"
                style={{ color: "var(--sf-muted)" }}
              >
                {formatCurrency(product.compareAtPrice, currency)}
              </span>
            )}
          </div>

          {uniqueSwatches.length > 0 && (
            <div className="flex items-center gap-1">
              {uniqueSwatches.map(([hex, label]) => (
                <button
                  key={hex}
                  type="button"
                  title={label}
                  onMouseEnter={() => setHoveredTone(hex)}
                  onClick={() => setHoveredTone(hex)}
                  className="w-3.5 h-3.5 rounded-full border border-black/20"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
