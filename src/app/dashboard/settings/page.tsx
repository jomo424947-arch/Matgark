"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card"
import { getMerchantDashboardDataAction, updateStoreSettingsAction } from "@/server/actions/store"
import { sanitizeSlug, isReservedSlug } from "@/lib/reserved-slugs"
import type { DeliveryType } from "@/types/domain"
import {
  Save,
  Store as StoreIcon,
  Truck,
  Palette,
  MessageCircle,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("")
  const [slug, setSlug] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("flat")
  const [flatFee, setFlatFee] = useState("")
  const [freeAbove, setFreeAbove] = useState("")
  const [cityFees, setCityFees] = useState<Record<string, number>>({})
  const [themeColor, setThemeColor] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const loadSettings = useCallback(async () => {
    setInitialLoading(true)
    setLoadError(false)
    try {
      const data = await getMerchantDashboardDataAction()
      if (!data.store) {
        throw new Error("Store settings are unavailable")
      }

      setStoreName(data.store.name)
      setSlug(data.store.slug)
      setWhatsapp(data.store.whatsapp)
      setDeliveryType(data.store.deliveryType)
      setFlatFee(String(data.store.flatFee))
      setFreeAbove(
        data.store.freeAbove !== null ? String(data.store.freeAbove) : ""
      )
      setCityFees(data.store.cityFees ?? {})
      setThemeColor(data.store.themeColor)
      setLogoUrl(data.store.logoUrl || null)
    } catch {
      setLoadError(true)
      toast.error("تعذر تحميل إعدادات المتجر")
    } finally {
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  if (initialLoading) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        جاري تحميل إعدادات المتجر...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-8 text-center" role="alert">
        <p className="font-bold text-foreground">تعذر تحميل إعدادات المتجر</p>
        <p className="mt-2 text-sm text-muted-foreground">لم يتم تحميل بيانات الإعدادات، ولم يتم عرض بيانات تجريبية.</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => void loadSettings()} isLoading={initialLoading}>
          إعادة المحاولة
        </Button>
      </div>
    )
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("اختاري لوجو بصيغة PNG أو JPG أو WEBP")
      e.target.value = ""
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم اللوجو كبير، الحد الأقصى 2 ميجابايت")
      e.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result)
        toast.success("تم اختيار اللوجو بنجاح")
      }
    }
    reader.onerror = () => toast.error("تعذر قراءة اللوجو، اختاري ملفاً آخر")
    reader.readAsDataURL(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanSlug = sanitizeSlug(slug)
    if (isReservedSlug(cleanSlug)) {
      toast.error("هذا الرابط محجوز للنظام، يرجى اختيار رابط آخر")
      return
    }

    if (!storeName.trim() || !whatsapp.trim() || !/^#[0-9a-fA-F]{6}$/.test(themeColor) || !Number.isFinite(Number(flatFee)) || Number(flatFee) < 0 || (freeAbove.trim() && (!Number.isFinite(Number(freeAbove)) || Number(freeAbove) < 0))) {
      toast.error("راجعي اسم المتجر ورقم واتساب واللون ورسوم التوصيل")
      return
    }

    setLoading(true)
    let res: Awaited<ReturnType<typeof updateStoreSettingsAction>>
    try {
      res = await updateStoreSettingsAction({
        storeName: storeName.trim(),
        slug: cleanSlug,
        whatsapp: whatsapp.trim(),
        deliveryType,
        flatFee: Number(flatFee),
        freeAbove: freeAbove.trim() ? Number(freeAbove) : null,
        cityFees,
        themeColor,
        logoUrl: logoUrl || undefined,
      })
    } catch {
      toast.error("حدث خطأ أثناء حفظ الإعدادات. حاولي مرة أخرى.")
      return
    } finally {
      setLoading(false)
    }

    if (!res.ok) {
      toast.error(res.error || "فشل حفظ الإعدادات")
      return
    }

    toast.success("تم حفظ إعدادات المتجر بنجاح!")
  }

  const presetColors = [
    { name: "برتقالي متجرك", hex: "#E8732A" },
    { name: "أسود كلاسيك", hex: "#1A1A1A" },
    { name: "أزرق ملكي", hex: "#2563EB" },
    { name: "أخضر زمردي", hex: "#059669" },
    { name: "وردي ناعم", hex: "#E11D48" },
    { name: "بنفسجي", hex: "#7C3AED" },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-right">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground">
          إعدادات المتجر
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          خصص بيانات متجرك، ورسوم التوصيل، والهوية البصرية
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Data */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <StoreIcon className="w-5 h-5 text-primary" />
              <CardTitle>بيانات المتجر</CardTitle>
            </div>
            <CardDescription>الاسم واللينك الخاص بمتجرك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="اسم المحل أو البراند"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground/90">
                لينك المتجر
              </label>
              <div className="flex items-center bg-muted/40 border border-input rounded-2xl px-4 py-2 text-sm text-foreground dir-ltr">
                <span className="text-xs text-muted-foreground font-semibold">
                  matgarak.com/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(sanitizeSlug(e.target.value))}
                  required
                  className="flex-1 bg-transparent border-0 outline-none text-foreground font-bold pl-1 text-left"
                />
              </div>
              {isReservedSlug(slug) && (
                <p className="text-xs text-destructive font-semibold">
                  هذا الرابط محجوز للنظام، يرجى اختيار رابط مختلف.
                </p>
              )}
            </div>

            <Input
              label="رقم واتساب لاستقبال إشعارات الأوردرات"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
              dir="ltr"
              className="text-right"
              helperText="كل أوردر جديد هيتبعتلك بتفاصيله على الرقم ده"
              startIcon={
                <MessageCircle className="w-4 h-4 text-emerald-500" />
              }
            />
          </CardContent>
        </Card>

        {/* Shipping & Delivery */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <CardTitle>إعدادات التوصيل والشحن</CardTitle>
            </div>
            <CardDescription>
              حدد الرسوم اللي هيدفعها العميل مع كل أوردر
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                aria-pressed={deliveryType === "flat"}
                onClick={() => setDeliveryType("flat")}
                className={`w-full text-right p-4 rounded-2xl border cursor-pointer transition-all ${
                  deliveryType === "flat"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                <div className="font-bold text-sm text-foreground mb-1">
                  رسم توصيل ثابت
                </div>
                <p className="text-xs text-muted-foreground">
                  مبلغ موحد لكل الأوردرات في جميع المحافظات
                </p>
              </button>

              <button
                type="button"
                aria-pressed={deliveryType === "by_city"}
                onClick={() => setDeliveryType("by_city")}
                className={`w-full text-right p-4 rounded-2xl border cursor-pointer transition-all ${
                  deliveryType === "by_city"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                <div className="font-bold text-sm text-foreground mb-1">
                  حسب المحافظة
                </div>
                <p className="text-xs text-muted-foreground">
                  تحديد سعر شحن لكل محافظة على حدة
                </p>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="سعر التوصيل الافتراضي (ج.م) *"
                type="number"
                value={flatFee}
                onChange={(e) => setFlatFee(e.target.value)}
                dir="ltr"
                className="text-right font-bold"
              />

              <Input
                label="توصيل مجاني للطلبات فوق (ج.م)"
                type="number"
                value={freeAbove}
                onChange={(e) => setFreeAbove(e.target.value)}
                dir="ltr"
                className="text-right font-bold"
                helperText="اتركه فارغاً إذا كنت لا ترغب بتوصيل مجاني"
              />
            </div>

            {deliveryType === "by_city" && (
              <div className="space-y-2 border-t border-border pt-4">
                <label className="block text-xs font-bold text-foreground">
                  تحديد رسوم الشحن لكل محافظة (ج.م):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {["القاهرة", "الجيزة", "الإسكندرية"].map((city) => (
                    <div
                      key={city}
                      className="p-3 rounded-xl border border-border bg-muted/20 space-y-1"
                    >
                      <label className="text-xs font-bold text-foreground">
                        {city}
                      </label>
                      <input
                        type="number"
                        value={cityFees[city] ?? 40}
                        onChange={(e) =>
                          setCityFees({
                            ...cityFees,
                            [city]: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-bold dir-ltr text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visual Identity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <CardTitle>هوية المتجر والألوان</CardTitle>
            </div>
            <CardDescription>
              اختار اللون الرئيسي اللي هيظهر لعملائك في واجهة المتجر
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground/90">
                اللون المميز (Accent Color)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {presetColors.map((color) => (
                  <button
                    type="button"
                    key={color.hex}
                    onClick={() => setThemeColor(color.hex)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                      themeColor === color.hex
                        ? "border-foreground shadow-md scale-105"
                        : "border-border hover:scale-102"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="pt-2">
              <label className="block text-sm font-semibold text-foreground/90 mb-2">
                لوجو المحل
              </label>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="لوجو المتجر"
                    className="w-16 h-16 rounded-2xl object-cover border border-border shadow-md"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-primary-foreground font-black text-2xl shadow-md"
                    style={{ backgroundColor: themeColor }}
                  >
                    {storeName.charAt(0)}
                  </div>
                )}
                <div className="space-y-1">
                  <label
                    htmlFor="logo-file-input"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-input bg-background hover:bg-muted text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>تغيير صورة اللوجو</span>
                  </label>
                  <input
                    id="logo-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    PNG أو JPG بحجم لا يتجاوز 2 ميجابايت
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            size="lg"
            className="font-bold shadow-xl shadow-primary/25 px-8"
            isLoading={loading}
            disabled={initialLoading || loadError}
          >
            <Save className="w-4 h-4 ml-2" />
            <span>حفظ كل الإعدادات</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
