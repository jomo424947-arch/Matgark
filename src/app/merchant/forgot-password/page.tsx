"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Mail, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react"
import { useI18n } from "@/components/providers/LanguageProvider"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Logo } from "@/components/ui/Logo"

export default function MerchantForgotPasswordPage() {
  const { locale, pick } = useI18n()
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
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
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold">
                {pick("تم استلام طلب استعادة كلمة المرور", "Reset request recorded")}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pick(
                  `في بيئة الإنتاج سيتم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}. في بيئة التطوير المحلية يمكنك استخدام بيانات الدخول التجريبية مباشرة من صفحة الدخول.`,
                  `In production, a password reset email is dispatched to ${email}. In this local development build, email delivery is not connected — use any demo merchant account on the sign-in screen.`
                )}
              </p>
              <Link
                href="/merchant/login"
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
              >
                <BackIcon className="w-4 h-4" />
                <span>{pick("العودة لتسجيل الدخول", "Back to Sign In")}</span>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold mb-1.5">
                {pick("استعادة كلمة مرور التاجر", "Reset merchant password")}
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                {pick(
                  "أدخل بريدك الإلكتروني المرتبط بحساب المتجر لإرسال تعليمات إعادة التعيين.",
                  "Enter the email address associated with your merchant account."
                )}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium mb-1.5">
                    {pick("البريد الإلكتروني", "Email address")}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="merchant@brand.com"
                      className="w-full h-11 rounded-xl border border-border bg-background ps-10 pe-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 transition-opacity"
                >
                  {pick("إرسال رابط الاستعادة", "Send Reset Instructions")}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-border text-center">
                <Link
                  href="/merchant/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <BackIcon className="w-3.5 h-3.5" />
                  <span>{pick("العودة لتسجيل الدخول", "Return to sign in")}</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
