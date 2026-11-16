import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Sparkles, ArrowRight, Store, Heart, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8 text-right">
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-border">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
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
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              عن منصة متجرك (Matgarak)
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              من البراندات الصغيرة .. إلى بيتك
            </p>
          </div>
        </div>

        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border space-y-6 text-sm leading-relaxed text-foreground/90">
          <p className="text-base text-foreground font-semibold">
            انطلقت منصة متجرك بهدف تمكين أصحاب المشاريع الصغيرة والمحلات والبراندات الناشئة في مصر والعالم العربي من امتلاك متجر إلكتروني احترافي متكامل خلال 5 دقائق فقط.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
              <Store className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-foreground">بدون عمولات</h3>
              <p className="text-xs text-muted-foreground">
                بيع كل منتجاتك واحتفظ بـ 100% من أرباحك بدون أي عمولات خفية.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
              <Zap className="w-6 h-6 text-amber-500" />
              <h3 className="font-bold text-foreground">تنظيم فوري</h3>
              <p className="text-xs text-muted-foreground">
                ودّع فوضى رسايل الإنستجرام ونوت بوك الأوردرات واستقبل طلباتك جاهزة.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
              <Heart className="w-6 h-6 text-rose-500" />
              <h3 className="font-bold text-foreground">دعم البراندات</h3>
              <p className="text-xs text-muted-foreground">
                أدوات مصممة خصيصاً لتناسب احتياجات السوق المصري والعربي.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground pt-8 border-t border-border">
        منصة متجرك © 2026 • جميع الحقوق محفوظة
      </footer>
    </div>
  )
}
