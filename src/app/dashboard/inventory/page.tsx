"use client"

import React, { useState, useMemo } from "react"
import { Search, Plus, Minus, History, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { formatVariantLabel } from "@/lib/commerce/engine"
import { StatusText } from "@/components/common/StatusText"
import { ProductVisual } from "@/components/common/ProductVisual"

export default function MerchantInventoryPage() {
  const { pick } = useI18n()
  const { merchantSession, store, storeProducts, storeInventoryLogs } =
    useActiveMerchantStore()
  const adjustVariantStock = usePlatformStore((s) => s.adjustVariantStock)

  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "low" | "out">("all")
  const [customModal, setCustomModal] = useState<{
    productId: string
    variantId: string
    title: string
    currentStock: number
  } | null>(null)
  const [deltaInput, setDeltaInput] = useState("10")
  const [noteInput, setNoteInput] = useState("")

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const flat = storeProducts.flatMap((prod) =>
      prod.variants.map((v) => ({
        product: prod,
        variant: v,
        variantLabel: formatVariantLabel(v),
        isOut: v.stock <= 0,
        isLow: v.stock > 0 && v.stock <= prod.lowStockThreshold,
      }))
    )

    return flat.filter((row) => {
      const matchQuery =
        !q ||
        row.product.nameEn.toLowerCase().includes(q) ||
        row.product.nameAr.toLowerCase().includes(q) ||
        row.variant.sku.toLowerCase().includes(q)
      if (!matchQuery) return false
      if (filter === "out") return row.isOut
      if (filter === "low") return row.isLow || row.isOut
      return true
    })
  }, [storeProducts, query, filter])

  if (!store) return null
  const actorName = merchantSession?.name || "Merchant"

  const quickAdjust = (productId: string, variantId: string, delta: number) => {
    adjustVariantStock({
      storeId: store.id,
      productId,
      variantId,
      delta,
      reason: delta > 0 ? "restock" : "manual_adjustment",
      note: delta > 0 ? "Quick restock" : "Manual deduction",
      actor: actorName,
    })
    toast.success(pick("تم تحديث رصيد المخزون", "Inventory stock updated"))
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customModal) return
    const delta = Number(deltaInput)
    if (!Number.isFinite(delta) || delta === 0) return
    adjustVariantStock({
      storeId: store.id,
      productId: customModal.productId,
      variantId: customModal.variantId,
      delta,
      reason: delta > 0 ? "restock" : "manual_adjustment",
      note: noteInput.trim() || undefined,
      actor: actorName,
    })
    toast.success(pick("تم تسجيل حركة المخزون بنجاح", "Stock adjustment recorded"))
    setCustomModal(null)
    setNoteInput("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {pick("إدارة المخزون وسجل الحركات", "Inventory & Stock Ledger")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pick(
            "تابع كميات كل مقاس ولون على حدة وعدّل المخزون مع تسجيل تلقائي في السجل.",
            "Track per-variant stock quantities, resolve low-stock alerts, and audit every adjustment."
          )}
        </p>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={pick("ابحث باسم المنتج أو SKU...", "Search product or variant SKU...")}
            className="w-full h-10 rounded-xl border border-border bg-background ps-9 pe-3 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(["all", "low", "out"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`h-9 px-3.5 rounded-xl text-xs font-semibold transition-colors ${
                filter === tab
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-muted"
              }`}
            >
              {tab === "all"
                ? pick("الكل", "All Variants")
                : tab === "low"
                  ? pick("مخزون منخفض", "Low Stock")
                  : pick("نفذ المخزون", "Out of Stock")}
            </button>
          ))}
        </div>
      </div>

      {/* Variants Stock Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <th className="text-start py-3 px-4 font-semibold">{pick("المنتج والمتغير", "Product & Variant")}</th>
                <th className="text-start py-3 px-4 font-semibold">SKU</th>
                <th className="text-start py-3 px-4 font-semibold">{pick("الحالة", "Health")}</th>
                <th className="text-center py-3 px-4 font-semibold">{pick("الكمية المتاحة", "Available")}</th>
                <th className="text-end py-3 px-4 font-semibold">{pick("تعديل سريع", "Quick Adjust")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ product, variant, variantLabel, isOut, isLow }) => (
                <tr key={variant.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                        <ProductVisual
                          type={product.visualType}
                          palette={product.visualPalette}
                          toneOverride={variant.colorHex}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-xs">{pick(product.nameAr, product.nameEn)}</p>
                        <p className="text-[11px] text-muted-foreground">{variantLabel}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{variant.sku}</td>
                  <td className="py-3 px-4">
                    <StatusText
                      tone={isOut ? "danger" : isLow ? "warning" : "success"}
                      icon={isOut ? "x" : isLow ? "warn" : "check"}
                      label={
                        isOut
                          ? pick("نفذ المخزون", "Out of stock")
                          : isLow
                            ? pick("منخفض", "Low stock")
                            : pick("متوفر", "Healthy")
                      }
                    />
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                    {variant.stock}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => quickAdjust(product.id, variant.id, -1)}
                        disabled={variant.stock <= 0}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => quickAdjust(product.id, variant.id, 1)}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomModal({
                            productId: product.id,
                            variantId: variant.id,
                            title: `${pick(product.nameAr, product.nameEn)} — ${variantLabel}`,
                            currentStock: variant.stock,
                          })
                          setDeltaInput("10")
                        }}
                        className="h-8 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                      >
                        {pick("تعديل مخصص", "Adjust")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment History Log */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold">{pick("سجل حركات المخزون", "Stock Adjustment History")}</h2>
        </div>
        <div className="divide-y divide-border">
          {storeInventoryLogs.slice(0, 12).map((log) => (
            <div key={log.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-semibold">
                  {pick(log.productNameAr, log.productNameEn)} · {log.variantLabel}
                </p>
                <p className="text-muted-foreground">
                  {log.actor} · {log.note || log.reason}
                </p>
              </div>
              <div className="text-end font-mono tabular-nums">
                <span
                  className={
                    log.delta >= 0
                      ? "text-emerald-600 dark:text-emerald-400 font-bold"
                      : "text-rose-600 dark:text-rose-400 font-bold"
                  }
                >
                  {log.delta >= 0 ? `+${log.delta}` : log.delta}
                </span>
                <span className="text-muted-foreground ms-2">
                  ({log.previousStock} → {log.newStock})
                </span>
              </div>
            </div>
          ))}
          {storeInventoryLogs.length === 0 && (
            <p className="p-6 text-center text-xs text-muted-foreground">
              {pick("لا توجد حركات مخزون مسجلة بعد.", "No stock adjustments recorded yet.")}
            </p>
          )}
        </div>
      </div>

      {/* Custom Adjust Modal */}
      {customModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCustomSubmit}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold">{pick("تعديل رصيد المخزون", "Adjust Variant Stock")}</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {customModal.title} ({pick("الحالي:", "Current:")} {customModal.currentStock})
            </p>
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                {pick("مقدار التغيير (+ للإضافة أو - للخصم)", "Quantity Delta (+ to add, - to deduct)")}
              </label>
              <input
                type="number"
                required
                value={deltaInput}
                onChange={(e) => setDeltaInput(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                {pick("سبب التعديل / ملاحظة", "Reason / Note")}
              </label>
              <input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={pick("شحنة توريد جديدة", "New warehouse restock")}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomModal(null)}
                className="h-9 px-4 rounded-xl border border-border text-xs font-semibold"
              >
                {pick("إلغاء", "Cancel")}
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
              >
                {pick("حفظ التعديل", "Apply Adjustment")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
