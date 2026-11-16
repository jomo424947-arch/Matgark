"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { useMerchantStore } from "@/stores/merchantStore"
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Plus,
  Share2,
  ExternalLink,
  MessageCircle,
} from "lucide-react"
import { toast } from "sonner"

export default function DashboardHome() {
  const [copied, setCopied] = useState(false)
  const settings = useMerchantStore((s) => s.settings)
  const products = useMerchantStore((s) => s.products)
  const orders = useMerchantStore((s) => s.orders)
  const customers = useMerchantStore((s) => s.customers)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://matgarak.com/${settings.slug}`)
    setCopied(true)
    toast.success("تم نسخ رابط متجرك بنجاح!")
    setTimeout(() => setCopied(false), 2000)
  }

  const totalRevenue = orders
    .filter((o) => o.status !== "ملغي")
    .reduce((sum, o) => sum + o.total, 0)
  const newOrdersCount = orders.filter((o) => o.status === "جديد").length
  const lowStockCount = products.filter((p) => p.stock < 5).length

  const stats = [
    {
      title: "إجمالي المبيعات",
      value: `${totalRevenue.toLocaleString("en-US")} ج.م`,
      change: "+18% هذا الأسبوع",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      title: "إجمالي الأوردرات",
      value: `${orders.length} أوردر`,
      change: `${newOrdersCount} جديدة قيد التأكيد`,
      icon: ShoppingCart,
      color: "text-primary bg-primary/10",
    },
    {
      title: "إجمالي المنتجات",
      value: `${products.length} منتج`,
      change: lowStockCount > 0 ? `${lowStockCount} أوشكوا على النفاذ` : "المخزون ممتاز",
      icon: Package,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      title: "إجمالي العملاء",
      value: `${customers.length} عميل`,
      change: "سجل عملاء نشط",
      icon: Users,
      color: "text-sky-500 bg-sky-500/10",
    },
  ]

  const recentOrders = orders.slice(0, 5)

  return (
    <div className="space-y-8 text-right">
      {/* الترحيب والشريط السريع */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-l from-primary/10 via-secondary/50 to-card p-6 rounded-3xl border border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            أهلاً، {settings.storeName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            متجرك نشط، واللينك شغال وجاهز لاستقبال الأوردرات.
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

          <Link href={`/store/${settings.slug}`}>
            <Button variant="outline" size="sm" className="font-bold gap-2">
              <ExternalLink className="w-4 h-4 text-primary" />
              <span>معاينة المتجر</span>
            </Button>
          </Link>

          <Link href="/products/new">
            <Button size="sm" className="font-bold gap-2 shadow-md">
              <Plus className="w-4 h-4" />
              <span>إضافة منتج جديد</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* كروت الإحصائيات الأربعة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {stat.change}
                  </span>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-foreground font-cairo">
                    {stat.value}
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

      {/* جدول أحدث الأوردرات */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
          <div className="space-y-1">
            <CardTitle>أحدث الأوردرات</CardTitle>
            <CardDescription>
              تابع الأوردرات الواردة وغيّر حالتها أول بأول
            </CardDescription>
          </div>
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="text-primary font-bold">
              عرض كل الأوردرات
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
                  <th className="py-3 px-4">التوقيت</th>
                  <th className="py-3 px-4 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {recentOrders.map((order) => {
                  const itemsSummary = order.items
                    .map((i) => `${i.name} (${i.size}) × ${i.qty}`)
                    .join(" + ")
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4 font-black text-foreground">
                        #{order.id}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-foreground">
                          {order.customer}
                        </div>
                        <div className="text-xs text-muted-foreground dir-ltr text-right">
                          {order.phone}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-foreground/80">
                        {order.city}
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        {itemsSummary}
                      </td>
                      <td className="py-4 px-4 font-black text-primary font-cairo">
                        {order.total} ج.م
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={order.statusType}>{order.status}</Badge>
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground">
                        {order.date}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <a
                          href={`https://wa.me/2${order.phone}?text=مرحباً ${order.customer}، بخصوص أوردرك رقم #${order.id} من ${settings.storeName}`}
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
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
