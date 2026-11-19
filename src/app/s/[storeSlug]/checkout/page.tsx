"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  CheckCircle2,
  Banknote,
  Landmark,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Truck,
} from "lucide-react"
import { toast } from "sonner"
import { usePlatformStore } from "@/stores/platformStore"
import { useStorefrontCartStore } from "@/stores/storefrontCartStore"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { calculateShippingFee, evaluateDiscountCode } from "@/lib/commerce/engine"
import { ProductVisual } from "@/components/common/ProductVisual"
import { placeOrderAction } from "@/server/actions/orders"
import type { PaymentMethodType, StoreOrder } from "@/types/saas"

const STEPS = [
  { id: 1, ar: "التواصل", en: "Contact" },
  { id: 2, ar: "العنوان", en: "Address" },
  { id: 3, ar: "الشحن", en: "Shipping" },
  { id: 4, ar: "الدفع", en: "Payment" },
  { id: 5, ar: "المراجعة", en: "Review" },
]

export default function StorefrontCheckoutPage() {
  const params = useParams<{ storeSlug: string }>()
  const storeSlug = params.storeSlug
  const { locale, pick, formatCurrency } = useI18n()

  const stores = usePlatformStore((s) => s.stores)
  const discounts = usePlatformStore((s) => s.discounts)
  const customers = usePlatformStore((s) => s.customers)
  const placeStorefrontOrder = usePlatformStore((s) => s.placeStorefrontOrder)

  const carts = useStorefrontCartStore((s) => s.carts)
  const coupons = useStorefrontCartStore((s) => s.coupons)
  const clearStoreCart = useStorefrontCartStore((s) => s.clearStoreCart)

  const customerSession = useAuthStore((s) => s.customerSessions[storeSlug])

  const store = useMemo(
    () => stores.find((s) => s.slug.toLowerCase() === storeSlug.toLowerCase()),
    [stores, storeSlug]
  )
  const customerRecord = customerSession
    ? customers.find((c) => c.id === customerSession.customerId)
    : null
  const defaultAddr = customerRecord?.addresses[0]

  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState(customerRecord?.name || "")
  const [email, setEmail] = useState(customerRecord?.email || "")
  const [phone, setPhone] = useState(customerRecord?.phone || "")
  const [country, setCountry] = useState(defaultAddr?.country || "Egypt")
  const [city, setCity] = useState(defaultAddr?.city || "Cairo")
  const [street, setStreet] = useState(defaultAddr?.street || "")
  const [apartment, setApartment] = useState(defaultAddr?.apartment || "")
  const [deliveryInstructions, setDeliveryInstructions] = useState("")

  const enabledShippingMethods = useMemo(
    () => (store ? store.shippingMethods.filter((m) => m.enabled) : []),
    [store]
  )
  const [shippingMethodId, setShippingMethodId] = useState(
    enabledShippingMethods[0]?.id || ""
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("cod")
  const [confirmedOrder, setConfirmedOrder] = useState<StoreOrder | null>(null)

  if (!store) return null

  const NextIcon = locale === "ar" ? ArrowLeft : ArrowRight
  const PrevIcon = locale === "ar" ? ArrowRight : ArrowLeft
  const currency = store.localization.currency
  const items = carts[storeSlug] ?? []
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

  const selectedShipping =
    enabledShippingMethods.find((m) => m.id === shippingMethodId) ??
    enabledShippingMethods[0]
  const shippingCalc = calculateShippingFee({
    method: selectedShipping,
    subtotal,
    city,
  })

  const appliedCode = coupons[storeSlug] || ""
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

  const effectiveShipping = discountCalc?.freeShipping ? 0 : shippingCalc.fee
  const discountAmount =
    discountCalc?.valid && !discountCalc.freeShipping ? discountCalc.discountAmount : 0
  const codFee = paymentMethod === "cod" ? store.paymentConfig.codFee : 0
  const grandTotal = Math.max(0, subtotal + effectiveShipping + codFee - discountAmount)

  // Step 6: Confirmation Receipt
  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-14">
        <div
          className="border p-8 text-center space-y-5"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "color-mix(in srgb, var(--sf-text) 12%, transparent)",
            borderRadius: "var(--sf-radius)",
          }}
        >
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              {pick("تم تأكيد الطلب بنجاح", "Order Confirmed")}
            </p>
            <h1 className="text-2xl font-bold font-mono">{confirmedOrder.orderNumber}</h1>
            <p className="text-sm" style={{ color: "var(--sf-muted)" }}>
              {pick(
                `شكراً لك يا ${confirmedOrder.customerName}! تم تسجيل طلبك لدى ${store.nameAr} وخصم الكميات من المخزون.`,
                `Thank you, ${confirmedOrder.customerName}! Your order has been submitted to ${store.nameEn} and inventory has been reserved.`
              )}
            </p>
          </div>

          <div
            className="text-start p-4 border space-y-2 text-xs"
            style={{
              borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
              borderRadius: "var(--sf-radius)",
            }}
          >
            <div className="flex justify-between">
              <span style={{ color: "var(--sf-muted)" }}>{pick("طريقة الدفع", "Payment Method")}</span>
              <span className="font-semibold">
                {confirmedOrder.paymentMethod === "cod"
                  ? pick("الدفع عند الاستلام", "Cash on Delivery")
                  : pick("تحويل بنكي", "Bank Transfer")}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--sf-muted)" }}>{pick("عنوان التوصيل", "Shipping To")}</span>
              <span className="font-semibold">
                {confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.street}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t font-bold text-sm" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
              <span>{pick("الإجمالي المستحق", "Order Total")}</span>
              <span className="tabular-nums">{formatCurrency(confirmedOrder.total, currency)}</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href={`/s/${storeSlug}/account`}
              className="h-11 px-5 text-xs font-semibold inline-flex items-center"
              style={{
                backgroundColor: "var(--sf-primary)",
                color: "#FFFFFF",
                borderRadius: "var(--sf-btn-radius)",
              }}
            >
              {pick("تتبع الطلب من حسابي", "Track Order in Account")}
            </Link>
            <Link
              href={`/s/${storeSlug}/products`}
              className="h-11 px-5 text-xs font-semibold inline-flex items-center border"
              style={{
                borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                borderRadius: "var(--sf-btn-radius)",
              }}
            >
              {pick("متابعة التسوق", "Continue Shopping")}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-5 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold">{pick("سلة التسوق فارغة", "Your shopping bag is empty")}</h1>
        <Link
          href={`/s/${storeSlug}/products`}
          className="inline-flex h-10 px-5 text-xs font-semibold items-center"
          style={{
            backgroundColor: "var(--sf-primary)",
            color: "#FFFFFF",
            borderRadius: "var(--sf-btn-radius)",
          }}
        >
          {pick("تصفح المنتجات", "Browse Products")}
        </Link>
      </div>
    )
  }

  const validateAndNext = () => {
    if (step === 1 && (!fullName.trim() || !email.trim() || !phone.trim())) {
      toast.error(pick("يرجى إكمال بيانات التواصل بالكامل", "Please complete your contact details"))
      return
    }
    if (step === 2 && (!city.trim() || !street.trim())) {
      toast.error(pick("يرجى إدخال المدينة والعنوان بالتفصيل", "Please enter your city and street address"))
      return
    }
    setStep((s) => Math.min(5, s + 1))
  }

  const handlePlaceOrder = async () => {
    // 1. Submit to Supabase Database via Server Action
    try {
      await placeOrderAction({
        storeSlug,
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        customerCity: city.trim(),
        customerAddress: `${street.trim()}${apartment.trim() ? ` - شقة ${apartment.trim()}` : ""}`,
        customerNotes: deliveryInstructions.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          size: i.variantLabel || "قياسي",
          color: "افتراضي",
          quantity: i.quantity,
        })),
      })
    } catch {
      // Continue gracefully
    }

    const created = placeStorefrontOrder({
      storeId: store.id,
      customerId: customerRecord?.id,
      customerName: fullName.trim(),
      customerEmail: email.trim().toLowerCase(),
      customerPhone: phone.trim(),
      shippingAddress: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        country: country.trim() || "Egypt",
        city: city.trim(),
        street: street.trim(),
        apartment: apartment.trim() || undefined,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
      },
      shippingMethodId: selectedShipping?.id || "standard",
      shippingMethodNameAr: selectedShipping?.nameAr || "شحن قياسي",
      shippingMethodNameEn: selectedShipping?.nameEn || "Standard Shipping",
      paymentMethod,
      items: items.map((i) => ({
        id: `oi-${Date.now()}-${i.variantId}`,
        productId: i.productId,
        variantId: i.variantId,
        nameAr: i.nameAr,
        nameEn: i.nameEn,
        variantLabel: i.variantLabel,
        sku: i.sku,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        visualType: i.visualType,
        visualPalette: i.visualPalette,
      })),
      subtotal,
      shippingFee: effectiveShipping + codFee,
      discountCode: discountCalc?.valid ? appliedCode : undefined,
      discountAmount,
      total: grandTotal,
    })

    clearStoreCart(storeSlug)
    setConfirmedOrder(created)
    toast.success(pick(`تم تأكيد الطلب ${created.orderNumber}`, `Order ${created.orderNumber} confirmed!`))
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {pick("إتمام الطلب", "Secure Checkout")}
        </h1>
        <ol className="flex items-center gap-2 text-xs">
          {STEPS.map((st) => (
            <li
              key={st.id}
              className="px-2.5 py-1 font-semibold border"
              style={{
                borderRadius: "var(--sf-btn-radius)",
                backgroundColor: step === st.id ? "var(--sf-primary)" : "transparent",
                color: step === st.id ? "#FFFFFF" : "var(--sf-muted)",
                borderColor:
                  step >= st.id
                    ? "var(--sf-primary)"
                    : "color-mix(in srgb, var(--sf-text) 14%, transparent)",
              }}
            >
              {st.id}. {pick(st.ar, st.en)}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Step Form Panel */}
        <div
          className="lg:col-span-7 border p-6 space-y-6"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
            borderRadius: "var(--sf-radius)",
          }}
        >
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold">
                1. {pick("معلومات التواصل", "Contact Information")}
              </h2>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {pick("الاسم الكامل", "Full Name")}
                </label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={pick("منى حسن", "Mona Hassan")}
                  className="w-full h-11 px-3.5 text-sm border bg-transparent"
                  style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    {pick("البريد الإلكتروني", "Email Address")}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 text-sm border bg-transparent dir-ltr"
                    style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    {pick("رقم الهاتف للتوصيل", "Mobile Phone")}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                    className="w-full h-11 px-3.5 text-sm border bg-transparent dir-ltr"
                    style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold">
                2. {pick("عنوان الشحن", "Shipping Address")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">{pick("الدولة", "Country")}</label>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm border bg-transparent"
                    style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">{pick("المدينة / المحافظة", "City / Governorate")}</label>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cairo"
                    className="w-full h-11 px-3.5 text-sm border bg-transparent"
                    style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">{pick("الشارع والمنطقة", "Street Address")}</label>
                <input
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder={pick("14 شارع التحرير، الدقي", "14 Tahrir Street, Dokki")}
                  className="w-full h-11 px-3.5 text-sm border bg-transparent"
                  style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">{pick("الشقة / الدور (اختياري)", "Apartment / Floor")}</label>
                  <input
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm border bg-transparent"
                    style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">{pick("ملاحظات للمندوب", "Delivery Notes")}</label>
                  <input
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm border bg-transparent"
                    style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold">
                3. {pick("اختيار وسيلة الشحن", "Choose Shipping Method")}
              </h2>
              <div className="space-y-2.5">
                {enabledShippingMethods.map((m) => {
                  const calc = calculateShippingFee({ method: m, subtotal, city })
                  const selected = m.id === (selectedShipping?.id || "")
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setShippingMethodId(m.id)}
                      className="w-full text-start p-4 border flex items-center justify-between gap-3 transition-colors"
                      style={{
                        borderRadius: "var(--sf-radius)",
                        borderColor: selected
                          ? "var(--sf-primary)"
                          : "color-mix(in srgb, var(--sf-text) 14%, transparent)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="w-4 h-4 shrink-0" />
                        <div>
                          <p className="text-sm font-bold">{pick(m.nameAr, m.nameEn)}</p>
                          <p className="text-xs" style={{ color: "var(--sf-muted)" }}>
                            {pick(m.estimatedDaysAr, m.estimatedDaysEn)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold tabular-nums">
                        {calc.isFree
                          ? pick("مجاني", "Free")
                          : formatCurrency(calc.fee, currency)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold">
                4. {pick("اختيار طريقة الدفع", "Select Payment Method")}
              </h2>
              <div className="space-y-3">
                {store.paymentConfig.codEnabled && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className="w-full text-start p-4 border flex items-center justify-between gap-3"
                    style={{
                      borderRadius: "var(--sf-radius)",
                      borderColor:
                        paymentMethod === "cod"
                          ? "var(--sf-primary)"
                          : "color-mix(in srgb, var(--sf-text) 14%, transparent)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Banknote className="w-5 h-5" />
                      <div>
                        <p className="text-sm font-bold">
                          {pick("الدفع نقداً عند الاستلام (COD)", "Cash on Delivery (COD)")}
                        </p>
                        <p className="text-xs" style={{ color: "var(--sf-muted)" }}>
                          {pick("ادفع عند استلام الشحنة والتأكد منها.", "Pay cash directly to the delivery courier.")}
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {store.paymentConfig.bankTransferEnabled && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className="w-full text-start p-4 border space-y-2"
                    style={{
                      borderRadius: "var(--sf-radius)",
                      borderColor:
                        paymentMethod === "bank_transfer"
                          ? "var(--sf-primary)"
                          : "color-mix(in srgb, var(--sf-text) 14%, transparent)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Landmark className="w-5 h-5" />
                      <div>
                        <p className="text-sm font-bold">
                          {pick("التحويل البنكي المباشر", "Direct Bank Transfer")}
                        </p>
                        <p className="text-xs" style={{ color: "var(--sf-muted)" }}>
                          {store.paymentConfig.bankName || pick("تفاصيل الحساب البنكي للمتجر", "Store bank account details")}
                        </p>
                      </div>
                    </div>
                    {paymentMethod === "bank_transfer" && store.paymentConfig.bankIban && (
                      <div className="p-3 text-xs font-mono border bg-black/5 rounded dir-ltr">
                        {store.paymentConfig.bankAccountName} · {store.paymentConfig.bankIban}
                      </div>
                    )}
                  </button>
                )}

                <div
                  className="p-3.5 border text-xs flex items-start gap-2.5 opacity-80"
                  style={{
                    borderRadius: "var(--sf-radius)",
                    borderColor: "color-mix(in srgb, var(--sf-text) 12%, transparent)",
                  }}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <p>
                    {pick(
                      "الدفع بالبطاقة البنكية غير متصل حالياً على هذا المتجر — لا يتم جمع أي بيانات بطاقات في هذه الواجهة.",
                      "Online card checkout is not connected on this storefront — no payment card information is collected here."
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold">
                5. {pick("مراجعة الطلب وتأكيده", "Review & Place Order")}
              </h2>
              <div
                className="p-4 border space-y-2 text-xs"
                style={{
                  borderRadius: "var(--sf-radius)",
                  borderColor: "color-mix(in srgb, var(--sf-text) 12%, transparent)",
                }}
              >
                <p>
                  <strong>{pick("العميل:", "Customer:")}</strong> {fullName} ({phone})
                </p>
                <p>
                  <strong>{pick("العنوان:", "Ship to:")}</strong> {street}, {city}, {country}
                </p>
                <p>
                  <strong>{pick("الشحن:", "Shipping:")}</strong>{" "}
                  {selectedShipping ? pick(selectedShipping.nameAr, selectedShipping.nameEn) : "Standard"}
                </p>
                <p>
                  <strong>{pick("الدفع:", "Payment:")}</strong>{" "}
                  {paymentMethod === "cod"
                    ? pick("الدفع عند الاستلام", "Cash on Delivery")
                    : pick("تحويل بنكي", "Bank Transfer")}
                </p>
              </div>
            </div>
          )}

          {/* Step Controls */}
          <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="h-10 px-4 text-xs font-semibold border inline-flex items-center gap-1.5 disabled:opacity-35"
              style={{
                borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                borderRadius: "var(--sf-btn-radius)",
              }}
            >
              <PrevIcon className="w-3.5 h-3.5" />
              <span>{pick("السابق", "Back")}</span>
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={validateAndNext}
                className="h-10 px-6 text-xs font-semibold inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: "var(--sf-primary)",
                  color: "#FFFFFF",
                  borderRadius: "var(--sf-btn-radius)",
                }}
              >
                <span>{pick("التالي", "Continue")}</span>
                <NextIcon className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlaceOrder}
                className="h-11 px-6 text-sm font-semibold inline-flex items-center gap-2"
                style={{
                  backgroundColor: "var(--sf-primary)",
                  color: "#FFFFFF",
                  borderRadius: "var(--sf-btn-radius)",
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{pick("تأكيد وإرسال الطلب", "Place Order")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Persistent Order Summary */}
        <div
          className="lg:col-span-5 border p-6 space-y-4"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
            borderRadius: "var(--sf-radius)",
          }}
        >
          <h2 className="text-sm font-bold">
            {pick("ملخص السلة", "Order Summary")} ({items.reduce((s, i) => s + i.quantity, 0)})
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.key} className="flex items-center gap-3 text-xs">
                <div className="w-12 h-14 rounded overflow-hidden shrink-0">
                  <ProductVisual type={item.visualType} palette={item.visualPalette} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{pick(item.nameAr, item.nameEn)}</p>
                  <p style={{ color: "var(--sf-muted)" }}>
                    {item.variantLabel} × {item.quantity}
                  </p>
                </div>
                <span className="font-bold tabular-nums shrink-0">
                  {formatCurrency(item.unitPrice * item.quantity, currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-3 border-t text-xs" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
            <div className="flex justify-between">
              <span style={{ color: "var(--sf-muted)" }}>{pick("المجموع الفرعي", "Subtotal")}</span>
              <span className="font-semibold tabular-nums">{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--sf-muted)" }}>{pick("الشحن", "Shipping")}</span>
              <span className="font-semibold tabular-nums">
                {effectiveShipping === 0
                  ? pick("مجاني", "Free")
                  : formatCurrency(effectiveShipping, currency)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>{pick("خصم", "Discount")} ({appliedCode})</span>
                <span className="tabular-nums">-{formatCurrency(discountAmount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
              <span>{pick("الإجمالي النهائي", "Total")}</span>
              <span className="tabular-nums">{formatCurrency(grandTotal, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
