"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Menu, X, ArrowLeft, Store } from "lucide-react"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { label: "الرئيسية", href: "#hero" },
    { label: "المميزات", href: "#features" },
    { label: "كيف يعمل؟", href: "#how-it-works" },
    { label: "الأسعار", href: "#pricing" },
    { label: "الأسئلة الشائعة", href: "#faq" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* اليمين: اللوجو والهوية */}
          <div className="flex items-center gap-8">
            <Logo size="md" withSlogan={false} />

            {/* روابط سطح المكتب */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-foreground/75 hover:text-primary transition-colors py-2"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* اليسار: أزرار تسجيل الدخول + Dark/Light toggle */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">
                تسجيل الدخول
              </Button>
            </Link>

            <Link href="/register">
              <Button size="sm" className="font-semibold shadow-lg shadow-primary/25">
                <Store className="w-4 h-4 ml-1.5" />
                <span>أنشئ متجرك مجاناً</span>
              </Button>
            </Link>

            {/* زر القائمة للموبايل */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-foreground hover:bg-muted focus:outline-none"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* قائمة الموبايل المنزلقة */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background/95 backdrop-blur-2xl border-b border-border/60 px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-foreground/80 hover:text-primary py-2 px-3 rounded-lg hover:bg-muted transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-border flex flex-col gap-2.5">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full justify-center">
                <span>ابدأ متجرك الآن</span>
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

