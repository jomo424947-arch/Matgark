"use client"

import React, { useState, useMemo, Suspense } from "react"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { User, MapPin, Package, Heart, LogOut, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { usePlatformStore } from "@/stores/platformStore"
import { useAuthStore } from "@/stores/authStore"
import { useStorefrontCartStore } from "@/stores/storefrontCartStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { scopeByTenant } from "@/lib/commerce/engine"
import { formatOrderStatusLabel } from "@/lib/i18n/translations"
import { StorefrontProductCard } from "@/components/storefront/StorefrontProductCard"
import type { ShippingAddress } from "@/types/saas"

type AccountTab = "orders" | "profile" | "addresses" | "wishlist"

function StorefrontAccountInner() {
  const params = useParams<{ storeSlug: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const storeSlug = params.storeSlug
  const { locale, pick, formatCurrency } = useI18n()

  const stores = usePlatformStore((s) => s.stores)
  const products = usePlatformStore((s) => s.products)
  const orders = usePlatformStore((s) => s.orders)
  const customers = usePlatformStore((s) => s.customers)
  const updateCustomerProfile = usePlatformStore((s) => s.updateCustomerProfile)

  const customerSession = useAuthStore((s) => s.customerSessions[storeSlug])
  const logoutStoreCustomer = useAuthStore((s) => s.logoutStoreCustomer)
  const guestWishlists = useStorefrontCartStore((s) => s.guestWishlists)

  const initialTab = (searchParams.get("tab") as AccountTab) || "orders"
  const [tab, setTab] = useState<AccountTab>(initialTab)

  const store = useMemo(
    () => stores.find((s) => s.slug.toLowerCase() === storeSlug.toLowerCase()),
    [stores, storeSlug]
  )
  const customer = useMemo(
    () =>
      customerSession && store
        ? customers.find(
            (c) => c.id === customerSession.customerId && c.storeId === store.id
          )
        : null,
    [customerSession, customers, store]
  )

  const [nameInput, setNameInput] = useState(customer?.name || "")
  const [phoneInput, setPhoneInput] = useState(customer?.phone || "")
  const [addrLabel, setAddrLabel] = useState("Home")
  const [addrCity, setAddrCity] = useState("Cairo")
  const [addrStreet, setAddrStreet] = useState("")

  if (!store) return null

  const storeProducts = scopeByTenant(products, store.id)
  const currency = store.localization.currency

  const wishlistIds = customer
    ? customer.wishlistProductIds
    : guestWishlists[storeSlug] ?? []
  const wishlistProducts = storeProducts.filter((p) => wishlistIds.includes(p.id))

  if (!customer) {
    return (
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 space-y-10">
        <div
          className="border p-8 text-center space-y-4 max-w-lg mx-auto"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "color-mix(in srgb, var(--sf-text) 12%, transparent)",
            borderRadius: "var(--sf-radius)",
          }}
        >
          <User className="w-10 h-10 mx-auto opacity-40" />
          <h1 className="text-xl font-bold">
            {pick("سجّل الدخول لإدارة حسابك وطلباتك", "Sign in to access your account")}
          </h1>
          <p className="text-xs" style={{ color: "var(--sf-muted)" }}>
            {pick(
              `حسابك خاص بمتجر ${store.nameAr} فقط لمتابعة طلباتك وعناوينك.`,
              `Your customer account is scoped exclusively to ${store.nameEn}.`
            )}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href={`/s/${storeSlug}/login`}
              className="h-10 px-5 text-xs font-semibold inline-flex items-center"
              style={{
                backgroundColor: "var(--sf-primary)",
                color: "#FFFFFF",
                borderRadius: "var(--sf-btn-radius)",
              }}
            >
              {pick("تسجيل الدخول", "Sign In")}
            </Link>
            <Link
              href={`/s/${storeSlug}/register`}
              className="h-10 px-5 text-xs font-semibold inline-flex items-center border"
              style={{
                borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                borderRadius: "var(--sf-btn-radius)",
              }}
            >
              {pick("إنشاء حساب", "Create Account")}
            </Link>
          </div>
        </div>

        {wishlistProducts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">{pick("قائمة المفضلة المحفوظة", "Saved Wishlist")}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {wishlistProducts.map((p) => (
                <StorefrontProductCard
                  key={p.id}
                  product={p}
                  storeSlug={storeSlug}
                  currency={currency}
                  theme={store.theme}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const myOrders = scopeByTenant(orders, store.id).filter(
    (o) =>
      o.customerId === customer.id ||
      o.customerEmail.toLowerCase() === customer.email.toLowerCase()
  )

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateCustomerProfile(customer.id, {
      name: nameInput.trim() || customer.name,
      phone: phoneInput.trim() || customer.phone,
    })
    toast.success(pick("تم تحديث بياناتك الشخصية", "Profile updated"))
  }

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addrStreet.trim()) return
    const nextAddr: ShippingAddress = {
      id: `addr-${Date.now()}`,
      label: addrLabel.trim() || "Home",
      fullName: customer.name,
      phone: customer.phone,
      country: "Egypt",
      city: addrCity.trim() || "Cairo",
      street: addrStreet.trim(),
    }
    updateCustomerProfile(customer.id, {
      addresses: [...customer.addresses, nextAddr],
    })
    setAddrStreet("")
    toast.success(pick("تم حفظ العنوان بنجاح", "Address saved"))
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--sf-accent)" }}>
            {pick(store.nameAr, store.nameEn)}
          </p>
          <h1 className="text-2xl font-bold mt-0.5">{customer.name}</h1>
          <p className="text-xs" style={{ color: "var(--sf-muted)" }}>
            {customer.email}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            logoutStoreCustomer(storeSlug)
            router.push(`/s/${storeSlug}`)
          }}
          className="h-9 px-4 text-xs font-semibold border inline-flex items-center gap-1.5 text-rose-600"
          style={{
            borderColor: "color-mix(in srgb, var(--sf-text) 15%, transparent)",
            borderRadius: "var(--sf-btn-radius)",
          }}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{pick("تسجيل الخروج", "Sign Out")}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "orders", icon: Package, ar: `طلباتي (${myOrders.length})`, en: `Orders (${myOrders.length})` },
            { id: "wishlist", icon: Heart, ar: `المفضلة (${wishlistProducts.length})`, en: `Wishlist (${wishlistProducts.length})` },
            { id: "addresses", icon: MapPin, ar: "العناوين المحفوظة", en: "Addresses" },
            { id: "profile", icon: User, ar: "الملف الشخصي", en: "Profile" },
          ] as const
        ).map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="h-10 px-4 text-xs font-semibold border inline-flex items-center gap-2 transition-colors"
              style={{
                borderRadius: "var(--sf-btn-radius)",
                backgroundColor: active ? "var(--sf-primary)" : "transparent",
                color: active ? "#FFFFFF" : "var(--sf-text)",
                borderColor: active
                  ? "var(--sf-primary)"
                  : "color-mix(in srgb, var(--sf-text) 16%, transparent)",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{pick(t.ar, t.en)}</span>
            </button>
          )
        })}
      </div>

      {tab === "orders" && (
        <div className="space-y-4">
          {myOrders.map((ord) => (
            <div
              key={ord.id}
              className="border p-5 space-y-4"
              style={{
                backgroundColor: "var(--sf-surface)",
                borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
                borderRadius: "var(--sf-radius)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 8%, transparent)" }}>
                <div>
                  <span className="font-mono font-bold text-sm">{ord.orderNumber}</span>
                  <span className="text-xs ms-3" style={{ color: "var(--sf-muted)" }}>
                    {ord.createdAt.slice(0, 10)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold" style={{ color: "var(--sf-accent)" }}>
                    {formatOrderStatusLabel(ord.status, locale)}
                  </span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(ord.total, currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                {ord.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {pick(item.nameAr, item.nameEn)} ({item.variantLabel}) × {item.quantity}
                    </span>
                    <span className="tabular-nums font-semibold">
                      {formatCurrency(item.unitPrice * item.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mini Order Tracking Steps */}
              <div className="pt-2 border-t flex flex-wrap gap-3 text-[11px]" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 8%, transparent)", color: "var(--sf-muted)" }}>
                {ord.timeline.map((step, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--sf-primary)" }} />
                    <span>{formatOrderStatusLabel(step.status, locale)}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
          {myOrders.length === 0 && (
            <p className="text-sm py-10 text-center" style={{ color: "var(--sf-muted)" }}>
              {pick("لم تقم بأي طلبات في هذا المتجر بعد.", "You haven't placed any orders in this store yet.")}
            </p>
          )}
        </div>
      )}

      {tab === "wishlist" && (
        <div>
          {wishlistProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {wishlistProducts.map((p) => (
                <StorefrontProductCard
                  key={p.id}
                  product={p}
                  storeSlug={storeSlug}
                  currency={currency}
                  theme={store.theme}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm py-10 text-center" style={{ color: "var(--sf-muted)" }}>
              {pick("قائمة المفضلة فارغة حالياً.", "Your wishlist is empty.")}
            </p>
          )}
        </div>
      )}

      {tab === "addresses" && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            {customer.addresses.map((addr, idx) => (
              <div
                key={addr.id || idx}
                className="p-4 border flex items-start justify-between gap-3 text-xs"
                style={{
                  backgroundColor: "var(--sf-surface)",
                  borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
                  borderRadius: "var(--sf-radius)",
                }}
              >
                <div>
                  <p className="font-bold text-sm">{addr.label || pick("العنوان", "Address")}</p>
                  <p className="mt-1">{addr.street}</p>
                  <p style={{ color: "var(--sf-muted)" }}>
                    {addr.city}, {addr.country}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateCustomerProfile(customer.id, {
                      addresses: customer.addresses.filter((_, i) => i !== idx),
                    })
                  }
                  className="text-rose-600 p-1.5 hover:bg-rose-500/10 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddAddress}
            className="lg:col-span-5 border p-5 space-y-3"
            style={{
              backgroundColor: "var(--sf-surface)",
              borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
              borderRadius: "var(--sf-radius)",
            }}
          >
            <h2 className="text-sm font-bold">{pick("إضافة عنوان جديد", "Add New Address")}</h2>
            <input
              value={addrLabel}
              onChange={(e) => setAddrLabel(e.target.value)}
              placeholder={pick("الاسم (المنزل / العمل)", "Label (Home / Office)")}
              className="w-full h-10 px-3 text-xs border bg-transparent"
              style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 16%, transparent)" }}
            />
            <input
              value={addrCity}
              onChange={(e) => setAddrCity(e.target.value)}
              placeholder={pick("المدينة", "City")}
              className="w-full h-10 px-3 text-xs border bg-transparent"
              style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 16%, transparent)" }}
            />
            <input
              required
              value={addrStreet}
              onChange={(e) => setAddrStreet(e.target.value)}
              placeholder={pick("الشارع والتفاصيل", "Street Address")}
              className="w-full h-10 px-3 text-xs border bg-transparent"
              style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 16%, transparent)" }}
            />
            <button
              type="submit"
              className="w-full h-10 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: "var(--sf-primary)",
                color: "#FFFFFF",
                borderRadius: "var(--sf-btn-radius)",
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{pick("حفظ العنوان", "Save Address")}</span>
            </button>
          </form>
        </div>
      )}

      {tab === "profile" && (
        <form
          onSubmit={handleSaveProfile}
          className="max-w-md border p-6 space-y-4"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
            borderRadius: "var(--sf-radius)",
          }}
        >
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("الاسم", "Full Name")}</label>
            <input
              value={nameInput || customer.name}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full h-10 px-3 text-sm border bg-transparent"
              style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 16%, transparent)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("الهاتف", "Phone")}</label>
            <input
              value={phoneInput || customer.phone}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full h-10 px-3 text-sm border bg-transparent dir-ltr"
              style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 16%, transparent)" }}
            />
          </div>
          <button
            type="submit"
            className="h-10 px-5 text-xs font-semibold"
            style={{
              backgroundColor: "var(--sf-primary)",
              color: "#FFFFFF",
              borderRadius: "var(--sf-btn-radius)",
            }}
          >
            {pick("حفظ التغييرات", "Save Profile")}
          </button>
        </form>
      )}
    </div>
  )
}

export default function StorefrontAccountPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-5 py-16 text-sm opacity-60">Loading account...</div>}>
      <StorefrontAccountInner />
    </Suspense>
  )
}

