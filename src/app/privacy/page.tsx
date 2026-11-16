import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { ShieldCheck, ArrowRight } from "lucide-react"

export default function PrivacyPage() {
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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              سياسة الخصوصية وحماية البيانات
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              آخر تحديث: نوفمبر 2026
            </p>
          </div>
        </div>

        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border space-y-6 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">1. البيانات التي نجمعها</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              نجمع أرقام الهواتف لتسجيل الدخول والتحقق، وبيانات المتاجر والمنتجات، وبيانات التوصيل (الاسم، العنوان، الهاتف) عند تقديم طلبات الشراء لتسليمها للتاجر المعني.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">2. كيف نستخدم بياناتك</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              تُستخدم البيانات فقط لتمكين التاجر من التواصل مع عملائه وإتمام عمليات الشحن والتوصيل، وتقديم الإشعارات الفورية للأوردرات عبر واتساب أو الرسائل النصية.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">3. حماية البيانات وعدم المشاركة</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              لا نقوم ببيع أو تأجير بيانات التجار أو العملاء لأي أطراف إعلانية خارجية. يتم تخزين البيانات بشكل مشفر وآمن وفقاً لأفضل الممارسات التقنية.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">4. التواصل معنا</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              لأي استفسارات حول بياناتك أو لحذف حسابك، يمكنك التواصل معنا عبر صفحة التواصل أو واتساب الدعم الفني.
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
