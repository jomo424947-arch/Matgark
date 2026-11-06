"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Plus,
  Share2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ExternalLink,
  MessageCircle,
} from "lucide-react"

export default function DashboardHome() {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://matgarak.com/cairo-couture")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stats = [
    {
      title: "مبيعات اليوم",
      value: "3,450 ج.م",
      change: "+18%",
      isPositive: true,
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      title: "أوردرات اليوم",
      value: "6 أوردرات",
      change: "4 جديدة قيد التأكيد",
      isPositive: true,
      icon: ShoppingCart,
      color: "text-primary bg-primary/10",
    },
    {
      title: "إجمالي المنتجات",
      value: "14 منتج",
      change: "2 أوشكوا على النفاذ",
      isPositive: false,
      icon: Package,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      title: "إجمالي العملاء",
      value: "89 عميل",
      change: "+12 هذا الأسبوع",
      isPositive: true,
      icon: Users,
      color: "text-sky-500 bg-sky-500/10",
    },
  ]

  const orders = [
    {
      id: "1048",
      customer: "محمد علي",
      phone: "01098765432",
      city: "القاهرة (مدينة نصر)",
      items: "جاكيت شتوي أسود (L) × 1",
      total: "850 ج.م",
      status: "جديد",
      statusColor: "warning",
      time: "منذ 15 دقيقة",
    },
    {
      id: "1047",
      customer: "نورين شريف",
      phone: "01234567890",
      city: "الجيزة (الدقي)",
      items: "سنيكرز جلد أبيض (38) × 1 + تيشيرت أوفرسايز (M) × 2",
      total: "1,220 ج.م",
      status: "مؤكد",
      statusColor: "info",
      time: "منذ ساعتين",
    },
    {
      id: "1046",
      customer: "عمر خالد",
      phone: "01122334455",
      city: "الإسكندرية (سموحة)",
      items: "هودي قطن رمادي (XL) × 1",
      total: "550 ج.م",
      status: "جاري الشحن",
      statusColor: "default",
      time: "أمس",
    },
    {
      id: "1045",
      customer: "ياسمين فهمي",
      phone: "01599887766",
      city: "القاهرة (التجمع الخامس)",
      items: "فستان بيج صيفي (S) × 1",
      total: "790 ج.م",
      status: "تم التسليم",
      statusColor: "success",
      time: "منذ يومين",
    },
  ]

  return (
    <div className="space-y-8 text-right">
      
      {/* الترحيب والشريط السريع */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-l from-primary/10 via-secondary/50 to-card p-6 rounded-3xl border border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            أهلاً، براند كايرو كوتور 👋
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

          <Link href="/dashboard/products/new">
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
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
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
            <CardDescription>تابع الأوردرات الواردة وغيّر حالتها أول بأول</CardDescription>
          </div>
          <Link href="/dashboard/orders">
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
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4 font-black text-foreground">
                      #{order.id}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-foreground">{order.customer}</div>
                      <div className="text-xs text-muted-foreground dir-ltr text-right">{order.phone}</div>
                    </td>
                    <td className="py-4 px-4 text-xs text-foreground/80">
                      {order.city}
                    </td>
                    <td className="py-4 px-4 text-xs text-muted-foreground max-w-xs truncate">
                      {order.items}
                    </td>
                    <td className="py-4 px-4 font-black text-primary">
                      {order.total}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={order.statusColor as any}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-xs text-muted-foreground">
                      {order.time}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <a
                        href={`https://wa.me/2${order.phone}?text=مرحباً ${order.customer}، بخصوص أوردرك رقم #${order.id} من متجرنا`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white text-xs font-bold transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

