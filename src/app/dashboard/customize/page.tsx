"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { getMerchantDashboardDataAction, updateStoreSettingsAction } from "@/server/actions/store"
import { StorefrontClient, type StorefrontPreviewTheme } from "@/components/store/StorefrontClient"
import type { Product, Store } from "@/types/domain"
import { toast } from "sonner"
import { AlertCircle, ArrowDown, ArrowUp, Eye, ImagePlus, LayoutGrid, Monitor, Palette, Paintbrush, Plus, RotateCcw, Save, Smartphone, Sparkles, Store as StoreIcon, Type, Upload, X } from "lucide-react"

type FontChoice = StorefrontPreviewTheme["fontFamily"]
type SectionKey = keyof StorefrontPreviewTheme["sections"]
type BannerDraft = StorefrontPreviewTheme["banners"][number]
type Draft = {
  storeName: string; description: string; logoUrl: string; faviconUrl: string
  primaryColor: string; secondaryColor: string; fontFamily: FontChoice
  borderStyle: StorefrontPreviewTheme["borderStyle"]
  productLayout: StorefrontPreviewTheme["productLayout"]; mobileColumns: 1 | 2
  announcementText: string; promoText: string; promoCards: StorefrontPreviewTheme["promoCards"]
  sections: StorefrontPreviewTheme["sections"]; sectionOrder: SectionKey[]; banners: BannerDraft[]
}
type TabId = "identity" | "colors" | "type" | "banners" | "sections" | "products" | "promotions"

const DEFAULT_DRAFT: Draft = {
  storeName: "", description: "", logoUrl: "", faviconUrl: "", primaryColor: "#E8732A", secondaryColor: "#F3ECE2",
  fontFamily: "Cairo", borderStyle: "rounded", productLayout: "grid", mobileColumns: 2,
  announcementText: "", promoText: "", promoCards: [],
  sections: { header: true, announcement: true, hero: true, products: true, footer: true },
  sectionOrder: ["header", "announcement", "hero", "products", "footer"], banners: [],
}
const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "identity", label: "هوية المتجر", icon: StoreIcon }, { id: "colors", label: "الألوان", icon: Palette },
  { id: "type", label: "الخطوط والحواف", icon: Type }, { id: "banners", label: "البانرات", icon: ImagePlus },
  { id: "sections", label: "أقسام المتجر", icon: LayoutGrid }, { id: "products", label: "عرض المنتجات", icon: Sparkles },
  { id: "promotions", label: "العروض", icon: Paintbrush },
]
const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value)
const cloneDraft = (value: Draft) => JSON.parse(JSON.stringify(value)) as Draft

