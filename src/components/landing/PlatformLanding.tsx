"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useI18n } from "@/components/providers/LanguageProvider"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
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
  Truck,
  Tag,
  Check,
  ExternalLink,
  Menu,
  X,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shirt,
  Ruler,
  Lock,
} from "lucide-react"

export function PlatformLanding() {
  const { dir, pick, t, formatCurrency } = useI18n()
  const stores = usePlatformStore((s) => s.stores)
  const products = usePlatformStore((s) => s.products)
  const plans = usePlatformStore((s) => s.plans)

  const [slugInput, setSlugInput] = useState("")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight

  const showcaseStore = useMemo(
    () => stores.find((s) => s.slug === "menz-club") ?? stores[0],
    [stores]
  )

  const showcaseProducts = useMemo(() => {
    if (!showcaseStore) return []
    return scopeByTenant(products, showcaseStore.id).filter((p) => p.status === "active")
  }, [products, showcaseStore])

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
          "هل المنصة مخصصة لمحلات وبراندات الملابس والأزياء فقط؟",
          "Is Matgarak built specifically for clothing & fashion brands?"
        ),
        a: pick(
          "نعم، كل تفصيلة في متجرك مصممة لتجارة الملابس: جدول المقاسات والألوان مع مخزون منفصل لكل مقاس، قوالب أزياء تحريرية، شحن المحافظات والدفع عند الاستلام، وسياسات استبدال المقاسات.",
          "Yes. Every workflow is crafted for apparel commerce: size/color variant matrices with per-size stock tracking, editorial fashion templates, Cash on Delivery, and easy size exchanges."
        ),
      },
      {
        q: pick(
          "كيف أحصل على رابط متجري بعد التسجيل؟",
          "How do I get my live store link after signing up?"
        ),
        a: pick(
          "بمجرد إنشاء حسابك واختيار اسم البراند، يظهر لك رابط متجرك المستقل (/s/your-brand) فوراً في أعلى صفحة الإعداد ولوحة التحكم مع زر نسخ سريع ومشاركة مباشرة عبر واتساب وإنستجرام.",
          "Immediately after registering your brand name, your dedicated store URL (/s/your-brand) appears at the top of Onboarding and your Dashboard with one-click Copy and WhatsApp Share buttons."
        ),
      },
      {
        q: pick(
          "هل تأخذ منصة متجرك عمولة على مبيعات الملابس؟",
          "Does Matgarak charge sales commissions?"
        ),
        a: pick(
          "لا، تحتفظ بـ 100% من أرباح مبيعاتك. يمكنك البدء على باقة الانطلاق المجانية والترقية فقط عندما يكبر كتالوج براندك وفريق عملك.",
          "Never. You keep 100% of your revenue. Launch free on Starter and upgrade only when your clothing catalog and team grow."
        ),
      },
      {
        q: pick(
          "هل يمكنني تجربة حساب تاجر ملابس كامل قبل التسجيل؟",
          "Can I explore a complete demo fashion store before creating my own?"
        ),
        a: pick(
          "بالتأكيد! جهّزنا لك متجر Men’z Club كحساب توضيحي شامل بمنتجات ملابس حقيقية ومقاسات وألوان وطلبات ومساعد ذكي (AI Copilot). يمكنك تصفح المتجر (/s/menz-club) أو دخول لوحة التحكم بضغطة واحدة من صفحة الدخول.",
          "Absolutely. Men’z Club is a complete showcase fashion store with real apparel products, sizes, colors, orders, and an AI Store Copilot. Visit /s/menz-club or sign into its dashboard in one click."
        ),
      },
    ],
    [pick]
  )

  const fashionCapabilities = [
    {
      icon: Ruler,
      title: pick("مصفوفة المقاسات والألوان الذكية", "Size & Color Stock Matrix"),
      desc: pick(
        "أضف مقاسات XS حتى XXL والألوان المختلفة لكل قطعة مع تتبع دقيق للمخزون وتنبيه تلقائي عند قرب نفاد أي مقاس.",
        "Manage XS–XXL sizes and colorways per garment with real-time per-variant stock deduction and low-stock alerts."
      ),
    },
    {
      icon: Palette,
      title: pick("قوالب أزياء تحريرية بدون كود", "Editorial Fashion Templates"),
      desc: pick(
        "اختر بين أتيليه مينيمال، بوتيك العبايات الناعم، أو ستريت وير عصري وخصص الألوان والأقسام مع معاينة حية للموبايل.",
        "Switch between Minimal Atelier, Soft Boutique, and Urban Streetwear layouts with live mobile and desktop preview."
      ),
    },
    {
      icon: Truck,
      title: pick("شحن المحافظات والدفع عند الاستلام", "Governorate Shipping & COD"),
      desc: pick(
        "حدد تكلفة الشحن وحد الشحن المجاني، وفعّل الدفع عند الاستلام أو التحويل البنكي وإنستاباي بمرونة كاملة.",
        "Configure regional delivery fees, free-shipping thresholds, Cash on Delivery, and direct bank transfers."
      ),
    },
    {
      icon: Tag,
      title: pick("كوبونات المواسم والإصدارات الجديدة", "Seasonal Drops & Coupons"),
      desc: pick(
        "أطلق أكواد خصم للمؤثرين والمواسم (نسبة مئوية، مبلغ ثابت، أو شحن مجاني) وتابع أداء كل حملة بدقة.",
        "Run influencer promo codes, percentage or fixed discounts, and free-shipping campaigns with real conversion tracking."
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          <Logo size="md" href="/" priority />

          <nav
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-muted-foreground"
            aria-label={pick("التنقل الرئيسي", "Primary Navigation")}
          >
            <a
              href="#showcase"
              className="hover:text-foreground transition-colors whitespace-nowrap"
            >
              {pick("المتجر التوضيحي", "Showcase Store")}
            </a>
            <a
              href="#capabilities"
              className="hover:text-foreground transition-colors whitespace-nowrap"
            >
              {pick("مميزات براندات الملابس", "Apparel Features")}
            </a>
            <a
              href="#workflow"
              className="hover:text-foreground transition-colors whitespace-nowrap"
            >
              {pick("كيف تبدأ", "How It Works")}
            </a>
            <a
              href="#pricing"
              className="hover:text-foreground transition-colors whitespace-nowrap"
            >
              {t.nav.pricing}
            </a>
            <a
              href="#faq"
              className="hover:text-foreground transition-colors whitespace-nowrap"
            >
              {pick("الأسئلة الشائعة", "FAQ")}
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <LanguageSwitcher compact />
              <ThemeToggle />
            </div>
            <Link
              href="/merchant/login"
              className="hidden sm:inline-flex items-center justify-center h-9 px-3.5 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              {pick("تسجيل الدخول", "Sign In")}
            </Link>
            <Link
              href="/merchant/register"
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <span>{pick("أنشئ متجر ملابسك", "Launch Store")}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label={pick("القائمة", "Toggle menu")}
              className="lg:hidden w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-b border-border bg-card px-4 py-4 space-y-3 shadow-xl">
            <nav className="flex flex-col gap-1 text-sm font-medium">
              <a
                href="#showcase"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-muted"
              >
                {pick("المتجر التوضيحي Men’z Club", "Men’z Club Showcase")}
              </a>
              <a
                href="#capabilities"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-muted"
              >
                {pick("مميزات براندات الملابس", "Apparel Features")}
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-muted"
              >
                {t.nav.pricing}
              </a>
              <Link
                href="/merchant/login"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-muted"
              >
                {pick("تسجيل دخول التجار", "Merchant Sign In")}
              </Link>
              <Link
                href="/admin/login"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground"
              >
                {pick("بوابة المشرف العام", "Platform Admin")}
              </Link>
            </nav>
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Editorial Hero Section */}
        <section className="relative border-b border-border overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left / Start Editorial Copy */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  <Shirt className="w-4 h-4" />
                  <span>
                    {pick(
                      "منصة متخصصة لمتاجر وبراندات الملابس والأزياء",
                      "Built Exclusively for Clothing & Fashion Brands"
                    )}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold leading-[1.14] tracking-tight text-foreground">
                  {pick(
                    "أطلق متجر ملابسك المستقل بتصميم يليق ببراندك",
                    "Launch an Independent Clothing Store Worthy of Your Label"
                  )}
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                  {pick(
                    "منصة واحدة لإطلاق براند الأزياء الخاص بك برابط مستقل، إدارة المقاسات والألوان والمخزون لكل مقاس، قوالب فاشون احترافية، وشحن لجميع المحافظات بدون أي عمولة على مبيعاتك.",
                    "Everything a modern clothing label needs: your own storefront URL, per-size & color inventory, editorial fashion themes, and Cash on Delivery — with 0% sales commission."
                  )}
                </p>

                {/* Live Slug Reservation Bar */}
                <div className="max-w-lg space-y-2.5 pt-1">
                  <div className="flex flex-col sm:flex-row gap-2.5 p-1.5 rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex-1 flex items-center dir-ltr px-2.5 min-h-[42px]">
                      <span className="text-xs font-mono text-muted-foreground select-none">
                        {(process.env.NEXT_PUBLIC_APP_URL || "http://187.126.0.23:3002")
                          .replace(/^https?:\/\//i, "")
                          .replace(/\/+$/, "")}
                        /s/
                      </span>
                      <input
                        type="text"
                        value={slugInput}
                        onChange={(e) =>
                          setSlugInput(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))
                        }
                        placeholder="your-fashion-brand"
                        aria-label={pick("رابط متجر ملابسك", "Your clothing store URL slug")}
                        className="flex-1 bg-transparent text-sm font-mono font-semibold text-foreground placeholder:text-muted-foreground/60 focus:outline-none px-1"
                      />
                    </div>
                    <Link
                      href={
                        slugInput.trim()
                          ? `/merchant/register?slug=${encodeURIComponent(slugInput.trim().toLowerCase())}`
                          : "/merchant/register"
                      }
                      className="h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shrink-0"
                    >
                      <span>{pick("احجز رابط متجرك", "Reserve Store Link")}</span>
                      <ArrowIcon className="w-4 h-4" />
                    </Link>
                  </div>

                  {slugStatus && (
                    <div
                      className={`flex items-center gap-1.5 text-xs font-medium px-1 ${
                        slugStatus.ok
                          ? "text-emerald-600 dark:text-emerald-400"
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

                {/* Secondary CTAs & Key Facts */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {pick("0% عمولة على المبيعات", "0% Sales Commission")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {pick("رابط متجر فوري بعد التسجيل", "Instant Live Store URL")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {pick("عربي RTL وإنجليزي LTR", "Bilingual AR / EN")}
                  </span>
                </div>
              </div>

              {/* Right / End Editorial Fashion Studio Visual */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-2xl">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src="/images/fashion-hero-editorial.jpg"
                      alt={pick(
                        "استوديو أزياء متجرك لبراندات الملابس",
                        "Matgarak editorial clothing brand studio"
                      )}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                    {/* Live Showcase Overlay Card */}
                    <div className="absolute bottom-4 inset-x-4 sm:bottom-5 sm:inset-x-5 rounded-xl border border-white/15 bg-black/65 backdrop-blur-md p-4 text-white flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                          {pick("نموذج حي لمتجر ملابس على المنصة", "Live Fashion Store Showcase")}
                        </p>
                        <p className="text-base font-bold truncate mt-0.5">
                          {pick("Men’z Club — مينز كلوب", "Men’z Club")}
                        </p>
                        <p className="text-xs text-white/75 font-mono dir-ltr text-start">
                          /s/menz-club
                        </p>
                      </div>
                      <Link
                        href="/s/menz-club"
                        className="h-9 px-4 rounded-lg bg-white text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-amber-50 transition-colors shrink-0"
                      >
                        <span>{pick("تصفح المتجر", "Visit Store")}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Workspace Navigation Strip */}
            <div className="mt-12 pt-6 border-t border-border/80 flex flex-wrap items-center justify-between gap-4 text-xs">
              <span className="font-semibold text-muted-foreground">
                {pick("وصول مباشر لبوابات المنصة:", "Direct Platform Portals:")}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/s/menz-club"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:border-primary/60 text-foreground font-semibold transition-colors"
                >
                  <Store className="w-3.5 h-3.5 text-primary" />
                  <span>{pick("متجر Men’z Club الحي", "Live Men’z Club Store")}</span>
                </Link>
                <Link
                  href="/merchant/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:border-primary/60 text-foreground font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>{pick("بوابة التاجر وحساب Men’z Club", "Merchant Portal & Demo")}</span>
                </Link>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:border-primary/60 text-muted-foreground hover:text-foreground font-semibold transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{pick("لوحة المشرف العام (Admin)", "Super Admin Portal")}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Flagship Complete Showcase Store (NOVA Atelier) */}
        <section id="showcase" className="py-16 lg:py-24 border-b border-border bg-secondary/35">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary mb-2">
                {pick("حساب توضيحي شامل وجاهز للتجربة", "Complete Interactive Fashion Showcase")}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {pick(
                  "شاهد كيف يبدو متجر ملابسك بالكامل قبل أن تبدأ",
                  "Experience a Complete Clothing Brand Storefront & Dashboard"
                )}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-2.5 leading-relaxed">
                {pick(
                  "متجر Men’z Club هو حساب توضيحي متكامل يضم كتالوج ملابس بمقاسات وألوان حقيقية، سلة مشتريات، أكواد خصم فعّالة، ومساعد ذكي (AI Copilot) يدير المتجر بالكامل.",
                  "Men’z Club is a full-featured showcase store with real apparel variants, active promo codes, checkout flow, and an AI Store Copilot."
                )}
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-stretch bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              {/* Showcase Visual */}
              <div className="lg:col-span-6 relative min-h-[280px] sm:min-h-[360px]">
                <Image
                  src="/images/nova-store-hero.jpg"
                  alt="Men’z Club Clothing Lookbook"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-5 inset-x-5 flex items-center justify-between text-white">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
                      {pick("تشكيلة خريف وشتاء 2026", "Autumn / Winter 2026")}
                    </p>
                    <p className="text-xl font-bold mt-0.5">
                      {pick("Men’z Club — مينز كلوب", "Men’z Club")}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-white/15 backdrop-blur text-xs font-mono dir-ltr">
                    /s/menz-club
                  </span>
                </div>
              </div>

              {/* Showcase Details & Credentials */}
              <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
                      <p className="text-xl font-extrabold tabular-nums">
                        {showcaseProducts.length || 6}+
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pick("قطعة ملابس بمقاسات", "Apparel SKUs")}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
                      <p className="text-xl font-extrabold font-mono">MENZ10</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pick("كود خصم فعّال 10%", "Live 10% Coupon")}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
                      <p className="text-xl font-extrabold">AI + AR</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pick("مساعد ذكي + ثنائي اللغة", "AI Copilot & AR/EN")}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        {pick(
                          "أقسام ملابس جاهزة: ملابس رجالي، أزياء نسائي، معاطف وجواكت، وإكسسوارات.",
                          "Ready clothing categories: Menswear, Womenswear, Outerwear, and Accessories."
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        {pick(
                          "مساعد ذكي لصاحب المتجر (Python + Groq Streaming) لإدارة المنتجات والخصومات والطلبات بالمحادثة.",
                          "Built-in Merchant AI Copilot (Python + Groq Streaming) to manage products, promos, and orders via chat."
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        {pick(
                          "لوحة تحكم كاملة بالتاجر + مصمم متجر مباشر + تقارير مبيعات ومخزون.",
                          "Complete merchant dashboard, live Visual Store Builder, orders, and inventory."
                        )}
                      </span>
                    </li>
                  </ul>

                  {/* Clean Demo Credentials Box */}
                  <div className="p-4 rounded-xl bg-muted/50 border border-border flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-primary" />
                        <span>{pick("بيانات دخول حساب Men’z Club التوضيحي", "Men’z Club Demo Credentials")}</span>
                      </p>
                      <p className="text-xs font-mono text-muted-foreground dir-ltr text-start">
                        karim@menz-club.com · menz123
                      </p>
                    </div>
                    <Link
                      href="/merchant/login"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {pick("دخول بضغطة واحدة", "One-click login")}
                    </Link>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/s/menz-club"
                    className="flex-1 min-w-[180px] h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <span>{pick("تصفح متجر Men’z Club", "Browse Men’z Club Store")}</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/merchant/login"
                    className="flex-1 min-w-[180px] h-11 px-5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>{pick("افتح لوحة التحكم والمساعد الذكي", "Open Dashboard & AI Copilot")}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fashion-Specific Capabilities */}
        <section id="capabilities" className="py-16 lg:py-24 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary mb-2">
                {pick("مصمم خصيصاً لصناعة الملابس", "Purpose-Built for Apparel")}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {pick(
                  "كل أدوات إدارة براند الملابس في لوحة واحدة",
                  "Every Tool Your Clothing Brand Needs in One Workspace"
                )}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {fashionCapabilities.map((item, idx) => {
                const Icon = item.icon
                return (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between gap-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 3-Step Workflow */}
        <section id="workflow" className="py-16 lg:py-24 border-b border-border bg-secondary/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary mb-2">
                {pick("من التسجيل إلى أول طلب في دقائق", "From Signup to First Order")}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {pick("3 خطوات بسيطة لإطلاق متجر ملابسك", "3 Simple Steps to Go Live")}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  num: "01",
                  title: pick("سجّل واحصل على رابط متجرك فوراً", "Sign Up & Claim Your Store Link"),
                  desc: pick(
                    "أدخل اسم براند الملابس واختر الرابط الخاص بك (/s/your-brand) وسيظهر لك جاهزاً للنسخ والمشاركة فور التسجيل.",
                    "Pick your brand slug (/s/your-brand) and get your live shareable storefront URL immediately after signing up."
                  ),
                },
                {
                  num: "02",
                  title: pick("اختر قالب الأزياء وأضف المقاسات", "Pick a Fashion Theme & Add Sizes"),
                  desc: pick(
                    "خصّص الألوان والشعار وأقسام الصفحة الرئيسية وأضف قطع الملابس بمقاساتها وألوانها ومخزون كل مقاس.",
                    "Customize colors, typography, and lookbook sections, then upload apparel items with size/color inventory."
                  ),
                },
                {
                  num: "03",
                  title: pick("شارك الرابط واستقبل الطلبات", "Share & Start Selling"),
                  desc: pick(
                    "ضع رابط متجرك في بايو إنستجرام وتيك توك وواتساب، وتابع كل طلب من التأكيد حتى الشحن والتسليم.",
                    "Drop your store URL into Instagram bio, TikTok, or WhatsApp and track every order from pending to delivered."
                  ),
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="bg-card border border-border rounded-2xl p-6 space-y-3"
                >
                  <span className="font-mono text-2xl font-extrabold text-primary">
                    {step.num}
                  </span>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 lg:py-24 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary mb-2">
                  {pick("خطط واضحة بدون عمولة بيع", "Transparent Plans · 0% Commission")}
                </p>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  {pick("ابدأ مجاناً وتوسّع مع نمو براندك", "Start Free, Scale With Your Label")}
                </h2>
              </div>

              <div className="inline-flex items-center p-1 rounded-xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    billingCycle === "monthly"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {pick("شهري", "Monthly")}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    billingCycle === "yearly"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {pick("سنوي (وفّر شهرين)", "Yearly (2 Months Free)")}
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, idx) => {
                const highlighted = idx === 1
                const price =
                  billingCycle === "monthly"
                    ? plan.monthlyPrice
                    : Math.round(plan.yearlyPrice / 12)
                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between border ${
                      highlighted
                        ? "border-primary bg-card ring-1 ring-primary/30 shadow-lg"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-bold">{pick(plan.nameAr, plan.nameEn)}</h3>
                        {highlighted && (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                            {pick("الأكثر اختياراً", "Most Popular")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {pick(plan.descriptionAr, plan.descriptionEn)}
                      </p>
                      <div className="pt-2">
                        <span className="text-3xl font-extrabold tabular-nums">
                          {price === 0
                            ? pick("مجاناً", "Free")
                            : formatCurrency(price, plan.currency)}
                        </span>
                        {price > 0 && (
                          <span className="text-xs text-muted-foreground ms-1.5">
                            / {pick("شهرياً", "month")}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-2.5 pt-4 border-t border-border text-sm">
                        {(dir === "rtl" ? plan.featuresAr : plan.featuresEn).map((feat, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground">
                            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      href="/merchant/register"
                      className={`mt-6 h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                        highlighted
                          ? "bg-primary text-primary-foreground hover:opacity-90"
                          : "border border-border bg-background hover:bg-muted text-foreground"
                      }`}
                    >
                      <span>{pick("ابدأ بهذه الباقة", "Start with this plan")}</span>
                      <ArrowIcon className="w-4 h-4" />
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 lg:py-24 border-b border-border bg-secondary/25">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary mb-2">
                {pick("إجابات واضحة", "Common Questions")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {pick("الأسئلة الشائعة لبراندات الملابس", "Frequently Asked Questions")}
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((item, idx) => {
                const open = openFaq === idx
                return (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : idx)}
                      className="w-full px-5 py-4 text-start flex items-center justify-between gap-4 font-semibold text-sm hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {open && (
                      <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 lg:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {pick(
                    "جاهز لإطلاق متجر ملابسك المستقل اليوم؟",
                    "Ready to Launch Your Clothing Store Today?"
                  )}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {pick(
                    "سجّل مجاناً، احصل على رابط متجرك فوراً، أو استكشف حساب Men’z Club التوضيحي الكامل مع المساعد الذكي.",
                    "Create your free account, claim your storefront URL immediately, or explore the full Men’z Club showcase."
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <Link
                  href="/merchant/register"
                  className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <span>{pick("ابدأ متجرك مجاناً", "Create Your Store")}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Link>
                <Link
                  href="/s/menz-club"
                  className="h-11 px-5 rounded-xl border border-border bg-background hover:bg-muted text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <Layers className="w-4 h-4 text-primary" />
                  <span>{pick("معاينة متجر Men’z Club", "Preview Men’z Club")}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Logo size="sm" href="/" />
            <p className="text-xs text-muted-foreground max-w-xs">
              {pick(
                "منصة متجرك المتخصصة لإطلاق وإدارة متاجر وبراندات الملابس والأزياء في العالم العربي.",
                "Matgarak — The dedicated e-commerce platform for independent clothing and fashion brands."
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
            <Link href="/about" className="hover:text-foreground">
              {pick("عن المنصة", "About")}
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              {pick("تواصل معنا", "Contact")}
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              {pick("الخصوصية", "Privacy")}
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              {pick("الشروط", "Terms")}
            </Link>
            <Link href="/merchant/login" className="hover:text-foreground">
              {pick("دخول التجار", "Merchant Login")}
            </Link>
            <Link href="/admin/login" className="hover:text-foreground">
              {pick("المشرف العام", "Platform Admin")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
