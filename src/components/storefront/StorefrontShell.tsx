"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShoppingBag,
  User,
  Search,
  Menu,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Heart,
} from "lucide-react"
import { toast } from "sonner"
import { usePlatformStore } from "@/stores/platformStore"
import { useAuthStore } from "@/stores/authStore"
import { useStorefrontCartStore } from "@/stores/storefrontCartStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { themeToCssVariables } from "@/lib/themes/presets"
import { evaluateDiscountCode } from "@/lib/commerce/engine"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ProductVisual } from "@/components/common/ProductVisual"

interface StorefrontShellProps {
  storeSlug: string
  children: React.ReactNode
}

export function StorefrontShell({ storeSlug, children }: StorefrontShellProps) {
  const router = useRouter()
  const { locale, pick, formatCurrency } = useI18n()
  const stores = usePlatformStore((s) => s.stores)
  const discounts = usePlatformStore((s) => s.discounts)
  const customers = usePlatformStore((s) => s.customers)

  const customerSession = useAuthStore((s) => s.customerSessions[storeSlug])

  const carts = useStorefrontCartStore((s) => s.carts)
  const coupons = useStorefrontCartStore((s) => s.coupons)
  const guestWishlists = useStorefrontCartStore((s) => s.guestWishlists)
  const drawerOpen = useStorefrontCartStore((s) => s.drawerOpen)
  const openDrawer = useStorefrontCartStore((s) => s.openDrawer)
  const closeDrawer = useStorefrontCartStore((s) => s.closeDrawer)
  const updateQuantity = useStorefrontCartStore((s) => s.updateQuantity)
  const removeItem = useStorefrontCartStore((s) => s.removeItem)
  const setCouponCode = useStorefrontCartStore((s) => s.setCouponCode)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [couponInput, setCouponInput] = useState("")

  const store = useMemo(
    () => stores.find((s) => s.slug.toLowerCase() === storeSlug.toLowerCase()),
    [stores, storeSlug]
  )

  const cartItems = carts[storeSlug] ?? []
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = cartItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const appliedCouponCode = coupons[storeSlug] || ""

  const customerRecord = customerSession
    ? customers.find((c) => c.id === customerSession.customerId)
    : null
  const wishlistCount = customerRecord
    ? customerRecord.wishlistProductIds.length
    : (guestWishlists[storeSlug] ?? []).length

  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight

  if (!store) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-xl font-bold">{pick("المتجر غير موجود", "Storefront Not Found")}</h1>
          <p className="text-sm text-muted-foreground">
            {pick(
              `لم نتمكن من العثور على متجر بالرابط /s/${storeSlug}.`,
              `We could not find an active storefront at /s/${storeSlug}.`
            )}
          </p>
          <Link
            href="/"
            className="inline-flex h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold items-center"
          >
            {pick("العودة للمنصة", "Return to Platform")}
          </Link>
        </div>
      </div>
    )
  }

  if (store.status === "suspended" || !store.visible) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
          <h1 className="text-xl font-bold">
            {pick(store.nameAr, store.nameEn)} —{" "}
            {store.status === "suspended"
              ? pick("غير متاح مؤقتاً", "Temporarily Unavailable")
              : pick("قيد التجهيز", "Coming Soon")}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {pick(
              "هذا المتجر غير متاح للزوار حالياً. يمكنك العودة لاحقاً أو استكشاف متاجر أخرى على المنصة.",
              "This storefront is currently offline. Please check back soon or browse active storefronts."
            )}
          </p>
          <Link
            href="/"
            className="inline-flex h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold items-center"
          >
            {pick("استكشف متاجر متجرك", "Explore Active Stores")}
          </Link>
        </div>
      </div>
    )
  }

  const cssVars = themeToCssVariables(store.theme)
  const currency = store.localization.currency

  const discountResult = appliedCouponCode
    ? evaluateDiscountCode({
        code: appliedCouponCode,
        discounts,
        storeId: store.id,
        subtotal,
        shippingFee: 0,
        cartItems: cartItems.map((i) => ({
          productId: i.productId,
          categoryId: i.categoryId,
          lineTotal: i.unitPrice * i.quantity,
        })),
        isFirstOrder: (customerRecord?.totalOrders ?? 0) === 0,
      })
    : null

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = couponInput.trim().toUpperCase()
    if (!clean) return
    const check = evaluateDiscountCode({
      code: clean,
      discounts,
      storeId: store.id,
      subtotal,
      shippingFee: 65,
      cartItems: cartItems.map((i) => ({
        productId: i.productId,
        categoryId: i.categoryId,
        lineTotal: i.unitPrice * i.quantity,
      })),
      isFirstOrder: (customerRecord?.totalOrders ?? 0) === 0,
    })
    if (!check.valid) {
      toast.error(pick("كود الخصم غير صالح أو لم يستوفِ الحد الأدنى", "Promo code is invalid or criteria not met"))
      return
    }
    setCouponCode(storeSlug, clean)
    setCouponInput("")
    toast.success(pick(`تم تطبيق كود الخصم ${clean}`, `Promo code ${clean} applied`))
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchOpen(false)
    router.push(`/s/${store.slug}/products?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const resolveNavHref = (href: string) =>
    href ? `/s/${store.slug}/${href}` : `/s/${store.slug}`

  return (
    <div
      style={{
        ...(cssVars as React.CSSProperties),
        backgroundColor: "var(--sf-bg)",
        color: "var(--sf-text)",
      }}
      className="min-h-screen flex flex-col overflow-x-clip"
    >
      {/* Independent Store Brand Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: "color-mix(in srgb, var(--sf-surface) 92%, transparent)",
          borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Mobile Menu + Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open store navigation"
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href={`/s/${store.slug}`} className="flex items-center gap-2 font-bold text-sm sm:text-base tracking-tight min-w-0">
              <span
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
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
              <span className="truncate max-w-[105px] sm:max-w-none">
                {pick(store.nameAr, store.nameEn)}
              </span>
            </Link>
          </div>

          {/* Center: Store Navigation Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Storefront navigation">
            {store.navigationLinks.map((link) => (
              <Link
                key={link.id}
                href={resolveNavHref(link.href)}
                className="text-sm font-medium opacity-80 hover:opacity-100 transition-opacity"
              >
                {pick(link.labelAr, link.labelEn)}
              </Link>
            ))}
          </nav>

          {/* Right: Search, Language, Account, Wishlist, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={pick("بحث", "Search")}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5"
            >
              <Search className="w-4 h-4" />
            </button>

            <LanguageSwitcher compact />

            <Link
              href={customerSession ? `/s/${store.slug}/account` : `/s/${store.slug}/login`}
              aria-label={pick("حسابي", "Account")}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5 relative"
            >
              <User className="w-4 h-4" />
              {customerSession && (
                <span
                  className="w-2 h-2 rounded-full absolute top-1.5 end-1.5"
                  style={{ backgroundColor: "var(--sf-accent)" }}
                />
              )}
            </Link>

            <Link
              href={`/s/${store.slug}/account?tab=wishlist`}
              aria-label={pick("المفضلة", "Wishlist")}
              className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center hover:bg-black/5 relative"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="text-[10px] font-bold absolute top-1 end-1 tabular-nums">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={openDrawer}
              aria-label={pick("سلة التسوق", "Open shopping bag")}
              className="h-9 px-3 flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "var(--sf-primary)",
                color: "#FFFFFF",
                borderRadius: "var(--sf-btn-radius)",
              }}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="tabular-nums">{cartCount}</span>
            </button>
          </div>
        </div>

        {/* Inline Expandable Search Bar */}
        {searchOpen && (
          <div
            className="border-t px-4 sm:px-8 py-3"
            style={{
              backgroundColor: "var(--sf-surface)",
              borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
            }}
          >
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex gap-2">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={pick("ابحث في منتجات المتجر...", "Search this store's products...")}
                className="flex-1 h-10 px-3.5 text-sm border bg-transparent focus:outline-none"
                style={{
                  borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                  borderRadius: "var(--sf-btn-radius)",
                }}
              />
              <button
                type="submit"
                className="h-10 px-4 text-xs font-semibold"
                style={{
                  backgroundColor: "var(--sf-primary)",
                  color: "#FFFFFF",
                  borderRadius: "var(--sf-btn-radius)",
                }}
              >
                {pick("بحث", "Search")}
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Independent Brand Footer */}
      <footer
        className="border-t mt-16"
        style={{
          backgroundColor: "var(--sf-surface)",
          borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 font-bold text-base">
              <span
                className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold"
                style={{
                  backgroundColor: "var(--sf-primary)",
                  borderRadius: "var(--sf-radius)",
                }}
              >
                {store.logoMonogram}
              </span>
              <span>{pick(store.nameAr, store.nameEn)}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--sf-muted)" }}>
              {pick(store.descriptionAr, store.descriptionEn)}
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider">
              {pick("تصفح المتجر", "Shop")}
            </p>
            <ul className="space-y-2 text-xs" style={{ color: "var(--sf-muted)" }}>
              <li>
                <Link href={`/s/${store.slug}`} className="hover:underline">
                  {pick("الرئيسية", "Home")}
                </Link>
              </li>
              <li>
                <Link href={`/s/${store.slug}/categories`} className="hover:underline">
                  {pick("الأقسام والمجموعات", "Categories")}
                </Link>
              </li>
              <li>
                <Link href={`/s/${store.slug}/products`} className="hover:underline">
                  {pick("جميع المنتجات", "All Products")}
                </Link>
              </li>
              <li>
                <Link href={`/s/${store.slug}/cart`} className="hover:underline">
                  {pick("سلة التسوق", "Shopping Bag")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider">
              {pick("حساب العميل", "Customer Care")}
            </p>
            <ul className="space-y-2 text-xs" style={{ color: "var(--sf-muted)" }}>
              <li>
                <Link href={`/s/${store.slug}/account`} className="hover:underline">
                  {pick("حسابي وطلباتي", "My Account & Orders")}
                </Link>
              </li>
              <li>
                <Link href={`/s/${store.slug}/login`} className="hover:underline">
                  {pick("تسجيل الدخول", "Sign In")}
                </Link>
              </li>
              <li>
                <Link href={`/s/${store.slug}/register`} className="hover:underline">
                  {pick("إنشاء حساب عميل", "Create Account")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider">
              {pick("التواصل", "Contact")}
            </p>
            <div className="space-y-1.5 text-xs" style={{ color: "var(--sf-muted)" }}>
              <p>{store.contactEmail}</p>
              <p className="dir-ltr text-start">{store.contactPhone}</p>
              {store.socialLinks.instagram && <p>Instagram: {store.socialLinks.instagram}</p>}
            </div>
          </div>
        </div>
        <div
          className="border-t py-4 px-5 sm:px-8 text-xs flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto"
          style={{
            borderColor: "color-mix(in srgb, var(--sf-text) 8%, transparent)",
            color: "var(--sf-muted)",
          }}
        >
          <span>
            © {new Date().getFullYear()} {pick(store.nameAr, store.nameEn)}
          </span>
          <Link href="/" className="hover:underline opacity-70">
            {pick("مدعوم بواسطة متجرك", "Powered by Matgarak")}
          </Link>
        </div>
      </footer>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div
            className="relative z-10 w-72 max-w-[85vw] h-full p-5 flex flex-col gap-4"
            style={{ backgroundColor: "var(--sf-surface)", color: "var(--sf-text)" }}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-bold">{pick(store.nameAr, store.nameEn)}</span>
              <button type="button" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-2">
              {store.navigationLinks.map((l) => (
                <Link
                  key={l.id}
                  href={resolveNavHref(l.href)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium"
                >
                  {pick(l.labelAr, l.labelEn)}
                </Link>
              ))}
              <Link
                href={`/s/${store.slug}/account`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium"
              >
                {pick("حسابي وطلباتي", "My Account & Orders")}
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Slide-Over Cart Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/45" onClick={closeDrawer} />
          <div
            className="relative z-10 w-full max-w-md h-full flex flex-col shadow-2xl"
            style={{ backgroundColor: "var(--sf-surface)", color: "var(--sf-text)" }}
          >
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {pick("سلة التسوق", "Shopping Bag")} ({cartCount})
                </span>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close bag"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 mx-auto opacity-25" />
                  <p className="text-sm font-semibold">
                    {pick("سلة التسوق فارغة حالياً", "Your shopping bag is empty")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      closeDrawer()
                      router.push(`/s/${store.slug}/products`)
                    }}
                    className="h-10 px-5 text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--sf-primary)",
                      color: "#FFFFFF",
                      borderRadius: "var(--sf-btn-radius)",
                    }}
                  >
                    {pick("ابدأ التسوق", "Start Shopping")}
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex gap-3 p-3 border"
                    style={{
                      borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)",
                      borderRadius: "var(--sf-radius)",
                    }}
                  >
                    <div className="w-16 h-20 rounded overflow-hidden shrink-0">
                      <ProductVisual type={item.visualType} palette={item.visualPalette} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold truncate">
                          {pick(item.nameAr, item.nameEn)}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--sf-muted)" }}>
                          {item.variantLabel}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(storeSlug, item.key, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-black/5"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-mono tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(storeSlug, item.key, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-black/5"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold tabular-nums">
                            {formatCurrency(item.unitPrice * item.quantity, currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(storeSlug, item.key)}
                            className="text-rose-600 p-1 hover:bg-rose-500/10 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div
                className="p-4 border-t space-y-3"
                style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}
              >
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder={pick("كود خصم (مثل NOVA10)", "Promo code (e.g. NOVA10)")}
                    className="flex-1 h-9 px-3 text-xs border bg-transparent font-mono uppercase"
                    style={{
                      borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)",
                      borderRadius: "var(--sf-btn-radius)",
                    }}
                  />
                  <button
                    type="submit"
                    className="h-9 px-3.5 text-xs font-semibold border"
                    style={{
                      borderColor: "color-mix(in srgb, var(--sf-text) 20%, transparent)",
                      borderRadius: "var(--sf-btn-radius)",
                    }}
                  >
                    {pick("تطبيق", "Apply")}
                  </button>
                </form>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--sf-muted)" }}>{pick("المجموع الفرعي", "Subtotal")}</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(subtotal, currency)}</span>
                  </div>
                  {discountResult?.valid && discountResult.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>{pick("خصم", "Discount")} ({appliedCouponCode})</span>
                      <span className="tabular-nums">
                        -{formatCurrency(discountResult.discountAmount, currency)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={`/s/${store.slug}/cart`}
                    onClick={closeDrawer}
                    className="h-10 text-xs font-semibold flex items-center justify-center border"
                    style={{
                      borderColor: "color-mix(in srgb, var(--sf-text) 20%, transparent)",
                      borderRadius: "var(--sf-btn-radius)",
                    }}
                  >
                    {pick("عرض السلة", "View Full Bag")}
                  </Link>
                  <Link
                    href={`/s/${store.slug}/checkout`}
                    onClick={closeDrawer}
                    className="h-10 text-xs font-semibold flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: "var(--sf-primary)",
                      color: "#FFFFFF",
                      borderRadius: "var(--sf-btn-radius)",
                    }}
                  >
                    <span>{pick("إتمام الطلب", "Checkout")}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
