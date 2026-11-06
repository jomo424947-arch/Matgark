"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { ArrowLeft, Phone, ShieldCheck, Store, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep("otp")
    }, 800)
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      // Redirect to dashboard
      window.location.href = "/dashboard"
    }, 1000)
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background p-4 sm:p-6 lg:p-8">
      {/* رأس الصفحة */}
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

      {/* نموذج الدخول في المنتصف */}
      <div className="max-w-md w-full mx-auto my-8">
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
                  : `أدخل الكود المكون من 4 أرقام المرسل للرقم ${phone}`}
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
                <div className="flex justify-center gap-3 dir-ltr">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value
                        const newOtp = [...otp]
                        newOtp[idx] = val
                        setOtp(newOtp)
                        if (val && idx < 3) {
                          document.getElementById(`otp-${idx + 1}`)?.focus()
                        }
                      }}
                      className="w-14 h-14 text-center text-2xl font-black rounded-2xl border border-input bg-muted/40 focus:bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground"
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
                    onClick={() => setStep("phone")}
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
                <Link href="/register" className="text-primary font-bold hover:underline">
                  افتح متجرك مجاناً الآن
                </Link>
              </p>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* تذييل بسيط */}
      <div className="text-center text-xs text-muted-foreground">
        منصة متجرك © 2026 • جميع الحقوق محفوظة
      </div>
    </div>
  )
}

