import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { Cookie, ArrowRight } from "lucide-react"

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8 text-right">
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-border">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowRight className="w-4 h-4" />
              <span>الرئيسية</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full py-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Cookie className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              سياسة ملفات تعريف الارتباط (Cookies)
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              آخر تحديث: نوفمبر 2026
            </p>
          </div>
        </div>

        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border space-y-6 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">1. ما هي ملفات الكوكيز؟</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              ملفات الكوكيز هي ملفات نصية صغيرة تُخزن في متصفحك لمساعدتنا على إبقائك مسجلاً في لوحة التحكم وتذكر سلة المشتريات وتفضيلات الوضع الليلي والنهاري.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">2. الكوكيز الأساسية</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              نستخدم ملفات تعريف ارتباط أساسية وأمنية مشفرة بخصائص (HttpOnly و Secure) لإدارة الجلسات ومنع الهجمات الإلكترونية.
            </p>
          </section>
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground pt-8 border-t border-border">
        منصة متجرك © 2026 • جميع الحقوق محفوظة
      </footer>
    </div>
  )
}
