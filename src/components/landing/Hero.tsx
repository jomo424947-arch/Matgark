"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { ArrowLeft, Sparkles, CheckCircle2, ShoppingBag, ShieldCheck, Zap, MessageCircle } from "lucide-react"
import { InstagramIcon } from "@/components/ui/SocialIcons"

export function Hero() {
  const [storeSlug, setStoreSlug] = useState("")

  return (
    <section id="hero" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* دوائر وتدرجات الخلفية الناعمة */}
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* الجانب الأيمن: العناوين و الـ CTA */}
          <div className="lg:col-span-7 text-right space-y-6">
            
            {/* Badge مميز */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>أسهل طريقة لبيع منتجاتك أونلاين في مصر والوطن العربي</span>
            </div>

            {/* العنوان الرئيسي */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.2]">
              من البراندات الصغيرة.. <br />
              <span className="text-primary relative inline-block">
                إلى بيتك
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-primary/40 -z-10"
                  viewBox="0 0 100 20"
                  preserveAspectRatio="none"
                >
                  <path d="M0 10 Q 50 0, 100 10" stroke="currentColor" strokeWidth="6" fill="none" />
                </svg>
              </span>
              {" "}في 5 دقايق فقط
            </h1>

            {/* الوصف */}
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              تخلّص من فوضى رسائل الإنستجرام والواتساب. افتح متجرك الإلكتروني باسم محلك، واستقبل أوردراتك منظمة ومحسوبة تلقائياً مع تنبيهات فورية.
            </p>

            {/* مربع حجز اسم المتجر السريع */}
            <div className="p-2 sm:p-3 rounded-3xl bg-card border border-border/80 shadow-xl shadow-foreground/5 max-w-xl">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full flex items-center bg-muted/50 rounded-2xl px-4 py-2.5">
                  <span className="text-xs sm:text-sm font-bold text-muted-foreground/70 pl-2">
                    matgarak.com/
                  </span>
                  <input
                    type="text"
                    value={storeSlug}
                    onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="اسم-متجرك"
                    className="flex-1 bg-transparent border-0 outline-none text-foreground text-sm font-medium placeholder:text-muted-foreground/50 dir-ltr text-right"
                  />
                </div>
                <Link
                  href={storeSlug ? `/register?slug=${storeSlug}` : "/register"}
                  className="w-full sm:w-auto"
                >
                  <Button size="lg" className="w-full sm:w-auto shadow-md">
                    <span>احجز متجرك مجاناً</span>
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* نقاط ثقة سريعة */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>بدون عمولة على المبيعات</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>بدون الحاجة لبطاقة بنكية</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>جاهز للمشاركة في بايو إنستجرام</span>
              </div>
            </div>

          </div>

          {/* الجانب الأيسر: Mockup المتجر التفاعلي */}
          <div className="lg:col-span-5 relative flex justify-center">
            
            {/* كارت محاكاة شاشة الموبايل الفخمة */}
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] rounded-[40px] p-3.5 bg-gradient-to-b from-foreground/10 to-foreground/5 border-4 border-foreground/10 shadow-2xl backdrop-blur-md">
              
              {/* شاشة الهاتف الداخلية */}
              <div className="bg-card rounded-[32px] overflow-hidden border border-border/60 shadow-inner">
                
                {/* شريط الحالة والـ Header */}
                <div className="bg-secondary/60 p-4 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-sm">
                        M
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-foreground">براند كايرو كوتور</div>
                        <div className="text-[10px] text-muted-foreground">متصل الآن • أوردرات سريعة</div>
                      </div>
                    </div>
                    <Badge variant="success" className="text-[10px]">
                      مفتوح للطلب
                    </Badge>
                  </div>
                </div>

                {/* محتوى المتجر الافتراضي */}
                <div className="p-4 space-y-3.5">
                  
                  {/* كارت المنتج 1 */}
                  <div className="flex gap-3 p-2.5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/70 transition-colors">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/30 flex items-center justify-center text-3xl">
                      🧥
                    </div>
                    <div className="flex-1 text-right flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-foreground">جاكيت شتوي أوفرسايز</div>
                        <div className="text-[10px] text-muted-foreground">متوفر مقاسات M, L, XL</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-primary">850 ج.م</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                          + أضف للسلة
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* كارت المنتج 2 */}
                  <div className="flex gap-3 p-2.5 rounded-2xl bg-muted/40 border border-border/40">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/30 flex items-center justify-center text-3xl">
                      👟
                    </div>
                    <div className="flex-1 text-right flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-foreground">سنيكرز جلد أبيض كلاسيك</div>
                        <div className="text-[10px] text-muted-foreground">مخزون محدود: 3 قطع</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-primary">620 ج.م</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                          + أضف للسلة
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* إشعار أوردر فوري يظهر كـ Floating Badge */}
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 animate-bounce">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">
                      ✓
                    </div>
                    <div className="text-right flex-1">
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        أوردر جديد #1042
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        أحمد س. • كاش عند الاستلام • القاهرة
                      </div>
                    </div>
                  </div>

                </div>

                {/* زر Checkout ثابت في أسفل الشاشة */}
                <div className="p-3 bg-card border-t border-border/40">
                  <div className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-between">
                    <span>إتمام الطلب (2 منتجات)</span>
                    <span>1,470 ج.م</span>
                  </div>
                </div>

              </div>

            </div>

            {/* كروت طافية عصرية حول الموبايل */}
            <div className="absolute -top-4 -right-6 bg-card border border-border/80 rounded-2xl p-3 shadow-xl hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white">
                <InstagramIcon className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">لينك جاهز لـ</div>
                <div className="text-xs font-bold text-foreground">Instagram Bio</div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 bg-card border border-border/80 rounded-2xl p-3 shadow-xl hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">إشعار فوري</div>
                <div className="text-xs font-bold text-foreground">على واتساب التاجر</div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
