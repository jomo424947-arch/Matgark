"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Logo } from "@/components/ui/Logo"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { useI18n } from "@/components/providers/LanguageProvider"
import { Home, Store } from "lucide-react"

export default function NotFound() {
  const { pick } = useI18n()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6 text-center">
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between">
        <Logo size="md" href="/" priority />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-md mx-auto space-y-4 my-12">
        <div className="text-7xl font-black text-primary tabular-nums">404</div>
        <h1 className="text-2xl font-bold text-foreground">
          {pick("الصفحة غير موجودة", "Page Not Found")}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {pick(
            "عذراً، الصفحة التي تبحث عنها قد تم نقلها أو حذفها أو أن الرابط غير صحيح.",
            "Sorry, the page you are looking for does not exist or may have been moved."
          )}
        </p>

        <div className="pt-4 flex flex-wrap justify-center gap-2.5">
          <Link href="/">
            <Button size="lg" className="font-semibold gap-2">
              <Home className="w-4 h-4" />
              <span>{pick("العودة للرئيسية", "Back to Home")}</span>
            </Button>
          </Link>
          <Link href="/s/menz-club">
            <Button variant="outline" size="lg" className="font-semibold gap-2">
              <Store className="w-4 h-4" />
              <span>{pick("تصفح متجر تجريبي", "Explore Demo Store")}</span>
            </Button>
          </Link>
        </div>
      </main>

      <footer className="text-xs text-muted-foreground pb-4">
        {pick("منصة متجرك © 2026 · جميع الحقوق محفوظة", "Matgarak © 2026 · All rights reserved")}
      </footer>
    </div>
  )
}
