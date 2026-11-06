"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import {
  Search,
  Filter,
  MessageCircle,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Eye,
  MapPin,
  Calendar,
} from "lucide-react"

export default function OrdersPage() {
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const allOrders = [
    {
      id: "1048",
      customer: "محمد علي",
      phone: "01098765432",
      city: "القاهرة",
      address: "مدينة نصر، شارع عباس العقاد، عمارة 14، شقة 5",
      items: [
        { name: "جاكيت شتوي أسود", size: "L", qty: 1, price: 850 },
      ],
      deliveryFee: 40,
      total: 890,
      status: "جديد",
      statusType: "warning",
      date: "اليوم، 05:40 م",
      notes: "يرجى الاتصال قبل الوصول",
    },
    {
      id: "1047",
      customer: "نورين شريف",
      phone: "01234567890",
      city: "الجيزة",
      address: "الدقي، شارع مصدق، برج الأطباء",
      items: [
        { name: "سنيكرز جلد أبيض", size: "38", qty: 1, price: 620 },
        { name: "تيشيرت أوفرسايز بيج", size: "M", qty: 2, price: 300 },
      ],
      deliveryFee: 45,
      total: 1265,
      status: "مؤكد",
      statusType: "info",
      date: "اليوم، 03:15 م",
      notes: "",
    },
    {
      id: "1046",
      customer: "عمر خالد",
      phone: "01122334455",
      city: "الإسكندرية",
      address: "سموحة، بجوار نادي سموحة، عمارة الأمل",
      items: [
        { name: "هودي قطن رمادي", size: "XL", qty: 1, price: 550 },
      ],
      deliveryFee: 60,
      total: 610,
      status: "جاري الشحن",
      statusType: "default",
      date: "أمس، 08:30 م",
      notes: "مندوب الشحن: أ/ هاني (01011223344)",
    },
    {
      id: "1045",
      customer: "ياسمين فهمي",
      phone: "01599887766",
      city: "القاهرة",
      address: "التجمع الخامس، النرجس 2، فيلا 18",
      items: [
        { name: "فستان بيج صيفي", size: "S", qty: 1, price: 790 },
      ],
      deliveryFee: 40,
      total: 830,
      status: "تم التسليم",
      statusType: "success",
      date: "منذ يومين",
      notes: "تم تحصيل المبلغ كاش",
    },
  ]

  const statusFilters = [
    { id: "all", label: "كل الأوردرات" },
    { id: "جديد", label: "جديد" },
    { id: "مؤكد", label: "مؤكد" },
    { id: "جاري الشحن", label: "جاري الشحن" },
    { id: "تم التسليم", label: "تم التسليم" },
  ]

  const filteredOrders = allOrders.filter((order) => {
    if (filter !== "all" && order.status !== filter) return false
    if (
      searchTerm &&
      !order.customer.includes(searchTerm) &&
      !order.id.includes(searchTerm) &&
      !order.phone.includes(searchTerm)
    ) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6 text-right">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground">
          إدارة ومتابعة الأوردرات
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          استقبل الأوردرات من العملاء، أكدها وتواصل معهم على واتساب
        </p>
      </div>

      {/* شريط الفلاتر والبحث */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map((sf) => (
              <button
                key={sf.id}
                onClick={() => setFilter(sf.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === sf.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>

          <div className="relative w-full">
            <input
              type="text"
              placeholder="ابحث برقم الأوردر، اسم العميل، أو رقم التليفون..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pr-10 pl-4 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3.5" />
          </div>
        </CardContent>
      </Card>

      {/* قائمة كروت الأوردرات */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-4">
              
              {/* الرأس: رقم الأوردر، الوقت، الحالة */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-foreground">
                    أوردر #{order.id}
                  </span>
                  <Badge variant={order.statusType as any}>
                    {order.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{order.date}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/2${order.phone}?text=مرحباً ${order.customer}، معاك متجر كايرو كوتور بخصوص أوردرك رقم #${order.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold shadow-sm transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>مراسلة على واتساب</span>
                  </a>

                  {/* تغيير سريع للحالة */}
                  <select
                    defaultValue={order.status}
                    className="h-8 px-2.5 rounded-xl border border-input bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
                  >
                    <option value="جديد">جديد</option>
                    <option value="مؤكد">مؤكد</option>
                    <option value="جاري الشحن">جاري الشحن</option>
                    <option value="تم التسليم">تم التسليم</option>
                    <option value="ملغي">ملغي</option>
                  </select>
                </div>
              </div>

              {/* بيانات العميل وتفاصيل المنتجات */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                {/* بيانات العميل */}
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-sm text-foreground">
                    بيانات العميل والتوصيل:
                  </div>
                  <div className="text-foreground">
                    <span className="font-semibold text-muted-foreground">الاسم: </span>
                    {order.customer}
                  </div>
                  <div className="text-foreground">
                    <span className="font-semibold text-muted-foreground">الموبايل: </span>
                    <span className="dir-ltr inline-block font-mono">{order.phone}</span>
                  </div>
                  <div className="text-foreground flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{order.address} ({order.city})</span>
                  </div>
                  {order.notes && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] font-medium">
                      📌 ملاحظة: {order.notes}
                    </div>
                  )}
                </div>

                {/* تفاصيل المنتجات والمجموع */}
                <div className="space-y-2 text-xs bg-muted/20 p-4 rounded-2xl border border-border/40">
                  <div className="font-bold text-sm text-foreground">
                    المنتجات المطلوبة:
                  </div>
                  <div className="space-y-1.5 divide-y divide-border/40">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center pt-1.5">
                        <span className="text-foreground font-medium">
                          {item.name} (مقاس {item.size}) × {item.qty}
                        </span>
                        <span className="font-bold text-foreground font-cairo">
                          {item.price * item.qty} ج.م
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-border flex justify-between text-muted-foreground">
                    <span>رسوم التوصيل:</span>
                    <span className="font-bold font-cairo">{order.deliveryFee} ج.م</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border text-sm font-black text-foreground">
                    <span>المجموع الإجمالي المطلوب كاش:</span>
                    <span className="text-primary text-base font-cairo">
                      {order.total} ج.م
                    </span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  )
}

