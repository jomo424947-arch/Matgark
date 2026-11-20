"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Logo } from "@/components/ui/Logo"
import {
  LayoutDashboard,
  Users,
  Store,
  CreditCard,
  BarChart3,
  LifeBuoy,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Lock,
} from "lucide-react"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { pick, t } = useI18n()
  const adminSession = useAuthStore((s) => s.adminSession)
  const logoutAdmin = useAuthStore((s) => s.logoutAdmin)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Allow login page without shell
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  // Protected Admin Gate
  if (!adminSession) {
    return (
      <div className="min-h-screen bg-[#120E0C] text-stone-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full border border-stone-800 bg-[#1B1512] rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="flex justify-center">
            <Logo size="md" surface="dark" href="/" />
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-stone-50">
              {pick("منطقة محمية — وصول غير مصرح به", "Restricted Area — Unauthorized Access")}
            </h1>
            <p className="text-xs text-stone-400">{t.admin.unauthorized}</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"
            >
              {pick("تسجيل دخول المشرف", "Go to Admin Login")}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-stone-700 text-stone-300 text-xs font-semibold hover:bg-stone-800"
            >
              {t.common.home}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: "/admin/dashboard", label: t.admin.dashboard, icon: LayoutDashboard },
    { href: "/admin/merchants", label: t.admin.merchants, icon: Users },
    { href: "/admin/stores", label: t.admin.stores, icon: Store },
    { href: "/admin/subscriptions", label: t.admin.subscriptions, icon: CreditCard },
    { href: "/admin/analytics", label: t.admin.analytics, icon: BarChart3 },
    { href: "/admin/support", label: t.admin.support, icon: LifeBuoy },
    { href: "/admin/settings", label: t.admin.settings, icon: Settings },
  ]

  const currentNav =
    navItems.find((n) => pathname.startsWith(n.href)) ?? navItems[0]

  const handleLogout = () => {
    logoutAdmin()
    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Executive Espresso Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-[#17120F] text-stone-200 border-e border-stone-800 justify-between">
        <div className="p-5 space-y-6">
          <div className="pb-4 border-b border-stone-800 flex items-center gap-3">
            <Logo size="sm" surface="dark" href="/admin/dashboard" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-stone-100 truncate">
                {pick("إدارة متجرك", "Matgarak Admin")}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-[#D9B58C]">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span className="truncate">{t.admin.subtitle}</span>
              </div>
            </div>
          </div>

          <nav className="space-y-1" aria-label={pick("قائمة المشرف العام", "Admin Sidebar")}>
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? "bg-primary text-white"
                      : "text-stone-300 hover:bg-stone-800/80 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-stone-800 space-y-3">
          <div className="px-2">
            <div className="text-xs font-semibold text-stone-100 truncate">{adminSession.name}</div>
            <div className="text-[11px] text-stone-400 truncate">{adminSession.email}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-stone-300 hover:bg-rose-500/15 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.common.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={pick("فتح القائمة", "Open admin menu")}
              className="lg:hidden p-2 rounded-lg border border-border text-foreground hover:bg-muted"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
              <span className="hidden sm:inline">{pick("لوحة المشرف", "Platform Admin")}</span>
              <span className="hidden sm:inline">/</span>
              <span className="font-semibold text-foreground truncate">{currentNav.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard"
              className="hidden md:inline-flex items-center h-9 px-3 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted whitespace-nowrap"
            >
              {t.nav.merchantPortal}
            </Link>
            <LanguageSwitcher compact />
            <ThemeToggle />
          </div>
        </header>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 flex">
            <div className="w-72 bg-[#17120F] text-stone-200 h-full p-5 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                  <Logo size="sm" surface="dark" href="/admin/dashboard" />
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label={t.common.close}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                          active ? "bg-primary text-white" : "text-stone-300 hover:bg-stone-800"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/15"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.common.logout}</span>
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
