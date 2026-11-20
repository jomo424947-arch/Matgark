"use client"

import React, { useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, ArrowLeft, CheckCircle2, Globe, Shirt } from "lucide-react"
import { toast } from "sonner"
import { usePlatformStore } from "@/stores/platformStore"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Logo } from "@/components/ui/Logo"
import { isReservedSlug } from "@/lib/reserved-slugs"
import { registerWithEmailAction } from "@/server/actions/auth"
import type { StoreThemePresetId } from "@/types/saas"

const CLOTHING_NICHES: {
  id: string
  ar: string
  en: string
  preset: StoreThemePresetId
}[] = [
  { id: "menswear", ar: "ملابس رجالي وكلاسيك", en: "Menswear & Tailored", preset: "minimal-fashion" },
  { id: "womenswear", ar: "أزياء نسائي وفساتين", en: "Womenswear & Dresses", preset: "modern-cosmetics" },
  { id: "modest", ar: "عبايات وملابس محجبات", en: "Abayas & Modest Wear", preset: "modern-cosmetics" },
  { id: "streetwear", ar: "ستريت وير وهوديز شبابي", en: "Streetwear & Hoodies", preset: "electronics-pro" },
  { id: "activewear", ar: "ملابس رياضية", en: "Activewear & Athleisure", preset: "electronics-pro" },
  { id: "kidswear", ar: "ملابس أطفال", en: "Kids Apparel", preset: "minimal-fashion" },
]

function MerchantRegisterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale, pick } = useI18n()
  const merchants = usePlatformStore((s) => s.merchants)
  const stores = usePlatformStore((s) => s.stores)
  const registerMerchantAndStore = usePlatformStore((s) => s.registerMerchantAndStore)
  const loginMerchant = useAuthStore((s) => s.loginMerchant)

  const initialSlug = (searchParams.get("slug") || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")

  const [ownerName, setOwnerName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [brandNameEn, setBrandNameEn] = useState("")
  const [brandNameAr, setBrandNameAr] = useState("")
  const [slug, setSlug] = useState(initialSlug)
  const [nicheId, setNicheId] = useState<string>("menswear")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
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
    if (
      isReservedSlug(normalizedSlug) ||
      stores.some((s) => s.slug.toLowerCase() === normalizedSlug)
    ) {
      setError(
        pick(
          "رابط المتجر محجوز بالفعل، جرّب اسماً آخر.",
          "This store slug is already taken or reserved. Please try another."
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

    setSubmitting(true)
    try {
      const serverResult = await registerWithEmailAction({
        name: ownerName.trim(),
        email: cleanEmail,
        password,
        brandName: brandNameAr.trim() || brandNameEn.trim(),
        slug: normalizedSlug,
        phone: phone.trim() || undefined,
      })

      if (!serverResult.ok) {
        setError(
          serverResult.error ||
            pick("تعذر إنشاء المتجر حالياً.", "Could not create your store right now.")
        )
        return
      }

      const nicheDef = CLOTHING_NICHES.find((c) => c.id === nicheId) ?? CLOTHING_NICHES[0]
      const { merchant, store } = registerMerchantAndStore({
        ownerName: ownerName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        password,
        brandNameAr: brandNameAr.trim() || brandNameEn.trim(),
        brandNameEn: brandNameEn.trim() || brandNameAr.trim(),
        slug: normalizedSlug,
        category: "fashion",
        presetId: nicheDef.preset,
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
          `تم إنشاء متجرك بنجاح! رابطك المباشر: /s/${store.slug}`,
          `Store created! Your live link is /s/${store.slug}`
        )
      )
      router.push("/merchant/onboarding")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-12">
      {/* Editorial Fashion Visual Side */}
      <aside className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-10 bg-zinc-950 text-white overflow-hidden">
        <Image
          src="/images/fashion-hero-editorial.jpg"
          alt={pick("إطلاق براند ملابس على متجرك", "Launch your clothing brand on Matgarak")}
          fill
          priority
          sizes="42vw"
          referrerPolicy="no-referrer"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/35" />

        <div className="relative z-10 flex items-center justify-between">
          <Logo size="md" surface="dark" href="/" />
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            {pick("متاجر الملابس والأزياء", "Apparel Brands")}
          </span>
        </div>

        <div className="relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300">
            <Shirt className="w-4 h-4" />
            <span>{pick("ابدأ مجاناً في دقيقتين", "Launch Free in 2 Minutes")}</span>
          </div>
          <h2 className="text-3xl font-extrabold leading-tight">
            {pick(
              "رابط متجرك المباشر جاهز فور إنشاء الحساب.",
              "Your independent store link goes live the moment you sign up."
            )}
          </h2>
          <ul className="space-y-2.5 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{pick("إدارة كاملة للمقاسات والألوان لكل منتج", "Per-size & color inventory tracking")}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{pick("قوالب أزياء احترافية جاهزة للتخصيص", "Editorial fashion templates ready to customize")}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{pick("الدفع عند الاستلام والشحن لكل المحافظات", "Cash on Delivery & governorate shipping")}</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* Registration Form Column */}
      <div className="lg:col-span-7 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border/70 px-5 sm:px-8 flex items-center justify-between">
          <div className="lg:hidden">
            <Logo size="sm" href="/" />
          </div>
          <Link
            href="/"
            className="hidden lg:inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {pick("العودة للصفحة الرئيسية", "Back to Home")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8">
          <div className="w-full max-w-xl space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                {pick("إنشاء متجر ملابس جديد", "Launch Your Clothing Brand")}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {pick("أنشئ متجر ملابسك المستقل", "Create your fashion store")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {pick(
                  "اختر اسم البراند وتخصص الملابس، وسنجهّز لك رابط متجرك فوراً.",
                  "Choose your brand name and clothing specialty — your live storefront URL is reserved immediately."
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-owner-name" className="block text-sm font-medium mb-1.5">
                    {pick("الاسم الكامل", "Full Name")}
                  </label>
                  <input
                    id="reg-owner-name"
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder={pick("أحمد سامي", "Alex Morgan")}
                    className="w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="reg-phone" className="block text-sm font-medium mb-1.5">
                    {pick("رقم الهاتف / واتساب", "Phone / WhatsApp")}
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                    dir="ltr"
                    className="w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm text-start focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium mb-1.5">
                    {pick("البريد الإلكتروني", "Business Email")}
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@mybrand.com"
                    dir="ltr"
                    className="w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm text-start focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium mb-1.5">
                    {pick("كلمة المرور", "Password")}
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm text-start focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border/70 grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-brand-en" className="block text-sm font-medium mb-1.5">
                    {pick("اسم براند الملابس (إنجليزي)", "Clothing Brand (English)")}
                  </label>
                  <input
                    id="reg-brand-en"
                    type="text"
                    required
                    value={brandNameEn}
                    onChange={(e) => handleBrandEnChange(e.target.value)}
                    placeholder="Kairo Wear"
                    className="w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="reg-brand-ar" className="block text-sm font-medium mb-1.5">
                    {pick("اسم براند الملابس (عربي)", "Clothing Brand (Arabic)")}
                  </label>
                  <input
                    id="reg-brand-ar"
                    type="text"
                    value={brandNameAr}
                    onChange={(e) => setBrandNameAr(e.target.value)}
                    placeholder="كايرو وير"
                    className="w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-slug" className="block text-sm font-medium mb-1.5">
                    {pick("رابط متجرك الفريد", "Store URL Slug")}
                  </label>
                  <div className="flex items-center h-11 rounded-xl border border-input bg-card overflow-hidden dir-ltr">
                    <span className="px-3 text-xs text-muted-foreground bg-muted/70 h-full flex items-center border-e border-border font-mono">
                      /s/
                    </span>
                    <input
                      id="reg-slug"
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="kairo-wear"
                      className="flex-1 px-3 text-sm bg-transparent focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-category" className="block text-sm font-medium mb-1.5">
                    {pick("تخصص الملابس", "Apparel Specialty")}
                  </label>
                  <select
                    id="reg-category"
                    value={nicheId}
                    onChange={(e) => setNicheId(e.target.value)}
                    className="w-full h-11 rounded-xl border border-input bg-card px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    {CLOTHING_NICHES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {pick(c.ar, c.en)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Instant Live Store URL Preview Box */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-primary">
                      {pick("رابط متجرك الذي سيظهر لعملائك فور التسجيل:", "Your live store URL right after signup:")}
                    </p>
                    <p className="text-xs font-mono font-bold text-foreground truncate dir-ltr text-start">
                      /s/{normalizedSlug || "your-brand-name"}
                    </p>
                  </div>
                </div>
                {normalizedSlug.length >= 3 && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-300"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
              >
                <span>
                  {submitting
                    ? pick("جاري تجهيز متجرك...", "Creating your store...")
                    : pick("إنشاء متجر الملابس واستلام الرابط", "Create Clothing Store & Get Link")}
                </span>
                <ArrowIcon className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>{pick("لديك حساب تاجر بالفعل؟", "Already have a merchant account?")}</span>
              <Link href="/merchant/login" className="font-semibold text-primary hover:underline">
                {pick("تسجيل الدخول", "Sign In")}
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function MerchantRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <MerchantRegisterInner />
    </Suspense>
  )
}
