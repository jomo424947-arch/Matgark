import React from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { MessageCircle, Heart } from "lucide-react"
import { InstagramIcon, FacebookIcon } from "@/components/ui/SocialIcons"

export function Footer() {
  return (
    <footer className="bg-secondary/40 border-t border-border/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-border/60">
          
          {/* العمود الأول: اللوجو والوصف */}
          <div className="lg:col-span-2 space-y-4 text-right">
            <Logo size="md" withSlogan={true} />
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              منصة المتاجر الإلكترونية المصممة خصيصاً للمحلات والبراندات والمشاريع الصغيرة في مصر والوطن العربي. بيع لعملائك باسم متجرك ومن غير فوضى الرسايل.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground/80 hover:text-primary hover:border-primary transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground/80 hover:text-primary hover:border-primary transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground/80 hover:text-emerald-500 hover:border-emerald-500 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* العمود الثاني: المنصة */}
          <div className="space-y-3 text-right">
            <h4 className="text-sm font-bold text-foreground">المنصة</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-primary transition-colors">المميزات</a></li>
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">كيف يعمل؟</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">الأسعار</a></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">أنشئ متجرك</Link></li>
            </ul>
          </div>

          {/* العمود الثالث: الدعم */}
          <div className="space-y-3 text-right">
            <h4 className="text-sm font-bold text-foreground">الدعم والمساعدة</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#faq" className="hover:text-primary transition-colors">الأسئلة الشائعة</a></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">تواصل معنا</Link></li>
              <li><a href="https://wa.me" className="hover:text-primary transition-colors">دعم عبر واتساب</a></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">عن متجرك</Link></li>
            </ul>
          </div>

          {/* العمود الرابع: الشروط والأمان */}
          <div className="space-y-3 text-right">
            <h4 className="text-sm font-bold text-foreground">قانوني</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">سياسة الخصوصية</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">شروط الاستخدام</Link></li>
              <li><Link href="/cookies" className="hover:text-primary transition-colors">سياسة الكوكيز</Link></li>
            </ul>
          </div>

        </div>

        {/* الشريط السفلي */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            جميع الحقوق محفوظة © 2026 متجرك (Matgarak).
          </div>
          <div className="flex items-center gap-1.5">
            <span>صُنع بكل</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>لدعم البراندات والمشاريع الصغيرة</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
