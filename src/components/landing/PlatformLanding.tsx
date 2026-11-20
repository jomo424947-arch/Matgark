"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useI18n } from "@/components/providers/LanguageProvider"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { ProductVisual } from "@/components/common/ProductVisual"
import { Logo } from "@/components/ui/Logo"
import { usePlatformStore } from "@/stores/platformStore"
import { isReservedSlug } from "@/lib/reserved-slugs"
import { scopeByTenant } from "@/lib/commerce/engine"
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
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react"

export function PlatformLanding() {
  const { locale, dir, pick, t, formatCurrency } = useI18n()
  const stores = usePlatformStore((s) => s.stores)
  const products = usePlatformStore((s) => s.products)
  const plans = usePlatformStore((s) => s.plans)

  const [slugInput, setSlugInput] = useState("")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [heroStoreIndex, setHeroStoreIndex] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight
  const liveDemoStores = useMemo(
    () => stores.filter((s) => s.status === "published").slice(0, 3),
    [stores]
  )

  const activeHeroStore = liveDemoStores[heroStoreIndex] ?? liveDemoStores[0]
  const activeHeroProducts = useMemo(() => {
    if (!activeHeroStore) return []
    return scopeByTenant(products, activeHeroStore.id)
      .filter((p) => p.status === "active")
      .slice(0, 2)
  }, [products, activeHeroStore])

  const slugStatus = useMemo(() => {
    const clean = slugInput.trim().toLowerCase()
    if (!clean) return null
    if (clean.length < 3) {
      return {
        ok: false,
        message: pick("3 أحرف إنجليزية على الأقل", "At least 3 characters"),
      }
    }
    if (
      isReservedSlug(clean) ||
      stores.some((s) => s.slug.toLowerCase() === clean)
    ) {
      return {
        ok: false,
        message: pick("هذا الرابط محجوز، جرّب اسماً آخر", "Already taken — try another slug"),
      }
    }
    return {
      ok: true,
      message: pick("الرابط متاح للحجز الفوري", "Available to reserve now"),
    }
  }, [slugInput, stores, pick])

  const faqs = useMemo(
    () => [
      {
        q: pick(
          "هل تأخذ منصة متجرك عمولة على مبيعات المتجر؟",
          "Does Matgarak charge transaction commissions on store sales?"
        ),
        a: pick(
          "لا، تحتفظ بـ 100% من مبيعاتك. يمكنك البدء على الباقة المجانية والترقية لاحقاً مع نمو عدد منتجاتك وفريق عملك.",
          "Never. You keep 100% of your revenue. Start on the free Starter plan and upgrade only when your catalog or team grows."
        ),
      },
      {
        q: pick(
          "هل يمكن تخصيص تصميم المتجر وأقسام الصفحة الرئيسية بدون كود؟",
          "Can merchants customize store themes and homepage sections without code?"
        ),
        a: pick(
          "نعم، يتضمن كل متجر مصمم متجر مرئي مباشر لتغيير القالب، الألوان، الخطوط، الشعار، وإعادة ترتيب الأقسام مع معاينة فورية للموبايل والكمبيوتر.",
          "Yes. Every merchant gets a live Visual Store Builder to switch presets, edit brand colors and typography, upload a store logo, and reorder homepage sections with desktop and mobile preview."
        ),
      },
      {
        q: pick(
          "كيف يتم فصل البيانات بين المتاجر المختلفة على المنصة؟",
          "How is multi-tenant isolation enforced across storefronts?"
        ),
        a: pick(
          "كل متجر يعمل على رابط مستقل (/s/store-slug) مع كتالوج منتجات، كوبونات، طلبات، وحسابات عملاء معزولة تماماً عن بقية المتاجر.",
          "Each brand operates on its own storefront URL (/s/store-slug) with strictly tenant-scoped products, categories, coupons, orders, and isolated customer accounts."
        ),
      },
      {
        q: pick(
          "كيف يدير المشرف العام المنصة والتجار والاشتراكات؟",
          "How does platform administration work for Super Admins?"
        ),
        a: pick(
          "توجد بوابة مستقلة ومحمية للمشرف العام (/admin/login) لإدارة التجار، تعليق أو تفعيل المتاجر، متابعة الإيرادات الشهرية MRR، وتذاكر الدعم الفني.",
          "A dedicated, isolated Super Admin portal (/admin/login) provides merchant governance, store publishing controls, subscription plans, MRR telemetry, and support ticket resolution."
        ),
      },
    ],
    [pick]
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Bag-only brand mark */}
          <Logo size="md" href="/" priority />

          {/* Zone 2: 5 concise single-line navigation links */}
          <nav
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground"
            aria-label={pick("التنقل الرئيسي", "Primary Navigation")}
          >
            <a
              href="#live-stores"
              className="hover:text-foreground underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.liveDemos}
            </a>
            <a
              href="#workflow"
              className="hover:text-foreground underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              {pick("كيف تعمل", "How It Works")}
            </a>
            <a
              href="#capabilities"
              className="hover:text-foreground underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.features}
            </a>
            <a
              href="#pricing"
              className="hover:text-foreground underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.pricing}
            </a>
            <Link
              href="/merchant/login"
              className="hover:text-foreground underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.merchantPortal}
            </Link>
          </nav>

          {/* Zone 3: Utility controls + 1 primary CTA */}
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
              aria-expanded={mobileNavOpen}
              className="lg:hidden p-2 rounded-lg border border-border text-foreground hover:bg-muted"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="lg:hidden border-b border-border bg-card px-4 py-4 space-y-3 shadow-lg">
            <nav className="flex flex-col gap-1 text-sm font-medium">
              <a href="#live-stores" onClick={() => setMobileNavOpen(false)} className="py-2.5 text-foreground">
                {t.nav.liveDemos}
              </a>
              <a href="#workflow" onClick={() => setMobileNavOpen(false)} className="py-2.5 text-foreground">
                {pick("كيف تعمل", "How It Works")}
              </a>
              <a href="#capabilities" onClick={() => setMobileNavOpen(false)} className="py-2.5 text-foreground">
                {t.nav.features}
              </a>
              <a href="#pricing" onClick={() => setMobileNavOpen(false)} className="py-2.5 text-foreground">
                {t.nav.pricing}
              </a>
              <Link href="/merchant/login" onClick={() => setMobileNavOpen(false)} className="py-2.5 text-foreground">
                {t.nav.merchantPortal}
              </Link>
              <Link href="/admin/login" onClick={() => setMobileNavOpen(false)} className="py-2.5 text-foreground">
                {t.nav.adminPortal}
              </Link>
              <Link
                href="/merchant/register"
                onClick={() => setMobileNavOpen(false)}
                className="mt-2 inline-flex items-center justify-center h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                {t.nav.startFree}
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border py-14 lg:py-22">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary">
                  <span>{pick("منصة متجرك للتجارة الإلكترونية", "Matgarak Commerce Platform")}</span>
                  <span aria-hidden="true" className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground font-medium">
                    {pick("متاجر مستقلة بالعربية والإنجليزية", "Multi-Tenant Arabic RTL & English LTR")}
                  </span>
                </div>

                <h1 className="text-[2.25rem] sm:text-5xl lg:text-[3.35rem] font-extrabold tracking-tight leading-[1.14] text-foreground [text-wrap:balance]">
                  {pick(
                    "أنشئ متجر علامتك التجارية المستقل، خصّص هويته، وابدأ البيع اليوم.",
                    "Launch, customize, and operate your independent brand storefront."
                  )}
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                  {pick(
                    "منظومة متكاملة تجمع بين مصمم متاجر مرئي بدون كود، وإدارة منتجات بمتغيرات ومخزون دقيق، وتجربة تسوق احترافية لعملائك، ولوحة مشرف عام لإدارة المنصة.",
                    "One cohesive SaaS architecture combining a no-code Visual Store Builder, multi-variant inventory and order workflows, branded customer storefronts, and Super Admin platform governance."
                  )}
                </p>

                {/* Store Slug Quick Reserve with Live Availability Feedback */}
                <div className="max-w-xl space-y-2">
                  <form
                    action="/merchant/register"
                    method="get"
                    className="border border-border bg-card rounded-xl p-2 flex flex-col sm:flex-row gap-2 focus-within:border-primary/60 transition-colors"
                  >
                    <div className="flex-1 flex items-center bg-muted/60 rounded-lg px-3.5 h-11 dir-ltr">
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        matgarak.com/s/
                      </span>
                      <input
                        type="text"
                        name="slug"
                        value={slugInput}
                        onChange={(e) =>
                          setSlugInput(
                            e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                          )
                        }
                        aria-label={pick("رابط متجرك", "Desired store slug")}
                        placeholder="your-brand"
                        className="flex-1 bg-transparent border-0 outline-none text-sm font-mono font-semibold text-foreground px-1 min-w-0"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>{pick("افتح متجرك الآن", "Create Store")}</span>
                      <ArrowIcon className="w-4 h-4" />
                    </button>
                  </form>

                  {slugStatus && (
                    <div
                      className={`flex items-center gap-1.5 text-xs font-medium px-1 ${
                        slugStatus.ok
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {slugStatus.ok ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{slugStatus.message}</span>
                    </div>
                  )}
                </div>

                {/* Direct Role Portals Strip */}
                <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span>{pick("وصول مباشر للبوابات:", "Direct portal access:")}</span>
                  <Link
                    href="/dashboard"
                    className="font-semibold text-foreground hover:text-primary underline underline-offset-4 whitespace-nowrap"
                  >
                    {pick("لوحة التاجر", "Merchant Dashboard")}
                  </Link>
                  <span aria-hidden="true">·</span>
                  <Link
                    href="/s/nova-atelier"
                    className="font-semibold text-foreground hover:text-primary underline underline-offset-4 whitespace-nowrap"
                  >
                    {pick("متجر NOVA", "NOVA Storefront")}
                  </Link>
                  <span aria-hidden="true">·</span>
                  <Link
                    href="/admin/login"
                    className="font-semibold text-foreground hover:text-primary underline underline-offset-4 whitespace-nowrap"
                  >
                    {pick("لوحة المشرف العام", "Super Admin")}
                  </Link>
                </div>
              </div>

              {/* Right Column: Interactive Multi-Tenant Storefront Previewer */}
              <div className="lg:col-span-5 flex flex-col justify-between border border-border rounded-2xl bg-card p-6 space-y-5">
                {/* Interactive Brand Switcher */}
                <div className="space-y-3 border-b border-border pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {pick("معاينة حية لمتاجر منشورة", "Live Published Storefronts")}
                    </span>
                    {activeHeroStore && (
                      <Link
                        href={`/s/${activeHeroStore.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline whitespace-nowrap"
                      >
                        <span>{pick("زيارة المتجر", "Visit Store")}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                    {liveDemoStores.map((st, idx) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setHeroStoreIndex(idx)}
                        className={`flex-1 px-1.5 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-colors truncate cursor-pointer ${
                          idx === heroStoreIndex
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {pick(st.nameAr, st.nameEn)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Storefront Products */}
                {activeHeroStore && (
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-muted-foreground dir-ltr">
                        /s/{activeHeroStore.slug}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-border"
                          style={{ backgroundColor: activeHeroStore.theme.primaryColor }}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-border"
                          style={{ backgroundColor: activeHeroStore.theme.accentColor }}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          {activeHeroStore.theme.presetId}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-1">
                      {activeHeroProducts.map((prod) => (
                        <Link
                          key={prod.id}
                          href={`/s/${activeHeroStore.slug}/products/${prod.id}`}
                          className="group border border-border rounded-xl overflow-hidden flex flex-col bg-background hover:border-primary/50 transition-colors"
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden">
                            <ProductVisual
                              type={prod.visualType}
                              palette={prod.visualPalette}
                              label={pick(prod.nameAr, prod.nameEn)}
                              className="group-hover:scale-[1.03] transition-transform duration-200"
                            />
                          </div>
                          <div className="p-3 space-y-1">
                            <div className="text-xs font-semibold text-foreground truncate">
                              {pick(prod.nameAr, prod.nameEn)}
                            </div>
                            <div className="text-xs font-mono tabular-nums text-muted-foreground">
                              {formatCurrency(prod.price, activeHeroStore.localization.currency)}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border text-center">
                  <div>
                    <div className="text-lg font-bold font-mono tabular-nums text-foreground">
                      0%
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {pick("عمولة مبيعات", "Sales Commission")}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold font-mono tabular-nums text-foreground">
                      3
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {pick("قوالب احترافية", "Theme Presets")}
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
                    "تصفّح 3 متاجر حقيقية تعمل بثيمات وألوان وأقسام ومنتجات وحسابات عملاء معزولة تماماً.",
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
                const storeProductCount = scopeByTenant(products, store.id).filter(
                  (p) => p.status === "active"
                ).length
                return (
                  <div
                    key={store.id}
                    className="border border-border rounded-xl bg-card overflow-hidden flex flex-col justify-between hover:border-foreground/30 transition-colors"
                  >
                    <div>
                      <div className="h-44 relative overflow-hidden">
                        <ProductVisual
                          type={visualType}
                          palette={[store.theme.primaryColor, store.theme.accentColor]}
                          label={store.nameEn}
                        />
                        <div className="absolute bottom-3 start-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-border text-[11px] font-mono text-foreground dir-ltr">
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
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {pick(store.descriptionAr, store.descriptionEn)}
                        </p>
                        <div className="pt-2 text-xs text-muted-foreground flex items-center gap-2 tabular-nums">
                          <span>{store.theme.presetId}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {storeProductCount} {pick("منتج", "products")}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{store.localization.currency}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2 flex items-center gap-2">
                      <Link
                        href={`/s/${store.slug}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{pick("تسوّق المتجر", "Visit Storefront")}</span>
                      </Link>
                      <Link
                        href={`/s/${store.slug}/categories`}
                        className="inline-flex items-center justify-center h-10 px-3 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors whitespace-nowrap"
                      >
                        {pick("الأقسام", "Categories")}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 3-Step Editorial Workflow */}
        <section id="workflow" className="py-16 lg:py-20 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {pick("من الفكرة إلى أول طلب في ثلاث خطوات", "From Brand Idea to First Order in Three Steps")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {pick(
                  "مسار عمل واضح مصمم للتجار الناشئين والبراندات المتوسعة بدون إعدادات تقنية معقدة.",
                  "A clear operational path designed for independent merchants without technical setup overhead."
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  num: "01",
                  title: pick("احجز رابط متجرك واختر القالب", "Reserve Your Slug & Brand Theme"),
                  desc: pick(
                    "سجّل متجرك بالرابط الخاص بك، اختر أحد القوالب الاحترافية الثلاثة، وحدد الألوان والخطوط التي تعبّر عن علامتك.",
                    "Claim your dedicated storefront slug, pick from curated design presets, and configure brand colors and typography."
                  ),
                },
                {
                  num: "02",
                  title: pick("أضف منتجاتك والمخزون والشحن", "Add Catalog, Variants & Shipping"),
                  desc: pick(
                    "ارفع منتجاتك بمقاسات وألوان وأسعار مستقلة، فعّل مناطق الشحن، وحدد طرق الدفع مثل الدفع عند الاستلام والتحويل البنكي.",
                    "Create multi-variant products with SKU stock tracking, configure shipping zones, and enable COD or bank transfers."
                  ),
                },
                {
                  num: "03",
                  title: pick("انشر المتجر وأدر طلباتك فورياً", "Publish Live & Fulfill Orders"),
                  desc: pick(
                    "شارك رابط متجرك مع عملائك، وتابع كل طلب عبر 9 مراحل تشغيلية مع فواتير جاهزة للطباعة وتنبيهات المخزون.",
                    "Share your storefront link, track every order through a 9-stage fulfillment timeline, print invoices, and monitor low stock."
                  ),
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="border border-border rounded-xl bg-card p-6 space-y-3"
                >
                  <span className="text-sm font-mono font-bold text-primary tabular-nums">
                    {step.num}.
                  </span>
                  <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Asymmetric Bento Capabilities & Three Platform Pillars */}
        <section id="capabilities" className="py-16 lg:py-20 border-b border-border bg-secondary/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {pick(
                  "ثلاث تجارب مصممة لكل دور داخل المنصة",
                  "Three Purpose-Built Product Experiences"
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                {pick(
                  "تجربة مخصصة للمشرف العام، وأخرى لصاحب المتجر، ومتجراً مستقلاً بالكامل للمشتري بصلاحيات وجلسات منفصلة.",
                  "Dedicated layouts, role-based permissions, and isolated sessions for Platform Super Admins, Store Owners, and End Customers."
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Marquee Bento Card (col-span-7) */}
              <div className="lg:col-span-7 border border-border rounded-2xl bg-card p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Store className="w-5 h-5" />
                    <span className="text-xs font-semibold">
                      {pick("01. مساحة عمل التاجر", "01. Merchant Operations")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {pick(
                      "لوحة التاجر ومصمم المتجر المرئي المباشر",
                      "Merchant Dashboard & Live Visual Store Builder"
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pick(
                      "إدارة شاملة للمنتجات والمتغيرات والمخزون وسجل حركات التعديل، 9 حالات للطلبات مع فواتير قابلة للطباعة، كوبونات خصم، إدارة فريق العمل بالصلاحيات، وتخصيص كامل لتصميم المتجر.",
                      "Complete control over multi-variant catalogs, nested categories, inventory adjustment ledgers, 9-stage order lifecycle with printable invoices, coupons, staff RBAC, and no-code visual theming."
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border">
                  {[
                    { icon: Palette, label: pick("مصمم مرئي", "Theme Studio") },
                    { icon: BarChart3, label: pick("تحليلات وتقارير", "Sales Reports") },
                    { icon: SlidersHorizontal, label: pick("سجل المخزون", "Stock Ledger") },
                    { icon: Globe, label: pick("عربي وإنجليزي", "RTL & LTR") },
                  ].map((feat) => {
                    const Icon = feat.icon
                    return (
                      <div key={feat.label} className="flex items-center gap-2 text-xs font-medium text-foreground">
                        <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{feat.label}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <Link
                    href="/merchant/login"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    <span>{pick("دخول لوحة التاجر", "Open Merchant Portal")}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/dashboard/store-design"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <span>{pick("معاينة مصمم المتجر", "Preview Store Builder")}</span>
                  </Link>
                </div>
              </div>

              {/* Stacked Secondary Pillars (col-span-5) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="flex-1 border border-border rounded-2xl bg-card p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-primary">
                      <Layers className="w-5 h-5" />
                      <span className="text-xs font-semibold">
                        {pick("02. واجهة المشتري", "02. Customer Storefront")}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {pick("تجربة تسوق مستقلة وسريعة لعملائك", "Branded Customer Storefront")}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {pick(
                        "أقسام ديناميكية، بحث وتصفية متقدمة، معاينة سريعة، سلة جانبية، إتمام طلب من 6 خطوات وحساب عميل معزول.",
                        "Theme-driven homepages, filtered catalogs, category hubs, quick view, slide-over bag, 6-step checkout, and store-scoped customer accounts."
                      )}
                    </p>
                  </div>
                  <Link
                    href="/s/nova-atelier"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>{pick("تصفح متجر NOVA", "Explore NOVA Storefront")}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="flex-1 border border-border rounded-2xl bg-card p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-primary">
                      <ShieldCheck className="w-5 h-5" />
                      <span className="text-xs font-semibold">
                        {pick("03. إدارة المنصة", "03. Super Admin Governance")}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {pick("لوحة المشرف العام (Super Admin)", "Platform Super Admin Console")}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {pick(
                        "تحكم كامل بالتجار والمتاجر والباقات والاشتراكات وإجمالي المبيعات GMV وتذاكر الدعم الفني وإعلانات المنصة.",
                        "Manage merchants, published/suspended stores, plans, MRR/GMV analytics, support queues, and global announcements."
                      )}
                    </p>
                  </div>
                  <Link
                    href="/admin/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>{pick("دخول لوحة المشرف العام", "Open Admin Portal")}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 lg:py-20 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {pick("باقات واضحة تنمو مع علامتك", "Transparent Plans Built to Scale")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {pick(
                    "ابدأ مجاناً وترقّى في أي وقت بدون عمولات خفية على المبيعات.",
                    "Start free and upgrade anytime with zero hidden transaction commissions."
                  )}
                </p>
              </div>
              <div className="inline-flex items-center p-1 bg-muted rounded-lg border border-border self-start">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
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
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-foreground">
                              {pick(plan.nameAr, plan.nameEn)}
                            </h3>
                            {isFeatured && (
                              <span className="text-[11px] font-semibold text-primary">
                                {pick("الأكثر اختياراً", "Most Popular")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {pick(plan.descriptionAr, plan.descriptionEn)}
                          </p>
                        </div>

                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold font-mono tabular-nums text-foreground">
                            {price === 0
                              ? pick("مجاناً", "Free")
                              : formatCurrency(price, plan.currency)}
                          </span>
                          {price > 0 && (
                            <span className="text-xs text-muted-foreground">
                              / {billingCycle === "monthly" ? pick("شهر", "mo") : pick("سنة", "yr")}
                            </span>
                          )}
                        </div>

                        {/* Concrete Plan Specs */}
                        <div className="text-xs text-muted-foreground flex items-center gap-2 tabular-nums">
                          <span>
                            {plan.productLimit === null
                              ? pick("منتجات غير محدودة", "Unlimited products")
                              : pick(`حتى ${plan.productLimit} منتج`, `Up to ${plan.productLimit} products`)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {pick(`${plan.staffLimit} عضو فريق`, `${plan.staffLimit} staff`)}
                          </span>
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
                        href={`/merchant/register?plan=${encodeURIComponent(plan.id)}`}
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

        {/* FAQ Section */}
        <section id="faq" className="py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {pick("الأسئلة الشائعة", "Frequently Asked Questions")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {pick(
                  "إجابات مباشرة حول تشغيل متجرك وإدارة المنصة.",
                  "Straightforward answers on launching storefronts and operating the platform."
                )}
              </p>
            </div>

            <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
              {faqs.map((item, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full px-5 py-4 flex items-center justify-between gap-4 text-start hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-semibold text-foreground">{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-3 text-foreground font-bold">
            <Logo size="sm" href="/" />
            <span className="text-muted-foreground font-medium">
              © 2026 {pick("متجرك", "Matgarak SaaS")}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/merchant/login" className="hover:text-foreground transition-colors">
              {t.nav.merchantPortal}
            </Link>
            <Link href="/admin/login" className="hover:text-foreground transition-colors">
              {t.nav.adminPortal}
            </Link>
            <Link href="/s/nova-atelier" className="hover:text-foreground transition-colors">
              NOVA Storefront
            </Link>
            <Link href="/about" className="hover:text-foreground transition-colors">
              {pick("عن متجرك", "About")}
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              {pick("تواصل معنا", "Contact")}
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
