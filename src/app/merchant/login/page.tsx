"use client"

import React, { useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { usePlatformStore } from "@/stores/platformStore"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Logo } from "@/components/ui/Logo"
import {
  loginWithEmailAction,
  establishLocalDemoSessionAction,
} from "@/server/actions/auth"

const FLAGSHIP_DEMO = {
  email: "karim@menz-club.com",
  password: "menz123",
  brandAr: "Men’z Club — مينز كلوب",
  brandEn: "Men’z Club",
  slug: "menz-club",
}

function MerchantLoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale, pick } = useI18n()
  const merchants = usePlatformStore((s) => s.merchants)
  const stores = usePlatformStore((s) => s.stores)
  const loginMerchant = useAuthStore((s) => s.loginMerchant)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight

  const authenticate = async (targetEmail: string, targetPassword: string) => {
    if (submitting) return
    setError("")
    setSubmitting(true)
    const cleanEmail = targetEmail.trim().toLowerCase()

    try {
      const localMerchant = merchants.find(
        (m) => m.email.toLowerCase() === cleanEmail
      )
      if (localMerchant?.status === "suspended") {
        setError(
          pick(
            "تم إيقاف حساب التاجر مؤقتاً. تواصل مع دعم المنصة.",
            "This merchant account is currently suspended. Contact platform support."
          )
        )
        return
      }

      const serverResult = await loginWithEmailAction({
        email: cleanEmail,
        password: targetPassword,
      })

      if (!serverResult.ok) {
        if (
          serverResult.mode === "local" &&
          localMerchant &&
          localMerchant.passwordDemo === targetPassword
        ) {
          const localStore =
            stores.find((s) => s.merchantId === localMerchant.id) ||
            stores.find((s) => localMerchant.storeIds.includes(s.id))
          if (localStore) {
            await establishLocalDemoSessionAction(localMerchant.id, localStore.id)
          }
        } else {
          setError(
            serverResult.error ||
              pick(
                "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
                "Invalid email address or password."
              )
          )
          return
        }
      }

      const primaryStore =
        stores.find((s) => s.merchantId === localMerchant?.id) ||
        stores.find((s) => localMerchant?.storeIds.includes(s.id)) ||
        stores[0]

      loginMerchant({
        merchantId: localMerchant?.id || "m-active",
        storeId: primaryStore?.id || "store-nova",
        name: localMerchant?.name || cleanEmail.split("@")[0],
        email: cleanEmail,
        role: "owner",
      })

      toast.success(
        pick(
          `أهلاً بك يا ${localMerchant?.name || cleanEmail.split("@")[0]}`,
          `Welcome back, ${localMerchant?.name || cleanEmail.split("@")[0]}`
        )
      )

      const fromParam = searchParams.get("from")
      const safeReturnPath =
        fromParam && fromParam.startsWith("/dashboard") ? fromParam : "/dashboard"

      router.push(
        primaryStore && !primaryStore.onboardingCompleted
          ? "/merchant/onboarding"
          : safeReturnPath
      )
    } catch {
      setError(
        pick(
          "حدث خطأ غير متوقع أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.",
          "An unexpected error occurred while signing in. Please try again."
        )
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void authenticate(email, password)
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-12">
      {/* Editorial Fashion Visual Side */}
      <aside className="hidden lg:flex lg:col-span-5 xl:col-span-6 relative flex-col justify-between p-10 bg-zinc-950 text-white overflow-hidden">
        <Image
          src="/images/fashion-login-editorial.jpg"
          alt={pick("بوتيك أزياء متجرك", "Matgarak luxury clothing boutique")}
          fill
          priority
          sizes="50vw"
          referrerPolicy="no-referrer"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/35" />

        <div className="relative z-10 flex items-center justify-between">
          <Logo size="md" surface="dark" href="/" />
          <span className="text-xs font-semibold tracking-wider uppercase text-amber-300/90">
            {pick("بوابة براندات الملابس", "Fashion Merchant Portal")}
          </span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
              {pick(
                "أدر متجر ملابسك، المقاسات، والطلبات من لوحة واحدة أنيقة.",
                "Run your clothing label, size inventory, and orders from one calm workspace."
              )}
            </h2>
            <p className="text-sm text-white/75 leading-relaxed">
              {pick(
                "كل براند يحصل على رابط متجر مستقل وتصميم أزياء تحريري جاهز للبيع عبر الموبايل والكمبيوتر.",
                "Every fashion brand gets a dedicated storefront URL and an editorial design system built to convert on mobile."
              )}
            </p>
          </div>

          {/* Live Flagship Store Preview Strip */}
          <div className="rounded-xl border border-white/15 bg-black/55 backdrop-blur-md p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold">
                {pick("متجر توضيحي مكتمل", "Complete Live Storefront")}
              </p>
              <p className="text-sm font-bold truncate mt-0.5">
                {pick(FLAGSHIP_DEMO.brandAr, FLAGSHIP_DEMO.brandEn)}
              </p>
              <p className="text-xs font-mono text-white/70 dir-ltr text-start">
                /s/{FLAGSHIP_DEMO.slug}
              </p>
            </div>
            <Link
              href={`/s/${FLAGSHIP_DEMO.slug}`}
              className="h-9 px-3.5 rounded-lg bg-white text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-amber-50 transition-colors shrink-0"
            >
              <span>{pick("معاينة", "Preview")}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Form Column */}
      <div className="lg:col-span-7 xl:col-span-6 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border/70 px-5 sm:px-8 flex items-center justify-between">
          <div className="lg:hidden">
            <Logo size="sm" href="/" />
          </div>
          <Link
            href="/"
            className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{pick("العودة للصفحة الرئيسية", "Back to Home")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-10">
          <div className="w-full max-w-md space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                {pick("تسجيل دخول التاجر", "Merchant Sign In")}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {pick("مرحباً بعودتك إلى متجرك", "Sign in to your fashion store")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {pick(
                  "أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم.",
                  "Enter your email and password to access your merchant dashboard."
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="merchant-email"
                  className="block text-sm font-medium mb-1.5 text-foreground"
                >
                  {pick("البريد الإلكتروني", "Email address")}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    id="merchant-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@brand.com"
                    dir="ltr"
                    className="w-full h-11 rounded-xl border border-input bg-card ps-10 pe-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-start"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="merchant-password"
                    className="text-sm font-medium text-foreground"
                  >
                    {pick("كلمة المرور", "Password")}
                  </label>
                  <Link
                    href="/merchant/forgot-password"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    {pick("نسيت كلمة المرور؟", "Forgot password?")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    id="merchant-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full h-11 rounded-xl border border-input bg-card ps-10 pe-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-start"
                  />
                </div>
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
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
              >
                <span>
                  {submitting
                    ? pick("جاري تسجيل الدخول...", "Signing in...")
                    : pick("تسجيل الدخول", "Sign In")}
                </span>
                <ArrowIcon className="w-4 h-4" />
              </button>
            </form>

            {/* Single Complete Flagship Demo Account Card */}
            <div className="rounded-2xl border border-primary/30 bg-card p-5 space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{pick("حساب توضيحي شامل وجاهز", "Complete Showcase Account")}</span>
                  </div>
                  <h2 className="text-sm font-bold text-foreground">
                    {pick(FLAGSHIP_DEMO.brandAr, FLAGSHIP_DEMO.brandEn)}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pick(
                      "متجر ملابس مكتمل بالمنتجات والمقاسات والطلبات وكوبون MENZ10 + المساعد الذكي لإدارة المتجر.",
                      "Full clothing store with apparel sizes, real orders, AI Copilot, and active MENZ10 promo code."
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border text-xs font-mono dir-ltr">
                <span className="text-foreground">{FLAGSHIP_DEMO.email}</span>
                <span className="text-muted-foreground">pass: {FLAGSHIP_DEMO.password}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    void authenticate(FLAGSHIP_DEMO.email, FLAGSHIP_DEMO.password)
                  }
                  className="flex-1 h-10 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>{pick("دخول فوري لحساب Men’z Club الشامل", "Sign In to Men’z Club Showcase")}</span>
                </button>
                <Link
                  href={`/s/${FLAGSHIP_DEMO.slug}`}
                  className="h-10 px-3.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{pick("المتجر", "Store")}</span>
                </Link>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div>
                {pick("ليس لديك متجر ملابس بعد؟", "New clothing brand?")}{" "}
                <Link
                  href="/merchant/register"
                  className="font-semibold text-primary hover:underline"
                >
                  {pick("أنشئ متجرك الآن", "Create store free")}
                </Link>
              </div>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{pick("دخول المشرف العام", "Admin Login")}</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function MerchantLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <MerchantLoginInner />
    </Suspense>
  )
}
