"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useMerchantStore } from "@/stores/merchantStore"
import { Upload, Plus, Trash2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function NewProductPage() {
  const router = useRouter()
  const addProduct = useMerchantStore((s) => s.addProduct)

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("ملابس كاجوال")
  const [description, setDescription] = useState("")
  const [variants, setVariants] = useState([
    { size: "S", color: "أسود", stock: "10" },
    { size: "M", color: "أسود", stock: "15" },
    { size: "L", color: "أسود", stock: "10" },
  ])
  const [loading, setLoading] = useState(false)

  const addVariant = () => {
    setVariants([...variants, { size: "M", color: "أبيض", stock: "5" }])
  }

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return
    setVariants(variants.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !price) return
    setLoading(true)
    addProduct({
      name: name.trim(),
      price: Number(price),
      category,
      description,
      variants,
    })
    setTimeout(() => {
      setLoading(false)
      toast.success("تم إضافة المنتج ونشره في متجرك بنجاح!")
      router.push("/products")
    }, 400)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-right">
      {/* الرأس */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            إضافة منتج جديد
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            أدخل تفاصيل المنتج وارفعه لمتجرك في ثواني
          </p>
        </div>

        <Link href="/products">
          <Button variant="ghost" size="sm">
            إلغاء والعودة
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* معلومات المنتج الأساسية */}
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
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="السعر للعميل (بالجنيه المصري) *"
                type="number"
                placeholder="450"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                dir="ltr"
                className="text-right"
              />

              <div className="space-y-2">
                <label
                  htmlFor="new-product-category"
                  className="block text-sm font-semibold text-foreground/90"
                >
                  الفئة / التصنيف
                </label>
                <select
                  id="new-product-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-12 rounded-2xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
                >
                  <option value="ملابس كاجوال">ملابس رجالي / حريمي</option>
                  <option value="ملابس شتوية">ملابس شتوية</option>
                  <option value="أحذية">أحذية وسنيكرز</option>
                  <option value="بناطيل">بناطيل</option>
                  <option value="إكسسوارات">إكسسوارات وشنط</option>
                  <option value="أشغال يدوية">أشغال يدوية وكروشيه</option>
                  <option value="أكل وحلويات">أكل ومخبوزات</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="new-product-description"
                className="block text-sm font-semibold text-foreground/90"
              >
                وصف المنتج (اختياري)
              </label>
              <textarea
                id="new-product-description"
                rows={3}
                placeholder="اكتب تفاصيل الخامة، تعليمات الغسيل، أو أي تفاصيل يحتاجها العميل..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 rounded-2xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-right resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* رفع صور المنتج */}
        <Card>
          <CardHeader>
            <CardTitle>صور المنتج</CardTitle>
            <CardDescription>الصور الواضحة بتزود المبيعات بنسبة 80%</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-3xl p-8 text-center hover:border-primary/60 transition-colors cursor-pointer bg-muted/20">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                اسحب الصور وأفلتها هنا، أو اضغط للاختيار من جهازك
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WEBP حتى 5 ميجابايت (تقدر ترفع حتى 5 صور للمنتج)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* المقاسات والألوان والمخزون */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>المقاسات والألوان (Variants)</CardTitle>
              <CardDescription>حدد المقاسات وكمية المخزون المتاحة</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariant}
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
                    <label
                      htmlFor={`variant-size-${idx}`}
                      className="block text-[11px] font-semibold text-muted-foreground mb-1"
                    >
                      المقاس
                    </label>
                    <input
                      id={`variant-size-${idx}`}
                      type="text"
                      value={v.size}
                      onChange={(e) => {
                        const newV = [...variants]
                        newV[idx].size = e.target.value
                        setVariants(newV)
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-center font-bold"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`variant-color-${idx}`}
                      className="block text-[11px] font-semibold text-muted-foreground mb-1"
                    >
                      اللون
                    </label>
                    <input
                      id={`variant-color-${idx}`}
                      type="text"
                      value={v.color}
                      onChange={(e) => {
                        const newV = [...variants]
                        newV[idx].color = e.target.value
                        setVariants(newV)
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-center font-bold"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`variant-stock-${idx}`}
                      className="block text-[11px] font-semibold text-muted-foreground mb-1"
                    >
                      الكمية بالمخزن
                    </label>
                    <input
                      id={`variant-stock-${idx}`}
                      type="number"
                      value={v.stock}
                      onChange={(e) => {
                        const newV = [...variants]
                        newV[idx].stock = e.target.value
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
                  aria-label={`حذف الخيار رقم ${idx + 1}`}
                  title="حذف هذا الخيار"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* زر الحفظ */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link href="/products">
            <Button variant="outline" size="lg">
              إلغاء
            </Button>
          </Link>
          <Button
            type="submit"
            size="lg"
            className="font-bold shadow-xl shadow-primary/25 px-8"
            isLoading={loading}
          >
            <CheckCircle2 className="w-5 h-5 ml-2" />
            <span>حفظ ونشر في المتجر</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
