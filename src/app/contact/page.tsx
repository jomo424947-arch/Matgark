"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { useI18n } from "@/components/providers/LanguageProvider"
import { MessageCircle, Mail, Clock, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function ContactPage() {
  const { pick, dir } = useI18n()
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !message.trim()) return
    setSent(true)
    toast.success(
      pick(
        "شكراً لتواصلك معنا! سيقوم فريق الدعم بالرد عليك في أقرب وقت.",
        "Thanks for reaching out! Our support team will reply shortly."
      )
    )
  }

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

      <main className="max-w-4xl mx-auto w-full py-10 space-y-8">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {pick("الدعم والتواصل", "Support & Contact")}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {pick("تواصل مع فريق متجرك", "Contact the Matgarak Team")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {pick(
              "فريق الدعم الفني والمبيعات جاهز للرد على استفساراتك ومساعدتك في إطلاق متجرك.",
              "Our technical support and onboarding team is here to help you launch and grow."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">
                    {pick("واتساب الدعم", "WhatsApp Support")}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono" dir="ltr">
                    +20 101 234 5678
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">
                    {pick("البريد الإلكتروني", "Email")}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    support@matgarak.com
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">
                    {pick("ساعات العمل", "Support Hours")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pick("يومياً من 9 صباحاً حتى 11 مساءً", "Daily, 9:00 AM – 11:00 PM EET")}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="md:col-span-2">
            <CardContent className="p-6 sm:p-8">
              {sent ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    {pick("تم استلام رسالتك بنجاح", "Message Received")}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {pick(
                      "سيتواصل معك فريقنا عبر واتساب أو الهاتف في أقرب وقت.",
                      "Our team will follow up via WhatsApp or phone shortly."
                    )}
                  </p>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setName("")
                        setPhone("")
                        setMessage("")
                        setSent(false)
                      }}
                    >
                      {pick("إرسال رسالة أخرى", "Send Another Message")}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label={pick("الاسم *", "Name *")}
                    placeholder={pick("اسمك الكريم", "Your full name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  <Input
                    label={pick("رقم الهاتف *", "Phone Number *")}
                    type="tel"
                    placeholder="01012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    dir="ltr"
                  />

                  <div className="space-y-2">
                    <label
                      htmlFor="contact-message"
                      className="block text-sm font-semibold text-foreground/90"
                    >
                      {pick("رسالتك أو استفسارك *", "Your Message *")}
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={pick("اكتب استفسارك هنا...", "Tell us how we can help...")}
                      required
                      className="w-full p-4 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-start resize-none"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full font-bold">
                    <span>{pick("إرسال الرسالة", "Send Message")}</span>
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-muted-foreground pt-8 border-t border-border">
        {pick("منصة متجرك © 2026 · جميع الحقوق محفوظة", "Matgarak © 2026 · All rights reserved")}
      </footer>
    </div>
  )
}
