"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { usePlatformStore } from "@/stores/platformStore"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Logo } from "@/components/ui/Logo"
import type { StoreThemePresetId, TenantStore } from "@/types/saas"

const CATEGORIES: { id: TenantStore["category"]; ar: string; en: string; preset: StoreThemePresetId }[] = [
  { id: "fashion", ar: "الأزياء والملابس", en: "Fashion & Apparel", preset: "minimal-fashion" },
  { id: "cosmetics", ar: "التجميل والعناية", en: "Cosmetics & Beauty", preset: "modern-cosmetics" },
  { id: "electronics", ar: "الإلكترونيات والتقنية", en: "Electronics & Tech", preset: "electronics-pro" },
  { id: "home", ar: "المنزل والديكور", en: "Home & Living", preset: "minimal-fashion" },
  { id: "food", ar: "الأغذية والمشروبات", en: "Food & Beverage", preset: "modern-cosmetics" },
  { id: "other", ar: "تجارة عامة", en: "General Commerce", preset: "electronics-pro" },
]

export default function MerchantRegisterPage() {
  const router = useRouter()
  const { locale, pick } = useI18n()
  const merchants = usePlatformStore((s) => s.merchants)
  const stores = usePlatformStore((s) => s.stores)
  const registerMerchantAndStore = usePlatformStore((s) => s.registerMerchantAndStore)
  const loginMerchant = useAuthStore((s) => s.loginMerchant)

  const [ownerName, setOwnerName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [brandNameEn, setBrandNameEn] = useState("")
  const [brandNameAr, setBrandNameAr] = useState("")
  const [slug, setSlug] = useState("")
  const [category, setCategory] = useState<TenantStore["category"]>("fashion")
  const [error, setError] = useState("")

  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight

  const normalizedSlug = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  const handleBrandEnChange = (val: string) => {
    setBrandNameEn(val)
    if (!slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      )
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const cleanEmail = email.trim().toLowerCase()

    if (merchants.some((m) => m.email.toLowerCase() === cleanEmail)) {
      setError(
        pick(
          "يوجد حساب تاجر مسجل بالفعل بهذا البريد الإلكتروني.",
          "A merchant account with this email already exists."
        )
      )
      return
    }
    if (!normalizedSlug || normalizedSlug.length < 3) {
      setError(
        pick(
          "يرجى اختيار رابط متجر لا يقل عن 3 أحرف إنجليزية.",
          "Please choose a store URL slug of at least 3 characters."
        )
      )
      return
    }
    if (stores.some((s) => s.slug.toLowerCase() === normalizedSlug)) {
      setError(
        pick(
          "رابط المتجر محجوز بالفعل، جرّب اسماً آخر.",
          "This store slug is already taken. Please try another."
        )
      )
      return
    }
    if (password.length < 6) {
      setError(
        pick(
          "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
          "Password must be at least 6 characters long."
        )
      )
      return
    }

    const catDef = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0]
    const { merchant, store } = registerMerchantAndStore({
      ownerName: ownerName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password,
      brandNameAr: brandNameAr.trim() || brandNameEn.trim(),
      brandNameEn: brandNameEn.trim() || brandNameAr.trim(),
      slug: normalizedSlug,
      category,
      presetId: catDef.preset,
    })

    loginMerchant({
      merchantId: merchant.id,
      storeId: store.id,
      name: merchant.name,
      email: merchant.email,
      role: "owner",
    })

    toast.success(
      pick(
        "تم إنشاء حسابك ومتجرك بنجاح! لنكمل خطوات الإعداد.",
        "Account and store created! Let's complete your guided setup."
      )
    )
    router.push("/merchant/onboarding")
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-16 border-b border-border/70 px-6 flex items-center justify-between max-w-6xl w-full mx-auto">
        <Logo size="md" href="/" priority />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              {pick("انضم إلى متجرك", "Start Your Brand")}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {pick("أنشئ متجرك الإلكتروني المستقل", "Create your independent online store")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {pick(
                "احجز رابط متجرك واختر مجال عملك لتبدأ رحلة الإعداد في دقائق.",
                "Reserve your store URL and business category to start your guided onboarding."
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {pick("الاسم الكامل", "Full Name")}
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder={pick("أحمد سامي", "Alex Morgan")}
                  className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {pick("رقم الهاتف / واتساب", "Phone / WhatsApp")}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 100 000 0000"
                  className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm dir-ltr text-start focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {pick("البريد الإلكتروني", "Business Email")}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@mybrand.com"
                  className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm dir-ltr text-start focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {pick("كلمة المرور", "Password")}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border/70 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {pick("اسم العلامة التجارية (إنجليزي)", "Brand Name (English)")}
                </label>
                <input
                  type="text"
                  required
                  value={brandNameEn}
                  onChange={(e) => handleBrandEnChange(e.target.value)}
                  placeholder="Kairo Studio"
                  className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {pick("اسم العلامة التجارية (عربي)", "Brand Name (Arabic)")}
                </label>
                <input
                  type="text"
                  value={brandNameAr}
                  onChange={(e) => setBrandNameAr(e.target.value)}
                  placeholder="كايرو ستوديو"
                  className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {pick("رابط المتجر الفريد", "Store URL Slug")}
                </label>
                <div className="flex items-center h-11 rounded-xl border border-border bg-background overflow-hidden dir-ltr">
                  <span className="px-3 text-xs text-muted-foreground bg-muted/60 h-full flex items-center border-e border-border font-mono">
                    /s/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="kairo-studio"
                    className="flex-1 px-3 text-sm bg-transparent focus:outline-none font-mono"
                  />
                </div>
                {normalizedSlug && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 dir-ltr">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>/s/{normalizedSlug}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {pick("مجال المتجر", "Store Category")}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TenantStore["category"])}
                  className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {pick(c.ar, c.en)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
            >
              <span>{pick("إنشاء المتجر والبدء في الإعداد", "Create Store & Start Onboarding")}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {pick("لديك حساب بالفعل؟", "Already have a merchant account?")}
            </span>
            <Link href="/merchant/login" className="font-semibold text-primary hover:underline">
              {pick("تسجيل الدخول", "Sign In")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
