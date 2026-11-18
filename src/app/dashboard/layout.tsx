"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { logoutAction } from "@/server/actions/auth"
import { getMerchantDashboardDataAction } from "@/server/actions/store"
import { getStorePath, getStoreDisplayUrl } from "@/lib/reserved-slugs"
import { toast } from "sonner"
import type { Store } from "@/types/domain"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  ExternalLink,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Paintbrush,
} from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [store, setStore] = useState<Store | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    let mounted = true
    getMerchantDashboardDataAction()
      .then((data) => {
        if (mounted && data.store) {
          setStore(data.store)
        }
      })
      .catch(() => {
        // Fallback for preview
      })
    return () => {
      mounted = false
    }
  }, [])

  const navigation = [
    { name: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
    { name: "المنتجات", href: "/dashboard/products", icon: Package },
    { name: "الأوردرات", href: "/dashboard/orders", icon: ShoppingCart },
    { name: "العملاء", href: "/dashboard/customers", icon: Users },
    { name: "تخصيص المتجر", href: "/dashboard/customize", icon: Paintbrush },
    { name: "إعدادات المتجر", href: "/dashboard/settings", icon: Settings },
  ]

  const storeSlug = store?.slug || ""
  const storeName = store?.name || "متجرك"

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      const result = await logoutAction()
      if (!result.ok) {
        toast.error("تعذر تسجيل الخروج. حاولي مرة أخرى.")
        return
      }
      router.replace(result.redirectTo)
      router.refresh()
    } catch {
      toast.error("حدث خطأ أثناء تسجيل الخروج. حاولي مرة أخرى.")
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 border-l border-border/80 bg-card/60 backdrop-blur-md p-6 justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <div className="pb-6 border-b border-border/60">
            <Logo size="md" />
          </div>

          {/* Current Store Preview Box */}
          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/60 text-right space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-foreground">
                {storeName}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate dir-ltr text-right">
              {storeSlug ? getStoreDisplayUrl(storeSlug) : "بيانات المتجر غير متاحة"}
            </div>
            <Link
              href={storeSlug ? getStorePath(storeSlug) : "/dashboard/settings"}
              target={storeSlug ? "_blank" : undefined}
              rel={storeSlug ? "noreferrer" : undefined}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold pt-1"
            >
              <span>معاينة متجرك</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`)

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
                  {isActive && <ChevronLeft className="w-4 h-4" />}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="pt-6 border-t border-border/60">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="w-full flex items-center justify-start text-muted-foreground hover:text-destructive gap-3 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            <span>{loggingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 border-b border-border/60 bg-card/40 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={sidebarOpen}
              aria-controls="dashboard-mobile-navigation"
              className="lg:hidden p-2 rounded-xl text-foreground hover:bg-muted"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
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
            <div
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-black flex items-center justify-center text-sm shadow-sm"
              aria-label={`الحساب: ${storeName}`}
              title={storeName}
            >
              {storeName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {sidebarOpen && (
          <div id="dashboard-mobile-navigation" role="dialog" aria-modal="true" aria-label="قائمة لوحة التحكم" className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-xl p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <Logo size="md" />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="إغلاق القائمة"
                  className="p-2 rounded-xl text-foreground hover:bg-muted"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-bold ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              isLoading={loggingOut}
            >
              تسجيل الخروج
            </Button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
