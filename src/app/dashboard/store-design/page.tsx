"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  Palette,
  LayoutTemplate,
  Layers,
  Navigation,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Rocket,
  Save,
  ExternalLink,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { STORE_THEME_PRESETS } from "@/lib/themes/presets"
import { StorefrontHomeRenderer } from "@/components/storefront/StorefrontHomeRenderer"
import { StatusText } from "@/components/common/StatusText"
import type { StoreTheme } from "@/types/saas"

type InspectorTab = "themes" | "brand" | "sections" | "navigation"
type DeviceFrame = "desktop" | "tablet" | "mobile"

const QUICK_PALETTES = [
  { name: "Alabaster Noir", primary: "#111111", secondary: "#F4F3F0", accent: "#B45309", bg: "#FFFFFF", text: "#111111" },
  { name: "Rose Espresso", primary: "#4A2C2A", secondary: "#F5ECE8", accent: "#B86B52", bg: "#FBF8F5", text: "#2B1E1C" },
  { name: "Cobalt Tech", primary: "#0F4C81", secondary: "#EEF2F7", accent: "#0EA5E9", bg: "#F8FAFC", text: "#0F172A" },
  { name: "Forest Atelier", primary: "#14532D", secondary: "#ECFDF5", accent: "#0D9488", bg: "#FAFDFB", text: "#0F172A" },
]

