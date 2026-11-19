"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Logo } from "@/components/ui/Logo"
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function AdminLoginPage() {
  const router = useRouter()
  const { pick, dir, t } = useI18n()
  const loginAdmin = useAuthStore((s) => s.loginAdmin)

  const [email, setEmail] = useState("admin@matgarak.com")
  const [password, setPassword] = useState("admin2026")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password.trim()) {
      setError(pick("يرجى إدخال البريد الإلكتروني وكلمة المرور.", "Please enter email and password."))
      return
    }
    if (cleanEmail !== "admin@matgarak.com" && !cleanEmail.endsWith("@matgarak.com")) {
      setError(
        pick(
          "حساب غير مصرح له بالدخول للوحة المشرف العام.",
          "Account is not authorized for Platform Admin access."
        )
      )
      return
    }
    if (password.trim().length < 6) {
      setError(pick("كلمة المرور غير صحيحة.", "Invalid credentials."))
      return
    }

    setLoading(true)
    setTimeout(() => {
      loginAdmin({
        id: "admin-1",
        name: "Amr El-Sherbiny",
        email: cleanEmail,
        role: "super_admin",
      })
      toast.success(pick("مرحباً بك في لوحة المشرف العام", "Signed in to Platform Admin"))
      router.push("/admin/dashboard")
      setLoading(false)
    }, 250)
  }

  return (
    <div className="min-h-screen bg-[#120E0C] text-stone-100 flex flex-col justify-between p-6">
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size="md" surface="dark" href="/" priority />
          <span className="hidden sm:inline text-xs font-semibold text-[#D9B58C] border-s border-stone-700 ps-3">
            {pick("إدارة المنصة", "Admin Console")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="bg-stone-900 border-stone-700 text-stone-100 hover:bg-stone-800" />
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-md w-full mx-auto my-10">
        <div className="border border-stone-800 bg-[#1B1512] rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-xl bg-stone-900 border border-stone-700/80 flex items-center justify-center text-[#D9B58C]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-stone-50">{t.admin.loginTitle}</h1>
            <p className="text-xs text-stone-400 leading-relaxed">
              {t.admin.loginDesc}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-semibold text-stone-300">
                {pick("البريد الإلكتروني للمشرف", "Operator Email")}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute top-3.5 start-3.5" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full h-11 ps-10 pe-3 rounded-lg bg-[#120E0C] border border-stone-700 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-semibold text-stone-300">
                {pick("كلمة المرور", "Password")}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute top-3.5 start-3.5" />
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full h-11 ps-10 pe-3 rounded-lg bg-[#120E0C] border border-stone-700 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? t.common.loading : pick("دخول لوحة المشرف العام", "Sign In as Platform Admin")}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-stone-800 space-y-2 text-[11px] text-stone-400">
            <div className="font-mono text-stone-300">
              {pick("حساب تطوير جاهز:", "Demo Operator:")} admin@matgarak.com / admin2026
            </div>
            <div>
              {pick(
                "هل تبحث عن لوحة تحكم متجرك؟",
                "Looking for your merchant store dashboard?"
              )}{" "}
              <Link href="/merchant/login" className="text-[#D9B58C] hover:underline font-semibold">
                {pick("تسجيل دخول التجار", "Merchant Sign In")}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-stone-500">
        Matgarak Platform Operations · Restricted Administrative Zone
      </footer>
    </div>
  )
}
