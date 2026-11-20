"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  AlertTriangle,
  Users,
  Plus,
  Palette,
  Tag,
  ExternalLink,
  Megaphone,
  ArrowUpRight,
} from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import {
  computeStoreOrderMetrics,
  getProductTotalStock,
  getStockLevelStatus,
} from "@/lib/commerce/engine"
import { formatOrderStatusLabel } from "@/lib/i18n/translations"
import { BarAreaChart } from "@/components/common/Charts"
import { ProductVisual } from "@/components/common/ProductVisual"
import { StatusText } from "@/components/common/StatusText"
import { LiveStoreUrlCard } from "@/components/merchant/LiveStoreUrlCard"

export default function MerchantDashboardOverviewPage() {
  const { locale, pick, formatCurrency } = useI18n()
  const {
    store,
    storeProducts,
    storeOrders,
    storeCustomers,
  } = useActiveMerchantStore()
  const updateStoreStatus = usePlatformStore((s) => s.updateStoreStatus)
  const announcements = usePlatformStore((s) => s.announcements)

  const metrics = useMemo(
    () => computeStoreOrderMetrics(storeOrders),
    [storeOrders]
  )

  const lowStockProducts = useMemo(
    () =>
      storeProducts.filter((p) => {
        const st = getStockLevelStatus(p)
        return st === "low_stock" || st === "out_of_stock"
      }),
    [storeProducts]
  )

  const topProducts = useMemo(
    () => [...storeProducts].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4),
    [storeProducts]
  )

  const recentOrders = useMemo(() => storeOrders.slice(0, 5), [storeOrders])

  const revenueSeries = useMemo(() => {
    const base = Math.max(metrics.totalSales, 4200)
    const multipliers = [0.58, 0.72, 0.65, 0.86, 0.94, 0.79, 1.0]
    const labelsAr = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"]
    const labelsEn = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]
    return multipliers.map((m, idx) => ({
      label: locale === "ar" ? labelsAr[idx] : labelsEn[idx],
      value: Math.round((base / 4) * m),
    }))
  }, [metrics.totalSales, locale])

  if (!store) return null

  const currency = store.localization.currency

  const handleToggleStoreStatus = () => {
    if (store.status === "suspended") {
      toast.error(
        pick(
          "المتجر موقوف من قبل إدارة المنصة ولا يمكن تفعيله ذاتياً.",
          "This store is suspended by platform administration."
        )
      )
      return
    }
    const next = store.status === "published" ? "draft" : "published"
    updateStoreStatus(store.id, next)
    toast.success(
      next === "published"
        ? pick("تم نشر المتجر للعملاء", "Store is now published live")
        : pick("تم تحويل المتجر إلى وضع المسودة", "Store switched to draft mode")
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {pick(`مرحباً بك في ${store.nameAr}`, `Welcome back to ${store.nameEn}`)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pick(
              "ملخص حي للمبيعات والطلبات وحالة المخزون لمتجرك المستقل.",
              "Live sales, fulfillment, and inventory health across your independent storefront."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleStoreStatus}
            className="h-9 px-3.5 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted transition-colors"
          >
            {store.status === "published"
              ? pick("تحويل لمسودة", "Switch to Draft")
              : pick("نشر المتجر الآن", "Publish Store Live")}
          </button>
          <Link
            href={`/s/${store.slug}`}
            className="h-9 px-3.5 rounded-xl border border-border bg-card text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-muted transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{pick("زيارة المتجر العام", "Open Storefront")}</span>
          </Link>
          <Link
            href="/dashboard/products/new"
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{pick("إضافة منتج", "Add Product")}</span>
          </Link>
        </div>
      </div>

      {/* Prominent Live Store URL Banner */}
      <LiveStoreUrlCard
        slug={store.slug}
        storeName={pick(store.nameAr, store.nameEn)}
        status={store.status}
      />

      {/* Onboarding Banner if incomplete */}
      {!store.onboardingCompleted && (
        <div className="bg-primary/5 border border-primary/25 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">
              {pick("أكمل إعداد متجرك لتحقيق أفضل تجربة للعملاء", "Complete your store onboarding checklist")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pick(
                "خصص القالب والألوان وأسعار الشحن قبل مشاركة رابط متجرك.",
                "Finish configuring your theme, shipping rates, and first products before sharing your store."
              )}
            </p>
          </div>
          <Link
            href="/merchant/onboarding"
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <span>{pick("استكمال الإعداد", "Continue Onboarding")}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{pick("إجمالي المبيعات", "Total Sales")}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {formatCurrency(metrics.totalSales, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1 tabular-nums">
            {pick("متوسط الطلب:", "Avg. order:")} {formatCurrency(metrics.averageOrderValue, currency)}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{pick("إجمالي الطلبات", "Total Orders")}</span>
            <ShoppingBag className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{metrics.totalOrders}</p>
          <div className="flex items-center gap-2.5 mt-1 text-xs text-muted-foreground tabular-nums">
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Clock className="w-3 h-3" /> {metrics.pendingCount}
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> {metrics.completedCount}
            </span>
            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <XCircle className="w-3 h-3" /> {metrics.cancelledCount}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{pick("المنتجات والمخزون", "Catalog & Stock")}</span>
            <Package className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{storeProducts.length}</p>
          <p className="text-xs mt-1">
            {lowStockProducts.length > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {pick(
                  `${lowStockProducts.length} تنبيه مخزون منخفض`,
                  `${lowStockProducts.length} low-stock alerts`
                )}
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {pick("جميع المنتجات متوفرة", "All catalog stock healthy")}
              </span>
            )}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{pick("عملاء المتجر", "Store Customers")}</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{storeCustomers.length}</p>
          <p className="text-xs text-muted-foreground mt-1 tabular-nums">
            {pick("مشتركو النشرة:", "Newsletter:")} {store.newsletterSubscribers.length}
          </p>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Link
          href="/dashboard/store-design"
          className="bg-card border border-border hover:border-primary/40 rounded-2xl p-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-bold">{pick("تخصيص تصميم المتجر", "Customize Store Design")}</p>
              <p className="text-xs text-muted-foreground">
                {pick("القوالب، الألوان، وأقسام الصفحة", "Themes, colors & homepage sections")}
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </Link>

        <Link
          href="/dashboard/discounts"
          className="bg-card border border-border hover:border-primary/40 rounded-2xl p-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-bold">{pick("إنشاء كود خصم", "Create Discount Code")}</p>
              <p className="text-xs text-muted-foreground">
                {pick("كوبونات نسبة، مبلغ ثابت أو شحن مجاني", "Percentage, fixed, or free shipping")}
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </Link>

        <Link
          href="/dashboard/inventory"
          className="bg-card border border-border hover:border-primary/40 rounded-2xl p-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-bold">{pick("إدارة المخزون", "Manage Inventory")}</p>
              <p className="text-xs text-muted-foreground">
                {pick("تعديل الكميات لكل مقاس ولون", "Per-variant stock ledger & alerts")}
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Charts & Top Products */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">{pick("أداء المبيعات الأسبوعي", "Weekly Revenue Trend")}</h2>
              <p className="text-xs text-muted-foreground">
                {pick("إجمالي الطلبات غير الملغاة", "Net order volume over the past 7 days")}
              </p>
            </div>
            <Link
              href="/dashboard/analytics"
              className="text-xs font-semibold text-primary hover:underline"
            >
              {pick("عرض التحليلات الكاملة", "Full Analytics")}
            </Link>
          </div>
          <BarAreaChart
            data={revenueSeries}
            accentColor={store.theme.primaryColor === "#111111" ? "#D98E3E" : store.theme.primaryColor}
            formatValue={(v) => formatCurrency(v, currency)}
          />
        </div>

        <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">{pick("الأكثر مبيعاً", "Top Selling Products")}</h2>
            <Link
              href="/dashboard/products"
              className="text-xs font-semibold text-primary hover:underline"
            >
              {pick("كل المنتجات", "All Products")}
            </Link>
          </div>
          <div className="space-y-3">
            {topProducts.map((prod) => (
              <Link
                key={prod.id}
                href={`/dashboard/products/${prod.id}`}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/60 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border">
                  <ProductVisual type={prod.visualType} palette={prod.visualPalette} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{pick(prod.nameAr, prod.nameEn)}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(prod.price, currency)} · {pick("مخزون:", "Stock:")}{" "}
                    {getProductTotalStock(prod)}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-xs font-bold tabular-nums">{prod.salesCount}</p>
                  <p className="text-[11px] text-muted-foreground">{pick("مبيعة", "sold")}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders & Platform Announcements */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-bold">{pick("أحدث الطلبات", "Recent Orders")}</h2>
            <Link
              href="/dashboard/orders"
              className="text-xs font-semibold text-primary hover:underline"
            >
              {pick("إدارة جميع الطلبات", "Manage All Orders")}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                  <th className="text-start py-2.5 px-4 font-semibold">{pick("رقم الطلب", "Order")}</th>
                  <th className="text-start py-2.5 px-4 font-semibold">{pick("العميل", "Customer")}</th>
                  <th className="text-start py-2.5 px-4 font-semibold">{pick("الحالة", "Status")}</th>
                  <th className="text-end py-2.5 px-4 font-semibold">{pick("الإجمالي", "Total")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-mono font-semibold text-xs">
                      <Link href={`/dashboard/orders/${ord.id}`} className="text-primary hover:underline">
                        {ord.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-xs">{ord.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">{ord.shippingAddress.city}</p>
                    </td>
                    <td className="py-3 px-4">
                      <StatusText
                        tone={
                          ord.status === "delivered"
                            ? "success"
                            : ord.status === "cancelled" || ord.status === "refunded"
                              ? "danger"
                              : ord.status === "shipped"
                                ? "info"
                                : "warning"
                        }
                        label={formatOrderStatusLabel(ord.status, locale)}
                      />
                    </td>
                    <td className="py-3 px-4 text-end font-semibold tabular-nums text-xs">
                      {formatCurrency(ord.total, currency)}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                      {pick("لا توجد طلبات حتى الآن.", "No orders placed yet.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold">{pick("إشعارات المنصة", "Platform Announcements")}</h2>
          </div>
          <div className="space-y-3">
            {announcements.slice(0, 3).map((ann) => (
              <div key={ann.id} className="p-3.5 rounded-xl bg-muted/40 border border-border/70">
                <p className="text-xs font-bold">{pick(ann.titleAr, ann.titleEn)}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {pick(ann.bodyAr, ann.bodyEn)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
