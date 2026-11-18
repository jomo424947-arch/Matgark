"use client"

import React, { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { registerMerchantAction } from "@/server/actions/auth"
import { normalizeLocalEgyptPhone } from "@/lib/whatsapp"
import { sanitizeSlug, isReservedSlug } from "@/lib/reserved-slugs"
import {
  ArrowLeft,
  Store,
  Phone,
  Sparkles,
  CheckCircle2,
  MessageCircle,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates that the redirect destination is a safe internal relative path.
 * Prevents Open Redirect vulnerabilities.
 */
function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback = "/onboarding"
): string {
  if (!target || typeof target !== "string") return fallback
  const trimmed = target.trim()
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !trimmed.includes("://")
  ) {
    return trimmed
  }
  return fallback
}

/** Validates an Egyptian phone number client-side before hitting the server. */
function isValidEgyptPhone(raw: string): boolean {
  const normalized = normalizeLocalEgyptPhone(raw)
  return /^01[0125]\d{8}$/.test(normalized)
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner form — uses useSearchParams so it must be inside <Suspense>
// ─────────────────────────────────────────────────────────────────────────────

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read initial values from URL query params (from Hero / Pricing links)
  const initialSlug = searchParams.get("slug") ?? ""
  const rawPlan = searchParams.get("plan")
  const initialPlan: "free" | "pro" =
    rawPlan === "pro" ? "pro" : "free"

  // ── Form state ──────────────────────────────────────────────────────────────
  const [storeName, setStoreName] = useState("")
  const [slug, setSlug] = useState(initialSlug)
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [sameAsPhone, setSameAsPhone] = useState(false)
  const [plan] = useState<"free" | "pro">(initialPlan)

  // ── Validation errors ───────────────────────────────────────────────────────
  const [nameError, setNameError] = useState<string | null>(null)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [whatsappError, setWhatsappError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  // ── Loading guard ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)

  // When "same as phone" is checked, mirror phone → whatsapp
  useEffect(() => {
    if (sameAsPhone) {
      setWhatsapp(phone)
      setWhatsappError(null)
    }
  }, [sameAsPhone, phone])

  // ── Field handlers ──────────────────────────────────────────────────────────

  /** Auto-derive slug from store name on name change. */
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setStoreName(val)
    setNameError(null)

    // Only auto-fill slug if the user hasn't manually edited it yet
    if (!slug || slug === sanitizeSlug(storeName)) {
      setSlug(sanitizeSlug(val))
      setSlugError(null)
    }
  }

  /** Sanitize slug on every keystroke. */
  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // Allow the user to type freely; sanitize for display/validation
    const sanitized = raw.toLowerCase().replace(/[^a-z0-9-]/g, "")
    setSlug(sanitized)
    setSlugError(null)
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(e.target.value)
    setPhoneError(null)
    if (sameAsPhone) {
      setWhatsapp(e.target.value)
      setWhatsappError(null)
    }
  }

  function handleWhatsappChange(e: React.ChangeEvent<HTMLInputElement>) {
    setWhatsapp(e.target.value)
    setWhatsappError(null)
  }

  // ── Client-side validation ──────────────────────────────────────────────────

  function validateFields(): boolean {
    let valid = true

    // Store name: 2–60 chars
    if (!storeName.trim()) {
      setNameError("اسم المتجر مطلوب")
      valid = false
    } else if (storeName.trim().length < 2) {
      setNameError("اسم المتجر يجب أن يكون حرفين على الأقل")
      valid = false
    } else if (storeName.trim().length > 60) {
      setNameError("اسم المتجر يجب ألا يتجاوز 60 حرفاً")
      valid = false
    } else {
      setNameError(null)
    }

    // Slug: sanitized, 3–40 chars, not reserved
    const cleanSlug = sanitizeSlug(slug)
    if (!cleanSlug) {
      setSlugError("رابط المتجر مطلوب")
      valid = false
    } else if (cleanSlug.length < 3) {
      setSlugError("رابط المتجر يجب أن يتكون من 3 أحرف على الأقل")
      valid = false
    } else if (cleanSlug.length > 40) {
      setSlugError("رابط المتجر يجب ألا يتجاوز 40 حرفاً")
      valid = false
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      setSlugError("الرابط يجب أن يحتوي على أحرف إنجليزية وأرقام وعلامة (-) فقط")
      valid = false
    } else if (isReservedSlug(cleanSlug)) {
      setSlugError("هذا الرابط محجوز للنظام، يرجى اختيار رابط آخر")
      valid = false
    } else {
      setSlugError(null)
    }

    // Phone
    if (!phone.trim()) {
      setPhoneError("رقم الموبايل مطلوب")
      valid = false
    } else if (!isValidEgyptPhone(phone)) {
      setPhoneError("يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقم (مثال: 01012345678)")
      valid = false
    } else {
      setPhoneError(null)
    }

    // WhatsApp
    const effectiveWhatsapp = sameAsPhone ? phone : whatsapp
    if (!effectiveWhatsapp.trim()) {
      setWhatsappError("رقم واتساب مطلوب")
      valid = false
    } else if (!isValidEgyptPhone(effectiveWhatsapp)) {
      setWhatsappError("يرجى إدخال رقم واتساب مصري صحيح مكون من 11 رقم (مثال: 01012345678)")
      valid = false
    } else {
      setWhatsappError(null)
    }

    return valid
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    if (!validateFields()) return
    if (loading) return // prevent duplicate submissions

    setLoading(true)

    try {
      const cleanPhone = normalizeLocalEgyptPhone(phone)
      const effectiveWhatsapp = sameAsPhone ? phone : whatsapp
      const cleanWhatsapp = normalizeLocalEgyptPhone(effectiveWhatsapp)
      const cleanSlug = sanitizeSlug(slug)

      const res = await registerMerchantAction({
        storeName: storeName.trim(),
        slug: cleanSlug,
        phone: cleanPhone,
        whatsapp: cleanWhatsapp,
        plan,
      })

      if (!res.ok) {
        // Detect slug-conflict error from backend and surface it on the slug field
        const errorMsg = res.error ?? "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى"
        if (
          errorMsg.includes("رابط") ||
          errorMsg.includes("محجوز") ||
          errorMsg.includes("slug")
        ) {
          setSlugError(errorMsg)
        } else {
          setServerError(errorMsg)
        }
        setLoading(false)
        return
      }

      // ── Success ─────────────────────────────────────────────────────────────
      toast.success("تم إنشاء متجرك بنجاح! جاري تحويلك لإعداد المتجر...")
      const destination = getSafeRedirectUrl(res.redirectTo, "/onboarding")
      router.refresh()
      router.push(destination)
      // Keep loading=true so the button stays disabled during navigation
    } catch (err) {
      console.error("[register] unexpected error:", err)
      setServerError("حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى")
      setLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </div>

      {/* Plan badge (shown if plan=pro was passed) */}
      {plan === "pro" && (
        <div className="max-w-lg w-full mx-auto mt-4">
          <div className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold w-fit mx-auto">
            <Sparkles className="w-3.5 h-3.5" />
            <span>الباقة الاحترافية — Pro</span>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="max-w-lg w-full mx-auto my-8">
        <Card className="border-border/80 shadow-2xl">
          <CardContent className="p-8 text-right space-y-6">
            {/* Heading */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>إعداد سريع في دقيقتين</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                افتح متجرك الإلكتروني مجاناً
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                ابدأ البيع لعملائك باسم محلك واستقبل أوردراتك منظمة من النهاردة.
              </p>
            </div>

            {/* Server-level error banner */}
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* ── Store Name ── */}
              <div className="space-y-1">
                <Input
                  label="اسم المحل أو البراند"
                  placeholder="مثال: براند كايرو كوتور"
                  value={storeName}
                  onChange={handleNameChange}
                  required
                  helperText={
                    nameError
                      ? undefined
                      : "هذا الاسم اللي هيظهر لعملائك في المتجر"
                  }
                  startIcon={<Store className="w-4 h-4" />}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? "name-error" : undefined}
                />
                {nameError && (
                  <p
                    id="name-error"
                    role="alert"
                    className="flex items-center gap-1 text-xs text-destructive pt-0.5"
                  >
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {nameError}
                  </p>
                )}
              </div>

              {/* ── Store Slug ── */}
              <div className="space-y-2">
                <label
                  htmlFor="register-slug-input"
                  className="block text-sm font-semibold text-foreground/90"
                >
                  لينك المتجر الخاص بك
                </label>
                <div
                  className={`flex items-center bg-muted/40 border rounded-2xl px-4 py-2 text-sm text-foreground dir-ltr transition-colors ${slugError
                      ? "border-destructive"
                      : "border-input focus-within:border-primary"
                    }`}
                >
                  <span className="text-xs text-muted-foreground font-semibold select-none">
                    matgarak.com/
                  </span>
                  <input
                    id="register-slug-input"
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="my-shop"
                    required
                    minLength={3}
                    maxLength={40}
                    aria-invalid={!!slugError}
                    aria-describedby={slugError ? "slug-error" : "slug-hint"}
                    className="flex-1 bg-transparent border-0 outline-none text-foreground font-bold pl-1 text-left"
                  />
                </div>
                {slugError ? (
                  <p
                    id="slug-error"
                    role="alert"
                    className="flex items-center gap-1 text-xs text-destructive"
                  >
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {slugError}
                  </p>
                ) : (
                  <p id="slug-hint" className="text-[11px] text-muted-foreground">
                    تقدر تشارك اللينك ده مع عملائك وفي بايو إنستجرام وتيك توك
                  </p>
                )}
              </div>

              {/* ── Personal Phone ── */}
              <div className="space-y-1">
                <Input
                  label="رقم الموبايل الشخصي"
                  type="tel"
                  inputMode="numeric"
                  placeholder="01012345678"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  dir="ltr"
                  startIcon={<Phone className="w-4 h-4" />}
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? "phone-error" : undefined}
                />
                {phoneError && (
                  <p
                    id="phone-error"
                    role="alert"
                    className="flex items-center gap-1 text-xs text-destructive pt-0.5"
                  >
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {phoneError}
                  </p>
                )}
              </div>

              {/* ── Same-as-phone toggle ── */}
              <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  checked={sameAsPhone}
                  onChange={(e) => setSameAsPhone(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-xs text-muted-foreground">
                  رقم واتساب نفس رقم الموبايل
                </span>
              </label>

              {/* ── WhatsApp ── */}
              {!sameAsPhone && (
                <div className="space-y-1">
                  <Input
                    label="رقم واتساب لاستقبال الأوردرات"
                    type="tel"
                    inputMode="numeric"
                    placeholder="01012345678"
                    value={whatsapp}
                    onChange={handleWhatsappChange}
                    required
                    dir="ltr"
                    helperText={
                      whatsappError
                        ? undefined
                        : "هنبعتلك إشعار فوري وتفاصيل كل أوردر جديد على الرقم ده"
                    }
                    startIcon={
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                    }
                    aria-invalid={!!whatsappError}
                    aria-describedby={
                      whatsappError ? "whatsapp-error" : undefined
                    }
                  />
                  {whatsappError && (
                    <p
                      id="whatsapp-error"
                      role="alert"
                      className="flex items-center gap-1 text-xs text-destructive pt-0.5"
                    >
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {whatsappError}
                    </p>
                  )}
                </div>
              )}

              {/* ── Trust signals ── */}
              <div className="space-y-2 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>باقة مجانية للأبد بدون أي بطاقة بنكية</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>بدون أي نسبة أو عمولة على مبيعاتك</span>
                </div>
              </div>

              {/* ── Submit ── */}
              <Button
                type="submit"
                size="lg"
                className="w-full font-bold shadow-xl shadow-primary/25 mt-4"
                isLoading={loading}
                disabled={loading}
              >
                <span>إنشاء المتجر والدخول للوحة التحكم</span>
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </form>

            {/* Login link */}
            <div className="pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                عندك حساب بالفعل؟{" "}
                <Link href="/login" className="text-primary font-bold hover:underline">
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        منصة متجرك © 2026 • جميع الحقوق محفوظة
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page export — wraps the form in <Suspense> to allow useSearchParams()
// ─────────────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground text-sm">
            جاري التحميل...
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
