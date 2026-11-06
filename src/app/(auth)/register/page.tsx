"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { ArrowLeft, Store, Phone, Sparkles, CheckCircle2, MessageCircle } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    storeName: "",
    slug: "",
    phone: "",
    whatsapp: "",
  })
  const [loading, setLoading] = useState(false)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
    setFormData((prev) => ({ ...prev, storeName: name, slug: slug }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      window.location.href = "/dashboard"
    }, 1200)
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

      {/* Main Form */}
      <div className="max-w-lg w-full mx-auto my-8">
        <Card className="border-border/80 shadow-2xl">
          <CardContent className="p-8 text-right space-y-6">
            
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* اسم المحل أو البراند */}
              <Input
                label="اسم المحل أو البراند"
                placeholder="مثال: براند كايرو كوتور"
                value={formData.storeName}
                onChange={handleNameChange}
                required
                helperText="هذا الاسم اللي هيظهر لعملائك في المتجر"
                startIcon={<Store className="w-4 h-4" />}
              />

              {/* لينك المتجر */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground/90">
                  لينك المتجر الخاص بك
                </label>
                <div className="flex items-center bg-muted/40 border border-input rounded-2xl px-4 py-2 text-sm text-foreground dir-ltr">
                  <span className="text-xs text-muted-foreground font-semibold">
                    matgarak.com/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      }))
                    }
                    placeholder="my-shop"
                    required
                    className="flex-1 bg-transparent border-0 outline-none text-foreground font-bold pl-1 text-left"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  تقدر تشارك اللينك ده مع عملائك وفي بايو إنستجرام وتيك توك
                </p>
              </div>

              {/* رقم الموبايل للتسجيل */}
              <Input
                label="رقم الموبايل الشخصي"
                type="tel"
                placeholder="01012345678"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                required
                dir="ltr"
                className="text-right"
                startIcon={<Phone className="w-4 h-4" />}
              />

              {/* رقم واتساب لاستقبال الأوردرات */}
              <Input
                label="رقم واتساب لاستقبال الأوردرات"
                type="tel"
                placeholder="01012345678"
                value={formData.whatsapp}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))
                }
                required
                dir="ltr"
                className="text-right"
                helperText="هنبعتلك إشعار فوري وتفاصيل كل أوردر جديد على الرقم ده"
                startIcon={<MessageCircle className="w-4 h-4 text-emerald-500" />}
              />

              {/* نقاط الثقة */}
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

              <Button
                type="submit"
                size="lg"
                className="w-full font-bold shadow-xl shadow-primary/25 mt-4"
                isLoading={loading}
              >
                <span>إنشاء المتجر والدخول للوحة التحكم</span>
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </form>

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

      <div className="text-center text-xs text-muted-foreground">
        منصة متجرك © 2026 • جميع الحقوق محفوظة
      </div>
    </div>
  )
}

