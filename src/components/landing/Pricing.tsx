"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Check, Sparkles } from "lucide-react"

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = [
    {
      name: "البداية المجانية",
      desc: "مثالية للمشاريع اللي لسه بتبدأ على إنستجرام وتيك توك",
      priceMonthly: 0,
      priceAnnual: 0,
      badge: "مجاناً للأبد",
      popular: false,
      cta: "ابدأ مجاناً الآن",
      href: "/register?plan=free",
      features: [
        "حتى 20 منتج نشط",
        "حتى 50 أوردر شهرياً",
        "لوجو وهوية متجرك الخاص",
        "لينك متجر قصير `matgarak.com/store`",
        "إشعارات فورية على واتساب",
        "Guest Checkout بدون حساب",
        "الدفع كاش عند الاستلام",
        "دعم فني عبر الواتساب",
      ],
    },
    {
      name: "باقة النمو الاحترافية",
      desc: "للمحلات والبراندات اللي بتبيع يومياً وعايزة تتوسع بسرعة",
      priceMonthly: 299,
      priceAnnual: 239,
      badge: "الأكثر اختياراً 🔥",
      popular: true,
      cta: "ابدأ تجربة مجانية 14 يوم",
      href: "/register?plan=pro",
      features: [
        "عدد غير محدود من المنتجات",
        "أوردرات غير محدودة شهرياً",
        "ربط دومين مخصص (مثل `brand.com`)",
        "بدون شارة (Powered by Matgarak)",
        "إدارة متقدمة للـ Variants والمخزون",
        "تقارير المبيعات وأعلى المنتجات طلباً",
        "تصدير بيانات العملاء والأوردرات Excel",
        "أولوية قصوى في الدعم الفني",
      ],
    },
  ]

  return (
    <section id="pricing" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>خطط أسعار واضحة وبسيطة</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            ابدأ مجاناً.. وادفع لما تكبر فقط
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            بدون عمولات خفية على مبيعاتك، بدون عقود ملزمة، وتقدر تلغي في أي وقت.
          </p>

          {/* تبديل شهري / سنوي */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-sm font-semibold ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              اشتراك شهري
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-8 rounded-full bg-secondary p-1 border border-border relative transition-colors focus:outline-none"
              aria-label="تبديل الخطة السنوية"
            >
              <div
                className={`w-6 h-6 rounded-full bg-primary transition-transform duration-300 ${
                  isAnnual ? "-translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-semibold ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
                اشتراك سنوي
              </span>
              <Badge variant="warning" className="text-[10px]">
                وفر 20%
              </Badge>
            </div>
          </div>
        </div>

        {/* كروت الباقات */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, idx) => {
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly
            return (
              <Card
                key={idx}
                className={`relative flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                  plan.popular
                    ? "border-2 border-primary shadow-2xl shadow-primary/15 scale-[1.02]"
                    : "hover:border-border/90 hover:shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="bg-primary text-primary-foreground text-center py-2 text-xs font-black tracking-wide">
                    {plan.badge}
                  </div>
                )}

                <CardContent className="p-8 text-right flex-1 flex flex-col justify-between space-y-6">
                  <div>
                    {!plan.popular && (
                      <span className="inline-block text-xs font-bold text-muted-foreground mb-2">
                        {plan.badge}
                      </span>
                    )}
                    <h3 className="text-2xl font-black text-foreground">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {plan.desc}
                    </p>

                    {/* السعر */}
                    <div className="my-6 flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-foreground font-cairo">
                        {price === 0 ? "0" : price}
                      </span>
                      <span className="text-sm font-bold text-muted-foreground">
                        ج.م / شهرياً
                      </span>
                    </div>

                    {/* قائمة المزايا */}
                    <div className="space-y-3 pt-4 border-t border-border">
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-sm text-foreground/90">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link href={plan.href} className="w-full pt-4">
                    <Button
                      variant={plan.popular ? "primary" : "outline"}
                      size="lg"
                      className="w-full font-bold shadow-md"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

      </div>
    </section>
  )
}

