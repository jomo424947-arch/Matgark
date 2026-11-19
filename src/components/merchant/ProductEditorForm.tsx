"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Save, ArrowLeft, ArrowRight, Layers } from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { ProductVisual } from "@/components/common/ProductVisual"
import type { CatalogProduct, CatalogVariant, ProductPublishStatus } from "@/types/saas"

const VISUAL_TYPES: { id: CatalogProduct["visualType"]; label: string }[] = [
  { id: "hoodie", label: "Hoodie" },
  { id: "coat", label: "Coat / Jacket" },
  { id: "tshirt", label: "T-Shirt" },
  { id: "trousers", label: "Trousers" },
  { id: "dress", label: "Dress" },
  { id: "bag", label: "Bag" },
  { id: "sneakers", label: "Sneakers" },
  { id: "serum", label: "Serum Bottle" },
  { id: "cream", label: "Skincare Cream" },
  { id: "perfume", label: "Fragrance" },
  { id: "palette", label: "Makeup Palette" },
  { id: "headphones", label: "Headphones" },
  { id: "keyboard", label: "Keyboard" },
  { id: "watch", label: "Smartwatch" },
  { id: "speaker", label: "Audio Speaker" },
]

interface ProductEditorFormProps {
  existingProduct?: CatalogProduct
}

