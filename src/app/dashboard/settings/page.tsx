"use client"

import React, { useState } from "react"
import { Save, Globe, SearchCheck } from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import type { Locale, StoreStatus, TenantStore } from "@/types/saas"

export default function MerchantSettingsPage() {
  const { pick } = useI18n()
  const { store } = useActiveMerchantStore()
  const updateStore = usePlatformStore((s) => s.updateStore)

  const [nameAr, setNameAr] = useState(store?.nameAr || "")
  const [nameEn, setNameEn] = useState(store?.nameEn || "")
  const [slug, setSlug] = useState(store?.slug || "")
  const [taglineAr, setTaglineAr] = useState(store?.taglineAr || "")
  const [taglineEn, setTaglineEn] = useState(store?.taglineEn || "")
  const [descriptionAr, setDescriptionAr] = useState(store?.descriptionAr || "")
  const [descriptionEn, setDescriptionEn] = useState(store?.descriptionEn || "")
  const [contactEmail, setContactEmail] = useState(store?.contactEmail || "")
  const [contactPhone, setContactPhone] = useState(store?.contactPhone || "")
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp || "")
  const [instagram, setInstagram] = useState(store?.socialLinks.instagram || "")
  const [tiktok, setTiktok] = useState(store?.socialLinks.tiktok || "")
  const [currency, setCurrency] = useState<TenantStore["localization"]["currency"]>(
    store?.localization.currency || "EGP"
  )
  const [primaryLanguage, setPrimaryLanguage] = useState<Locale>(
    store?.localization.primaryLanguage || "ar"
  )
  const [status, setStatus] = useState<StoreStatus>(store?.status || "published")
  const [seoTitleAr, setSeoTitleAr] = useState(store?.seo.titleAr || "")
  const [seoTitleEn, setSeoTitleEn] = useState(store?.seo.titleEn || "")
  const [seoDescEn, setSeoDescEn] = useState(store?.seo.descriptionEn || "")

  if (!store) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateStore(store.id, {
      nameAr: nameAr.trim() || store.nameAr,
      nameEn: nameEn.trim() || store.nameEn,
      slug:
        slug
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-") || store.slug,
      taglineAr,
      taglineEn,
      descriptionAr,
      descriptionEn,
      contactEmail,
      contactPhone,
      whatsapp,
      status: store.status === "suspended" ? "suspended" : status,
      socialLinks: {
        ...store.socialLinks,
        instagram: instagram.trim() || undefined,
        tiktok: tiktok.trim() || undefined,
      },
      localization: {
        ...store.localization,
        primaryLanguage,
        currency,
      },
      seo: {
        ...store.seo,
        titleAr: seoTitleAr,
        titleEn: seoTitleEn,
        descriptionEn: seoDescEn,
      },
    })
    toast.success(pick("تم حفظ إعدادات المتجر بنجاح", "Store settings saved"))
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {pick("إعدادات المتجر", "Store Settings")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pick(
              "تعديل الهوية العامة، بيانات التواصل، اللغة والعملة، وتحسين محركات البحث.",
              "Manage general store identity, contact channels, localization, and SEO metadata."
            )}
          </p>
        </div>
        <button
          type="submit"
          className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{pick("حفظ التغييرات", "Save Changes")}</span>
        </button>
      </div>

      {/* General */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold">{pick("الهوية الأساسية", "General Identity")}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("اسم المتجر (عربي)", "Store Name (AR)")}</label>
            <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("اسم المتجر (إنجليزي)", "Store Name (EN)")}</label>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("رابط المتجر (Slug)", "Storefront Slug")}</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-mono dir-ltr" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("حالة المتجر", "Store Status")}</label>
            <select
              disabled={store.status === "suspended"}
              value={status}
              onChange={(e) => setStatus(e.target.value as StoreStatus)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm disabled:opacity-50"
            >
              <option value="published">{pick("منشور (متاح للعملاء)", "Published (Live)")}</option>
              <option value="draft">{pick("مسودة (مخفي)", "Draft (Hidden)")}</option>
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("الشعار المختصر (عربي)", "Tagline (AR)")}</label>
            <input value={taglineAr} onChange={(e) => setTaglineAr(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("الشعار المختصر (إنجليزي)", "Tagline (EN)")}</label>
            <input value={taglineEn} onChange={(e) => setTaglineEn(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("وصف المتجر (عربي)", "Description (AR)")}</label>
            <textarea rows={2} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("وصف المتجر (إنجليزي)", "Description (EN)")}</label>
            <textarea rows={2} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
          </div>
        </div>
      </div>

      {/* Contact & Localization */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold">{pick("التواصل واللغة والعملة", "Contact & Localization")}</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("البريد", "Contact Email")}</label>
            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm dir-ltr" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("الهاتف", "Phone")}</label>
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm dir-ltr" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">WhatsApp</label>
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm dir-ltr" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Instagram</label>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@brand" className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm dir-ltr" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">TikTok</label>
            <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@brand" className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm dir-ltr" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("اللغة", "Lang")}</label>
              <select value={primaryLanguage} onChange={(e) => setPrimaryLanguage(e.target.value as Locale)} className="w-full h-10 rounded-xl border border-border bg-background px-2 text-xs">
                <option value="ar">AR</option>
                <option value="en">EN</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("العملة", "Currency")}</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as TenantStore["localization"]["currency"])} className="w-full h-10 rounded-xl border border-border bg-background px-2 text-xs">
                <option value="EGP">EGP</option>
                <option value="SAR">SAR</option>
                <option value="AED">AED</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <SearchCheck className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold">{pick("إعدادات SEO للمتجر", "Storefront SEO")}</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("عنوان SEO (عربي)", "SEO Title (AR)")}</label>
            <input value={seoTitleAr} onChange={(e) => setSeoTitleAr(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("عنوان SEO (إنجليزي)", "SEO Title (EN)")}</label>
            <input value={seoTitleEn} onChange={(e) => setSeoTitleEn(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5">{pick("وصف SEO", "Meta Description")}</label>
          <textarea rows={2} value={seoDescEn} onChange={(e) => setSeoDescEn(e.target.value)} className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
        </div>
      </div>
    </form>
  )
}
