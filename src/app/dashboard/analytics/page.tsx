"use client"

import React, { useState, useMemo } from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { computeStoreOrderMetrics } from "@/lib/commerce/engine"
import { BarAreaChart, HorizontalBreakdown } from "@/components/common/Charts"

export default function MerchantAnalyticsPage() {
  const { locale, pick, formatCurrency } = useI18n()
  const { store, storeOrders, storeProducts, storeCategories, storeCustomers } =
    useActiveMerchantStore()
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d")

  const metrics = useMemo(() => computeStoreOrderMetrics(storeOrders), [storeOrders])

  const series = useMemo(() => {
    const scale = range === "7d" ? 0.45 : range === "30d" ? 1 : 2.6
    const base = Math.max(metrics.totalSales, 5000) * scale
    const pts = range === "7d" ? 7 : 6
    return Array.from({ length: pts }, (_, i) => ({
      label:
        range === "7d"
          ? `${pick("يوم", "D")}${i + 1}`
          : `${pick("فترة", "P")}${i + 1}`,
      value: Math.round((base / pts) * (0.7 + ((i * 19) % 40) / 100)),
    }))
  }, [metrics.totalSales, range, pick])

  const categoryBreakdown = useMemo(() => {
    return storeCategories.slice(0, 5).map((cat) => {
      const sales = storeProducts
        .filter((p) => p.categoryId === cat.id)
        .reduce((sum, p) => sum + p.salesCount * p.price, 0)
      return {
        label: pick(cat.nameAr, cat.nameEn),
        value: Math.max(sales, 100),
        displayValue: formatCurrency(sales, store?.localization.currency),
        color: cat.accentColor,
      }
    })
  }, [storeCategories, storeProducts, pick, formatCurrency, store])

  if (!store) return null
  const currency = store.localization.currency

  const exportCsv = () => {
    const header = "OrderNumber,Date,Customer,Status,PaymentMethod,Total\n"
    const body = storeOrders
      .map(
        (o) =>
          `${o.orderNumber},${o.createdAt.slice(0, 10)},"${o.customerName}",${o.status},${o.paymentMethod},${o.total}`
      )
      .join("\n")
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${store.slug}-orders-${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(pick("تم تصدير تقرير CSV بنجاح", "CSV analytics report exported"))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {pick("تحليلات وتقارير المتجر", "Store Analytics & Reports")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pick(
              "قياس المبيعات ومتوسط سلة الشراء وأداء الأقسام خلال الفترات الزمنية.",
              "Track sales velocity, average order value, and category performance."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-card p-1">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold ${
                  range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="h-10 px-4 rounded-xl border border-border bg-card text-xs font-semibold inline-flex items-center gap-2 hover:bg-muted"
          >
            <Download className="w-4 h-4" />
            <span>{pick("تصدير CSV", "Export CSV")}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">{pick("إجمالي الإيرادات", "Net Sales")}</p>
          <p className="text-2xl font-bold tabular-nums mt-1">
            {formatCurrency(metrics.totalSales, currency)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">{pick("متوسط قيمة الطلب", "Average Order Value")}</p>
          <p className="text-2xl font-bold tabular-nums mt-1">
            {formatCurrency(metrics.averageOrderValue, currency)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">{pick("معدل الإتمام", "Fulfillment Rate")}</p>
          <p className="text-2xl font-bold tabular-nums mt-1">
            {metrics.totalOrders > 0
              ? `${Math.round(((metrics.totalOrders - metrics.cancelledCount) / metrics.totalOrders) * 100)}%`
              : "—"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">{pick("العملاء النشطون", "Active Customers")}</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{storeCustomers.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-4">
            {pick("منحنى الإيرادات", "Revenue Curve")} ({range.toUpperCase()})
          </h2>
          <BarAreaChart
            data={series}
            accentColor={store.theme.primaryColor === "#111111" ? "#2563EB" : store.theme.primaryColor}
            formatValue={(v) => formatCurrency(v, currency)}
          />
        </div>
        <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-4">
            {pick("المبيعات حسب القسم", "Revenue by Category")}
          </h2>
          {categoryBreakdown.length > 0 ? (
            <HorizontalBreakdown items={categoryBreakdown} />
          ) : (
            <p className="text-xs text-muted-foreground">
              {locale === "ar" ? "لا توجد أقسام بعد." : "No categories configured yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