export function ProductEditorForm({ existingProduct }: ProductEditorFormProps) {
  const router = useRouter()
  const { locale, pick } = useI18n()
  const { store, storeCategories } = useActiveMerchantStore()
  const createProduct = usePlatformStore((s) => s.createProduct)
  const updateProduct = usePlatformStore((s) => s.updateProduct)

  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft

  const [nameAr, setNameAr] = useState(existingProduct?.nameAr || "")
  const [nameEn, setNameEn] = useState(existingProduct?.nameEn || "")
  const [descriptionAr, setDescriptionAr] = useState(existingProduct?.descriptionAr || "")
  const [descriptionEn, setDescriptionEn] = useState(existingProduct?.descriptionEn || "")
  const [price, setPrice] = useState(String(existingProduct?.price ?? 850))
  const [compareAtPrice, setCompareAtPrice] = useState(
    existingProduct?.compareAtPrice ? String(existingProduct.compareAtPrice) : ""
  )
  const [sku, setSku] = useState(existingProduct?.sku || "SKU-1001")
  const [barcode, setBarcode] = useState(existingProduct?.barcode || "")
  const [categoryId, setCategoryId] = useState(
    existingProduct?.categoryId || storeCategories[0]?.id || ""
  )
  const [status, setStatus] = useState<ProductPublishStatus>(
    existingProduct?.status || "active"
  )
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(existingProduct?.lowStockThreshold ?? 5)
  )
  const [weightKg, setWeightKg] = useState(String(existingProduct?.weightKg ?? 0.5))
  const [dimensions, setDimensions] = useState(existingProduct?.dimensions || "30x25x8 cm")
  const [seoTitle, setSeoTitle] = useState(existingProduct?.seoTitle || "")
  const [seoDescription, setSeoDescription] = useState(existingProduct?.seoDescription || "")
  const [visualType, setVisualType] = useState<CatalogProduct["visualType"]>(
    existingProduct?.visualType || "hoodie"
  )
  const [primaryTone, setPrimaryTone] = useState(
    existingProduct?.visualPalette[0] || store?.theme.primaryColor || "#111111"
  )
  const [secondaryTone, setSecondaryTone] = useState(
    existingProduct?.visualPalette[1] || store?.theme.accentColor || "#6B7280"
  )
  const [featured, setFeatured] = useState(existingProduct?.featured ?? false)
  const [bestSeller, setBestSeller] = useState(existingProduct?.bestSeller ?? false)
  const [newArrival, setNewArrival] = useState(existingProduct?.newArrival ?? true)

  const [variants, setVariants] = useState<CatalogVariant[]>(
    existingProduct?.variants.length
      ? existingProduct.variants
      : [
          {
            id: "v-init-1",
            sku: "SKU-1001-BLK-M",
            color: "Black",
            colorHex: "#18181B",
            size: "M",
            material: "",
            capacity: "",
            price: 850,
            stock: 18,
            available: true,
          },
        ]
  )

  if (!store) return null

  const addVariantRow = () => {
    const basePrice = Math.max(0, Number(price) || 0)
    setVariants((prev) => [
      ...prev,
      {
        id: `v-${Date.now()}-${prev.length + 1}`,
        sku: `${sku}-V${prev.length + 1}`,
        color: "",
        colorHex: primaryTone,
        size: "",
        material: "",
        capacity: "",
        price: basePrice,
        stock: 10,
        available: true,
      },
    ])
  }

  const updateVariantField = (
    id: string,
    field: keyof CatalogVariant,
    value: string | number | boolean
  ) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    )
  }

  const removeVariantRow = (id: string) => {
    if (variants.length <= 1) {
      toast.error(pick("يجب أن يحتوي المنتج على متغير واحد على الأقل.", "Product must keep at least one variant."))
      return
    }
    setVariants((prev) => prev.filter((v) => v.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanNameEn = nameEn.trim() || nameAr.trim()
    const cleanNameAr = nameAr.trim() || nameEn.trim()
    if (!cleanNameEn) {
      toast.error(pick("أدخل اسم المنتج.", "Please enter a product name."))
      return
    }

    const basePrice = Math.max(1, Number(price) || 1)
    const comparePriceNum = compareAtPrice ? Number(compareAtPrice) : undefined
    const slug =
      existingProduct?.slug ||
      cleanNameEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ||
      `product-${Date.now().toString().slice(-4)}`

    const payload = {
      storeId: store.id,
      categoryId: categoryId || storeCategories[0]?.id || "",
      nameAr: cleanNameAr,
      nameEn: cleanNameEn,
      slug,
      descriptionAr: descriptionAr.trim() || descriptionEn.trim(),
      descriptionEn: descriptionEn.trim() || descriptionAr.trim(),
      price: basePrice,
      compareAtPrice:
        comparePriceNum && comparePriceNum > basePrice ? comparePriceNum : undefined,
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: barcode.trim() || undefined,
      status,
      lowStockThreshold: Math.max(1, Number(lowStockThreshold) || 5),
      weightKg: Number(weightKg) || undefined,
      dimensions: dimensions.trim() || undefined,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      visualType,
      visualPalette: [primaryTone, secondaryTone] as [string, string],
      galleryTones: [primaryTone, secondaryTone, "#334155"],
      variants: variants.map((v) => ({
        ...v,
        price: Math.max(1, Number(v.price) || basePrice),
        stock: Math.max(0, Number(v.stock) || 0),
        available: (Number(v.stock) || 0) > 0 && v.available,
      })),
      specs: existingProduct?.specs ?? [
        { labelAr: "الحالة", labelEn: "Condition", valueAr: "جديد أصلي", valueEn: "Brand New" },
      ],
      reviews: existingProduct?.reviews ?? [],
      featured,
      bestSeller,
      newArrival,
    }

    if (existingProduct) {
      updateProduct(existingProduct.id, payload)
      toast.success(pick("تم تحديث المنتج بنجاح", "Product updated successfully"))
    } else {
      createProduct(payload)
      toast.success(pick("تم إنشاء المنتج وإضافته للكتالوج", "Product created and added to catalog"))
    }
    router.push("/dashboard/products")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted"
          >
            <BackIcon className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">
              {existingProduct
                ? pick("تعديل المنتج", "Edit Product")
                : pick("إضافة منتج جديد", "Create New Product")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {pick(
                "أدر التفاصيل، الأسعار، المقاسات والألوان والمخزون لكل متغير.",
                "Configure bilingual copy, pricing, SEO, and per-variant SKU and stock."
              )}
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-95"
        >
          <Save className="w-4 h-4" />
          <span>{existingProduct ? pick("حفظ التعديلات", "Save Product") : pick("إنشاء المنتج", "Publish Product")}</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Main Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Basic Info */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold">{pick("المعلومات الأساسية", "Product Information")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {pick("اسم المنتج (عربي)", "Product Name (Arabic)")}
                </label>
                <input
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="هودي قطن ثقيل"
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {pick("اسم المنتج (إنجليزي)", "Product Name (English)")}
                </label>
                <input
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Heavyweight Cotton Hoodie"
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {pick("الوصف (عربي)", "Description (Arabic)")}
                </label>
                <textarea
                  rows={3}
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {pick("الوصف (إنجليزي)", "Description (English)")}
                </label>
                <textarea
                  rows={3}
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Identifiers */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold">{pick("التسعير والمعرفات والشحن", "Pricing, SKU & Dimensions")}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {pick("السعر الأساسي", "Base Price")} ({store.localization.currency})
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {pick("السعر قبل الخصم", "Compare-at Price")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="Optional"
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {pick("تنبيه المخزون المنخفض", "Low-Stock Threshold")}
                </label>
                <input
                  type="number"
                  min={1}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">SKU</label>
                <input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">{pick("الباركود", "Barcode")}</label>
                <input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="622100..."
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">{pick("الوزن (كجم)", "Weight (kg)")}</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">{pick("الأبعاد", "Dimensions")}</label>
                <input
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Variants Matrix */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold">
                  {pick("متغيرات المنتج (المقاس / اللون / السعة / المخزون)", "Product Variants Matrix")}
                </h2>
              </div>
              <button
                type="button"
                onClick={addVariantRow}
                className="h-8 px-3 rounded-lg border border-border text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-muted"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{pick("إضافة متغير", "Add Variant")}</span>
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">
                      {pick(`متغير #${idx + 1}`, `Variant #${idx + 1}`)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVariantRow(v.id)}
                      className="text-rose-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{pick("حذف", "Remove")}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">
                        {pick("اللون", "Color")}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={v.colorHex || "#18181B"}
                          onChange={(e) => updateVariantField(v.id, "colorHex", e.target.value)}
                          className="w-7 h-8 rounded border border-border bg-transparent shrink-0"
                        />
                        <input
                          value={v.color || ""}
                          onChange={(e) => updateVariantField(v.id, "color", e.target.value)}
                          placeholder="Black"
                          className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">
                        {pick("المقاس", "Size")}
                      </label>
                      <input
                        value={v.size || ""}
                        onChange={(e) => updateVariantField(v.id, "size", e.target.value)}
                        placeholder="S / M / L"
                        className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">
                        {pick("السعة / الخامة", "Cap / Mat")}
                      </label>
                      <input
                        value={v.capacity || v.material || ""}
                        onChange={(e) => updateVariantField(v.id, "capacity", e.target.value)}
                        placeholder="50ml / Cotton"
                        className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">SKU</label>
                      <input
                        value={v.sku}
                        onChange={(e) => updateVariantField(v.id, "sku", e.target.value)}
                        className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">
                        {pick("السعر", "Price")}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={v.price}
                        onChange={(e) => updateVariantField(v.id, "price", Number(e.target.value))}
                        className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-mono tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">
                        {pick("المخزون", "Stock")}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={v.stock}
                        onChange={(e) => updateVariantField(v.id, "stock", Number(e.target.value))}
                        className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-mono tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEO */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold">{pick("تحسين محركات البحث (SEO)", "Search Engine Metadata (SEO)")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">SEO Title</label>
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">SEO Description</label>
                <input
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Publishing & Category */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold">{pick("النشر والتصنيف", "Status & Organization")}</h2>
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("حالة النشر", "Publish Status")}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductPublishStatus)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="active">{pick("نشط ومنشور", "Active (Published)")}</option>
                <option value="draft">{pick("مسودة", "Draft")}</option>
                <option value="archived">{pick("مؤرشف", "Archived")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("القسم", "Category")}</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
              >
                {storeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? "— " : ""}
                    {pick(c.nameAr, c.nameEn)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 pt-2 border-t border-border text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                <span>{pick("منتج مميز بالرئيسية", "Featured on Homepage")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={bestSeller} onChange={(e) => setBestSeller(e.target.checked)} />
                <span>{pick("ضمن الأكثر مبيعاً", "Include in Best Sellers")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newArrival} onChange={(e) => setNewArrival(e.target.checked)} />
                <span>{pick("ضمن وصل حديثاً", "Include in New Arrivals")}</span>
              </label>
            </div>
          </div>

          {/* Product Studio Visual Preview */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold">{pick("معاينة صور المنتج", "Studio Visual Preview")}</h2>
            <div className="aspect-square rounded-xl overflow-hidden border border-border">
              <ProductVisual type={visualType} palette={[primaryTone, secondaryTone]} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("نوع المجسم", "Product Silhouette")}</label>
              <select
                value={visualType}
                onChange={(e) => setVisualType(e.target.value as CatalogProduct["visualType"])}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
              >
                {VISUAL_TYPES.map((vt) => (
                  <option key={vt.id} value={vt.id}>
                    {vt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">{pick("لون أساسي", "Primary Tone")}</label>
                <input
                  type="color"
                  value={primaryTone}
                  onChange={(e) => setPrimaryTone(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{pick("لون ثانوي", "Secondary Tone")}</label>
                <input
                  type="color"
                  value={secondaryTone}
                  onChange={(e) => setSecondaryTone(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
