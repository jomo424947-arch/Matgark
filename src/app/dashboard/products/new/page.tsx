"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card"
import { createProductAction } from "@/server/actions/products"
import { Upload, Plus, Trash2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function NewProductPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("ملابس")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [variants, setVariants] = useState([
    { size: "", color: "", stock: "0" },
  ])
  const [loading, setLoading] = useState(false)

  const addVariant = () => {
    setVariants((current) => [...current, { size: "", color: "", stock: "0" }])
  }

  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
      toast.error("يجب تحديد خيار مقاس ولون واحد على الأقل")
      return
    }
    setVariants(variants.filter((_, i) => i !== index))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("اختاري صورة PNG أو JPG أو WEBP فقط")
      e.target.value = ""
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً، الحد الأقصى 5 ميجابايت")
      e.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImage(reader.result)
        toast.success("تم اختيار الصورة بنجاح")
      }
    }
    reader.onerror = () => toast.error("تعذر قراءة الصورة، اختاري ملفاً آخر")
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numericPrice = Number(price)
    if (
      name.trim().length < 2 ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0 ||
      !category.trim()
    ) {
      toast.error("يرجى إدخال اسم منتج صحيح وفئة وسعر أكبر من صفر")
      return
    }
    if (description.trim().length > 1000) {
      toast.error("وصف المنتج يجب ألا يتجاوز 1000 حرف")
      return
    }

    if (variants.some((v) => !v.size.trim() || !v.color.trim() || !Number.isInteger(Number(v.stock)) || Number(v.stock) < 0)) {
      toast.error("راجعي المقاسات والألوان وكميات المخزون")
      return
    }

    setLoading(true)
    let res: Awaited<ReturnType<typeof createProductAction>>
    try {
      res = await createProductAction({
        name: name.trim(),
        price: numericPrice,
        category: category.trim(),
        description: description.trim() || undefined,
        image: image || undefined,
        variants: variants.map((v) => ({
          size: v.size.trim(),
          color: v.color.trim(),
          stock: Number(v.stock),
        })),
      })
    } catch {
      toast.error("حدث خطأ أثناء إضافة المنتج. حاولي مرة أخرى.")
      return
    } finally {
      setLoading(false)
    }

    if (!res.ok) {
      toast.error(res.error || "فشل إضافة المنتج")
      return
    }

    toast.success("تمت إضافة المنتج بنجاح!")
    router.push("/dashboard/products")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-right">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            إضافة منتج جديد
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            أدخل تفاصيل المنتج وارفعه لمتجرك في ثواني
          </p>
        </div>

        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm">
            إلغاء والعودة
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>البيانات الأساسية</CardTitle>
            <CardDescription>الاسم والسعر وتصنيف المنتج</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="اسم المنتج *"
              placeholder="مثال: جاكيت جينز أوفرسايز"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="السعر للعميل (بالجنيه المصري) *"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="450"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                dir="ltr"
                className="text-right font-bold"
              />

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground/90">
                  الفئة / التصنيف
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full h-12 rounded-2xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
                >
                  <option value="ملابس">ملابس رجالي / حريمي</option>
                  <option value="أحذية">أحذية وسنيكرز</option>
                  <option value="إكسسوارات">إكسسوارات وشنط</option>
                  <option value="أشغال يدوية">أشغال يدوية وكروشيه</option>
                  <option value="أكل وحلويات">أكل ومخبوزات</option>
                  <option value="أخرى">فئة أخرى</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground/90">
                وصف المنتج (اختياري)
              </label>
              <textarea
                rows={3}
                placeholder="اكتب تفاصيل الخامة، تعليمات الغسيل، أو أي تفاصيل يحتاجها العميل..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                className="w-full p-4 rounded-2xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-right resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle>صورة المنتج</CardTitle>
            <CardDescription>
              اختاري صورة واضحة تمثل المنتج وتساعد العميل على التعرف عليه
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label
              htmlFor="new-product-file"
              className="block border-2 border-dashed border-border rounded-3xl p-8 text-center hover:border-primary/60 transition-colors cursor-pointer bg-muted/20"
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt="معاينة المنتج"
                  className="w-32 h-32 object-cover rounded-2xl mx-auto mb-4 border border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8" />
                </div>
              )}
              <h4 className="text-sm font-bold text-foreground">
                {image
                  ? "اضغط لتغيير الصورة المحددة"
                  : "اضغط لاختيار صورة المنتج من جهازك"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WEBP حتى 5 ميجابايت
              </p>
            </label>
            <input
              id="new-product-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>المقاسات والألوان (Variants)</CardTitle>
              <CardDescription>
                حدد المقاسات وكمية المخزون المتاحة
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariant}
              disabled={loading}
              className="font-bold gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة خيار</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {variants.map((v, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border"
              >
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      المقاس
                    </label>
                    <input
                      type="text"
                      aria-label={`مقاس الخيار ${idx + 1}`}
                      value={v.size}
                      onChange={(e) => {
                        const newV = [...variants]
                        newV[idx]!.size = e.target.value
                        setVariants(newV)
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      اللون
                    </label>
                    <input
                      type="text"
                      aria-label={`لون الخيار ${idx + 1}`}
                      value={v.color}
                      onChange={(e) => {
                        const newV = [...variants]
                        newV[idx]!.color = e.target.value
                        setVariants(newV)
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      الكمية بالمخزن
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      aria-label={`كمية مخزون الخيار ${idx + 1}`}
                      value={v.stock}
                      onChange={(e) => {
                        const newV = [...variants]
                        newV[idx]!.stock = e.target.value
                        setVariants(newV)
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-center font-bold dir-ltr"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  className="p-2.5 rounded-xl hover:bg-destructive/10 text-destructive mt-4"
                  title="حذف هذا الخيار"
                  aria-label={`حذف الخيار ${idx + 1}`}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link href="/dashboard/products">
            <Button variant="outline" size="lg">
              إلغاء
            </Button>
          </Link>
          <Button
            type="submit"
            size="lg"
            className="font-bold shadow-xl shadow-primary/25 px-8"
            isLoading={loading}
            disabled={loading}
          >
            <CheckCircle2 className="w-5 h-5 ml-2" />
            <span>حفظ المنتج</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
