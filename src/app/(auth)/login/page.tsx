"use client"

import React, { useState, useEffect, useRef, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { requestOtpAction, verifyOtpAction } from "@/server/actions/auth"
import { normalizeLocalEgyptPhone } from "@/lib/whatsapp"
import { ArrowLeft, Phone, Store, RotateCw, Sparkles, AlertCircle } from "lucide-react"
import { toast } from "sonner"

/**
 * Validates that the redirect destination is a safe internal relative path.
 * Prevents Open Redirect vulnerabilities (e.g. //malicious.com or https://evil.com).
 */
function getSafeRedirectUrl(target: string | null | undefined, fallback = "/dashboard"): string {
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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawNext = searchParams.get("next")

  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // 6-digit OTP state
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""])
  const [otpError, setOtpError] = useState<string | null>(null)
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Refs for auto-advancing focus between the 6 OTP inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Focus the first OTP field upon entering the OTP step
  useEffect(() => {
    if (step === "otp") {
      inputRefs.current[0]?.focus()
    }
  }, [step])

  const validatePhone = (input: string): string | null => {
    const cleaned = normalizeLocalEgyptPhone(input.trim())
    if (!cleaned) {
      return "يرجى إدخال رقم الموبايل"
    }
    if (!/^01[0125]\d{8}$/.test(cleaned)) {
      return "يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015"
    }
    return null
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError(null)

    const validationError = validatePhone(phone)
    if (validationError) {
      setPhoneError(validationError)
      toast.error(validationError)
      return
    }

    const cleanedPhone = normalizeLocalEgyptPhone(phone.trim())
    setLoading(true)

    try {
      const res = await requestOtpAction(cleanedPhone)

      if (!res.ok) {
        setPhoneError(res.error || "فشل إرسال كود التأكيد")
        toast.error(res.error || "فشل إرسال كود التأكيد")
        setLoading(false)
        return
      }

      setStep("otp")
      setCountdown(60)
      setOtp(["", "", "", "", "", ""])
      setOtpError(null)

      if (res.devOtp) {
        setDevOtpCode(res.devOtp)
      } else {
        setDevOtpCode(null)
      }

      toast.success("تم إرسال كود التأكيد إلى رقمك بنجاح")
    } catch {
      toast.error("حدث خطأ في الاتصال بالخادم، يرجى المحاولة مرة أخرى")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return

    const cleanedPhone = normalizeLocalEgyptPhone(phone.trim())
    setLoading(true)
    setOtpError(null)

    try {
      const res = await requestOtpAction(cleanedPhone)

      if (!res.ok) {
        setOtpError(res.error || "فشل إعادة إرسال الكود")
        toast.error(res.error || "فشل إعادة إرسال الكود")
        setLoading(false)
        return
      }

      setCountdown(60)
      setOtp(["", "", "", "", "", ""])

      if (res.devOtp) {
        setDevOtpCode(res.devOtp)
      }

      toast.success("تم إرسال كود تأكيد جديد")
      inputRefs.current[0]?.focus()
    } catch {
      toast.error("تعذر إعادة إرسال الكود حالياً")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError(null)

    const code = otp.join("").trim()
    if (code.length !== 6) {
      setOtpError("يرجى إدخال كود التأكيد كاملاً (6 أرقام)")
      return
    }

    const cleanedPhone = normalizeLocalEgyptPhone(phone.trim())
    setLoading(true)

    try {
      const res = await verifyOtpAction(cleanedPhone, code)

      if (!res.ok) {
        setOtpError(res.error || "كود التأكيد غير صحيح")
        toast.error(res.error || "فشل التحقق من الكود")
        setLoading(false)
        return
      }

      toast.success("تم تأكيد الدخول بنجاح! جاري توجيهك...")
      const destination = getSafeRedirectUrl(rawNext, res.redirectTo || "/dashboard")
      router.push(destination)
      router.refresh()
    } catch {
      toast.error("حدث خطأ أثناء تأكيد الدخول، يرجى المحاولة مجدداً")
      setLoading(false)
    }
  }

  const handleOtpChange = (idx: number, val: string) => {
    const numeric = val.replace(/\D/g, "").slice(-1)
    const newOtp = [...otp]
    newOtp[idx] = numeric
    setOtp(newOtp)
    setOtpError(null)

    if (numeric && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[idx] && idx > 0) {
        inputRefs.current[idx - 1]?.focus()
      }
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return

    const newOtp = [...otp]
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || ""
    }
    setOtp(newOtp)
    setOtpError(null)

    const focusIdx = Math.min(pasted.length, 5)
    inputRefs.current[focusIdx]?.focus()
  }

  const isOtpComplete = otp.every((digit) => digit.length === 1)

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center justify-between max-w-6xl mx-auto w-full">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-8">
        <Card className="border-border/80 shadow-2xl">
          <CardContent className="p-8 text-right space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <Store className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-foreground">
                {step === "phone" ? "تسجيل الدخول إلى متجرك" : "تأكيد رقم الموبايل"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {step === "phone"
                  ? "أدخل رقم تليفونك المسجل وهنبعتلك كود تأكيد في رسالة"
                  : `أدخل الكود المكون من 6 أرقام المرسل للرقم ${phone}`}
              </p>
            </div>

            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <Input
                  label="رقم الموبايل"
                  type="tel"
                  placeholder="01012345678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setPhoneError(null)
                  }}
                  error={phoneError || undefined}
                  required
                  dir="ltr"
                  className="text-center text-lg tracking-widest font-semibold"
                  startIcon={<Phone className="w-4 h-4" />}
                  autoFocus
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold shadow-lg shadow-primary/20"
                  isLoading={loading}
                >
                  <span>إرسال كود التأكيد</span>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* 6-digit OTP Input Grid */}
                <div className="space-y-2">
                  <div
                    className="flex justify-center gap-2 sm:gap-2.5 dir-ltr"
                    onPaste={handleOtpPaste}
                  >
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el
                        }}
                        id={`otp-input-${idx}`}
                        aria-label={`الرقم ${idx + 1} من كود التأكيد`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-11 sm:w-12 h-13 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-2xl border transition-all outline-none text-foreground ${
                          otpError
                            ? "border-destructive focus:ring-2 focus:ring-destructive/30 bg-destructive/5"
                            : digit
                            ? "border-primary bg-primary/5 focus:ring-2 focus:ring-primary focus:border-primary"
                            : "border-input bg-muted/40 focus:bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                        }`}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-destructive font-medium pt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}
                </div>

                {/* Dev Mode OTP Auto-fill Helper */}
                {devOtpCode && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>كود بيئة التطوير (Dev OTP):</span>
                      </span>
                      <span className="font-mono font-bold tracking-widest text-sm bg-background px-2 py-0.5 rounded-lg border border-amber-500/30">
                        {devOtpCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = devOtpCode.split("").slice(0, 6)
                        setOtp(digits)
                        setOtpError(null)
                        inputRefs.current[5]?.focus()
                      }}
                      className="w-full text-center py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 font-bold transition-colors"
                    >
                      ملء الكود التجريبي تلقائياً ⚡
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold shadow-lg shadow-primary/20"
                  isLoading={loading}
                  disabled={!isOtpComplete || loading}
                >
                  <span>تأكيد والدخول للوحة التحكم</span>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>

                {/* Resend and Edit Phone Options */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone")
                      setOtp(["", "", "", "", "", ""])
                      setOtpError(null)
                      setDevOtpCode(null)
                    }}
                    className="text-primary hover:underline font-semibold"
                  >
                    تغيير رقم الموبايل؟
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || loading}
                    className={`flex items-center gap-1.5 font-semibold ${
                      countdown > 0
                        ? "text-muted-foreground cursor-not-allowed"
                        : "text-primary hover:underline cursor-pointer"
                    }`}
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    <span>
                      {countdown > 0
                        ? `إعادة الإرسال بعد (${countdown} ثانية)`
                        : "إعادة إرسال كود التأكيد"}
                    </span>
                  </button>
                </div>
              </form>
            )}

            <div className="pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                معندكش متجر لسه؟{" "}
                <Link href="/register" className="text-primary font-bold hover:underline">
                  افتح متجرك مجاناً الآن
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground">
        منصة متجرك © 2026 • جميع الحقوق محفوظة
      </footer>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">
          جاري التحميل...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
