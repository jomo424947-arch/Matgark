"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useMerchantStore } from "@/stores/merchantStore"
import { normalizeSlug } from "@/lib/storeLogic"
import { Save, Store, Truck, Palette, MessageCircle, Upload } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const settings = useMerchantStore((s) => s.settings)
  const updateSettings = useMerchantStore((s) => s.updateSettings)

  const [storeName, setStoreName] = useState(settings.storeName)
  const [slug, setSlug] = useState(settings.slug)
  const [slogan, setSlogan] = useState(settings.slogan)
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp)
  const [deliveryType, setDeliveryType] = useState<"flat" | "by_city">(
    settings.deliveryType
  )
  const [flatFee, setFlatFee] = useState(String(settings.flatFee))
  const [freeAbove, setFreeAbove] = useState(String(settings.freeAbove))
  const [cityFees, setCityFees] = useState<Record<string, number>>(
    settings.cityFees
  )
  const [themeColor, setThemeColor] = useState(settings.themeColor)
  const [loading, setLoading] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const cleanSlug = normalizeSlug(slug, "cairo-couture")
    setSlug(cleanSlug)
    updateSettings({
      storeName: storeName.trim() || "براند كايرو كوتور",
      slug: cleanSlug,
      slogan: slogan.trim(),
      whatsapp: whatsapp.trim(),
      deliveryType,
      flatFee: Math.max(0, Number(flatFee) || 0),
      freeAbove: Math.max(0, Number(freeAbove) || 0),
      cityFees,
      themeColor,
    })
    setTimeout(() => {
      setLoading(false)
      toast.success("تم حفظ إعدادات المتجر بنجاح!")
    }, 400)
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
        {/* بيانات المتجر الأساسية */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
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

            <Input
              label="وصف قصير للمتجر (Slogan)"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="مثال: أحدث صيحات الملابس الكاجوال في مصر"
            />

            <div className="space-y-2">
              <label
                htmlFor="settings-slug-input"
                className="block text-sm font-semibold text-foreground/90"
              >
                لينك المتجر
              </label>
              <div className="flex items-center bg-muted/40 border border-input rounded-2xl px-4 py-2 text-sm text-foreground dir-ltr">
                <span className="text-xs text-muted-foreground font-semibold">
                  matgarak.com/
                </span>
                <input
                  id="settings-slug-input"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="flex-1 bg-transparent border-0 outline-none text-foreground font-bold pl-1 text-left"
                />
              </div>
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
              startIcon={<MessageCircle className="w-4 h-4 text-emerald-500" />}
            />
          </CardContent>
        </Card>

        {/* إعدادات الشحن والتوصيل */}
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
                onClick={() => setDeliveryType("flat")}
                className={`p-4 rounded-2xl border text-right transition-all ${
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
                onClick={() => setDeliveryType("by_city")}
                className={`p-4 rounded-2xl border text-right transition-all ${
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
                label="سعر التوصيل الثابت / الافتراضي (ج.م)"
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
                helperText="ضع 0 إذا كنت لا ترغب بتوصيل مجاني"
              />
            </div>

            {deliveryType === "by_city" && (
              <div className="pt-3 border-t border-border space-y-3">
                <div className="text-xs font-bold text-foreground">
                  أسعار التوصيل حسب المحافظة (ج.م):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(cityFees).map(([city, fee]) => (
                    <div
                      key={city}
                      className="p-3 rounded-xl bg-muted/30 border border-border space-y-1"
                    >
                      <label
                        htmlFor={`city-fee-${city}`}
                        className="block text-xs font-bold text-foreground"
                      >
                        {city}
                      </label>
                      <input
                        id={`city-fee-${city}`}
                        type="number"
                        value={fee}
                        onChange={(e) =>
                          setCityFees((prev) => ({
                            ...prev,
                            [city]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs font-bold dir-ltr text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* الهوية البصرية وثيم المتجر */}
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

            {/* رفع اللوجو */}
            <div className="pt-2">
              <label className="block text-sm font-semibold text-foreground/90 mb-2">
                لوجو المحل
              </label>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-2xl shadow-md">
                  {storeName.trim().charAt(0) || "ك"}
                </div>
                <div className="space-y-1">
                  <Button type="button" variant="outline" size="sm" className="gap-2">
                    <Upload className="w-4 h-4" />
                    <span>تغيير صورة اللوجو</span>
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    PNG أو JPG مربع بحجم لا يتجاوز 2 ميجابايت
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* زر الحفظ */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            size="lg"
            className="font-bold shadow-xl shadow-primary/25 px-8"
            isLoading={loading}
          >
            <Save className="w-4 h-4 ml-2" />
            <span>حفظ كل الإعدادات</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
