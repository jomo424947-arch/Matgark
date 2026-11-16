"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { ArrowLeft, Phone, Store, Sparkles } from "lucide-react"
import { requestOtpAction, verifyOtpAction } from "@/server/actions/auth"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("01012345678")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return

    setLoading(true)
    const res = await requestOtpAction(phone)
    setLoading(false)

    if (!res.ok) {
      toast.error(res.error || "فشل إرسال كود التأكيد")
      return
    }

    if (res.devOtp) {
      setDevOtp(res.devOtp)
    }

    toast.success("تم إرسال كود التأكيد في رسالة!")
    setStep("otp")
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = otp.join("").trim()
    if (fullCode.length !== 6) {
      toast.error("يرجى إدخال كود التأكيد كاملاً (6 أرقام)")
      return
    }

    setLoading(true)
    const res = await verifyOtpAction(phone, fullCode)
    setLoading(false)

    if (!res.ok) {
      toast.error(res.error || "كود التأكيد غير صحيح")
      return
    }

    toast.success("تم تسجيل الدخول بنجاح! جاري تحويلك...")
    router.push(res.redirectTo || "/dashboard")
  }

  const handleFillDevOtp = () => {
    if (!devOtp || devOtp.length !== 6) return
    const digits = devOtp.split("")
    setOtp(digits)
    toast.success("تم تعبئة الكود التجريبي بنجاح")
  }

  const handlePasteOtp = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (text) {
      const newOtp = [...otp]
      for (let i = 0; i < 6; i++) {
        newOtp[i] = text[i] || ""
      }
      setOtp(newOtp)
      const lastIndex = Math.min(text.length, 5)
      document.getElementById(`otp-${lastIndex}`)?.focus()
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/">
            <Button variant="ghost" size="sm">
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <Card className="border-border/80 shadow-2xl">
          <CardContent className="p-8 text-right space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <Store className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-foreground">
                {step === "phone"
                  ? "تسجيل الدخول إلى متجرك"
                  : "تأكيد رقم الموبايل"}
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
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  dir="ltr"
                  className="text-center text-lg tracking-widest font-semibold"
                  startIcon={<Phone className="w-4 h-4" />}
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
                {devOtp && (
                  <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-center space-y-1.5">
                    <div className="text-xs font-bold text-primary flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>كود تجريبي للاختبار السريع: {devOtp}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillDevOtp}
                      className="text-xs text-foreground font-extrabold underline hover:text-primary"
                    >
                      اضغط هنا لتعبئة الكود تلقائياً
                    </button>
                  </div>
                )}

                <div
                  className="flex justify-center gap-2 dir-ltr"
                  onPaste={handlePasteOtp}
                >
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      autoComplete="one-time-code"
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "")
                        const newOtp = [...otp]
                        newOtp[idx] = val ? val[val.length - 1]! : ""
                        setOtp(newOtp)
                        if (val && idx < 5) {
                          document.getElementById(`otp-${idx + 1}`)?.focus()
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[idx] && idx > 0) {
                          document.getElementById(`otp-${idx - 1}`)?.focus()
                        }
                      }}
                      className="w-11 sm:w-12 h-14 text-center text-xl font-black rounded-2xl border border-input bg-muted/40 focus:bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground"
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold shadow-lg shadow-primary/20"
                  isLoading={loading}
                >
                  <span>تأكيد والدخول للوحة التحكم</span>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone")
                      setOtp(["", "", "", "", "", ""])
                    }}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    تغيير رقم الموبايل؟
                  </button>
                </div>
              </form>
            )}

            <div className="pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                معندكش متجر لسه؟{" "}
                <Link
                  href="/register"
                  className="text-primary font-bold hover:underline"
                >
                  افتح متجرك مجاناً الآن
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        منصة متجرك © 2026 • جميع الحقوق محفوظة
      </div>
    </div>
  )
}
