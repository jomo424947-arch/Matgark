"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { completeOnboardingAction } from "@/server/actions/store"
import { sanitizeSlug, getStorePath, getStoreDisplayUrl } from "@/lib/reserved-slugs"
import {
  Store,
  MessageCircle,
  Package,
  ArrowLeft,
  Sparkles,
  Upload,
  Copy,
  ExternalLink,
  PartyPopper,
} from "lucide-react"
import { toast } from "sonner"

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  // Step 1: Store data
  const [storeName, setStoreName] = useState("")
  const [storeSlug, setStoreSlug] = useState("")
  const [category, setCategory] = useState("ملابس")

  // Step 2: WhatsApp & delivery
  const [whatsapp, setWhatsapp] = useState("")
  const [deliveryFee, setDeliveryFee] = useState("40")

  // Step 3: First product
  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState("")
  const [productSizes, setProductSizes] = useState("")
  const [productImage, setProductImage] = useState<string | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${getStoreDisplayUrl(storeSlug)}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً، الحد الأقصى 5 ميجابايت")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setProductImage(event.target?.result as string)
      toast.success("تم اختيار صورة المنتج بنجاح")
    }
    reader.readAsDataURL(file)
  }

  const handleFinishOnboarding = async () => {
    if (!productName.trim() || !(Number(productPrice) > 0)) {
      toast.error("يرجى إدخال اسم المنتج وسعر أكبر من صفر")
      return
    }

    setLoading(true)

    const res = await completeOnboardingAction({
      storeName,
      storeSlug,
      category,
      whatsapp,
      deliveryFee: Number(deliveryFee) || 0,
      productName,
      productPrice: Number(productPrice) || 0,
      productSizes,
      productImage: productImage || undefined,
    })

    setLoading(false)

    if (!res.ok) {
      toast.error(res.error || "فشل إكمال تجهيز المتجر")
      return
    }

    if (res.storeSlug) {
      setStoreSlug(res.storeSlug)
    }

    toast.success("تم تجهيز متجرك بنجاح!")
    setCurrentStep(4)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-right">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-border/60">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-xs">
              تخطي إلى لوحة التحكم
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Wizard */}
      <div className="max-w-2xl mx-auto w-full my-8">
        {/* Progress Stepper */}
        {currentStep <= 3 && (
          <div className="mb-8 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-2">
              <span className={currentStep >= 1 ? "text-primary" : ""}>
                1. بيانات المتجر
              </span>
              <span className={currentStep >= 2 ? "text-primary" : ""}>
                2. التوصيل والواتساب
              </span>
              <span className={currentStep >= 3 ? "text-primary" : ""}>
                3. أول منتج
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Card className="border-border/80 shadow-2xl overflow-hidden">
          <CardContent className="p-8 sm:p-10 space-y-6">
            {/* Step 1: Store info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                    <Store className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                    اختار اسم ورابط متجرك
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    الاسم ده اللي عملائك هيشوفوه في بايو إنستجرام وتيك توك
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="اسم المتجر أو البراند *"
                    placeholder="مثال: براند رداء للأزياء"
                    value={storeName}
                    onChange={(e) => {
                      setStoreName(e.target.value)
                      setStoreSlug(sanitizeSlug(e.target.value))
                    }}
                    required
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground/90">
                      رابط متجرك الخاص *
                    </label>
                    <div className="flex items-center bg-muted/40 border border-input rounded-2xl px-4 py-2.5 text-sm dir-ltr">
                      <span className="text-xs text-muted-foreground font-semibold">
                        matgarak.com/
                      </span>
                      <input
                        type="text"
                        value={storeSlug}
                        onChange={(e) => setStoreSlug(sanitizeSlug(e.target.value))}
                        className="flex-1 bg-transparent border-0 outline-none text-foreground font-bold pl-1 text-left"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground/90">
                      مجال المتجر الرئيسي
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-12 rounded-2xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
                    >
                      <option value="ملابس">ملابس وأزياء</option>
                      <option value="أحذية">أحذية وسنيكرز</option>
                      <option value="إكسسوارات">إكسسوارات ومجوهرات</option>
                      <option value="أكل">أكل وحلويات ومخبوزات</option>
                      <option value="أشغال يدوية">أشغال يدوية وكروشيه</option>
                      <option value="أخرى">مجال آخر</option>
                    </select>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={() => {
                    if (!storeName.trim() || !storeSlug.trim()) {
                      toast.error("يرجى ملء جميع الحقول المطلوبة")
                      return
                    }
                    setCurrentStep(2)
                  }}
                  className="w-full font-bold shadow-lg shadow-primary/20"
                >
                  <span>التالي: إعدادات الواتساب والتوصيل</span>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Delivery & WhatsApp */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                    أين تريد استلام الأوردرات؟
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    أدخل رقم واتساب لنرسل لك تنبيهاً فورياً وتفاصيل كل أوردر جديد
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="رقم واتساب لاستقبال الأوردرات *"
                    type="tel"
                    placeholder="01012345678"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                    dir="ltr"
                    className="text-right"
                    helperText="هيوصلك إشعار فوري وتفاصيل العميل كاملة أول ما يطلب"
                    startIcon={
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                    }
                  />

                  <Input
                    label="سعر التوصيل الافتراضي (ج.م) *"
                    type="number"
                    placeholder="40"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    required
                    dir="ltr"
                    className="text-right font-bold"
                    helperText="تقدر تعدله لاحقاً وتحدده حسب كل محافظة من الإعدادات"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentStep(1)}
                  >
                    السابق
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      if (!whatsapp.trim()) {
                        toast.error("يرجى إدخال رقم واتساب")
                        return
                      }
                      setCurrentStep(3)
                    }}
                    className="flex-1 font-bold shadow-lg shadow-primary/20"
                  >
                    <span>التالي: إضافة أول منتج</span>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: First product */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                    <Package className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                    أضف أول منتج لمتجرك
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    منتج واحد يكفي علشان متجرك يكون جاهز للمشاركة ويبدأ يبيع
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="اسم المنتج *"
                    placeholder="مثال: فستان صيفي قطن أنيق"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="السعر (ج.م) *"
                      type="number"
                      placeholder="650"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      required
                      dir="ltr"
                      className="text-right font-bold"
                    />

                    <Input
                      label="المقاسات المتاحة"
                      placeholder="S, M, L, XL"
                      value={productSizes}
                      onChange={(e) => setProductSizes(e.target.value)}
                    />
                  </div>

                  {/* Real image upload */}
                  <div>
                    <label
                      htmlFor="onboarding-product-image"
                      className="block border-2 border-dashed border-border rounded-2xl p-6 text-center bg-muted/20 hover:border-primary cursor-pointer transition-colors"
                    >
                      {productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={productImage}
                          alt="معاينة المنتج"
                          className="w-24 h-24 object-cover rounded-xl mx-auto mb-2 border border-border"
                        />
                      ) : (
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      )}
                      <p className="text-xs font-bold text-foreground">
                        {productImage
                          ? "اضغط لتغيير الصورة المحددة"
                          : "ارفع صورة المنتج من جهازك (اختياري الآن)"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        PNG, JPG, WEBP حتى 5 ميجابايت
                      </p>
                    </label>
                    <input
                      id="onboarding-product-image"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentStep(2)}
                  >
                    السابق
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleFinishOnboarding}
                    isLoading={loading}
                    className="flex-1 font-bold shadow-xl shadow-primary/25 bg-primary text-primary-foreground"
                  >
                    <span>إنهاء وتجهيز المتجر! 🎉</span>
                    <Sparkles className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Celebration screen */}
            {currentStep === 4 && (
              <div className="text-center space-y-6 animate-in zoom-in-95 duration-300 py-4">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
                  <PartyPopper className="w-10 h-10 animate-bounce" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-foreground">
                    مبروك! متجرك جاهز للبيع 🎉
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    تم إنشاء متجر &ldquo;{storeName}&rdquo; بنجاح. شارك الرابط
                    الآن في بايو إنستجرام وابدأ في استقبال أوردراتك!
                  </p>
                </div>

                {/* Store link card */}
                <div className="p-4 rounded-2xl bg-secondary/60 border border-border flex items-center justify-between gap-3 max-w-md mx-auto">
                  <span className="text-sm font-black text-foreground dir-ltr truncate font-mono">
                    {getStoreDisplayUrl(storeSlug)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="gap-1.5 shrink-0 font-bold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "تم النسخ!" : "نسخ"}</span>
                  </Button>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <Link href={getStorePath(storeSlug)} target="_blank">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto font-bold gap-2"
                    >
                      <span>معاينة متجرك كعميل</span>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>

                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto font-bold shadow-xl shadow-primary/25 gap-2"
                    >
                      <span>الدخول للوحة التحكم</span>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        منصة متجرك © 2026 • دعم البراندات والمشاريع الصغيرة
      </div>
    </div>
  )
}
