"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { MessageCircle, Mail, Phone, ArrowRight, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
    toast.success("شكراً لتواصلك معنا! سيقوم فريق الدعم بالرد عليك في أقرب وقت.")
  }

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

      <main className="max-w-4xl mx-auto w-full py-10 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            تواصل مع فريق منصة متجرك
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            فريق الدعم الفني والمساعدة جاهز دائماً للرد على استفساراتك
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">واتساب الدعم</div>
                  <div className="text-xs text-muted-foreground dir-ltr text-right">+20 101 234 5678</div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">البريد الإلكتروني</div>
                  <div className="text-xs text-muted-foreground">support@matgarak.com</div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">ساعات العمل</div>
                  <div className="text-xs text-muted-foreground">يومياً من 9 صباحاً حتى 11 مساءً</div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="md:col-span-2">
            <CardContent className="p-6 sm:p-8">
              {sent ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">تم استلام رسالتك بنجاح!</h3>
                  <p className="text-xs text-muted-foreground">
                    هنتواصل معاك عبر الواتساب أو التليفون في أقرب وقت.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="الاسم *"
                    placeholder="اسمك الكريم"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  <Input
                    label="رقم الموبايل *"
                    type="tel"
                    placeholder="01012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    dir="ltr"
                    className="text-right"
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground/90">
                      رسالتك أو استفسارك *
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="اكتب استفسارك هنا..."
                      required
                      className="w-full p-4 rounded-2xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-right resize-none"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full font-bold">
                    <span>إرسال الرسالة</span>
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground pt-8 border-t border-border">
        منصة متجرك © 2026 • جميع الحقوق محفوظة
      </footer>
    </div>
  )
}
