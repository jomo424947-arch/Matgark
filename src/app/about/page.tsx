"use client"

import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { useI18n } from "@/components/providers/LanguageProvider"
import { ArrowRight, ArrowLeft, Store, Layers, Zap } from "lucide-react"

export default function AboutPage() {
  const { pick, dir } = useI18n()
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8 text-start">
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between gap-4 pb-6 border-b border-border">
        <Logo size="md" href="/" priority />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <BackArrow className="w-4 h-4" />
              <span>{pick("الرئيسية", "Home")}</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full py-12 space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {pick("عن متجرك", "About Matgarak")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {pick(
              "بنية تجارة إلكترونية عربية للبراندات المستقلة",
              "Arabic-first commerce infrastructure for independent brands"
            )}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            {pick(
              "انطلقت منصة متجرك لتمكين العلامات التجارية وأصحاب المشاريع في مصر والعالم العربي من إطلاق متاجر إلكترونية مستقلة بالكامل بهوية بصرية مميزة ولوحة تشغيل احترافية بدون تعقيد تقني.",
              "Matgarak empowers independent merchants across Egypt and the MENA region to launch fully branded online storefronts with a complete operations dashboard and zero engineering overhead."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-foreground">
              {pick("هوية مستقلة لكل متجر", "Independent Brand Identity")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {pick(
                "كل متجر يعمل على رابطه الخاص وألوانه وأقسامه وقوالبه دون أي تشتيت لعملائك.",
                "Every store runs on its own storefront URL, theme palette, typography, and visual layout."
              )}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-foreground">
              {pick("تشغيل يومي منظم", "Structured Daily Operations")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {pick(
                "إدارة المخزون، الخيارات المتعددة، مناطق الشحن، والطلبات في شاشة واحدة واضحة وسريعة.",
                "Manage multi-variant stock, shipping zones, promo codes, and orders in one clean workspace."
              )}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-foreground">
              {pick("بدون عمولة على المبيعات", "Zero Sales Commission")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {pick(
                "احتفظ بـ 100% من مبيعاتك مع باقات اشتراك واضحة وتكامل محلي يناسب السوق المصري والعربي.",
                "Keep 100% of your revenue with transparent subscription tiers tailored for regional commerce."
              )}
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">
              {pick("جاهز لإطلاق متجرك؟", "Ready to launch your storefront?")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {pick(
                "ابدأ مجاناً في دقائق أو استكشف أحد المتاجر الحية على المنصة.",
                "Create your store in minutes or explore a live storefront built on Matgarak."
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/merchant/register">
              <Button size="sm" className="font-semibold">
                {pick("أنشئ متجرك الآن", "Create Store")}
              </Button>
            </Link>
            <Link href="/s/nova-atelier">
              <Button variant="outline" size="sm" className="font-semibold">
                {pick("معاينة متجر حي", "Preview Live Store")}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-muted-foreground pt-8 border-t border-border">
        {pick("منصة متجرك © 2026 · جميع الحقوق محفوظة", "Matgarak © 2026 · All rights reserved")}
      </footer>
    </div>
  )
}
