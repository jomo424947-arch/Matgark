"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, ArrowLeft, Tag } from "lucide-react"
import { toast } from "sonner"
import { usePlatformStore } from "@/stores/platformStore"
import { useStorefrontCartStore } from "@/stores/storefrontCartStore"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { calculateShippingFee, evaluateDiscountCode } from "@/lib/commerce/engine"
import { ProductVisual } from "@/components/common/ProductVisual"

export default function StorefrontCartPage() {
  const params = useParams<{ storeSlug: string }>()
  const storeSlug = params.storeSlug
  const { locale, pick, formatCurrency } = useI18n()

  const stores = usePlatformStore((s) => s.stores)
  const discounts = usePlatformStore((s) => s.discounts)
  const customers = usePlatformStore((s) => s.customers)
  const customerSession = useAuthStore((s) => s.customerSessions[storeSlug])

  const carts = useStorefrontCartStore((s) => s.carts)
  const coupons = useStorefrontCartStore((s) => s.coupons)
  const updateQuantity = useStorefrontCartStore((s) => s.updateQuantity)
  const removeItem = useStorefrontCartStore((s) => s.removeItem)
  const setCouponCode = useStorefrontCartStore((s) => s.setCouponCode)

  const [couponInput, setCouponInput] = useState("")

  const store = useMemo(
    () => stores.find((s) => s.slug.toLowerCase() === storeSlug.toLowerCase()),
    [stores, storeSlug]
  )

  if (!store) return null

  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight
  const currency = store.localization.currency
  const items = carts[storeSlug] ?? []
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const defaultShipping = store.shippingMethods.find((m) => m.enabled)
  const shippingCalc = calculateShippingFee({
    method: defaultShipping,
    subtotal,
  })
  const appliedCode = coupons[storeSlug] || ""
  const customerRecord = customerSession
    ? customers.find((c) => c.id === customerSession.customerId)
    : null

  const discountCalc = appliedCode
    ? evaluateDiscountCode({
        code: appliedCode,
        discounts,
        storeId: store.id,
        subtotal,
        shippingFee: shippingCalc.fee,
        cartItems: items.map((i) => ({
          productId: i.productId,
          categoryId: i.categoryId,
          lineTotal: i.unitPrice * i.quantity,
        })),
        isFirstOrder: (customerRecord?.totalOrders ?? 0) === 0,
      })
    : null

  const discountAmount = discountCalc?.valid ? discountCalc.discountAmount : 0
  const effectiveShipping = discountCalc?.freeShipping ? 0 : shippingCalc.fee
  const grandTotal = Math.max(0, subtotal + effectiveShipping - (discountCalc?.freeShipping ? 0 : discountAmount))

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = couponInput.trim().toUpperCase()
    if (!clean) return
    const check = evaluateDiscountCode({
      code: clean,
      discounts,
      storeId: store.id,
      subtotal,
      shippingFee: shippingCalc.fee,
      cartItems: items.map((i) => ({
        productId: i.productId,
        categoryId: i.categoryId,
        lineTotal: i.unitPrice * i.quantity,
      })),
      isFirstOrder: (customerRecord?.totalOrders ?? 0) === 0,
    })
    if (!check.valid) {
      toast.error(pick("الكوبون غير صالح أو لم يستوفِ الحد الأدنى", "Coupon is invalid or does not meet requirements"))
      return
    }
    setCouponCode(storeSlug, clean)
    setCouponInput("")
    toast.success(pick(`تم تطبيق كود الخصم ${clean}`, `Coupon ${clean} applied`))
  }

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {pick("سلة التسوق", "Your Shopping Bag")}
      </h1>

      {items.length === 0 ? (
        <div
          className="py-20 text-center space-y-4 border"
          style={{
            borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
            borderRadius: "var(--sf-radius)",
          }}
        >
          <ShoppingBag className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-base font-bold">
            {pick("سلة التسوق فارغة حالياً", "Your bag is currently empty")}
          </p>
          <Link
            href={`/s/${storeSlug}/products`}
            className="inline-flex h-11 px-6 text-sm font-semibold items-center"
            style={{
              backgroundColor: "var(--sf-primary)",
              color: "#FFFFFF",
              borderRadius: "var(--sf-btn-radius)",
            }}
          >
            {pick("متابعة التسوق", "Continue Shopping")}
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-3">
            {items.map((item) => (
              <div
                key={item.key}
                className="p-4 border flex items-center gap-4"
                style={{
                  backgroundColor: "var(--sf-surface)",
                  borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
                  borderRadius: "var(--sf-radius)",
                }}
              >
                <div className="w-20 h-24 rounded overflow-hidden shrink-0">
                  <ProductVisual type={item.visualType} palette={item.visualPalette} />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/s/${storeSlug}/products/${item.productId}`}
                    className="font-bold text-sm hover:underline block truncate"
                  >
                    {pick(item.nameAr, item.nameEn)}
                  </Link>
                  <p className="text-xs mt-0.5" style={{ color: "var(--sf-muted)" }}>
                    {item.variantLabel} · <span className="font-mono">{item.sku}</span>
                  </p>
                  <p className="text-sm font-bold mt-2 tabular-nums">
                    {formatCurrency(item.unitPrice, currency)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(storeSlug, item.key, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-black/5"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-bold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(storeSlug, item.key, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-black/5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(storeSlug, item.key)}
                    className="text-xs text-rose-600 inline-flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{pick("حذف", "Remove")}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div
            className="lg:col-span-4 border p-6 space-y-5"
            style={{
              backgroundColor: "var(--sf-surface)",
              borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
              borderRadius: "var(--sf-radius)",
            }}
          >
            <h2 className="text-base font-bold">{pick("ملخص الطلب", "Order Summary")}</h2>

            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 opacity-50 absolute top-1/2 -translate-y-1/2 start-3" />
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder={pick("كود الخصم", "Promo code")}
                  className="w-full h-10 ps-8 pe-3 text-xs border bg-transparent font-mono uppercase"
                  style={{
                    borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                    borderRadius: "var(--sf-btn-radius)",
                  }}
                />
              </div>
              <button
                type="submit"
                className="h-10 px-4 text-xs font-semibold border"
                style={{
                  borderColor: "color-mix(in srgb, var(--sf-text) 20%, transparent)",
                  borderRadius: "var(--sf-btn-radius)",
                }}
              >
                {pick("تطبيق", "Apply")}
              </button>
            </form>

            {appliedCode && (
              <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span>{pick("الكوبون المطبق:", "Applied code:")} {appliedCode}</span>
                <button
                  type="button"
                  onClick={() => setCouponCode(storeSlug, "")}
                  className="underline text-rose-600"
                >
                  {pick("إزالة", "Remove")}
                </button>
              </div>
            )}

            <div className="space-y-2.5 text-sm pt-2 border-t" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--sf-muted)" }}>{pick("المجموع الفرعي", "Subtotal")}</span>
                <span className="font-semibold tabular-nums">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--sf-muted)" }}>{pick("تقدير الشحن", "Estimated Shipping")}</span>
                <span className="font-semibold tabular-nums">
                  {effectiveShipping === 0
                    ? pick("مجاني", "Free")
                    : formatCurrency(effectiveShipping, currency)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                  <span>{pick("الخصم", "Discount")}</span>
                  <span className="tabular-nums">-{formatCurrency(discountAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-3 border-t" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
                <span>{pick("الإجمالي التقديري", "Estimated Total")}</span>
                <span className="tabular-nums">{formatCurrency(grandTotal, currency)}</span>
              </div>
            </div>

            <Link
              href={`/s/${storeSlug}/checkout`}
              className="w-full h-12 text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
              style={{
                backgroundColor: "var(--sf-primary)",
                color: "#FFFFFF",
                borderRadius: "var(--sf-btn-radius)",
              }}
            >
              <span>{pick("المتابعة لإتمام الطلب", "Proceed to Checkout")}</span>
              <ArrowIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
