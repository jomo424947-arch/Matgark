"use client"

import React, { useState } from "react"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { BarAreaChart, HorizontalBreakdown } from "@/components/common/Charts"
import { Download } from "lucide-react"
import { toast } from "sonner"

export default function AdminAnalyticsPage() {
  const { pick, t, formatCurrency } = useI18n()
  const orders = usePlatformStore((s) => s.orders)
  const stores = usePlatformStore((s) => s.stores)
  const merchants = usePlatformStore((s) => s.merchants)
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "12m">("30d")

  const multiplier = range === "7d" ? 0.35 : range === "30d" ? 1 : range === "90d" ? 2.6 : 9.4
  const baseGmv = orders.reduce((s, o) => s + o.total, 0)
  const scaledGmv = Math.round(baseGmv * multiplier)

  const acquisitionSeries = [
    { label: "W1", value: Math.round(6 * multiplier) },
    { label: "W2", value: Math.round(9 * multiplier) },
    { label: "W3", value: Math.round(12 * multiplier) },
    { label: "W4", value: Math.round(16 * multiplier) },
    { label: "W5", value: Math.round(21 * multiplier) },
    { label: "W6", value: Math.round(24 * multiplier) },
  ]

  const categoryDistribution = [
    {
      label: pick("الأزياء والملابس", "Fashion & Apparel"),
      value: 52,
      displayValue: "52%",
      color: "#18181B",
    },
    {
      label: pick("التجميل والعناية", "Beauty & Cosmetics"),
      value: 28,
      displayValue: "28%",
      color: "#B86B52",
    },
    {
      label: pick("الإلكترونيات والتقنية", "Electronics & Tech"),
      value: 20,
      displayValue: "20%",
      color: "#0F4C81",
    },
  ]

  const handleExportCsv = () => {
    const rows = [
      ["Store", "Slug", "Status", "Orders", "Revenue"],
      ...stores.map((s) => {
        const sOrders = orders.filter((o) => o.storeId === s.id)
        const rev = sOrders.reduce((sum, o) => sum + o.total, 0)
        return [s.nameEn, s.slug, s.status, String(sOrders.length), String(rev)]
      }),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `matgarak-platform-analytics-${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(pick("تم تصدير تقرير المنصة بصيغة CSV", "Exported platform CSV report"))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t.admin.analytics}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {pick(
              "مؤشرات النمو واستحواذ التجار ومعدل التحويل للباقات المدفوعة.",
              "Revenue overview, merchant acquisition velocity, store creation trends, and plan conversion."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-muted rounded-lg border border-border">
            {(["7d", "30d", "90d", "12m"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md cursor-pointer ${
                  range === r
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.common.exportCsv}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-border rounded-xl bg-card p-5 space-y-1">
          <div className="text-xs text-muted-foreground">{pick("حجم المبيعات (GMV)", "Period GMV")}</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
            {formatCurrency(scaledGmv)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">+24.2%</div>
        </div>
        <div className="border border-border rounded-xl bg-card p-5 space-y-1">
          <div className="text-xs text-muted-foreground">{pick("التجار النشطون", "Active Merchants")}</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
            {merchants.filter((m) => m.status === "active").length}
          </div>
          <div className="text-[11px] text-muted-foreground">{pick("معدل احتفاظ 94%", "94% retention")}</div>
        </div>
        <div className="border border-border rounded-xl bg-card p-5 space-y-1">
          <div className="text-xs text-muted-foreground">{pick("تحويل الباقات المدفوعة", "Paid Plan Conversion")}</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
            75.0%
          </div>
          <div className="text-[11px] text-muted-foreground">{pick("3 من 4 متاجر مدفوعة", "3 of 4 paid tiers")}</div>
        </div>
        <div className="border border-border rounded-xl bg-card p-5 space-y-1">
          <div className="text-xs text-muted-foreground">{pick("متوسط قيمة الطلب", "Platform AOV")}</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
            {formatCurrency(orders.length ? Math.round(baseGmv / orders.length) : 0)}
          </div>
          <div className="text-[11px] text-muted-foreground">{pick("عبر كل العملات", "Blended average")}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 border border-border rounded-xl bg-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-foreground">
            {pick("اتجاه إنشاء المتاجر واستحواذ التجار", "Merchant Acquisition & Store Creation")}
          </h2>
          <BarAreaChart data={acquisitionSeries} accentColor="#0F4C81" />
        </div>
        <div className="lg:col-span-5 border border-border rounded-xl bg-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-foreground">
            {pick("توزيع المتاجر حسب القطاع", "Storefront Sector Distribution")}
          </h2>
          <HorizontalBreakdown items={categoryDistribution} />
        </div>
      </div>
    </div>
  )
}
