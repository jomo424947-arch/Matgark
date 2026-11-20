"use client"

import React from "react"
import Link from "next/link"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { BarAreaChart, HorizontalBreakdown } from "@/components/common/Charts"
import { StatusText } from "@/components/common/StatusText"
import { formatStoreStatusLabel } from "@/lib/i18n/translations"
import { ExternalLink, ArrowUpRight } from "lucide-react"

export default function AdminDashboardPage() {
  const { pick, locale, t, formatCurrency } = useI18n()
  const merchants = usePlatformStore((s) => s.merchants)
  const stores = usePlatformStore((s) => s.stores)
  const customers = usePlatformStore((s) => s.customers)
  const orders = usePlatformStore((s) => s.orders)
  const subscriptions = usePlatformStore((s) => s.subscriptions)
  const activityLogs = usePlatformStore((s) => s.activityLogs)

  const activeStores = stores.filter((s) => s.status === "published").length
  const suspendedStores = stores.filter((s) => s.status === "suspended").length
  const totalGmv = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((sum, o) => sum + o.total, 0)

  const activeSubs = subscriptions.filter((s) => s.status === "active")
  const mrr = activeSubs.reduce(
    (sum, s) =>
      sum + (s.billingPeriod === "yearly" ? Math.round(s.amount / 12) : s.amount),
    0
  )

  const kpis = [
    {
      label: t.admin.totalMerchants,
      value: String(merchants.length),
      sub: pick(`${merchants.filter((m) => m.status === "active").length} حساب نشط`, `${merchants.filter((m) => m.status === "active").length} active`),
    },
    {
      label: t.admin.activeStores,
      value: String(activeStores),
      sub: pick(`${suspendedStores} موقوف`, `${suspendedStores} suspended`),
    },
    {
      label: t.admin.totalCustomers,
      value: String(customers.length),
      sub: pick("عبر كل المتاجر", "Across all tenants"),
    },
    {
      label: t.admin.totalOrders,
      value: String(orders.length),
      sub: pick(`${orders.filter((o) => o.status === "delivered").length} مكتمل`, `${orders.filter((o) => o.status === "delivered").length} delivered`),
    },
    {
      label: t.admin.platformRevenue,
      value: formatCurrency(totalGmv),
      sub: pick("إجمالي مبيعات التجار", "Gross merchandise volume"),
    },
    {
      label: t.admin.mrr,
      value: formatCurrency(mrr),
      sub: pick(`${activeSubs.length} اشتراك نشط`, `${activeSubs.length} active plans`),
    },
  ]

  const revenueSeries = [
    { label: pick("يونيو", "Jun"), value: 42000 },
    { label: pick("يوليو", "Jul"), value: 58500 },
    { label: pick("أغسطس", "Aug"), value: 64200 },
    { label: pick("سبتمبر", "Sep"), value: 81400 },
    { label: pick("أكتوبر", "Oct"), value: 96800 },
    { label: pick("نوفمبر", "Nov"), value: Math.max(112000, totalGmv * 8) },
  ]

  const storeBreakdown = stores.map((store) => {
    const storeOrders = orders.filter((o) => o.storeId === store.id)
    const rev = storeOrders.reduce((sum, o) => sum + o.total, 0)
    return {
      label: pick(store.nameAr, store.nameEn),
      value: Math.max(rev, 200),
      displayValue: `${formatCurrency(rev)} · ${storeOrders.length} ${pick("طلب", "orders")}`,
      color: store.theme.primaryColor,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {pick("نظرة عامة على المنصة", "Platform Operations Overview")}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {pick(
              "متابعة شاملة للتجار والمتاجر والمبيعات والاشتراكات عبر المنصة",
              "Unified overview of merchants, storefronts, GMV, and active plans across the platform"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/merchants"
            className="h-9 px-3.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>{t.admin.merchants}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/subscriptions"
            className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>{t.admin.subscriptions}</span>
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="border border-border rounded-xl bg-card p-4 space-y-2"
          >
            <div className="text-xs text-muted-foreground font-medium leading-snug">
              {kpi.label}
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {kpi.value}
            </div>
            <div className="text-[11px] text-muted-foreground">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 border border-border rounded-xl bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {pick("نمو مبيعات المنصة (آخر 6 أشهر)", "Platform GMV Trend (Last 6 Months)")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {pick("إجمالي حجم التداول الشهري عبر جميع المتاجر", "Monthly gross merchandise value across active stores")}
              </p>
            </div>
          </div>
          <BarAreaChart
            data={revenueSeries}
            formatValue={(v) => formatCurrency(v)}
          />
        </div>

        <div className="lg:col-span-5 border border-border rounded-xl bg-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-foreground">
            {pick("توزيع الإيرادات حسب المتجر", "Revenue by Storefront")}
          </h2>
          <HorizontalBreakdown items={storeBreakdown} />
        </div>
      </div>

      {/* Stores Snapshot + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 border border-border rounded-xl bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              {pick("المتاجر المسجلة", "Registered Storefronts")}
            </h2>
            <Link href="/admin/stores" className="text-xs font-semibold text-primary hover:underline">
              {pick("إدارة الكل", "Manage All")}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2.5 px-4 text-start font-semibold">{pick("المتجر", "Store")}</th>
                  <th className="py-2.5 px-4 text-start font-semibold">{pick("القالب", "Theme")}</th>
                  <th className="py-2.5 px-4 text-start font-semibold">{t.common.status}</th>
                  <th className="py-2.5 px-4 text-end font-semibold">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">
                        {pick(store.nameAr, store.nameEn)}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        /s/{store.slug}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {store.theme.presetId}
                    </td>
                    <td className="py-3 px-4">
                      <StatusText
                        tone={
                          store.status === "published"
                            ? "success"
                            : store.status === "suspended"
                              ? "danger"
                              : "warning"
                        }
                        icon={
                          store.status === "published"
                            ? "check"
                            : store.status === "suspended"
                              ? "x"
                              : "clock"
                        }
                        label={formatStoreStatusLabel(store.status, locale)}
                      />
                    </td>
                    <td className="py-3 px-4 text-end">
                      <Link
                        href={`/s/${store.slug}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                      >
                        <span>{pick("عرض", "View")}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 border border-border rounded-xl bg-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-foreground">
            {t.admin.recentActivity}
          </h2>
          <div className="divide-y divide-border">
            {activityLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="text-xs font-medium text-foreground">
                  {pick(log.actionAr, log.actionEn)}
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                  <span>{log.actor}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {new Date(log.timestamp).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
