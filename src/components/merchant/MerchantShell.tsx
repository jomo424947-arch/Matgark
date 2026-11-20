"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ShoppingBag,
  Users,
  Tag,
  Palette,
  BarChart3,
  Truck,
  CreditCard,
  Shield,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Store,
  ChevronDown,
  Sparkles,
  Bot,
} from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { StatusText } from "@/components/common/StatusText"
import { Logo } from "@/components/ui/Logo"
import { MerchantAiCopilot } from "@/components/merchant/MerchantAiCopilot"
import { formatStoreStatusLabel } from "@/lib/i18n/translations"
import { logoutAction } from "@/server/actions/auth"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  labelAr: string
  labelEn: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelAr: "نظرة عامة", labelEn: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/assistant", labelAr: "المساعد الذكي (AI)", labelEn: "AI Copilot", icon: Bot },
  { href: "/dashboard/orders", labelAr: "الطلبات", labelEn: "Orders", icon: ShoppingBag },
  { href: "/dashboard/products", labelAr: "المنتجات", labelEn: "Products", icon: Package },
  { href: "/dashboard/categories", labelAr: "الأقسام والمجموعات", labelEn: "Categories", icon: FolderTree },
  { href: "/dashboard/inventory", labelAr: "المخزون", labelEn: "Inventory", icon: Boxes },
  { href: "/dashboard/customers", labelAr: "العملاء", labelEn: "Customers", icon: Users },
  { href: "/dashboard/discounts", labelAr: "الخصومات والتسويق", labelEn: "Discounts", icon: Tag },
  { href: "/dashboard/store-design", labelAr: "مصمم المتجر", labelEn: "Store Builder", icon: Palette },
  { href: "/dashboard/analytics", labelAr: "التحليلات", labelEn: "Analytics", icon: BarChart3 },
  { href: "/dashboard/shipping", labelAr: "الشحن والتوصيل", labelEn: "Shipping", icon: Truck },
  { href: "/dashboard/payments", labelAr: "طرق الدفع", labelEn: "Payments", icon: CreditCard },
  { href: "/dashboard/staff", labelAr: "فريق العمل", labelEn: "Team & Roles", icon: Shield },
  { href: "/dashboard/settings", labelAr: "إعدادات المتجر", labelEn: "Settings", icon: Settings },
]

