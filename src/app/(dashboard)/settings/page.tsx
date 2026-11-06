"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Save, Store, Truck, Palette, MessageCircle, Upload, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("براند كايرو كوتور")
  const [slug, setSlug] = useState("cairo-couture")
  const [whatsapp, setWhatsapp] = useState("01012345678")
  const [deliveryType, setDeliveryType] = useState("flat")
  const [flatFee, setFlatFee] = useState("40")
  const [freeAbove, setFreeAbove] = useState("1000")
  const [themeColor, setThemeColor] = useState("#E8732A")
  const [loading, setLoading] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success("تم حفظ إعدادات المتجر بنجاح!")
    }, 800)
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
              <div
                onClick={() => setDeliveryType("flat")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
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
              </div>

              <div
                onClick={() => setDeliveryType("by_city")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
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
              </div>
            </div>

            {deliveryType === "flat" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="سعر التوصيل الثابت (ج.م)"
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
                  ك
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