function readImage(file: File, favicon = false): Promise<string> {
  const accepted = favicon
    ? ["image/png", "image/jpeg", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"]
    : ["image/png", "image/jpeg", "image/webp"]
  if (!accepted.includes(file.type)) throw new Error("صيغة الصورة غير مدعومة")
  if (file.size > 2 * 1024 * 1024) throw new Error("الحد الأقصى لحجم الصورة 2 ميجابايت")
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("تعذرت قراءة الصورة"))
    reader.onerror = () => reject(new Error("تعذرت قراءة الصورة"))
    reader.readAsDataURL(file)
  })
}
function luminance(hex: string) {
  const values = hex.slice(1).match(/.{2}/g)?.map((part) => parseInt(part, 16) / 255) ?? [0, 0, 0]
  const linear = values.map((v) => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

export default function CustomizeStorePage() {
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT)
  const [baseline, setBaseline] = useState<Draft | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>("identity")
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [draggedSection, setDraggedSection] = useState<SectionKey | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true); setLoadError(false)
    try {
      const data = await getMerchantDashboardDataAction()
      if (!data.store) throw new Error("Store unavailable")
      const initial: Draft = {
        ...DEFAULT_DRAFT, storeName: data.store.name, description: data.store.slogan || "",
        logoUrl: data.store.logoUrl || "", primaryColor: data.store.themeColor || DEFAULT_DRAFT.primaryColor,
      }
      setStore(data.store); setProducts(data.products ?? []); setDraft(initial); setBaseline(cloneDraft(initial))
    } catch {
      setLoadError(true); toast.error("تعذر تحميل بيانات المتجر. حاولي إعادة المحاولة.")
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { void loadData() }, [loadData])

  const updateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const hasUnsavedChanges = useMemo(() => baseline !== null && JSON.stringify(draft) !== JSON.stringify(baseline), [draft, baseline])
  const supportedChanges = !!baseline && (draft.storeName !== baseline.storeName || draft.primaryColor !== baseline.primaryColor || draft.logoUrl !== baseline.logoUrl)
  const designOnlyChanges = !!baseline && (
    draft.description !== baseline.description || draft.faviconUrl !== baseline.faviconUrl || draft.secondaryColor !== baseline.secondaryColor ||
    draft.fontFamily !== baseline.fontFamily || draft.borderStyle !== baseline.borderStyle || draft.productLayout !== baseline.productLayout ||
    draft.mobileColumns !== baseline.mobileColumns || draft.announcementText !== baseline.announcementText || draft.promoText !== baseline.promoText ||
    JSON.stringify(draft.promoCards) !== JSON.stringify(baseline.promoCards) || JSON.stringify(draft.sections) !== JSON.stringify(baseline.sections) ||
    JSON.stringify(draft.sectionOrder) !== JSON.stringify(baseline.sectionOrder) || JSON.stringify(draft.banners) !== JSON.stringify(baseline.banners)
  )

  const publishSupportedChanges = async () => {
    if (!store || !supportedChanges || publishing) return
    if (!isHexColor(draft.primaryColor) || draft.storeName.trim().length < 2) { toast.error("راجعي اسم المتجر واللون الرئيسي"); return }
    if (!window.confirm("هيتم تحديث اسم المتجر واللون الرئيسي واللوجو على واجهة العملاء المنشورة. باقي إعدادات التصميم هتفضل معاينة فقط لحد ما الباك يدعم حفظ الثيم. تكملي؟")) return
    setPublishing(true)
    try {
      const result = await updateStoreSettingsAction({
        storeName: draft.storeName.trim(), slug: store.slug, whatsapp: store.whatsapp,
        deliveryType: store.deliveryType, flatFee: store.flatFee, freeAbove: store.freeAbove,
        cityFees: store.cityFees, themeColor: draft.primaryColor, logoUrl: draft.logoUrl,
      })
      if (!result.ok || !result.store) { toast.error(result.error || "تعذر نشر الهوية الأساسية"); return }
      setStore(result.store)
      setBaseline((current) => current ? { ...current, storeName: draft.storeName, primaryColor: draft.primaryColor, logoUrl: draft.logoUrl } : current)
      toast.success("تم تحديث الاسم واللون واللوجو على المتجر المنشور")
      if (designOnlyChanges) toast.warning("باقي إعدادات التصميم معاينة محلية فقط، وتحتاج دعم حفظ الثيم من الباك.")
    } catch { toast.error("حدث خطأ أثناء النشر. لم يتم تأكيد حفظ التغييرات.") }
    finally { setPublishing(false) }
  }
  const resetDraft = () => {
    if (!baseline || !window.confirm("ترجعي التعديلات لآخر بيانات تم تحميلها أو نشرها؟")) return
    setDraft(cloneDraft(baseline))
  }
  const uploadLogo = async (file?: File) => {
    if (!file) return
    try { updateDraft("logoUrl", await readImage(file)); toast.success("اللوجو جاهز للمعاينة والنشر") }
    catch (error) { toast.error(error instanceof Error ? error.message : "تعذر قراءة الصورة") }
  }
  const uploadFavicon = async (file?: File) => {
    if (!file) return
    try { updateDraft("faviconUrl", await readImage(file, true)); toast.info("الأيقونة معاينة فقط؛ لا يوجد حقل لحفظها حاليًا") }
    catch (error) { toast.error(error instanceof Error ? error.message : "تعذر قراءة الأيقونة") }
  }
  const addBanner = () => {
    if (draft.banners.length >= 5) { toast.error("الحد الأقصى 5 بانرات"); return }
    updateDraft("banners", [...draft.banners, { id: `banner-${Date.now()}`, imageUrl: "", title: "", buttonText: "", destination: "", startsAt: "", endsAt: "" }])
  }
  const updateBanner = (id: string, patch: Partial<BannerDraft>) => {
    const current = draft.banners.find((item) => item.id === id)
    if (!current) return
    const next = { ...current, ...patch }
    if (next.startsAt && next.endsAt && new Date(next.startsAt).getTime() > new Date(next.endsAt).getTime()) {
      toast.error("تاريخ نهاية البانر لازم يكون بعد تاريخ البداية")
      return
    }
    updateDraft("banners", draft.banners.map((item) => item.id === id ? next : item))
  }
  const uploadBanner = async (id: string, file?: File) => {
    if (!file) return
    try { updateBanner(id, { imageUrl: await readImage(file) }); toast.success("صورة البانر جاهزة للمعاينة") }
    catch (error) { toast.error(error instanceof Error ? error.message : "تعذر قراءة صورة البانر") }
  }
  const moveSection = (from: SectionKey, to: SectionKey) => {
    if (from === to) return
    const order = [...draft.sectionOrder]; const fromIndex = order.indexOf(from); const toIndex = order.indexOf(to)
    if (fromIndex < 0 || toIndex < 0) return
    order.splice(fromIndex, 1); order.splice(toIndex, 0, from); updateDraft("sectionOrder", order)
  }

  const previewTheme: StorefrontPreviewTheme = {
    secondaryColor: isHexColor(draft.secondaryColor) ? draft.secondaryColor : DEFAULT_DRAFT.secondaryColor,
    fontFamily: draft.fontFamily, borderStyle: draft.borderStyle, productLayout: draft.productLayout,
    mobileColumns: draft.mobileColumns, announcementText: draft.announcementText, promoText: draft.promoText,
    promoCards: draft.promoCards, sections: draft.sections, sectionOrder: draft.sectionOrder, banners: draft.banners,
  }
  const previewStore = store ? { ...store, name: draft.storeName || store.name, slogan: draft.description, logoUrl: draft.logoUrl || undefined, themeColor: isHexColor(draft.primaryColor) ? draft.primaryColor : store.themeColor } : null

  if (loading) return <div className="rounded-2xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">جاري تحميل بيانات المتجر...</div>
  if (loadError || !store || !previewStore) return <div className="rounded-2xl border border-border bg-white p-8 text-center" role="alert"><AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" /><h1 className="font-bold">مش قادرين نحمل بيانات المتجر</h1><p className="mt-2 text-sm text-muted-foreground">مش هنعرض بيانات تجريبية.</p><Button className="mt-4" onClick={() => void loadData()} isLoading={loading}>إعادة المحاولة</Button></div>

  const sectionLabels: Record<SectionKey, string> = { header: "رأس المتجر", announcement: "شريط الإعلان", hero: "البانرات", products: "المنتجات", footer: "تذييل المتجر" }
  const selectedTab = TABS.find((tab) => tab.id === activeTab)

  return <div className="space-y-5 text-right" dir="rtl">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div><div className="flex items-center gap-2 text-xs font-bold text-primary"><Paintbrush className="h-4 w-4" /> محرر هوية متجرك</div><h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">خصص شكل متجرك</h1><p className="mt-1 text-sm text-slate-500">عدّلي وشوفي النتيجة فورًا في المعاينة قبل نشر الهوية الأساسية.</p></div>
      <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${hasUnsavedChanges ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{hasUnsavedChanges ? "فيه تغييرات غير منشورة" : "لا توجد تغييرات معلقة"}</span><Button variant="outline" onClick={resetDraft} disabled={!hasUnsavedChanges || publishing}><RotateCcw className="ml-2 h-4 w-4" /> إلغاء تعديلات المعاينة</Button><Button onClick={() => void publishSupportedChanges()} disabled={!supportedChanges || publishing} isLoading={publishing}><Save className="ml-2 h-4 w-4" /> نشر الهوية المتاحة</Button></div>
    </div>

    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_410px]">
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4" aria-label="معاينة المتجر">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Eye className="h-4 w-4 text-primary" /> معاينة مباشرة</div><div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1"><button type="button" onClick={() => setDevice("desktop")} aria-pressed={device === "desktop"} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${device === "desktop" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}><Monitor className="h-4 w-4" /> كمبيوتر</button><button type="button" onClick={() => setDevice("mobile")} aria-pressed={device === "mobile"} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${device === "mobile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}><Smartphone className="h-4 w-4" /> موبايل</button></div></div>
        <div className="overflow-auto rounded-xl bg-slate-100 p-2 sm:p-4"><div className={`mx-auto overflow-hidden border border-slate-200 bg-white shadow-xl ${device === "mobile" ? "max-w-[390px] rounded-[2rem]" : "w-full rounded-xl"}`}><div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-500"><span>معاينة غير منشورة</span><span dir="ltr">matgarak.com/{store.slug}</span></div><StorefrontClient store={previewStore} products={products} previewMode previewTheme={previewTheme} /></div></div>
        {designOnlyChanges && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-800"><AlertCircle className="ml-1 inline h-4 w-4" /> إعدادات التصميم التفصيلية ظاهرة في المعاينة فقط حاليًا. الباك لا يوفر حفظ Draft/Published Theme أو إدارة الإصدارات.</p>}
      </section>

      <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-5">
        <div className="border-b border-slate-100 p-4"><h2 className="font-black text-slate-900">إعدادات التصميم</h2><p className="mt-1 text-xs text-slate-500">اختاري القسم اللي عايزة تعدليه</p></div>
        <div className="grid grid-cols-2 gap-1 border-b border-slate-100 p-2 sm:grid-cols-3 xl:grid-cols-2">{TABS.map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} aria-pressed={activeTab === tab.id} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-right text-xs font-bold ${activeTab === tab.id ? "bg-orange-50 text-orange-700" : "text-slate-600 hover:bg-slate-50"}`}><Icon className="h-4 w-4 shrink-0" />{tab.label}</button> })}</div>
        <div className="max-h-[75vh] space-y-5 overflow-y-auto p-4"><div><h3 className="font-black text-slate-900">{selectedTab?.label}</h3><p className="mt-1 text-xs leading-5 text-slate-500">التغييرات بتظهر مباشرة في المعاينة.</p></div>

          {activeTab === "identity" && <div className="space-y-4">
            <Input label="اسم المتجر" value={draft.storeName} onChange={(event) => updateDraft("storeName", event.target.value)} maxLength={60} />
            <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700">وصف قصير للمتجر</label><textarea value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} maxLength={180} rows={3} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-orange-400" placeholder="اكتبي وصف مختصر يعرّف العملاء بمتجرك" /></div>
            <div className="rounded-xl border border-slate-200 p-3"><label className="mb-2 block text-xs font-bold text-slate-700">لوجو المتجر</label><div className="flex items-center gap-3">{draft.logoUrl ? <img src={draft.logoUrl} alt="معاينة لوجو المتجر" className="h-16 w-16 rounded-xl border border-slate-200 object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-xl text-xl font-black text-white" style={{ backgroundColor: draft.primaryColor }}>{draft.storeName.charAt(0) || "م"}</div>}<label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50"><Upload className="ml-1 inline h-4 w-4" /> اختيار صورة<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { void uploadLogo(event.target.files?.[0]); event.currentTarget.value = "" }} /></label></div><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] leading-5 text-slate-500">PNG أو JPG أو WEBP — بحد أقصى 2MB. يتم حفظه عند نشر الهوية الأساسية.</p>{draft.logoUrl && <button type="button" onClick={() => updateDraft("logoUrl", "")} className="text-[11px] font-bold text-red-600 hover:underline">إزالة اللوجو</button>}</div></div>
            <div className="rounded-xl border border-dashed border-slate-200 p-3"><label className="mb-2 block text-xs font-bold text-slate-700">أيقونة المتصفح (Favicon)</label><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold"><ImagePlus className="h-4 w-4" /> اختيار أيقونة<input type="file" accept="image/png,image/jpeg,image/webp,image/x-icon" className="sr-only" onChange={(event) => { void uploadFavicon(event.target.files?.[0]); event.currentTarget.value = "" }} /></label>{draft.faviconUrl && <img src={draft.faviconUrl} alt="معاينة الأيقونة" className="mr-3 inline-block h-8 w-8 rounded border object-contain" />}<p className="mt-2 text-[10px] text-amber-700">معاينة فقط — لا يوجد حقل أو إجراء خلفي لحفظ Favicon.</p></div>
          </div>}

          {activeTab === "colors" && <div className="space-y-4">
            {[{ key: "primaryColor" as const, label: "اللون الرئيسي", value: draft.primaryColor }, { key: "secondaryColor" as const, label: "اللون الثانوي", value: draft.secondaryColor }].map((color) => <div key={color.key} className="space-y-2"><label className="text-xs font-bold text-slate-700">{color.label}</label><div className="flex items-center gap-2"><input type="color" value={isHexColor(color.value) ? color.value : "#E8732A"} onChange={(event) => updateDraft(color.key, event.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1" /><input value={color.value} onChange={(event) => updateDraft(color.key, event.target.value)} dir="ltr" maxLength={7} className={`h-11 min-w-0 flex-1 rounded-lg border px-3 text-sm font-bold outline-none ${isHexColor(color.value) ? "border-slate-200" : "border-red-400 bg-red-50"}`} /></div>{!isHexColor(color.value) && <p className="text-[11px] text-red-600">اكتبي لون HEX صحيح مثل #E8732A</p>}</div>)}
            <div className="space-y-2"><p className="text-xs font-bold text-slate-700">لوحات ألوان جاهزة</p><div className="grid grid-cols-2 gap-2">{[{ name: "دافئ", primary: "#B65C38", secondary: "#F5E9DE" }, { name: "أخضر طبيعي", primary: "#356859", secondary: "#E8F0E8" }, { name: "أسود وذهبي", primary: "#252525", secondary: "#F1E8D5" }, { name: "وردي هادئ", primary: "#B94E70", secondary: "#F8E9EF" }, { name: "أزرق", primary: "#315B86", secondary: "#E8EFF7" }, { name: "برتقالي", primary: "#E8732A", secondary: "#F3ECE2" }].map((palette) => <button type="button" key={palette.name} onClick={() => { updateDraft("primaryColor", palette.primary); updateDraft("secondaryColor", palette.secondary) }} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2 text-xs font-bold hover:border-slate-400"><span className="flex overflow-hidden rounded-full"><i className="h-5 w-5" style={{ backgroundColor: palette.primary }} /><i className="h-5 w-5" style={{ backgroundColor: palette.secondary }} /></span>{palette.name}</button>)}</div></div>
            {isHexColor(draft.primaryColor) && (luminance(draft.primaryColor) > 0.72 || luminance(draft.primaryColor) < 0.035) && <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">تنبيه: اللون الرئيسي فاتح جدًا أو داكن جدًا؛ راجعي وضوح النصوص فوقه.</p>}
          </div>}

          {activeTab === "type" && <div className="space-y-4"><div className="space-y-2"><label className="text-xs font-bold text-slate-700">الخط العربي</label><select value={draft.fontFamily} onChange={(event) => updateDraft("fontFamily", event.target.value as FontChoice)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"><option>Cairo</option><option>Tajawal</option><option>Almarai</option><option>Amiri</option></select><p className="rounded-lg bg-slate-50 p-3 text-sm" style={{ fontFamily: draft.fontFamily === "Cairo" ? "var(--font-cairo)" : draft.fontFamily === "Tajawal" ? "var(--font-tajawal)" : draft.fontFamily === "Almarai" ? "var(--font-almarai)" : "var(--font-amiri)" }}>متجرك يعكس هوية علامتك التجارية</p></div><div className="space-y-2"><p className="text-xs font-bold text-slate-700">شكل الحواف</p><div className="grid grid-cols-3 gap-2">{([{ value: "sharp", label: "حادة", radius: "rounded-sm" }, { value: "medium", label: "متوسطة", radius: "rounded-xl" }, { value: "rounded", label: "دائرية", radius: "rounded-3xl" }] as const).map((option) => <button type="button" key={option.value} onClick={() => updateDraft("borderStyle", option.value)} aria-pressed={draft.borderStyle === option.value} className={`border p-3 text-xs font-bold ${option.radius} ${draft.borderStyle === option.value ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200"}`}>{option.label}</button>)}</div></div></div>}

          {activeTab === "banners" && <div className="space-y-4"><div className="flex items-center justify-between"><p className="text-xs font-bold text-slate-700">بانرات المتجر ({draft.banners.length}/5)</p><Button size="sm" variant="outline" onClick={() => { if (draft.banners.length >= 5) toast.error("الحد الأقصى 5 بانرات"); else updateDraft("banners", [...draft.banners, { id: `banner-${Date.now()}`, imageUrl: "", title: "", buttonText: "", destination: "", startsAt: "", endsAt: "" }]) }} disabled={draft.banners.length >= 5}><Plus className="ml-1 h-4 w-4" /> إضافة بانر</Button></div>{draft.banners.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">لسه مفيش بانرات. أضيفي بانر عشان يظهر في المعاينة.</div>}{draft.banners.map((banner, index) => <div key={banner.id} className="space-y-3 rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between"><b className="text-xs">بانر {index + 1}</b><button type="button" aria-label="حذف البانر" onClick={() => updateDraft("banners", draft.banners.filter((item) => item.id !== banner.id))} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><X className="h-4 w-4" /></button></div>{banner.imageUrl && <img src={banner.imageUrl} alt="معاينة البانر" className="h-28 w-full rounded-lg object-cover" />}<label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-xs font-bold"><Upload className="h-4 w-4" /> رفع صورة البانر<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { void (async () => { const file = event.target.files?.[0]; if (!file) return; try { updateBanner(banner.id, { imageUrl: await readImage(file) }); toast.success("صورة البانر جاهزة للمعاينة") } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر قراءة الصورة") } finally { event.target.value = "" } })() }} /></label><Input label="عنوان البانر" value={banner.title} onChange={(event) => updateBanner(banner.id, { title: event.target.value })} maxLength={80} /><Input label="نص الزر" value={banner.buttonText} onChange={(event) => updateBanner(banner.id, { buttonText: event.target.value })} maxLength={30} /><Input label="رابط الوجهة" value={banner.destination} onChange={(event) => updateBanner(banner.id, { destination: event.target.value })} placeholder="https:// أو رابط منتج" /><div className="grid grid-cols-2 gap-2"><div><label className="mb-1 block text-[11px] font-bold">بداية العرض</label><input type="datetime-local" value={banner.startsAt} onChange={(event) => updateBanner(banner.id, { startsAt: event.target.value })} className="h-10 w-full rounded-lg border border-slate-200 px-2 text-xs" /></div><div><label className="mb-1 block text-[11px] font-bold">نهاية العرض</label><input type="datetime-local" value={banner.endsAt} onChange={(event) => updateBanner(banner.id, { endsAt: event.target.value })} className="h-10 w-full rounded-lg border border-slate-200 px-2 text-xs" /></div></div><p className="text-[10px] leading-5 text-amber-700">البانرات ومواعيدها معاينة فقط حاليًا؛ حفظها وجدولتها يحتاجان دعمًا من الباك.</p></div>)}</div>}

          {activeTab === "sections" && <div className="space-y-3"><p className="text-xs leading-5 text-slate-500">فعّلي أو اخفي الأقسام، واسحبي القسم لتغيير ترتيبه. الترتيب يظهر في المعاينة.</p>{draft.sectionOrder.map((section, index) => <div key={section} draggable onDragStart={() => setDraggedSection(section)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedSection) moveSection(draggedSection, section); setDraggedSection(null) }} className={`flex items-center gap-2 rounded-xl border p-3 ${draggedSection === section ? "border-orange-400 bg-orange-50" : "border-slate-200"}`}><span className="cursor-grab text-slate-400">⠿</span><span className="flex-1 text-xs font-bold">{sectionLabels[section]}</span><button type="button" aria-label={`تحريك ${sectionLabels[section]} لأعلى`} disabled={index === 0} onClick={() => moveSection(section, draft.sectionOrder[index - 1])} className="rounded-md p-1 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" aria-label={`تحريك ${sectionLabels[section]} لأسفل`} disabled={index === draft.sectionOrder.length - 1} onClick={() => moveSection(section, draft.sectionOrder[index + 1])} className="rounded-md p-1 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button><input type="checkbox" checked={draft.sections[section]} onChange={(event) => updateDraft("sections", { ...draft.sections, [section]: event.target.checked })} aria-label={`إظهار ${sectionLabels[section]}`} className="h-4 w-4 accent-orange-600" /></div>)}</div>}

          {activeTab === "products" && <div className="space-y-4"><div className="space-y-2"><p className="text-xs font-bold text-slate-700">طريقة عرض المنتجات</p><div className="grid grid-cols-3 gap-2">{([{ value: "grid", label: "شبكة" }, { value: "list", label: "قائمة" }, { value: "large", label: "بطاقات كبيرة" }] as const).map((option) => <button type="button" key={option.value} onClick={() => updateDraft("productLayout", option.value)} aria-pressed={draft.productLayout === option.value} className={`rounded-xl border p-3 text-xs font-bold ${draft.productLayout === option.value ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200"}`}>{option.label}</button>)}</div></div><div className="space-y-2"><p className="text-xs font-bold text-slate-700">عدد الأعمدة على الموبايل</p><div className="grid grid-cols-2 gap-2">{([1, 2] as const).map((columns) => <button type="button" key={columns} onClick={() => updateDraft("mobileColumns", columns)} aria-pressed={draft.mobileColumns === columns} className={`rounded-xl border p-3 text-xs font-bold ${draft.mobileColumns === columns ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200"}`}>{columns} عمود</button>)}</div></div><p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">تغيير شكل العرض يظهر في المعاينة. حفظه للزوار يحتاج حقل إعدادات الثيم في الباك.</p></div>}

          {activeTab === "promotions" && <div className="space-y-4">
            <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700" htmlFor="announcement-text">نص شريط الإعلان</label><textarea id="announcement-text" rows={2} maxLength={120} value={draft.announcementText} onChange={(event) => updateDraft("announcementText", event.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="مثال: شحن مجاني للطلبات فوق 1000 جنيه" /></div>
            <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700" htmlFor="promo-text">رسالة ترويجية مختصرة</label><textarea id="promo-text" rows={2} maxLength={120} value={draft.promoText} onChange={(event) => updateDraft("promoText", event.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="مثال: عروض نهاية الموسم لفترة محدودة" /></div>
            <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-slate-700">بطاقات ترويجية ({draft.promoCards.length}/3)</p><Button size="sm" variant="outline" disabled={draft.promoCards.length >= 3} onClick={() => updateDraft("promoCards", [...draft.promoCards, { id: `promo-${Date.now()}`, title: "", description: "", buttonText: "", destination: "" }])}><Plus className="ml-1 h-4 w-4" /> إضافة بطاقة</Button></div>
            {draft.promoCards.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">أضيفي حتى 3 بطاقات، وستظهر في معاينة المتجر.</p>}
            {draft.promoCards.map((card, index) => <div key={card.id} className="space-y-2 rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between"><b className="text-xs">بطاقة {index + 1}</b><button type="button" aria-label={`حذف البطاقة ${index + 1}`} onClick={() => updateDraft("promoCards", draft.promoCards.filter((item) => item.id !== card.id))} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><X className="h-4 w-4" /></button></div><Input label="عنوان البطاقة" value={card.title} maxLength={60} onChange={(event) => updateDraft("promoCards", draft.promoCards.map((item) => item.id === card.id ? { ...item, title: event.target.value } : item))} /><div className="space-y-1"><label className="text-xs font-bold text-slate-700">وصف مختصر</label><textarea rows={2} maxLength={120} value={card.description} onChange={(event) => updateDraft("promoCards", draft.promoCards.map((item) => item.id === card.id ? { ...item, description: event.target.value } : item))} className="w-full rounded-xl border border-slate-200 p-3 text-sm" /></div><Input label="نص الزر" value={card.buttonText} maxLength={24} onChange={(event) => updateDraft("promoCards", draft.promoCards.map((item) => item.id === card.id ? { ...item, buttonText: event.target.value } : item))} /><Input label="وجهة الزر (اختياري)" value={card.destination} maxLength={300} placeholder="رابط منتج أو قسم" onChange={(event) => updateDraft("promoCards", draft.promoCards.map((item) => item.id === card.id ? { ...item, destination: event.target.value } : item))} /></div>)}
            <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">البطاقات ورسالة العرض تظهر في المعاينة المحلية فقط؛ نشرها يحتاج تخزين إعدادات العروض في الـBackend. بيانات السعر الأصلي والمخفض غير موجودة حاليًا، لذلك لن نعرض خصومات أو نسبًا غير حقيقية.</p>
          </div>}
        </div>
      </aside>
    </div>
  </div>
}
