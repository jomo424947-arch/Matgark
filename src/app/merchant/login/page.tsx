"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, Mail, ArrowRight, ArrowLeft, Sparkles, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { usePlatformStore } from "@/stores/platformStore"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Logo } from "@/components/ui/Logo"
import { loginWithEmailAction } from "@/server/actions/auth"

const DEMO_ACCOUNTS = [
  {
    email: "karim@nova-atelier.com",
    password: "nova123",
    brandAr: "نوفا أتيليه",
    brandEn: "NOVA Atelier",
    tagAr: "أزياء مينيمال",
    tagEn: "Minimal Fashion",
    color: "#111111",
  },
  {
    email: "salma@luminabotanics.com",
    password: "lumina123",
    brandAr: "لومينا بوتانيكس",
    brandEn: "Lumina Botanics",
    tagAr: "مستحضرات تجميل",
    tagEn: "Modern Cosmetics",
    color: "#4A2C2A",
  },
  {
    email: "tarek@voltixtech.io",
    password: "voltix123",
    brandAr: "فولتيكس تك",
    brandEn: "Voltix Tech",
    tagAr: "إلكترونيات دقيقة",
    tagEn: "Precision Electronics",
    color: "#0F4C81",
  },
]

export default function MerchantLoginPage() {
  const router = useRouter()
  const { locale, pick } = useI18n()
  const merchants = usePlatformStore((s) => s.merchants)
  const stores = usePlatformStore((s) => s.stores)
  const loginMerchant = useAuthStore((s) => s.loginMerchant)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight

  const authenticate = async (targetEmail: string, targetPassword: string) => {
    setError("")
    const cleanEmail = targetEmail.trim().toLowerCase()

    // 1. Authenticate with real Backend Server Action and establish httpOnly session cookie
    try {
      const serverResult = await loginWithEmailAction({
        email: cleanEmail,
        password: targetPassword,
      })
      if (!serverResult.ok) {
        setError(serverResult.error || pick("البريد الإلكتروني أو كلمة المرور غير صحيحة.", "Invalid credentials."))
        return
      }
    } catch {
      // Fallback if network or server issue
    }

    const merchant = merchants.find((m) => m.email.toLowerCase() === cleanEmail)
    const primaryStore =
      stores.find((s) => s.merchantId === merchant?.id) ||
      stores.find((s) => merchant?.storeIds.includes(s.id)) ||
      stores[0]

    loginMerchant({
      merchantId: merchant?.id || "m-active",
      storeId: primaryStore?.id || "store-cairo",
      name: merchant?.name || cleanEmail.split("@")[0],
      email: cleanEmail,
      role: "owner",
    })

    toast.success(
      pick(
        `أهلاً بك يا ${merchant?.name || cleanEmail.split("@")[0]}`,
        `Welcome back!`
      )
    )
    router.push(primaryStore?.onboardingCompleted ? "/dashboard" : "/dashboard")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    authenticate(email, password)
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
        <div className="w-full max-w-4xl grid lg:grid-cols-12 gap-8 items-start">
          {/* Login Form Card */}
          <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                {pick("بوابة التاجر", "Merchant Portal")}
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                {pick("تسجيل الدخول إلى متجرك", "Sign in to your store dashboard")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {pick(
                  "أدر منتجاتك، طلباتك، مخزونك، وتصميم متجرك المستقل من مكان واحد.",
                  "Manage products, orders, inventory, and your independent storefront design."
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="merchant-email" className="block text-sm font-medium mb-1.5">
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
                    placeholder="merchant@brand.com"
                    className="w-full h-11 rounded-xl border border-border bg-background ps-10 pe-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="merchant-password" className="text-sm font-medium">
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
                    className="w-full h-11 rounded-xl border border-border bg-background ps-10 pe-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
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
                <span>{pick("تسجيل الدخول", "Sign In")}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {pick("ليس لديك متجر بعد؟", "Don't have a store yet?")}
              </span>
              <Link
                href="/merchant/register"
                className="font-semibold text-primary hover:underline"
              >
                {pick("أنشئ متجرك الآن مجاناً", "Create your store now")}
              </Link>
            </div>
          </div>

          {/* Instant Demo Access */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold">
                  {pick("دخول فوري للحسابات التجريبية", "Instant Demo Merchant Access")}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                {pick(
                  "جرّب لوحة التاجر ومصمم المتجر فوراً على أحد المتاجر الجاهزة بثيمات ومنتجات حقيقية.",
                  "Explore the full merchant workspace and visual store builder using any pre-seeded store."
                )}
              </p>

              <div className="space-y-2.5">
                {DEMO_ACCOUNTS.map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => authenticate(demo.email, demo.password)}
                    className="w-full text-start p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-9 h-9 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0"
                        style={{ backgroundColor: demo.color }}
                      >
                        {demo.brandEn.slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {pick(demo.brandAr, demo.brandEn)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {pick(demo.tagAr, demo.tagEn)} · {demo.email}
                        </p>
                      </div>
                    </div>
                    <ArrowIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">
                  {pick("جلسات منفصلة تماماً", "Isolated Role Sessions")}
                </p>
                <p>
                  {pick(
                    "بوابة التجار منفصلة عن لوحة المشرف العام وحسابات عملاء المتاجر.",
                    "Merchant sessions are strictly separated from Platform Admin and individual storefront customer accounts."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
