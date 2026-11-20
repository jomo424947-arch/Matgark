"use client"

import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { useI18n } from "@/components/providers/LanguageProvider"
import { Cookie, ArrowRight, ArrowLeft } from "lucide-react"

export default function CookiesPage() {
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

      <main className="max-w-4xl mx-auto w-full py-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {pick("سياسة ملفات تعريف الارتباط (Cookies)", "Cookie Policy")}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pick("آخر تحديث: نوفمبر 2026", "Last updated: November 2026")}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border space-y-6 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              {pick("1. ما هي ملفات الكوكيز؟", "1. What Are Cookies?")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {pick(
                "ملفات الكوكيز هي ملفات صغيرة تُحفظ في متصفحك لإبقاء جلستك نشطة وتذكر سلة المشتريات ولغة العرض والوضع الليلي أو النهاري.",
                "Cookies and browser storage keep your session active, preserve your shopping bag, and remember your preferred language and theme."
              )}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              {pick("2. الكوكيز الأساسية والأمنية", "2. Essential & Security Cookies")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {pick(
                "نستخدم ملفات تعريف ارتباط أساسية مؤمّنة بخصائص HttpOnly و SameSite لحماية جلسات التجار ومنع الوصول غير المصرح به.",
                "We use essential security cookies configured with HttpOnly and SameSite attributes to protect merchant sessions and prevent unauthorized access."
              )}
            </p>
          </section>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-muted-foreground pt-8 border-t border-border">
        {pick("منصة متجرك © 2026 · جميع الحقوق محفوظة", "Matgarak © 2026 · All rights reserved")}
      </footer>
    </div>
  )
}
