"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { useI18n } from "@/components/providers/LanguageProvider"

export default function StorefrontForgotPasswordPage() {
  const params = useParams<{ storeSlug: string }>()
  const storeSlug = params.storeSlug
  const { pick } = useI18n()

  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  return (
    <div className="max-w-md mx-auto px-5 py-14">
      <div
        className="border p-6 sm:p-8 space-y-5"
        style={{
          backgroundColor: "var(--sf-surface)",
          borderColor: "color-mix(in srgb, var(--sf-text) 12%, transparent)",
          borderRadius: "var(--sf-radius)",
        }}
      >
        {sent ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h1 className="text-lg font-bold">
              {pick("تم تسجيل طلب استعادة كلمة المرور", "Reset request received")}
            </h1>
            <p className="text-xs leading-relaxed" style={{ color: "var(--sf-muted)" }}>
              {pick(
                `في بيئة الإنتاج سيتم إرسال رابط استعادة كلمة المرور إلى ${email}.`,
                `In production, password recovery instructions will be sent to ${email}.`
              )}
            </p>
            <Link
              href={`/s/${storeSlug}/login`}
              className="inline-flex h-10 px-5 text-xs font-semibold items-center"
              style={{
                backgroundColor: "var(--sf-primary)",
                color: "#FFFFFF",
                borderRadius: "var(--sf-btn-radius)",
              }}
            >
              {pick("العودة لتسجيل الدخول", "Back to Sign In")}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold">
              {pick("استعادة كلمة المرور", "Reset Your Password")}
            </h1>
            <p className="text-xs" style={{ color: "var(--sf-muted)" }}>
              {pick(
                "أدخل بريدك الإلكتروني المسجل في هذا المتجر.",
                "Enter the email address associated with your customer account in this store."
              )}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (email.trim()) setSent(true)
              }}
              className="space-y-4"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 px-3.5 text-sm border bg-transparent dir-ltr"
                style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "color-mix(in srgb, var(--sf-text) 18%, transparent)" }}
              />
              <button
                type="submit"
                className="w-full h-11 text-sm font-semibold"
                style={{
                  backgroundColor: "var(--sf-primary)",
                  color: "#FFFFFF",
                  borderRadius: "var(--sf-btn-radius)",
                }}
              >
                {pick("إرسال الرابط", "Send Reset Link")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
