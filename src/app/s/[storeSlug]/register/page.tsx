"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { usePlatformStore } from "@/stores/platformStore"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/components/providers/LanguageProvider"

export default function StorefrontCustomerRegisterPage() {
  const params = useParams<{ storeSlug: string }>()
  const router = useRouter()
  const storeSlug = params.storeSlug
  const { pick } = useI18n()

  const stores = usePlatformStore((s) => s.stores)
  const registerStoreCustomer = usePlatformStore((s) => s.registerStoreCustomer)
  const loginStoreCustomer = useAuthStore((s) => s.loginStoreCustomer)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const store = useMemo(
    () => stores.find((s) => s.slug.toLowerCase() === storeSlug.toLowerCase()),
    [stores, storeSlug]
  )

  if (!store) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const res = registerStoreCustomer({
      storeId: store.id,
      name,
      email,
      phone,
      password,
    })
    if (!res.ok) {
      setError(
        pick(
          "يوجد حساب مسجل بالفعل بهذا البريد في هذا المتجر.",
          res.error
        )
      )
      return
    }
    loginStoreCustomer(storeSlug, {
      customerId: res.customer.id,
      storeId: store.id,
      storeSlug: store.slug,
      name: res.customer.name,
      email: res.customer.email,
    })
    toast.success(pick("تم إنشاء حسابك بنجاح", "Customer account created"))
    router.push(`/s/${storeSlug}/account`)
  }

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
          <h1 className="text-2xl font-bold mt-1">
            {pick("إنشاء حساب عميل", "Create Customer Account")}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("الاسم الكامل", "Full Name")}</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 text-sm border bg-transparent"
              style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("البريد الإلكتروني", "Email")}</label>
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
            <label className="block text-xs font-semibold mb-1.5">{pick("رقم الهاتف", "Phone")}</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 px-3.5 text-sm border bg-transparent dir-ltr"
              style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("كلمة المرور", "Password")}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3.5 text-sm border bg-transparent"
              style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
            />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <button
            type="submit"
            className="w-full h-11 text-sm font-semibold"
            style={{
              backgroundColor: "var(--sf-primary)",
              color: "#FFFFFF",
              borderRadius: "var(--sf-btn-radius)",
            }}
          >
            {pick("إنشاء الحساب", "Create Account")}
          </button>
        </form>

        <div className="pt-4 border-t text-xs flex items-center justify-between" style={{ borderColor: "color-mix(in srgb, var(--sf-text) 10%, transparent)" }}>
          <span style={{ color: "var(--sf-muted)" }}>{pick("لديك حساب بالفعل؟", "Already registered?")}</span>
          <Link href={`/s/${storeSlug}/login`} className="font-bold hover:underline" style={{ color: "var(--sf-primary)" }}>
            {pick("تسجيل الدخول", "Sign In")}
          </Link>
        </div>
      </div>
    </div>
  )
}
