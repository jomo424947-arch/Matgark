"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { Plus, Search, Copy, Trash2, Edit3, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { getProductTotalStock, getStockLevelStatus } from "@/lib/commerce/engine"
import { ProductVisual } from "@/components/common/ProductVisual"
import { StatusText } from "@/components/common/StatusText"

export default function MerchantProductsPage() {
  const { pick, formatCurrency } = useI18n()
  const { store, storeProducts, storeCategories } = useActiveMerchantStore()
  const updateProduct = usePlatformStore((s) => s.updateProduct)
  const duplicateProduct = usePlatformStore((s) => s.duplicateProduct)
  const deleteProduct = usePlatformStore((s) => s.deleteProduct)

  const [query, setQuery] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return storeProducts.filter((p) => {
      const matchQuery =
        !q ||
        p.nameEn.toLowerCase().includes(q) ||
        p.nameAr.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      const matchCat = catFilter === "all" || p.categoryId === catFilter
      const matchStatus = statusFilter === "all" || p.status === statusFilter
      return matchQuery && matchCat && matchStatus
    })
  }, [storeProducts, query, catFilter, statusFilter])

  if (!store) return null
  const currency = store.localization.currency

  const getCategoryName = (catId: string) => {
    const cat = storeCategories.find((c) => c.id === catId)
    return cat ? pick(cat.nameAr, cat.nameEn) : "—"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {pick("إدارة المنتجات والكتالوج", "Products & Catalog")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pick(
              `${storeProducts.length} منتج في كتالوج ${store.nameAr}`,
              `${storeProducts.length} products in ${store.nameEn} catalog`
            )}
          </p>
        </div>

        <Link
          href="/dashboard/products/new"
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-95"
        >
          <Plus className="w-4 h-4" />
          <span>{pick("إضافة منتج جديد", "Add Product")}</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={pick("ابحث بالاسم أو SKU...", "Search by name or SKU...")}
            className="w-full h-10 rounded-xl border border-border bg-background ps-9 pe-3 text-sm"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
        >
          <option value="all">{pick("كل الأقسام", "All Categories")}</option>
          {storeCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {pick(c.nameAr, c.nameEn)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
        >
          <option value="all">{pick("كل الحالات", "All Statuses")}</option>
          <option value="active">{pick("نشط", "Active")}</option>
          <option value="draft">{pick("مسودة", "Draft")}</option>
          <option value="archived">{pick("مؤرشف", "Archived")}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <th className="text-start py-3 px-4 font-semibold">{pick("المنتج", "Product")}</th>
                <th className="text-start py-3 px-4 font-semibold">{pick("القسم", "Category")}</th>
                <th className="text-start py-3 px-4 font-semibold">{pick("السعر", "Price")}</th>
                <th className="text-start py-3 px-4 font-semibold">{pick("المخزون", "Inventory")}</th>
                <th className="text-start py-3 px-4 font-semibold">{pick("الحالة", "Status")}</th>
                <th className="text-end py-3 px-4 font-semibold">{pick("إجراءات", "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((prod) => {
                const totalStock = getProductTotalStock(prod)
                const stockStatus = getStockLevelStatus(prod)
                return (
                  <tr key={prod.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg overflow-hidden border border-border shrink-0">
                          <ProductVisual type={prod.visualType} palette={prod.visualPalette} />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/products/${prod.id}`}
                            className="font-semibold hover:text-primary truncate block max-w-[240px]"
                          >
                            {pick(prod.nameAr, prod.nameEn)}
                          </Link>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {prod.sku} · {prod.variants.length}{" "}
                            {pick("متغيرات", "variants")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {getCategoryName(prod.categoryId)}
                    </td>
                    <td className="py-3 px-4 tabular-nums">
                      <p className="font-semibold text-xs">{formatCurrency(prod.price, currency)}</p>
                      {prod.compareAtPrice && (
                        <p className="text-[11px] text-muted-foreground line-through">
                          {formatCurrency(prod.compareAtPrice, currency)}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusText
                        tone={
                          stockStatus === "out_of_stock"
                            ? "danger"
                            : stockStatus === "low_stock"
                              ? "warning"
                              : "success"
                        }
                        label={`${totalStock} ${pick("قطعة", "in stock")}`}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <StatusText
                        tone={
                          prod.status === "active"
                            ? "success"
                            : prod.status === "draft"
                              ? "warning"
                              : "neutral"
                        }
                        label={
                          prod.status === "active"
                            ? pick("نشط", "Active")
                            : prod.status === "draft"
                              ? pick("مسودة", "Draft")
                              : pick("مؤرشف", "Archived")
                        }
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title={pick("تبديل النشر", "Toggle publish")}
                          onClick={() => {
                            const next = prod.status === "active" ? "draft" : "active"
                            updateProduct(prod.id, { status: next })
                            toast.success(
                              next === "active"
                                ? pick("تم نشر المنتج", "Product published")
                                : pick("تم تحويل المنتج لمسودة", "Product moved to draft")
                            )
                          }}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                        >
                          {prod.status === "active" ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <Link
                          href={`/dashboard/products/${prod.id}`}
                          title={pick("تعديل", "Edit")}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          title={pick("نسخ المنتج", "Duplicate")}
                          onClick={() => {
                            duplicateProduct(prod.id)
                            toast.success(pick("تم نسخ المنتج كمسودة", "Product duplicated as draft"))
                          }}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {confirmDeleteId === prod.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              deleteProduct(prod.id)
                              setConfirmDeleteId(null)
                              toast.success(pick("تم حذف المنتج", "Product deleted"))
                            }}
                            className="h-8 px-2.5 rounded-lg bg-rose-600 text-white text-xs font-semibold"
                          >
                            {pick("تأكيد", "Confirm")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            title={pick("حذف", "Delete")}
                            onClick={() => setConfirmDeleteId(prod.id)}
                            className="w-8 h-8 rounded-lg border border-border text-rose-600 flex items-center justify-center hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    {pick("لا توجد منتجات مطابقة لخيارات البحث.", "No products match your current filters.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