export default function VisualStoreBuilderPage() {
  const { pick } = useI18n()
  const { store, storeProducts, storeCategories } = useActiveMerchantStore()

  const applyThemePresetToDraft = usePlatformStore((s) => s.applyThemePresetToDraft)
  const updateDraftTheme = usePlatformStore((s) => s.updateDraftTheme)
  const toggleDraftSectionVisibility = usePlatformStore((s) => s.toggleDraftSectionVisibility)
  const moveDraftSection = usePlatformStore((s) => s.moveDraftSection)
  const updateDraftSectionContent = usePlatformStore((s) => s.updateDraftSectionContent)
  const publishStoreDesign = usePlatformStore((s) => s.publishStoreDesign)
  const restorePreviousTheme = usePlatformStore((s) => s.restorePreviousTheme)
  const updateStore = usePlatformStore((s) => s.updateStore)

  const [activeTab, setActiveTab] = useState<InspectorTab>("themes")
  const [device, setDevice] = useState<DeviceFrame>("desktop")
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>("sec-hero")
  const [newNavLabelAr, setNewNavLabelAr] = useState("")
  const [newNavLabelEn, setNewNavLabelEn] = useState("")
  const [newNavHref, setNewNavHref] = useState("products")

  const hasUnpublishedChanges = useMemo(() => {
    if (!store) return false
    return (
      JSON.stringify(store.draftTheme) !== JSON.stringify(store.theme) ||
      JSON.stringify(store.draftSections) !== JSON.stringify(store.sections)
    )
  }, [store])

  if (!store) return null

  const sortedDraftSections = [...store.draftSections].sort((a, b) => a.order - b.order)

  const handlePublish = () => {
    publishStoreDesign(store.id)
    toast.success(
      pick(
        "تم نشر تصميم المتجر مباشرة على الرابط العام!",
        "Storefront theme & sections published live!"
      )
    )
  }

  const handleRestore = () => {
    const ok = restorePreviousTheme(store.id)
    if (ok) {
      toast.success(pick("تمت استعادة النسخة السابقة بنجاح", "Previous published theme restored"))
    } else {
      toast.info(pick("لا توجد نسخة سابقة محفوظة للاستعادة", "No previous published version available yet"))
    }
  }

  const handleAddNavLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNavLabelEn.trim() && !newNavLabelAr.trim()) return
    updateStore(store.id, {
      navigationLinks: [
        ...store.navigationLinks,
        {
          id: `nav-${Date.now()}`,
          labelAr: newNavLabelAr.trim() || newNavLabelEn.trim(),
          labelEn: newNavLabelEn.trim() || newNavLabelAr.trim(),
          href: newNavHref.trim(),
        },
      ],
    })
    setNewNavLabelAr("")
    setNewNavLabelEn("")
    toast.success(pick("تمت إضافة الرابط لقائمة المتجر", "Navigation link added"))
  }

  const canvasMaxWidth =
    device === "mobile" ? "390px" : device === "tablet" ? "768px" : "100%"

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-muted/30">
      {/* Builder Top Action Bar */}
      <div className="h-14 border-b border-border bg-card px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-sm font-bold truncate">
            {pick("مصمم المتجر المرئي", "Visual Store Builder")}
          </h1>
          <StatusText
            tone={hasUnpublishedChanges ? "warning" : "success"}
            icon={hasUnpublishedChanges ? "clock" : "check"}
            label={
              hasUnpublishedChanges
                ? pick("مسودة غير منشورة", "Unpublished Draft")
                : pick("متطابق مع المتجر المباشر", "Live & Synced")
            }
          />
        </div>

        {/* Device Viewport Switcher */}
        <div className="hidden md:flex items-center rounded-xl border border-border bg-background p-0.5">
          {(
            [
              { id: "desktop", icon: Monitor, label: pick("كمبيوتر", "Desktop") },
              { id: "tablet", icon: Tablet, label: pick("تابلت", "Tablet") },
              { id: "mobile", icon: Smartphone, label: pick("موبايل", "Mobile") },
            ] as const
          ).map((d) => {
            const Icon = d.icon
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDevice(d.id)}
                title={d.label}
                aria-label={d.label}
                className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  device === d.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">{d.label}</span>
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRestore}
            title={pick("استعادة النسخة السابقة", "Restore Previous")}
            className="h-9 px-3 rounded-xl border border-border text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-muted"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{pick("استعادة", "Restore")}</span>
          </button>
          <button
            type="button"
            onClick={() => toast.success(pick("تم حفظ المسودة تلقائياً", "Draft changes saved"))}
            className="h-9 px-3 rounded-xl border border-border text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-muted"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{pick("حفظ مسودة", "Save Draft")}</span>
          </button>
          <button
            type="button"
            onClick={handlePublish}
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-95"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>{pick("نشر مباشر", "Publish Live")}</span>
          </button>
          <Link
            href={`/s/${store.slug}`}
            className="h-9 w-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted"
            title={pick("فتح المتجر العام", "Open Live Storefront")}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Inspector Panel */}
        <aside className="w-full lg:w-[360px] xl:w-[390px] border-b lg:border-b-0 lg:border-e border-border bg-card flex flex-col shrink-0 max-h-[45vh] lg:max-h-none">
          {/* Inspector Tabs */}
          <div className="grid grid-cols-4 border-b border-border p-1.5 gap-1 shrink-0">
            {(
              [
                { id: "themes", icon: LayoutTemplate, ar: "القوالب", en: "Themes" },
                { id: "brand", icon: Palette, ar: "الهوية", en: "Brand" },
                { id: "sections", icon: Layers, ar: "الأقسام", en: "Sections" },
                { id: "navigation", icon: Navigation, ar: "القوائم", en: "Nav" },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{pick(tab.ar, tab.en)}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Panels */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {activeTab === "themes" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pick(
                    "تبديل القالب يغيّر الهوية البصرية وتخطيط البطاقات فوراً دون فقدان منتجاتك أو أقسامك.",
                    "Switching presets transforms your store's visual identity immediately while keeping all products and categories intact."
                  )}
                </p>
                {STORE_THEME_PRESETS.map((preset) => {
                  const selected = store.draftTheme.presetId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        applyThemePresetToDraft(store.id, preset.id)
                        toast.success(pick(`تم تطبيق قالب ${preset.nameAr}`, `Applied ${preset.nameEn} to draft`))
                      }}
                      className={`w-full text-start p-3.5 rounded-xl border transition-all ${
                        selected
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                          : "border-border hover:border-foreground/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold">{pick(preset.nameAr, preset.nameEn)}</span>
                        <div className="flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full border border-black/15" style={{ backgroundColor: preset.theme.primaryColor }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/15" style={{ backgroundColor: preset.theme.accentColor }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/15" style={{ backgroundColor: preset.theme.backgroundColor }} />
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {pick(preset.descriptionAr, preset.descriptionEn)}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}

            {activeTab === "brand" && (
              <div className="space-y-5">
                {/* Brand Logo Upload & Monogram */}
                <div className="space-y-2.5 pb-3 border-b border-border">
                  <p className="text-xs font-bold">{pick("شعار العلامة التجارية", "Brand Logo & Mark")}</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl border border-border overflow-hidden flex items-center justify-center shrink-0 text-white font-bold text-sm"
                      style={{ backgroundColor: store.draftTheme.primaryColor }}
                    >
                      {store.logoDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={store.logoDataUrl}
                          alt={pick(store.nameAr, store.nameEn)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        store.logoMonogram
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label className="h-8 px-3 rounded-lg border border-border text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:bg-muted">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{pick("رفع شعار", "Upload Logo")}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              if (file.size > 512 * 1024) {
                                toast.error(pick("الحد الأقصى لحجم الشعار 500 كيلوبايت", "Logo file must be under 500KB"))
                                return
                              }
                              const reader = new FileReader()
                              reader.onload = () => {
                                if (typeof reader.result === "string") {
                                  updateStore(store.id, { logoDataUrl: reader.result })
                                  toast.success(pick("تم تحديث شعار المتجر", "Store logo updated"))
                                }
                              }
                              reader.readAsDataURL(file)
                            }}
                          />
                        </label>
                        {store.logoDataUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              updateStore(store.id, { logoDataUrl: undefined })
                              toast.info(pick("تمت إزالة صورة الشعار", "Custom logo removed"))
                            }}
                            className="h-8 px-2.5 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-500/10"
                          >
                            {pick("إزالة", "Remove")}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {pick("حرف الشعار:", "Monogram:")}
                        </span>
                        <input
                          maxLength={3}
                          value={store.logoMonogram}
                          onChange={(e) =>
                            updateStore(store.id, {
                              logoMonogram: e.target.value.toUpperCase() || "S",
                            })
                          }
                          className="w-14 h-7 px-2 rounded-lg border border-border bg-background text-xs font-mono uppercase text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Color Palettes */}
                <div className="space-y-2">
                  <p className="text-xs font-bold">{pick("لوحات ألوان جاهزة", "Quick Color Palettes")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_PALETTES.map((pal) => (
                      <button
                        key={pal.name}
                        type="button"
                        onClick={() =>
                          updateDraftTheme(store.id, {
                            primaryColor: pal.primary,
                            secondaryColor: pal.secondary,
                            accentColor: pal.accent,
                            backgroundColor: pal.bg,
                            textColor: pal.text,
                          })
                        }
                        className="p-2 rounded-xl border border-border hover:border-primary/40 text-start"
                      >
                        <div className="flex gap-1 mb-1">
                          <span className="h-3 flex-1 rounded" style={{ backgroundColor: pal.primary }} />
                          <span className="h-3 flex-1 rounded" style={{ backgroundColor: pal.accent }} />
                          <span className="h-3 flex-1 rounded border border-black/10" style={{ backgroundColor: pal.secondary }} />
                        </div>
                        <span className="text-[11px] font-medium">{pal.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual Color Pickers */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-xs font-bold">{pick("تخصيص الألوان", "Brand Tokens")}</p>
                  {(
                    [
                      { key: "primaryColor", ar: "اللون الأساسي", en: "Primary Color" },
                      { key: "secondaryColor", ar: "اللون الثانوي", en: "Secondary Surface" },
                      { key: "accentColor", ar: "لون التمييز", en: "Accent Color" },
                      { key: "backgroundColor", ar: "لون الخلفية", en: "Page Background" },
                      { key: "textColor", ar: "لون النصوص", en: "Primary Text" },
                    ] as const
                  ).map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-xs">
                      <label>{pick(item.ar, item.en)}</label>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {store.draftTheme[item.key]}
                        </span>
                        <input
                          type="color"
                          value={store.draftTheme[item.key]}
                          onChange={(e) =>
                            updateDraftTheme(store.id, { [item.key]: e.target.value })
                          }
                          className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Typography, Radius, Buttons, Header, Cards */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      {pick("نمط الخطوط", "Typography")}
                    </label>
                    <select
                      value={store.draftTheme.fontFamily}
                      onChange={(e) =>
                        updateDraftTheme(store.id, {
                          fontFamily: e.target.value as StoreTheme["fontFamily"],
                        })
                      }
                      className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
                    >
                      <option value="editorial">Editorial</option>
                      <option value="modern-sans">Modern Sans</option>
                      <option value="technical">Technical Precision</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        {pick("استدارة الحواف", "Corner Radius")}
                      </label>
                      <select
                        value={store.draftTheme.borderRadius}
                        onChange={(e) =>
                          updateDraftTheme(store.id, {
                            borderRadius: e.target.value as StoreTheme["borderRadius"],
                          })
                        }
                        className="w-full h-9 rounded-xl border border-border bg-background px-2.5 text-xs"
                      >
                        <option value="none">Sharp (0px)</option>
                        <option value="sm">Subtle (4px)</option>
                        <option value="md">Balanced (10px)</option>
                        <option value="lg">Soft (16px)</option>
                        <option value="xl">Rounded (24px)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        {pick("شكل الأزرار", "Button Style")}
                      </label>
                      <select
                        value={store.draftTheme.buttonStyle}
                        onChange={(e) =>
                          updateDraftTheme(store.id, {
                            buttonStyle: e.target.value as StoreTheme["buttonStyle"],
                          })
                        }
                        className="w-full h-9 rounded-xl border border-border bg-background px-2.5 text-xs"
                      >
                        <option value="square">Square</option>
                        <option value="rounded">Rounded</option>
                        <option value="pill">Pill</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        {pick("نمط الهيدر", "Header Layout")}
                      </label>
                      <select
                        value={store.draftTheme.headerStyle}
                        onChange={(e) =>
                          updateDraftTheme(store.id, {
                            headerStyle: e.target.value as StoreTheme["headerStyle"],
                          })
                        }
                        className="w-full h-9 rounded-xl border border-border bg-background px-2.5 text-xs"
                      >
                        <option value="minimal">Minimal</option>
                        <option value="centered">Centered Brand</option>
                        <option value="structured">Structured</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        {pick("بطاقة المنتج", "Product Card")}
                      </label>
                      <select
                        value={store.draftTheme.productCardStyle}
                        onChange={(e) =>
                          updateDraftTheme(store.id, {
                            productCardStyle: e.target.value as StoreTheme["productCardStyle"],
                          })
                        }
                        className="w-full h-9 rounded-xl border border-border bg-background px-2.5 text-xs"
                      >
                        <option value="editorial">Editorial</option>
                        <option value="soft-card">Soft Card</option>
                        <option value="spec-grid">Spec Grid</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sections" && (
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground">
                  {pick(
                    "أعد ترتيب أقسام الصفحة الرئيسية، أخفِ أو أظهر أي قسم، وعدّل النصوص مباشرة.",
                    "Reorder, show/hide, and edit copy for every storefront homepage section."
                  )}
                </p>
                {sortedDraftSections.map((sec, idx) => {
                  const isOpen = expandedSectionId === sec.id
                  return (
                    <div
                      key={sec.id}
                      className="rounded-xl border border-border bg-background overflow-hidden"
                    >
                      <div className="p-2.5 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedSectionId(isOpen ? null : sec.id)}
                          className="flex items-center gap-2 text-start min-w-0 flex-1"
                        >
                          {isOpen ? (
                            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="text-xs font-semibold truncate">
                            {sec.type.replace(/_/g, " ")}
                          </span>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveDraftSection(store.id, sec.id, "up")}
                            className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sortedDraftSections.length - 1}
                            onClick={() => moveDraftSection(store.id, sec.id, "down")}
                            className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleDraftSectionVisibility(store.id, sec.id)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              sec.visible
                                ? "text-emerald-600 hover:bg-emerald-500/10"
                                : "text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {sec.visible ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="p-3 border-t border-border bg-muted/20 space-y-2.5 text-xs">
                          <div>
                            <label className="block text-[11px] font-semibold mb-1">
                              {pick("العنوان (عربي)", "Title (Arabic)")}
                            </label>
                            <input
                              value={sec.titleAr}
                              onChange={(e) =>
                                updateDraftSectionContent(store.id, sec.id, {
                                  titleAr: e.target.value,
                                })
                              }
                              className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold mb-1">
                              {pick("العنوان (إنجليزي)", "Title (English)")}
                            </label>
                            <input
                              value={sec.titleEn}
                              onChange={(e) =>
                                updateDraftSectionContent(store.id, sec.id, {
                                  titleEn: e.target.value,
                                })
                              }
                              className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-xs"
                            />
                          </div>
                          {sec.type !== "announcement" && (
                            <>
                              <div>
                                <label className="block text-[11px] font-semibold mb-1">
                                  {pick("النص الفرعي (عربي)", "Subtitle (Arabic)")}
                                </label>
                                <textarea
                                  rows={2}
                                  value={sec.subtitleAr}
                                  onChange={(e) =>
                                    updateDraftSectionContent(store.id, sec.id, {
                                      subtitleAr: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-border bg-background p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold mb-1">
                                  {pick("النص الفرعي (إنجليزي)", "Subtitle (English)")}
                                </label>
                                <textarea
                                  rows={2}
                                  value={sec.subtitleEn}
                                  onChange={(e) =>
                                    updateDraftSectionContent(store.id, sec.id, {
                                      subtitleEn: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-border bg-background p-2 text-xs"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === "navigation" && (
              <div className="space-y-4">
                <p className="text-xs font-bold">{pick("روابط قائمة الهيدر", "Header Navigation Links")}</p>
                <div className="space-y-2">
                  {store.navigationLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border text-xs"
                    >
                      <div>
                        <p className="font-semibold">{pick(link.labelAr, link.labelEn)}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">/{link.href}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateStore(store.id, {
                            navigationLinks: store.navigationLinks.filter((l) => l.id !== link.id),
                          })
                        }
                        className="w-7 h-7 rounded-lg text-rose-600 hover:bg-rose-500/10 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddNavLink} className="space-y-2.5 pt-3 border-t border-border">
                  <input
                    value={newNavLabelAr}
                    onChange={(e) => setNewNavLabelAr(e.target.value)}
                    placeholder={pick("عنوان الرابط (عربي)", "Link Label (AR)")}
                    className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
                  />
                  <input
                    value={newNavLabelEn}
                    onChange={(e) => setNewNavLabelEn(e.target.value)}
                    placeholder={pick("عنوان الرابط (إنجليزي)", "Link Label (EN)")}
                    className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
                  />
                  <input
                    value={newNavHref}
                    onChange={(e) => setNewNavHref(e.target.value)}
                    placeholder="products?sort=newest"
                    className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-mono dir-ltr"
                  />
                  <button
                    type="submit"
                    className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{pick("إضافة رابط", "Add Link")}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </aside>

        {/* Live Storefront Preview Canvas */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start bg-muted/40">
          <div
            className="w-full transition-all duration-300 shadow-xl border border-border rounded-2xl overflow-hidden bg-white"
            style={{ maxWidth: canvasMaxWidth }}
          >
            {/* Browser chrome bar */}
            <div className="h-9 bg-zinc-100 dark:bg-zinc-900 border-b border-border px-3 flex items-center justify-between text-[11px] text-muted-foreground dir-ltr">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              </div>
              <span className="font-mono truncate">https://matgarak.app/s/{store.slug}</span>
              <span className="uppercase font-semibold">{device}</span>
            </div>

            <div className="max-h-[calc(100vh-11rem)] overflow-y-auto">
              <StorefrontHomeRenderer
                store={store}
                theme={store.draftTheme}
                sections={store.draftSections}
                products={storeProducts}
                categories={storeCategories}
                previewMode
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
