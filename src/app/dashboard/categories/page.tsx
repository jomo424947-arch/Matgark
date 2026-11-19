"use client"

import React, { useState } from "react"
import { Plus, ArrowUp, ArrowDown, Trash2, Star, FolderTree } from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"

export default function MerchantCategoriesPage() {
  const { pick } = useI18n()
  const { store, storeCategories, storeProducts } = useActiveMerchantStore()
  const createCategory = usePlatformStore((s) => s.createCategory)
  const updateCategory = usePlatformStore((s) => s.updateCategory)
  const deleteCategory = usePlatformStore((s) => s.deleteCategory)
  const moveCategoryOrder = usePlatformStore((s) => s.moveCategoryOrder)

  const [nameAr, setNameAr] = useState("")
  const [nameEn, setNameEn] = useState("")
  const [parentId, setParentId] = useState<string>("")
  const [isCollection, setIsCollection] = useState(false)
  const [featured, setFeatured] = useState(true)
  const [accentColor, setAccentColor] = useState("#18181B")

  if (!store) return null

  const rootCategories = storeCategories.filter((c) => !c.parentId)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameEn.trim() && !nameAr.trim()) return
    const cleanEn = nameEn.trim() || nameAr.trim()
    const cleanAr = nameAr.trim() || nameEn.trim()
    createCategory({
      storeId: store.id,
      parentId: parentId || null,
      nameAr: cleanAr,
      nameEn: cleanEn,
      slug: cleanEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `cat-${Date.now().toString().slice(-4)}`,
      descriptionAr: `تصفح قسم ${cleanAr}`,
      descriptionEn: `Explore ${cleanEn}`,
      isCollection,
      featured,
      displayOrder: storeCategories.length,
      accentColor,
    })
    setNameAr("")
    setNameEn("")
    setParentId("")
    toast.success(pick("تمت إضافة القسم بنجاح", "Category created"))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {pick("الأقسام والمجموعات", "Categories & Collections")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pick(
            "نظّم هيكل متجرك بأقسام رئيسية وفرعية ومجموعات موسمية مميزة.",
            "Organize your storefront with nested categories, subcategories, and featured collections."
          )}
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Create Form */}
        <form
          onSubmit={handleCreate}
          className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold">{pick("إضافة قسم أو مجموعة", "Add Category / Collection")}</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">
              {pick("الاسم (عربي)", "Name (Arabic)")}
            </label>
            <input
              required
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={pick("مثال: الإكسسوارات", "e.g. Accessories")}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              {pick("الاسم (إنجليزي)", "Name (English)")}
            </label>
            <input
              required
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Accessories"
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              {pick("القسم الأب (اختياري)", "Parent Category (Optional)")}
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="">{pick("قسم رئيسي", "Top-level category")}</option>
              {rootCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {pick(c.nameAr, c.nameEn)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold">{pick("اللون:", "Accent:")}</label>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-border"
            />
          </div>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCollection}
                onChange={(e) => setIsCollection(e.target.checked)}
              />
              <span>{pick("عرض كمجموعة موسمية (Collection)", "Mark as Curated Collection")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              <span>{pick("مميز في الصفحة الرئيسية", "Featured on Storefront Home")}</span>
            </label>
          </div>
          <button
            type="submit"
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>{pick("إضافة القسم", "Create Category")}</span>
          </button>
        </form>

        {/* Hierarchy Table */}
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold">
              {pick("هيكل الأقسام", "Category Tree")} ({storeCategories.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {storeCategories.map((cat) => {
              const parent = cat.parentId
                ? storeCategories.find((p) => p.id === cat.parentId)
                : null
              const prodCount = storeProducts.filter((p) => p.categoryId === cat.id).length
              return (
                <div
                  key={cat.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: cat.accentColor }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold flex items-center gap-2">
                        {parent && (
                          <span className="text-xs font-normal text-muted-foreground">
                            {pick(parent.nameAr, parent.nameEn)} /
                          </span>
                        )}
                        <span>{pick(cat.nameAr, cat.nameEn)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        /{cat.slug} · {prodCount} {pick("منتجات", "products")}
                        {cat.isCollection ? ` · ${pick("مجموعة", "Collection")}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title={pick("تبديل المميز", "Toggle featured")}
                      onClick={() => updateCategory(cat.id, { featured: !cat.featured })}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                        cat.featured
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategoryOrder(store.id, cat.id, "up")}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategoryOrder(store.id, cat.id, "down")}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteCategory(cat.id)
                        toast.success(pick("تم حذف القسم", "Category removed"))
                      }}
                      className="w-8 h-8 rounded-lg border border-border text-rose-600 flex items-center justify-center hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
