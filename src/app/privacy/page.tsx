"use client"

import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { useI18n } from "@/components/providers/LanguageProvider"
import { ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
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
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {pick("سياسة الخصوصية وحماية البيانات", "Privacy Policy & Data Protection")}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pick("آخر تحديث: نوفمبر 2026", "Last updated: November 2026")}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border space-y-6 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              {pick("1. البيانات التي نجمعها", "1. Information We Collect")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {pick(
                "نجمع أرقام الهواتف أو البريد الإلكتروني لتسجيل الدخول والتحقق، وبيانات المتاجر والمنتجات، وبيانات التوصيل (الاسم، العنوان، الهاتف) عند تقديم طلبات الشراء لتسليمها للتاجر المعني.",
                "We collect phone numbers or emails for account verification, merchant store and catalog data, and shipping details (name, address, phone) submitted during checkout so merchants can fulfill orders."
              )}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              {pick("2. كيف نستخدم بياناتك", "2. How We Use Information")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {pick(
                "تُستخدم البيانات فقط لتمكين التاجر من التواصل مع عملائه وإتمام عمليات الشحن والتوصيل، وتقديم إشعارات الطلبات وتقارير المبيعات داخل لوحة التحكم.",
                "Data is used solely to operate storefronts, enable order fulfillment and delivery notifications, and power merchant analytics."
              )}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              {pick("3. حماية البيانات وعدم المشاركة", "3. Data Security & Non-Selling Commitment")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {pick(
                "لا نقوم ببيع أو تأجير بيانات التجار أو العملاء لأي أطراف إعلانية خارجية. تُعزل بيانات كل متجر وتُحفظ وفق أفضل ممارسات الأمان.",
                "We never sell or rent merchant or customer records to third-party advertisers. Storefront data is isolated per tenant and protected using modern security standards."
              )}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              {pick("4. التواصل وحذف الحساب", "4. Contact & Deletion Requests")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {pick(
                "لأي استفسار حول بياناتك أو طلب حذف الحساب، يمكنك التواصل معنا مباشرة عبر صفحة التواصل.",
                "For any privacy inquiry or account deletion request, please reach out through our Contact page."
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
