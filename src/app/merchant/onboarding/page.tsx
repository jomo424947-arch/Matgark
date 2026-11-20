"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Store,
  Check,
  ArrowRight,
  ArrowLeft,
  Palette,
  Package,
  Truck,
  Sparkles,
  Rocket,
  Globe,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { usePlatformStore } from "@/stores/platformStore"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { STORE_THEME_PRESETS } from "@/lib/themes/presets"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { LiveStoreUrlCard } from "@/components/merchant/LiveStoreUrlCard"
import type { CatalogProduct, Locale, StoreThemePresetId, TenantStore } from "@/types/saas"

const ONBOARDING_STAGES = [
  { id: 1, ar: "هوية المتجر والرابط", en: "Brand & URL" },
  { id: 2, ar: "اللغة والمجال", en: "Language & Niche" },
  { id: 3, ar: "القالب والألوان", en: "Template & Colors" },
  { id: 4, ar: "أول منتج في الكتالوج", en: "First Product" },
  { id: 5, ar: "الشحن والدفع", en: "Shipping & Payment" },
  { id: 6, ar: "المعاينة والنشر", en: "Preview & Publish" },
]

export default function MerchantOnboardingPage() {
  const router = useRouter()
  const { locale, pick, formatCurrency } = useI18n()
  const merchantSession = useAuthStore((s) => s.merchantSession)
  const loginMerchant = useAuthStore((s) => s.loginMerchant)
  const stores = usePlatformStore((s) => s.stores)
  const merchants = usePlatformStore((s) => s.merchants)
  const products = usePlatformStore((s) => s.products)
  const updateStore = usePlatformStore((s) => s.updateStore)
  const applyThemePresetToDraft = usePlatformStore((s) => s.applyThemePresetToDraft)
  const updateDraftTheme = usePlatformStore((s) => s.updateDraftTheme)
  const publishStoreDesign = usePlatformStore((s) => s.publishStoreDesign)
  const createProduct = usePlatformStore((s) => s.createProduct)
  const createCategory = usePlatformStore((s) => s.createCategory)
  const categories = usePlatformStore((s) => s.categories)

  const activeStore = useMemo(() => {
    if (merchantSession) {
      return stores.find((s) => s.id === merchantSession.storeId) ?? stores[0]
    }
    return stores[0]
  }, [merchantSession, stores])

  const [stage, setStage] = useState(1)
  const [nameAr, setNameAr] = useState(activeStore?.nameAr || "")
  const [nameEn, setNameEn] = useState(activeStore?.nameEn || "")
  const [slug, setSlug] = useState(activeStore?.slug || "")
  const [monogram, setMonogram] = useState(activeStore?.logoMonogram || "M")
  const [logoColor, setLogoColor] = useState(activeStore?.logoColor || "#111111")
  const [primaryLang, setPrimaryLang] = useState<Locale>(
    activeStore?.localization.primaryLanguage || "ar"
  )
  const [currency, setCurrency] = useState<TenantStore["localization"]["currency"]>(
    activeStore?.localization.currency || "EGP"
  )
  const [category, setCategory] = useState<TenantStore["category"]>(
    activeStore?.category || "fashion"
  )
  const [selectedPreset, setSelectedPreset] = useState<StoreThemePresetId>(
    activeStore?.draftTheme.presetId || "minimal-fashion"
  )
  const [primaryColor, setPrimaryColor] = useState(
    activeStore?.draftTheme.primaryColor || "#111111"
  )
  const [accentColor, setAccentColor] = useState(
    activeStore?.draftTheme.accentColor || "#B45309"
  )

  // First product optional creator
  const [prodNameAr, setProdNameAr] = useState("")
  const [prodNameEn, setProdNameEn] = useState("")
  const [prodPrice, setProdPrice] = useState("950")
  const [prodStock, setProdStock] = useState("20")
  const [prodCreated, setProdCreated] = useState(false)

  // Shipping & payment
  const [shippingRate, setShippingRate] = useState(
    String(activeStore?.shippingMethods[0]?.rate ?? 65)
  )
  const [freeAbove, setFreeAbove] = useState(
    String(activeStore?.shippingMethods[0]?.freeAbove ?? 1500)
  )
  const [codEnabled, setCodEnabled] = useState(
    activeStore?.paymentConfig.codEnabled ?? true
  )
  const [bankEnabled, setBankEnabled] = useState(
    activeStore?.paymentConfig.bankTransferEnabled ?? true
  )

  const NextIcon = locale === "ar" ? ArrowLeft : ArrowRight
  const PrevIcon = locale === "ar" ? ArrowRight : ArrowLeft

  if (!merchantSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center space-y-4">
          <Store className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-xl font-bold">
            {pick("يلزم تسجيل الدخول كـ تاجر", "Merchant sign-in required")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {pick(
              "سجّل الدخول أو أنشئ حساب تاجر جديد لإكمال خطوات إعداد متجرك.",
              "Sign in or create a merchant account to continue store onboarding."
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href="/merchant/register"
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center"
            >
              {pick("إنشاء متجر جديد", "Create New Store")}
            </Link>
            <button
              type="button"
              onClick={() => {
                const m = merchants[0]
                const s = stores.find((st) => st.merchantId === m.id) ?? stores[0]
                loginMerchant({
                  merchantId: m.id,
                  storeId: s.id,
                  name: m.name,
                  email: m.email,
                  role: "owner",
                })
              }}
              className="h-10 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted"
            >
              {pick("متابعة بحساب NOVA التجريبي", "Continue with NOVA Demo")}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!activeStore) return null

  const storeProducts = products.filter((p) => p.storeId === activeStore.id)

  const saveCurrentStage = () => {
    if (stage === 1) {
      updateStore(activeStore.id, {
        nameAr: nameAr.trim() || activeStore.nameAr,
        nameEn: nameEn.trim() || activeStore.nameEn,
        slug:
          slug
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-") || activeStore.slug,
        logoMonogram: (monogram.trim() || "M").slice(0, 2).toUpperCase(),
        logoColor,
        onboardingStep: Math.max(activeStore.onboardingStep, 4),
      })
    } else if (stage === 2) {
      updateStore(activeStore.id, {
        category,
        localization: {
          ...activeStore.localization,
          primaryLanguage: primaryLang,
          currency,
        },
        onboardingStep: Math.max(activeStore.onboardingStep, 6),
      })
    } else if (stage === 3) {
      updateDraftTheme(activeStore.id, {
        presetId: selectedPreset,
        primaryColor,
        accentColor,
      })
      updateStore(activeStore.id, {
        onboardingStep: Math.max(activeStore.onboardingStep, 8),
      })
    } else if (stage === 4) {
      if ((prodNameAr.trim() || prodNameEn.trim()) && !prodCreated) {
        let catId = categories.find((c) => c.storeId === activeStore.id)?.id
        if (!catId) {
          const createdCat = createCategory({
            storeId: activeStore.id,
            parentId: null,
            nameAr: "التشكيلة الأساسية",
            nameEn: "Core Collection",
            slug: "core-collection",
            descriptionAr: "المنتجات المميزة للمتجر",
            descriptionEn: "Signature store pieces",
            isCollection: true,
            featured: true,
            displayOrder: 0,
            accentColor: primaryColor,
          })
          catId = createdCat.id
        }
        const visualType: CatalogProduct["visualType"] =
          category === "cosmetics"
            ? "serum"
            : category === "electronics"
              ? "headphones"
              : "hoodie"
        const priceNum = Math.max(10, Number(prodPrice) || 950)
        const stockNum = Math.max(1, Number(prodStock) || 20)
        createProduct({
          storeId: activeStore.id,
          categoryId: catId,
          nameAr: prodNameAr.trim() || prodNameEn.trim(),
          nameEn: prodNameEn.trim() || prodNameAr.trim(),
          slug: `item-${Date.now().toString().slice(-4)}`,
          descriptionAr: "منتج مضاف خلال إعداد المتجر جاهز للعرض والبيع الفوري.",
          descriptionEn: "Added during store setup and ready for storefront orders.",
          price: priceNum,
          sku: `${monogram.toUpperCase()}-001`,
          status: "active",
          lowStockThreshold: 5,
          visualType,
          visualPalette: [primaryColor, accentColor],
          galleryTones: [primaryColor, accentColor],
          variants: [
            {
              id: `v-${Date.now()}`,
              sku: `${monogram.toUpperCase()}-001-STD`,
              size: "M",
              color: "Classic",
              colorHex: primaryColor,
              price: priceNum,
              stock: stockNum,
              available: true,
            },
          ],
          specs: [],
          reviews: [],
          featured: true,
          bestSeller: true,
          newArrival: true,
        })
        setProdCreated(true)
        toast.success(pick("تمت إضافة أول منتج إلى متجرك", "First product added to your catalog"))
      }
      updateStore(activeStore.id, {
        onboardingStep: Math.max(activeStore.onboardingStep, 10),
      })
    } else if (stage === 5) {
      const updatedShipping = activeStore.shippingMethods.length
        ? activeStore.shippingMethods.map((m, idx) =>
            idx === 0
              ? {
                  ...m,
                  rate: Math.max(0, Number(shippingRate) || 0),
                  freeAbove: Number(freeAbove) > 0 ? Number(freeAbove) : null,
                }
              : m
          )
        : [
            {
              id: `ship-${Date.now()}`,
              nameAr: "شحن قياسي",
              nameEn: "Standard Delivery",
              type: "flat" as const,
              rate: Math.max(0, Number(shippingRate) || 65),
              freeAbove: Number(freeAbove) > 0 ? Number(freeAbove) : null,
              estimatedDaysAr: "2 - 4 أيام",
              estimatedDaysEn: "2 - 4 days",
              enabled: true,
            },
          ]

      updateStore(activeStore.id, {
        shippingMethods: updatedShipping,
        paymentConfig: {
          ...activeStore.paymentConfig,
          codEnabled,
          bankTransferEnabled: bankEnabled,
        },
        onboardingStep: Math.max(activeStore.onboardingStep, 12),
      })
    }
  }

  const handleNext = () => {
    saveCurrentStage()
    if (stage < ONBOARDING_STAGES.length) {
      setStage((s) => s + 1)
    }
  }

  const handlePublish = () => {
    saveCurrentStage()
    publishStoreDesign(activeStore.id)
    updateStore(activeStore.id, {
      onboardingCompleted: true,
      onboardingStep: 13,
      status: "published",
      visible: true,
    })
    toast.success(
      pick("تهانينا! متجرك الآن منشور وجاهز لاستقبال الطلبات.", "Congratulations! Your store is now live.")
    )
    router.push("/dashboard")
  }

  const handleSaveLater = () => {
    saveCurrentStage()
    toast.info(pick("تم حفظ تقدمك، يمكنك استكمال الإعداد لاحقاً.", "Progress saved. Continue anytime from your dashboard."))
    router.push("/dashboard")
  }

  const progressPercent = Math.round((stage / ONBOARDING_STAGES.length) * 100)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-16 border-b border-border/70 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center"
            style={{ backgroundColor: logoColor }}
          >
            {monogram}
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">
              {pick("إعداد المتجر الموجّه", "Guided Store Onboarding")}
            </p>
            <p className="text-xs text-muted-foreground">
              {pick(`المرحلة ${stage} من ${ONBOARDING_STAGES.length}`, `Stage ${stage} of ${ONBOARDING_STAGES.length}`)} · {progressPercent}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveLater}
            className="h-9 px-3.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors"
          >
            {pick("حفظ والمتابعة لاحقاً", "Save & Continue Later")}
          </button>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Prominent Store URL Banner immediately visible after signup */}
        <LiveStoreUrlCard
          slug={slug || activeStore.slug}
          storeName={pick(nameAr || activeStore.nameAr, nameEn || activeStore.nameEn)}
          status={activeStore.status}
          compact
        />

        {/* Stepper pills */}
        <ol className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {ONBOARDING_STAGES.map((st) => {
            const done = st.id < stage
            const current = st.id === stage
            return (
              <li key={st.id}>
                <button
                  type="button"
                  onClick={() => setStage(st.id)}
                  className={`w-full text-start p-2.5 rounded-xl border text-xs transition-colors ${
                    current
                      ? "border-primary bg-primary/5 font-semibold text-foreground"
                      : done
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {done ? (
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <span className="font-mono text-[11px]">{st.id}.</span>
                    )}
                    <span className="truncate">{pick(st.ar, st.en)}</span>
                  </div>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          {stage === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <Store className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">
                  {pick("هوية المتجر والرابط العام", "Store Identity & Public URL")}
                </h1>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("اسم المتجر (عربي)", "Store Name (Arabic)")}
                  </label>
                  <input
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("اسم المتجر (إنجليزي)", "Store Name (English)")}
                  </label>
                  <input
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("أحرف الشعار", "Logo Monogram")}
                  </label>
                  <input
                    maxLength={2}
                    value={monogram}
                    onChange={(e) => setMonogram(e.target.value.toUpperCase())}
                    className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("لون الشعار", "Logo Accent Color")}
                  </label>
                  <div className="flex items-center gap-2 h-11 px-3 rounded-xl border border-border bg-background">
                    <input
                      type="color"
                      value={logoColor}
                      onChange={(e) => setLogoColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono">{logoColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("رابط المتجر", "Storefront URL")}
                  </label>
                  <div className="flex items-center h-11 rounded-xl border border-border bg-background overflow-hidden dir-ltr">
                    <span className="px-2.5 text-xs text-muted-foreground bg-muted/60 h-full flex items-center font-mono">
                      /s/
                    </span>
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="flex-1 px-2.5 text-sm bg-transparent focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {stage === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">
                  {pick("اللغة الافتراضية والعملة والمجال", "Primary Language, Currency & Niche")}
                </h1>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("لغة المتجر الأساسية", "Primary Store Language")}
                  </label>
                  <select
                    value={primaryLang}
                    onChange={(e) => setPrimaryLang(e.target.value as Locale)}
                    className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm"
                  >
                    <option value="ar">العربية (RTL)</option>
                    <option value="en">English (LTR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("العملة", "Store Currency")}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) =>
                      setCurrency(e.target.value as TenantStore["localization"]["currency"])
                    }
                    className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm"
                  >
                    <option value="EGP">EGP — {pick("جنيه مصري", "Egyptian Pound")}</option>
                    <option value="SAR">SAR — {pick("ريال سعودي", "Saudi Riyal")}</option>
                    <option value="AED">AED — {pick("درهم إماراتي", "UAE Dirham")}</option>
                    <option value="USD">USD — {pick("دولار أمريكي", "US Dollar")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("تخصص متجر الملابس", "Clothing Store Specialty")}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TenantStore["category"])}
                    className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm"
                  >
                    <option value="fashion">{pick("أزياء وملابس (رجالي / نسائي / ستريت وير)", "Fashion & Apparel (Men / Women / Streetwear)")}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {stage === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">
                  {pick("اختر قالب المتجر وألوان العلامة", "Choose Your Store Template & Brand Colors")}
                </h1>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {STORE_THEME_PRESETS.map((preset) => {
                  const active = selectedPreset === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(preset.id)
                        setPrimaryColor(preset.theme.primaryColor)
                        setAccentColor(preset.theme.accentColor)
                        applyThemePresetToDraft(activeStore.id, preset.id)
                      }}
                      className={`text-start p-4 rounded-xl border transition-all ${
                        active
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                          : "border-border hover:border-foreground/30"
                      }`}
                    >
                      <div
                        className="h-20 rounded-lg mb-3 p-3 flex flex-col justify-between border border-black/5"
                        style={{ backgroundColor: preset.theme.backgroundColor }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="h-2.5 w-14 rounded-sm"
                            style={{ backgroundColor: preset.theme.primaryColor }}
                          />
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: preset.theme.accentColor }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-6 rounded"
                              style={{ backgroundColor: preset.theme.secondaryColor }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="font-bold text-sm">{pick(preset.nameAr, preset.nameEn)}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {pick(preset.descriptionAr, preset.descriptionEn)}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("اللون الأساسي للعلامة", "Primary Brand Color")}
                  </label>
                  <div className="flex items-center gap-3 h-11 px-3 rounded-xl border border-border bg-background">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono">{primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("لون التمييز (Accent)", "Accent Color")}
                  </label>
                  <div className="flex items-center gap-3 h-11 px-3 rounded-xl border border-border bg-background">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono">{accentColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {stage === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">
                  {pick("أضف أول منتج إلى متجرك", "Add Your First Product")}
                </h1>
              </div>

              {storeProducts.length > 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  {pick(
                    `يحتوي متجرك حالياً على ${storeProducts.length} منتجاً. يمكنك إضافة منتج جديد أدناه أو الانتقال للخطوة التالية مباشرة.`,
                    `Your store already has ${storeProducts.length} products. Add another below or skip straight to the next step.`
                  )}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("اسم المنتج (عربي)", "Product Name (Arabic)")}
                  </label>
                  <input
                    value={prodNameAr}
                    onChange={(e) => setProdNameAr(e.target.value)}
                    placeholder={pick("مثال: هودي قطن فاخر", "e.g. Heavyweight Cotton Hoodie")}
                    className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("اسم المنتج (إنجليزي)", "Product Name (English)")}
                  </label>
                  <input
                    value={prodNameEn}
                    onChange={(e) => setProdNameEn(e.target.value)}
                    placeholder="Signature Cotton Hoodie"
                    className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("السعر", "Price")} ({currency})
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("الكمية بالمخزون", "Initial Stock")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}

          {stage === 5 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">
                  {pick("إعدادات الشحن وطرق الدفع", "Shipping & Payment Setup")}
                </h1>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("سعر الشحن القياسي", "Standard Shipping Rate")} ({currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={shippingRate}
                    onChange={(e) => setShippingRate(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {pick("شحن مجاني للطلبات فوق", "Free Shipping Above")} ({currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={freeAbove}
                    onChange={(e) => setFreeAbove(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-border cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold">
                      {pick("الدفع عند الاستلام (COD)", "Cash on Delivery (COD)")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pick("الطريقة الأكثر شيوعاً للطلبات المحلية.", "Recommended default payment method for local orders.")}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={codEnabled}
                    onChange={(e) => setCodEnabled(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl border border-border cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold">
                      {pick("التحويل البنكي المباشر", "Direct Bank Transfer")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pick("يمكنك إضافة تفاصيل IBAN لاحقاً من صفحة الدفع.", "Configure IBAN and bank account details later under Payments.")}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={bankEnabled}
                    onChange={(e) => setBankEnabled(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                </label>
              </div>
            </div>
          )}

          {stage === 6 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <Rocket className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">
                  {pick("متجرك جاهز للإطلاق!", "Your Store Is Ready to Launch")}
                </h1>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 bg-muted/40 border border-border rounded-xl p-5 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{pick("اسم المتجر", "Store Name")}</p>
                  <p className="font-bold mt-0.5">{pick(nameAr || nameEn, nameEn || nameAr)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{pick("الرابط المستقل", "Storefront URL")}</p>
                  <p className="font-mono font-semibold mt-0.5 dir-ltr text-start">/s/{slug}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{pick("القالب المختار", "Selected Theme")}</p>
                  <p className="font-semibold mt-0.5">{selectedPreset}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{pick("الشحن القياسي", "Standard Shipping")}</p>
                  <p className="font-semibold mt-0.5 tabular-nums">
                    {formatCurrency(Number(shippingRate) || 0, currency)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/store-design"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>{pick("تخصيص متقدم في مصمم المتجر", "Open Visual Store Builder")}</span>
                </Link>
                <Link
                  href={`/s/${slug}`}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{pick("معاينة المتجر العام", "Preview Storefront")}</span>
                </Link>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="mt-8 pt-5 border-t border-border flex items-center justify-between">
            <button
              type="button"
              disabled={stage === 1}
              onClick={() => setStage((s) => Math.max(1, s - 1))}
              className="h-10 px-4 rounded-xl border border-border text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40 hover:bg-muted transition-colors"
            >
              <PrevIcon className="w-4 h-4" />
              <span>{pick("السابق", "Previous")}</span>
            </button>

            {stage < ONBOARDING_STAGES.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-95"
              >
                <span>{pick("حفظ والمتابعة", "Save & Continue")}</span>
                <NextIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-95"
              >
                <Rocket className="w-4 h-4" />
                <span>{pick("نشر المتجر والانتقال للوحة التحكم", "Publish Store & Go to Dashboard")}</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