export function MerchantShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { locale, pick } = useI18n()
  const merchantSession = useAuthStore((s) => s.merchantSession)
  const loginMerchant = useAuthStore((s) => s.loginMerchant)
  const switchMerchantStore = useAuthStore((s) => s.switchMerchantStore)
  const logoutMerchant = useAuthStore((s) => s.logoutMerchant)

  const stores = usePlatformStore((s) => s.stores)
  const merchants = usePlatformStore((s) => s.merchants)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [copilotDrawerOpen, setCopilotDrawerOpen] = useState(false)

  const isStoreBuilder = pathname === "/dashboard/store-design"
  const isAssistantPage = pathname === "/dashboard/assistant"

  if (!merchantSession) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="h-16 border-b border-border px-6 flex items-center justify-between max-w-5xl w-full mx-auto">
          <Logo size="md" href="/" priority />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold">
              {pick("يلزم تسجيل الدخول للوحة التاجر", "Merchant Sign-In Required")}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {pick(
                "هذه المساحة مخصصة لأصحاب المتاجر وفريق عملهم. سجّل الدخول أو جرّب متجر Men’z Club التجريبي فوراً.",
                "This workspace is reserved for store merchants and staff. Sign in or launch the Men’z Club demo store instantly."
              )}
            </p>
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const m = merchants[0]
                  const s = stores.find((st) => st.merchantId === m.id) ?? stores[0]
                  if (m && s) {
                    loginMerchant({
                      merchantId: m.id,
                      storeId: s.id,
                      name: m.name,
                      email: m.email,
                      role: "owner",
                    })
                  }
                }}
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{pick("دخول فوري كـ تاجر Men’z Club", "Quick Sign-In as Men’z Club")}</span>
              </button>
              <Link
                href="/merchant/login"
                className="h-10 px-4 rounded-xl border border-border text-sm font-semibold flex items-center justify-center hover:bg-muted"
              >
                {pick("صفحة تسجيل دخول التجار", "Go to Merchant Login")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const activeStore =
    stores.find((s) => s.id === merchantSession.storeId) ??
    stores.find((s) => s.merchantId === merchantSession.merchantId) ??
    stores[0]

  const isNavActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  const statusTone =
    activeStore?.status === "published"
      ? "success"
      : activeStore?.status === "suspended"
        ? "danger"
        : "warning"

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-e border-border">
      {/* Brand + Store Switcher */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <button
            type="button"
            onClick={() => setSwitcherOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2.5 p-2 rounded-xl border border-border hover:bg-muted/60 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-8 h-8 rounded-lg text-white text-xs font-bold flex items-center justify-center shrink-0"
                style={{ backgroundColor: activeStore?.logoColor || "#111111" }}
              >
                {activeStore?.logoMonogram || "M"}
              </span>
              <div className="min-w-0 text-start">
                <p className="text-sm font-bold truncate leading-tight">
                  {activeStore ? pick(activeStore.nameAr, activeStore.nameEn) : "Store"}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono truncate dir-ltr text-start">
                  /s/{activeStore?.slug}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>

          {switcherOpen && (
            <div className="absolute z-30 top-full mt-1.5 inset-x-0 bg-card border border-border rounded-xl shadow-lg p-1.5 space-y-1">
              <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                {pick("تبديل المتجر النشط", "Switch Active Store")}
              </p>
              {stores.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    switchMerchantStore(st.id)
                    setSwitcherOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-start transition-colors",
                    st.id === activeStore?.id
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <span
                    className="w-6 h-6 rounded text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                    style={{ backgroundColor: st.logoColor }}
                  >
                    {st.logoMonogram}
                  </span>
                  <span className="truncate">{pick(st.nameAr, st.nameEn)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {activeStore && (
          <div className="mt-3 flex items-center justify-between px-1">
            <StatusText
              tone={statusTone}
              icon={activeStore.status === "published" ? "check" : activeStore.status === "suspended" ? "x" : "clock"}
              label={formatStoreStatusLabel(activeStore.status, locale)}
            />
            <Link
              href={`/s/${activeStore.slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>{pick("فتح المتجر", "Storefront")}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5" aria-label="Merchant navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isNavActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{pick(item.labelAr, item.labelEn)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Merchant Account Footer */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold truncate">{merchantSession.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{merchantSession.email}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await logoutAction().catch(() => {})
            logoutMerchant()
            router.push("/merchant/login")
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{pick("تسجيل الخروج", "Sign Out")}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen no-print">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute top-3 end-3 z-20 w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="lg:hidden w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground min-w-0">
              <Logo size="xs" href="/" />
              <span className="opacity-40">/</span>
              <span className="truncate font-semibold text-foreground">
                {activeStore ? pick(activeStore.nameAr, activeStore.nameEn) : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeStore && (
              <Link
                href={`/s/${activeStore.slug}`}
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{pick("معاينة المتجر العام", "View Storefront")}</span>
              </Link>
            )}
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <main
          className={cn(
            "flex-1 min-w-0",
            isStoreBuilder ? "p-0" : "p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto"
          )}
        >
          {children}
        </main>
      </div>

      {/* Floating Quick-Access Merchant AI Copilot Button & Slide-over Drawer */}
      {!isAssistantPage && (
        <>
          <button
            type="button"
            onClick={() => setCopilotDrawerOpen(true)}
            aria-label={pick("فتح المساعد الذكي للمتجر", "Open AI Store Copilot")}
            className="fixed bottom-5 end-5 z-40 h-12 px-4 rounded-full bg-primary text-primary-foreground shadow-xl hover:opacity-95 transition-opacity inline-flex items-center gap-2 text-xs font-bold cursor-pointer no-print"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">{pick("المساعد الذكي", "AI Copilot")}</span>
          </button>

          {copilotDrawerOpen && (
            <div className="fixed inset-0 z-50 flex justify-end no-print">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
                onClick={() => setCopilotDrawerOpen(false)}
              />
              <div className="relative z-10 w-full max-w-md h-full bg-card border-s border-border shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
                  <Link
                    href="/dashboard/assistant"
                    onClick={() => setCopilotDrawerOpen(false)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {pick("فتح في شاشة كاملة", "Open Full Workspace")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setCopilotDrawerOpen(false)}
                    aria-label={pick("إغلاق", "Close")}
                    className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <MerchantAiCopilot mode="drawer" />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
