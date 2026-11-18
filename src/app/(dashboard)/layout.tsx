"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { useMerchantStore } from "@/stores/merchantStore"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  ExternalLink,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronLeft,
  BarChart3,
  Tag,
} from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const settings = useMerchantStore((s) => s.settings)
  const orders = useMerchantStore((s) => s.orders)
  const newOrdersCount = orders.filter((o) => o.status === "جديد").length

  const navigation = [
    { name: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
    { name: "المنتجات", href: "/dashboard/products", icon: Package },
    { name: "الأوردرات", href: "/dashboard/orders", icon: ShoppingCart, badge: newOrdersCount },
    { name: "العملاء", href: "/dashboard/customers", icon: Users },
    { name: "الإحصائيات", href: "/dashboard", icon: BarChart3 },
    { name: "إعدادات المتجر", href: "/dashboard/settings", icon: Settings },
  ]

  // Do not wrap the standalone onboarding wizard with the dashboard sidebar
  if (pathname === "/onboarding") {
    return <>{children}</>
  }

  const isNavItemActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* الشريط الجانبي (Sidebar) على سطح المكتب */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 border-l border-border/80 bg-card/60 backdrop-blur-md p-6 justify-between shrink-0">
        <div className="space-y-8">
          {/* الشعار */}
          <div className="pb-6 border-b border-border/60">
            <Logo size="md" />
          </div>

          {/* المتجر الحالي ومعاينة سريعة */}
          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/60 text-right space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-foreground">
                {settings.storeName}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate dir-ltr text-right">
              matgarak.com/{settings.slug}
            </div>
            <Link
              href={`/${settings.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold pt-1"
            >
              <span>معاينة متجرك</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* روابط القائمة */}
          <nav className="space-y-1.5" aria-label="قائمة لوحة التحكم">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = isNavItemActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 text-[11px] font-black rounded-full ${
                          isActive
                            ? "bg-white text-primary"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronLeft className="w-4 h-4" />}
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* أسفل القائمة: تسجيل الخروج */}
        <div className="pt-6 border-t border-border/60">
          <Link href="/">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive gap-3 rounded-2xl"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </Button>
          </Link>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* شريط علوي (Header) */}
        <header className="h-20 border-b border-border/60 bg-card/40 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "إغلاق القائمة الجانبية" : "فتح القائمة الجانبية"}
              className="lg:hidden p-2 rounded-xl text-foreground hover:bg-muted"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="text-right">
              <h2 className="text-base sm:text-lg font-black text-foreground">
                لوحة تحكم المتجر
              </h2>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                مرحباً بك! تابع أوردراتك ومخزونك لحظة بلحظة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/orders"
              aria-label="إشعارات الأوردرات الجديدة"
              className="relative w-10 h-10 rounded-xl border border-border/60 bg-background/80 hover:bg-muted flex items-center justify-center text-foreground transition-colors"
            >
              <Bell className="w-5 h-5" />
              {newOrdersCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
              )}
            </Link>
            <div
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-black flex items-center justify-center text-sm shadow-sm"
              title={settings.storeName}
            >
              {settings.storeName.trim().charAt(0) || "م"}
            </div>
          </div>
        </header>

        {/* قائمة الموبايل Drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-xl p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <Logo size="md" />
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="إغلاق القائمة"
                  className="p-2 rounded-xl text-foreground hover:bg-muted"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="space-y-2" aria-label="قائمة الموبايل">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = isNavItemActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-base font-bold ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 text-xs font-black rounded-full bg-primary/20 text-primary">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
                <Link
                  href={`/${settings.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-bold text-primary hover:bg-muted"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>معاينة متجرك</span>
                </Link>
              </nav>
            </div>
            <Link href="/" onClick={() => setSidebarOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                تسجيل الخروج
              </Button>
            </Link>
          </div>
        )}

        {/* جسم الصفحة */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
