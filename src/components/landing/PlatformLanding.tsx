"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useI18n } from "@/components/providers/LanguageProvider"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { ProductVisual } from "@/components/common/ProductVisual"
import { Logo } from "@/components/ui/Logo"
import { usePlatformStore } from "@/stores/platformStore"
import {
  ArrowLeft,
  ArrowRight,
  Store,
  ShieldCheck,
  Palette,
  Layers,
  BarChart3,
  Globe,
  ShoppingBag,
  Check,
  ExternalLink,
  Menu,
  X,
} from "lucide-react"

export function PlatformLanding() {
  const { locale, dir, pick, t, formatCurrency } = useI18n()
  const stores = usePlatformStore((s) => s.stores)
  const plans = usePlatformStore((s) => s.plans)
  const [slugInput, setSlugInput] = useState("")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight
  const liveDemoStores = stores.filter((s) => s.status === "published").slice(0, 3)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark */}
          <Logo size="md" href="/" priority />

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground"
            aria-label={pick("التنقل الرئيسي", "Primary Navigation")}
          >
            <a
              href="#live-stores"
              className="hover:text-foreground transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.liveDemos}
            </a>
            <a
              href="#capabilities"
              className="hover:text-foreground transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.features}
            </a>
            <a
              href="#pricing"
              className="hover:text-foreground transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.pricing}
            </a>
            <Link
              href="/merchant/login"
              className="hover:text-foreground transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.merchantPortal}
            </Link>
            <Link
              href="/admin/login"
              className="hover:text-foreground transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.adminPortal}
            </Link>
          </nav>

          {/* Zone 3: Primary CTA + compact utility menu for mobile */}
          <div className="flex items-center gap-2.5 shrink-0">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <Link
              href="/merchant/register"
              className="hidden sm:inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0"
            >
              <span>{t.nav.startFree}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label={pick("فتح القائمة", "Toggle navigation menu")}
              className="lg:hidden p-2 rounded-lg border border-border text-foreground hover:bg-muted"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="lg:hidden border-b border-border bg-card px-4 py-4 space-y-3 shadow-lg">
            <nav className="flex flex-col gap-2 text-sm font-medium">
              <a href="#live-stores" onClick={() => setMobileNavOpen(false)} className="py-2 text-foreground">
                {t.nav.liveDemos}
              </a>
              <a href="#capabilities" onClick={() => setMobileNavOpen(false)} className="py-2 text-foreground">
                {t.nav.features}
              </a>
              <a href="#pricing" onClick={() => setMobileNavOpen(false)} className="py-2 text-foreground">
                {t.nav.pricing}
              </a>
              <Link href="/merchant/login" onClick={() => setMobileNavOpen(false)} className="py-2 text-foreground">
                {t.nav.merchantPortal}
              </Link>
              <Link href="/admin/login" onClick={() => setMobileNavOpen(false)} className="py-2 text-foreground">
                {t.nav.adminPortal}
              </Link>
              <Link
                href="/merchant/register"
                onClick={() => setMobileNavOpen(false)}
                className="mt-2 inline-flex items-center justify-center h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                {t.nav.startFree}
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                <p className="text-xs font-semibold tracking-wide text-primary">
                  {pick(
                    "منصة التجارة الإلكترونية متعددة المتاجر • عربي RTL وإنجليزي LTR",
                    "Multi-Tenant E-Commerce SaaS • Full Arabic RTL & English LTR"
                  )}
                </p>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.15] text-foreground [text-wrap:balance]">
                  {pick(
                    "أنشئ متجر علامتك التجارية المستقل، خصّص هويته، وابدأ البيع اليوم.",
                    "Build, customize, and operate your independent brand storefront."
                  )}
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                  {pick(
                    "منظومة متكاملة تجمع بين مصمم متاجر مرئي بدون كود، وإدارة منتجات بمتغيرات ومخزون دقيق، وتجربة تسوق احترافية لعملائك، ولوحة مشرف عام لإدارة المنصة.",
                    "One cohesive SaaS architecture combining a no-code Visual Store Builder, multi-variant inventory and order workflows, branded customer storefronts, and Super Admin platform governance."
                  )}
                </p>

                {/* Store Slug Quick Reserve */}
                <div className="max-w-xl border border-border bg-card rounded-xl p-2 flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center bg-muted/60 rounded-lg px-3.5 h-11 dir-ltr">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      matgarak.com/s/
                    </span>
                    <input
                      type="text"
                      value={slugInput}
                      onChange={(e) =>
                        setSlugInput(
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                        )
                      }
                      aria-label={pick("رابط متجرك", "Desired store slug")}
                      placeholder="nova-atelier"
                      className="flex-1 bg-transparent border-0 outline-none text-sm font-mono font-semibold text-foreground px-1"
                    />
                  </div>
                  <Link
                    href={
                      slugInput
                        ? `/merchant/register?slug=${slugInput}`
                        : "/merchant/register"
                    }
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>{pick("افتح متجرك الآن", "Create Store")}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </Link>
                </div>

                {/* Direct Role Portals Strip */}
                <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span>{pick("وصول سريع للتجربة الكاملة:", "Explore all three experiences:")}</span>
                  <Link
                    href="/dashboard"
                    className="font-semibold text-foreground hover:text-primary underline underline-offset-4"
                  >
                    {pick("لوحة التاجر", "Merchant Dashboard")}
                  </Link>
                  <span aria-hidden="true">·</span>
                  <Link
                    href="/s/nova-atelier"
                    className="font-semibold text-foreground hover:text-primary underline underline-offset-4"
                  >
                    {pick("متجر NOVA", "NOVA Storefront")}
                  </Link>
                  <span aria-hidden="true">·</span>
                  <Link
                    href="/admin/login"
                    className="font-semibold text-foreground hover:text-primary underline underline-offset-4"
                  >
                    {pick("لوحة المشرف العام", "Super Admin")}
                  </Link>
                </div>
              </div>

              {/* Right Column: Editorial Multi-Tenant Showcase Frame */}
              <div className="lg:col-span-5 flex flex-col justify-between border border-border rounded-2xl bg-card p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {pick("معاينة متجر مستقل منشور", "Published Independent Storefront")}
                    </div>
                    <div className="text-base font-bold text-foreground mt-0.5">
                      NOVA Atelier — Minimal Fashion
                    </div>
                  </div>
                  <Link
                    href="/s/nova-atelier"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline whitespace-nowrap"
                  >
                    <span>{pick("زيارة المتجر", "Visit Store")}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1">
                  <Link
                    href="/s/nova-atelier/products/prod-nova-hoodie"
                    className="group border border-border rounded-xl overflow-hidden flex flex-col bg-background hover:border-foreground/30 transition-colors"
                  >
                    <div className="aspect-[4/3] w-full">
                      <ProductVisual
                        type="hoodie"
                        palette={["#18181B", "#3F3F46"]}
                        label="NOVA Heavyweight Hoodie"
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {pick("هودي نوفا 460 جم", "NOVA Heavyweight Hoodie")}
                      </div>
                      <div className="text-xs font-mono tabular-nums text-muted-foreground">
                        {formatCurrency(1150)}
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/s/nova-atelier/products/prod-nova-coat"
                    className="group border border-border rounded-xl overflow-hidden flex flex-col bg-background hover:border-foreground/30 transition-colors"
                  >
                    <div className="aspect-[4/3] w-full">
                      <ProductVisual
                        type="coat"
                        palette={["#7C6A58", "#4A3F35"]}
                        label="Tailored Merino Overcoat"
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {pick("معطف صوف ميرينو", "Tailored Merino Coat")}
                      </div>
                      <div className="text-xs font-mono tabular-nums text-muted-foreground">
                        {formatCurrency(2850)}
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border text-center">
                  <div>
                    <div className="text-lg font-bold font-mono tabular-nums text-foreground">
                      3
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {pick("تجارب مستقلة", "Role Portals")}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold font-mono tabular-nums text-foreground">
                      3
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {pick("قوالب متاجر", "Theme Presets")}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold font-mono tabular-nums text-foreground">
                      RTL/LTR
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {pick("عربي وإنجليزي", "Bilingual Native")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Branded Multi-Tenant Storefronts Showcase */}
        <section id="live-stores" className="py-16 lg:py-20 border-b border-border bg-secondary/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {pick(
                    "كل براند بهويته الخاصة والمستقلة",
                    "Independent Brand Storefronts on One Architecture"
                  )}
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  {pick(
                    "جرّب 3 متاجر حقيقية تعمل بثيمات وألوان وأقسام ومنتجات وحسابات عملاء معزولة تماماً.",
                    "Explore three live multi-tenant storefronts running distinct visual themes, catalogs, coupons, and isolated customer accounts."
                  )}
                </p>
              </div>
              <Link
                href="/dashboard/store-design"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline whitespace-nowrap"
              >
                <Palette className="w-4 h-4" />
                <span>{pick("افتح مصمم المتجر المرئي", "Open Visual Store Builder")}</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {liveDemoStores.map((store) => {
                const visualType =
                  store.category === "cosmetics"
                    ? "serum"
                    : store.category === "electronics"
                      ? "headphones"
                      : "hoodie"
                return (
                  <div
                    key={store.id}
                    className="border border-border rounded-xl bg-card overflow-hidden flex flex-col justify-between hover:border-foreground/30 transition-colors"
                  >
                    <div>
                      <div className="h-44 relative">
                        <ProductVisual
                          type={visualType}
                          palette={[store.theme.primaryColor, store.theme.accentColor]}
                          label={store.nameEn}
                        />
                        <div className="absolute bottom-3 start-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-border text-[11px] font-mono text-foreground">
                          /s/{store.slug}
                        </div>
                      </div>
                      <div className="p-5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-lg font-bold text-foreground">
                            {pick(store.nameAr, store.nameEn)}
                          </h3>
                          <span
                            className="w-4 h-4 rounded-full border border-border shrink-0"
                            style={{ backgroundColor: store.theme.primaryColor }}
                            title={store.theme.presetId}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {pick(store.descriptionAr, store.descriptionEn)}
                        </p>
                        <div className="pt-2 text-xs text-muted-foreground flex items-center gap-2">
                          <span>{store.theme.presetId}</span>
                          <span aria-hidden="true">·</span>
                          <span>{store.localization.currency}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2 flex items-center gap-2">
                      <Link
                        href={`/s/${store.slug}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{pick("تسوّق المتجر", "Visit Storefront")}</span>
                      </Link>
                      <Link
                        href={`/s/${store.slug}/products`}
                        className="inline-flex items-center justify-center h-10 px-3 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                      >
                        {pick("الكتالوج", "Catalog")}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Three Platform Pillars */}
        <section id="capabilities" className="py-16 lg:py-20 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {pick(
                  "ثلاث تجارب مصممة لكل دور داخل المنصة",
                  "Three Purpose-Built Product Experiences"
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                {pick(
                  "لم نبني لوحة واحدة مكررة للجميع — بل صممنا تجربة مخصصة للمشرف العام، وأخرى لصاحب المتجر، ومتجراً مستقلاً بالكامل للمشتري.",
                  "Dedicated layouts, permissions, and workflows for Platform Super Admins, Store Owners, and End Customers."
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-border rounded-xl bg-card p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">
                    {pick("1. لوحة المشرف العام (Super Admin)", "01. Platform Super Admin")}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pick(
                      "إدارة التجار والمتاجر والباقات والاشتراكات والـ MRR والتحليلات وتذاكر الدعم الفني وإعدادات المنصة.",
                      "Oversee merchants, active/suspended stores, subscription plans, MRR telemetry, support queues, and global governance."
                    )}
                  </p>
                </div>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline pt-2"
                >
                  <span>{pick("دخول المشرف العام", "Open Admin Portal")}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Link>
              </div>

              <div className="border border-border rounded-xl bg-card p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <Store className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">
                    {pick("2. لوحة التاجر ومصمم المتجر", "02. Merchant Dashboard & Builder")}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pick(
                      "إدارة المنتجات والمتغيرات والمخزون، 9 حالات للطلبات مع الفواتير، كوبونات الخصم، وفريق العمل، ومصمم المتجر المرئي المباشر.",
                      "Manage multi-variant catalogs, nested categories, inventory logs, 9-stage order lifecycle, coupons, staff RBAC, and live visual theming."
                    )}
                  </p>
                </div>
                <Link
                  href="/merchant/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline pt-2"
                >
                  <span>{pick("دخول لوحة التاجر", "Open Merchant Portal")}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Link>
              </div>

              <div className="border border-border rounded-xl bg-card p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <Layers className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">
                    {pick("3. واجهة المتجر المستقلة للعملاء", "03. Branded Customer Storefront")}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pick(
                      "صفحة رئيسية ديناميكية بالأقسام المختارة، تصفية وبحث متقدم، صفحات منتجات كاملة، سلة تسوق، إتمام طلب من 6 خطوات وحساب عميل معزول.",
                      "Dynamic theme-driven homepage, filtered catalog, full PDPs with variant pricing, cart drawer, 6-step checkout, and store-scoped customer accounts."
                    )}
                  </p>
                </div>
                <Link
                  href="/s/nova-atelier"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline pt-2"
                >
                  <span>{pick("تصفح متجر NOVA", "Explore NOVA Storefront")}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {[
                {
                  icon: Palette,
                  title: pick("تخصيص مرئي بدون كود", "No-Code Theme Studio"),
                  desc: pick("غيّر الألوان والخطوط وترتيب الأقسام مع معاينة فورية.", "Edit brand tokens, layouts, and homepage sections live."),
                },
                {
                  icon: BarChart3,
                  title: pick("تحليلات ومخزون فوري", "Real-Time Inventory & Analytics"),
                  desc: pick("تتبع المخزون لكل مقاس ولون وسجل حركات التعديل.", "Per-variant stock ledgers, low-stock alerts, and CSV exports."),
                },
                {
                  icon: Globe,
                  title: pick("عربي RTL وإنجليزي LTR", "Native Arabic RTL & English LTR"),
                  desc: pick("دعم لغوي واتجاه تصميم متكامل في كل صفحة ومكون.", "Centralized i18n with mirrored layout direction and formatting."),
                },
                {
                  icon: ShieldCheck,
                  title: pick("عزل كامل بين المتاجر", "Strict Multi-Tenant Isolation"),
                  desc: pick("بيانات وحسابات ومنتجات كل متجر معزولة بدقة.", "Scoped catalogs, orders, coupons, and customer auth per store."),
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="p-4 border border-border rounded-xl bg-background space-y-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <div className="text-sm font-semibold text-foreground">{item.title}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {pick("باقات واضحة تنمو مع علامتك", "Transparent Plans Built to Scale")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {pick("ابدأ مجاناً وترقّى في أي وقت بدون عمولات خفية على المبيعات.", "Start free and upgrade anytime with zero hidden transaction commissions.")}
                </p>
              </div>
              <div className="inline-flex items-center p-1 bg-muted rounded-lg border border-border self-start">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    billingCycle === "monthly"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {pick("شهري", "Monthly")}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    billingCycle === "yearly"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {pick("سنوي (وفر شهرين)", "Yearly (2 Months Free)")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans
                .filter((p) => p.active)
                .map((plan) => {
                  const price =
                    billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
                  const isFeatured = plan.id === "plan-growth"
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-xl border p-6 flex flex-col justify-between space-y-6 ${
                        isFeatured
                          ? "border-primary bg-card shadow-sm"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-foreground">
                            {pick(plan.nameAr, plan.nameEn)}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {pick(plan.descriptionAr, plan.descriptionEn)}
                          </p>
                        </div>

                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold font-mono tabular-nums text-foreground">
                            {price === 0 ? pick("مجاناً", "Free") : formatCurrency(price, plan.currency)}
                          </span>
                          {price > 0 && (
                            <span className="text-xs text-muted-foreground">
                              / {billingCycle === "monthly" ? pick("شهر", "mo") : pick("سنة", "yr")}
                            </span>
                          )}
                        </div>

                        <ul className="space-y-2.5 pt-3 border-t border-border">
                          {(locale === "ar" ? plan.featuresAr : plan.featuresEn).map(
                            (feat) => (
                              <li
                                key={feat}
                                className="flex items-start gap-2 text-xs text-foreground/90"
                              >
                                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <Link
                        href="/merchant/register"
                        className={`inline-flex items-center justify-center h-10 rounded-lg text-xs font-semibold transition-colors ${
                          isFeatured
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {pick("ابدأ بهذه الباقة", "Get Started")}
                      </Link>
                    </div>
                  )
                })}
            </div>
          </div>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-3 text-foreground font-bold">
            <Logo size="sm" href="/" />
            <span className="text-muted-foreground font-medium">
              © 2026 {pick("متجرك", "Matgarak SaaS")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/merchant/login" className="hover:text-foreground transition-colors">
              {t.nav.merchantPortal}
            </Link>
            <Link href="/admin/login" className="hover:text-foreground transition-colors">
              {t.nav.adminPortal}
            </Link>
            <Link href="/s/nova-atelier" className="hover:text-foreground transition-colors">
              NOVA Storefront
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {pick("الخصوصية", "Privacy")}
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {pick("الشروط", "Terms")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
