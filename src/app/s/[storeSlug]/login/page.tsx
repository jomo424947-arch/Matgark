"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { usePlatformStore } from "@/stores/platformStore"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/components/providers/LanguageProvider"

export default function StorefrontCustomerLoginPage() {
  const params = useParams<{ storeSlug: string }>()
  const router = useRouter()
  const storeSlug = params.storeSlug
  const { pick } = useI18n()

  const stores = usePlatformStore((s) => s.stores)
  const customers = usePlatformStore((s) => s.customers)
  const loginStoreCustomer = useAuthStore((s) => s.loginStoreCustomer)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const store = useMemo(
    () => stores.find((s) => s.slug.toLowerCase() === storeSlug.toLowerCase()),
    [stores, storeSlug]
  )
  const storeCustomers = useMemo(
    () => (store ? customers.filter((c) => c.storeId === store.id) : []),
    [customers, store]
  )

  if (!store) return null

  const signInWith = (targetEmail: string, targetPassword: string) => {
    setError("")
    const clean = targetEmail.trim().toLowerCase()
    const cust = storeCustomers.find((c) => c.email.toLowerCase() === clean)
    if (!cust || cust.passwordDemo !== targetPassword) {
      setError(
        pick(
          "بيانات الدخول غير صحيحة لهذا المتجر.",
          "Invalid customer credentials for this store."
        )
      )
      return
    }
    loginStoreCustomer(storeSlug, {
      customerId: cust.id,
      storeId: store.id,
      storeSlug: store.slug,
      name: cust.name,
      email: cust.email,
    })
    toast.success(pick(`أهلاً بك يا ${cust.name}`, `Welcome back, ${cust.name}`))
    router.push(`/s/${storeSlug}/account`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    signInWith(email, password)
  }

  const demoCustomer = storeCustomers[0]

  return (
    <div className="max-w-md mx-auto px-5 py-14">
      <div
        className="border p-6 sm:p-8 space-y-6"
        style={{
          backgroundColor: "var(--sf-surface)",
          borderColor: "color-mix(in srgb, var(--sf-text) 12%, transparent)",
          borderRadius: "var(--sf-radius)",
        }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--sf-accent)" }}>
            {pick(store.nameAr, store.nameEn)}
          </p>
          <h1 className="text-2xl font-bold mt-1">{pick("تسجيل دخول العميل", "Customer Sign In")}</h1>
          <p className="text-xs mt-1" style={{ color: "var(--sf-muted)" }}>
            {pick(
              "تابع طلباتك وعناوينك المحفوظة ومفضلتك في هذا المتجر.",
              "Track your orders, saved addresses, and wishlist in this store."
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              {pick("البريد الإلكتروني", "Email")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3.5 text-sm border bg-transparent dir-ltr"
              style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold">{pick("كلمة المرور", "Password")}</label>
              <Link
                href={`/s/${storeSlug}/forgot-password`}
                className="text-xs hover:underline"
                style={{ color: "var(--sf-primary)" }}
              >
                {pick("نسيت كلمة المرور؟", "Forgot password?")}
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3.5 text-sm border bg-transparent"
              style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600">{error}</p>
          )}

          <button
            type="submit"
            className="w-full h-11 text-sm font-semibold"
            style={{
              backgroundColor: "var(--sf-primary)",
              color: "#FFFFFF",
              borderRadius: "var(--sf-btn-radius)",
            }}
          >
            {pick("تسجيل الدخول", "Sign In")}
          </button>
        </form>

        {demoCustomer && (
          <button
            type="button"
            onClick={() => signInWith(demoCustomer.email, demoCustomer.passwordDemo)}
            className="w-full h-10 text-xs font-semibold border flex items-center justify-center gap-2 hover:bg-black/5"
            style={{
              borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)",
              borderRadius: "var(--sf-btn-radius)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {pick(
                `دخول تجريبي سريع (${demoCustomer.name})`,
                `Quick Demo Sign-In (${demoCustomer.name})`
              )}
            </span>
          </button>
        )}

        <div className="pt-4 border-t text-xs flex items-center justify-between" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
          <span style={{ color: "var(--sf-muted)" }}>
            {pick("جديد في هذا المتجر؟", "New to this store?")}
          </span>
          <Link
            href={`/s/${storeSlug}/register`}
            className="font-bold hover:underline"
            style={{ color: "var(--sf-primary)" }}
          >
            {pick("إنشاء حساب", "Create Account")}
          </Link>
        </div>
      </div>
    </div>
  )
}
