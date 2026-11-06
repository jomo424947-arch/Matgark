"use client"

import React, { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      q: "هل فتح المتجر فعلاً مجاني؟ وهل بتاخدوا نسبة من أوردراتي؟",
      a: "نعم، الباقة الأساسية مجانية بالكامل للأبد بدون أي مصاريف خفية، وبدون أي عمولة أو نسبة على مبيعاتك. كل أرباحك بتدخل جيبك بالكامل.",
    },
    {
      q: "إزاي العميل بيطلب من متجري؟",
      a: "العميل بيدخل على لينك متجرك من بايو إنستجرام أو فيسبوك، يختار المنتجات والمقاسات، ويكتب اسمه ورقمه وعنوانه، ويضغط 'إتمام الطلب'. الأوردر بيوصلك فوري.",
    },
    {
      q: "مين اللي بيوصل الأوردرات وبيحصل الفلوس؟",
      a: "التوصيل والشحن مسؤوليتك كصاحب محل أو بتتعامل مع شركة الشحن اللي بتفضلها. العميل بيسيبلك عنوانه، وأنت بتحدد رسوم التوصيل، والدفع بيكون كاش عند الاستلام.",
    },
    {
      q: "هل هحتاج اشتري لابتوب عشان أدير المتجر؟",
      a: "نهائياً! منصة متجرك مصممة بالكامل لتشتغل من الموبايل بنفس السلاسة. تقدر تضيف منتجات وتغير أسعار وتتابع أوردراتك وأنت في أي مكان.",
    },
    {
      q: "إزاي بيجيلي إشعار بكل أوردر جديد؟",
      a: "أول ما العميل يطلب، بيوصلك إشعار فوري على لوحة التحكم، ورسالة على رقم الواتساب اللي سجلت بيه فيها تفاصيل الأوردر كاملة وبزر مباشر للتواصل مع العميل.",
    },
    {
      q: "هل أقدر أغير اسم المتجر أو اللوجو بعد ما أفتح؟",
      a: "نعم بكل سهولة، من خلال صفحة إعدادات المتجر تقدر تعدل الاسم، الوصف، اللوجو، الألوان، وأرقام التواصل في أي وقت.",
    },
  ]

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <section id="faq" className="py-20 md:py-28 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <HelpCircle className="w-4 h-4" />
            <span>إجابات على كل استفساراتك</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            الأسئلة الأكثر شيوعاً
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            كل اللي يدور في بالك عن منصة متجرك وإزاي تبدأ.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-card overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-right flex items-center justify-between gap-4 font-bold text-foreground hover:text-primary transition-colors focus:outline-none"
                >
                  <span className="text-base sm:text-lg">{faq.q}</span>
                  <div
                    className={`w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-0 text-sm sm:text-base text-muted-foreground leading-relaxed animate-in fade-in duration-200 border-t border-border/40 mt-2 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

