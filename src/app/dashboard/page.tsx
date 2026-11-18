"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { getMerchantDashboardDataAction } from "@/server/actions/store"
import { getStoreDisplayUrl } from "@/lib/reserved-slugs"
import { formatPrice } from "@/lib/utils"
import { buildWhatsAppLink } from "@/lib/whatsapp"
import {
  ORDER_STATUS_BADGE_MAP,
  type DashboardStats,
  type Order,
  type Store,
} from "@/types/domain"
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Plus,
  Share2,
  MessageCircle,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

export default function DashboardHome() {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [store, setStore] = useState<Store | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const data = await getMerchantDashboardDataAction()
      setStore(data.store)
      setStats(data.stats)
      setOrders(data.recentOrders ?? [])
    } catch {
      setLoadError(true)
      toast.error("تعذر تحميل بيانات لوحة التحكم. حاولي إعادة المحاولة.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const storeSlug = store?.slug || ""
  const storeName = store?.name || "متجرك"

  const handleCopyLink = async () => {
    if (!storeSlug) {
      toast.error("بيانات رابط المتجر غير متاحة حالياً")
      return
    }
    try {
      await navigator.clipboard.writeText(`https://${getStoreDisplayUrl(storeSlug)}`)
      setCopied(true)
      toast.success("تم نسخ لينك متجرك بنجاح!")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("تعذر نسخ الرابط. تأكدي من صلاحية النسخ في المتصفح.")
    }
  }

  const statCards = [
    {
      title: "مبيعات اليوم",
      value: stats ? formatPrice(stats.todaySales) : "—",
      change: stats?.todayOrdersCount ? `${stats.todayOrdersCount} أوردرات اليوم` : "لا توجد أوردرات اليوم",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      title: "أوردرات اليوم",
      value: stats ? `${stats.todayOrdersCount} أوردر` : "—",
      change: stats ? `${stats.newOrdersCount} جديدة قيد المتابعة` : "",
      icon: ShoppingCart,
      color: "text-primary bg-primary/10",
    },
    {
      title: "إجمالي المنتجات",
      value: stats ? `${stats.totalProductsCount} منتج` : "—",
      change: stats?.lowStockProductsCount ? `${stats.lowStockProductsCount} مخزون منخفض` : "المخزون متوفر",
      icon: Package,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      title: "إجمالي العملاء",
      value: stats ? `${stats.totalCustomersCount} عميل` : "—",
      change: "مسجلين في متجرك",
      icon: Users,
      color: "text-sky-500 bg-sky-500/10",
    },
  ]

  return (
    <div className="space-y-8 text-right">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-l from-primary/10 via-secondary/50 to-card p-6 rounded-3xl border border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            أهلاً، {storeName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            تابعي أداء متجرك وأديري المنتجات والأوردرات من مكان واحد.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="font-bold gap-2"
          >
            <Share2 className="w-4 h-4 text-primary" />
            <span>{copied ? "تم نسخ اللينك!" : "نسخ لينك المتجر"}</span>
          </Button>

          <Link href="/dashboard/products/new">
            <Button size="sm" className="font-bold gap-2 shadow-md">
              <Plus className="w-4 h-4" />
              <span>إضافة منتج جديد</span>
            </Button>
          </Link>
        </div>
      </div>

      {loadError && (
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p role="alert" className="text-sm text-muted-foreground">لم يتم تحميل بيانات المتجر والإحصائيات، لذلك لن نعرض أرقامًا افتراضية.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadDashboard()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card
              key={idx}
              className="hover:border-primary/40 transition-colors"
            >
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {loading ? "جاري التحميل..." : loadError ? "تعذر تحميل البيانات" : stat.change}
                  </span>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-foreground font-cairo">
                    {loading ? "..." : loadError ? "—" : stat.value}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground mt-0.5">
                    {stat.title}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
          <div className="space-y-1">
            <CardTitle>أحدث الأوردرات</CardTitle>
            <CardDescription>
              تابع الأوردرات الواردة وغيّر حالتها أول بأول
            </CardDescription>
          </div>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" className="text-primary font-bold">
              إدارة الأوردرات
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs font-bold border-b border-border">
                <tr>
                  <th className="py-3 px-4">رقم الأوردر</th>
                  <th className="py-3 px-4">العميل</th>
                  <th className="py-3 px-4">العنوان</th>
                  <th className="py-3 px-4">المنتجات</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">جاري تحميل الأوردرات...</td></tr>
                ) : loadError ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">تعذر تحميل الأوردرات. استخدمي زر إعادة المحاولة بالأعلى.</td></tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد أوردرات متاحة حاليًا
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const badgeVariant =
                      ORDER_STATUS_BADGE_MAP[order.status] || "default"
                    const itemsText = order.items
                      .map((i) => `${i.name} (${i.size}) × ${i.quantity}`)
                      .join(" + ")

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 px-4 font-black text-foreground">
                          #{order.orderNumber}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-foreground">
                            {order.customerName}
                          </div>
                          <div className="text-xs text-muted-foreground dir-ltr text-right">
                            {order.customerPhone}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs text-foreground/80">
                          {order.customerCity}
                        </td>
                        <td className="py-4 px-4 text-xs text-muted-foreground max-w-xs truncate">
                          {itemsText}
                        </td>
                        <td className="py-4 px-4 font-black text-primary font-cairo">
                          {formatPrice(order.total)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={badgeVariant}>{order.status}</Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <a
                            href={buildWhatsAppLink(
                              order.customerPhone,
                              `مرحباً ${order.customerName}، بخصوص أوردرك رقم #${order.orderNumber} من متجر ${storeName}`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white text-xs font-bold transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>واتساب</span>
                          </a>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
