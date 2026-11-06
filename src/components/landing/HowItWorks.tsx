import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ArrowLeft, UserCheck, PlusCircle, Rocket } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: UserCheck,
      title: "سجّل برقم موبايلك",
      desc: "خطوة واحدة برقم تليفونك وتأكيد OTP. اختار اسم متجرك المفضل، وهيطلعلك لينك المتجر فوراً.",
      highlight: "أقل من دقيقة واحدة",
    },
    {
      number: "02",
      icon: PlusCircle,
      title: "أضف منتجاتك وصورك",
      desc: "ارفع صور المنتج من موبايلك، اكتب اسمه وسعره، وحدد المقاسات والألوان المتاحة ورسوم التوصيل.",
      highlight: "سهل وسريع جداً",
    },
    {
      number: "03",
      icon: Rocket,
      title: "شارك اللينك واستقبل أوردراتك",
      desc: "حط اللينك في بايو إنستجرام وابعت اللينك لعملائك، واستقبل كل أوردر منظم على الداشبورد وواتساب.",
      highlight: "أوردراتك بتتحسب لوحدها",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-secondary/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <span>رحلة البداية</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            إزاي تبدأ متجرك في 3 خطوات بسيطة؟
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            مش محتاج أي خبرة في البرمجة أو تصميم المواقع. المنصة معمولة للمبتدئين ولأصحاب المحلات.
          </p>
        </div>

        {/* خطوات العرض مع أرقام كبيرة وتدرج */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div
                key={idx}
                className="relative bg-card rounded-3xl p-8 border border-border/80 text-right space-y-4 hover:shadow-xl transition-all duration-300"
              >
                {/* الرقم الكبير في الخلفية */}
                <div className="text-6xl font-black text-foreground/5 absolute top-4 left-6 select-none font-cairo">
                  {step.number}
                </div>

                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7" />
                </div>

                <div className="inline-block text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/10">
                  {step.highlight}
                </div>

                <h3 className="text-xl font-bold text-foreground">
                  {step.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            )
          })}
        </div>

        {/* زر التحفيز في الأسفل */}
        <div className="text-center mt-12">
          <Link href="/register">
            <Button size="lg" className="font-bold shadow-lg shadow-primary/25">
              <span>ابدأ الآن - مجاناً تماماً</span>
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  )
}

