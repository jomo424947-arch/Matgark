"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { getMerchantDashboardDataAction } from "@/server/actions/store"
import { updateOrderStatusAction } from "@/server/actions/orders"
import { formatPrice } from "@/lib/utils"
import { buildWhatsAppLink } from "@/lib/whatsapp"
import {
  ORDER_STATUS_BADGE_MAP,
  ORDER_STATUSES,
  type Order,
  type OrderStatus,
  type Store,
} from "@/types/domain"
import {
  Search,
  MessageCircle,
  Clock,
  MapPin,
} from "lucide-react"
import { toast } from "sonner"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const loadData = () => {
    getMerchantDashboardDataAction()
      .then((data) => {
        setOrders(data.recentOrders.length > 0 ? data.recentOrders : [])
        // Fetch all orders
        setStore(data.store)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const statusFilters = [
    { id: "all", label: "كل الأوردرات" },
    { id: "جديد", label: "جديد" },
    { id: "مؤكد", label: "مؤكد" },
    { id: "جاري الشحن", label: "جاري الشحن" },
    { id: "تم التسليم", label: "تم التسليم" },
    { id: "ملغي", label: "ملغي" },
  ]

  const filteredOrders = orders.filter((order) => {
    if (filter !== "all" && order.status !== filter) return false
    if (
      searchTerm &&
      !order.customerName.includes(searchTerm) &&
      !order.orderNumber.includes(searchTerm) &&
      !order.customerPhone.includes(searchTerm)
    ) {
      return false
    }
    return true
  })

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const res = await updateOrderStatusAction(orderId, newStatus)
    if (!res.ok) {
      toast.error(res.error || "فشل تحديث حالة الأوردر")
      return
    }

    toast.success(`تم تحديث حالة الأوردر إلى "${newStatus}"`)
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
  }

  const storeName = store?.name || "متجر كايرو كوتور"

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

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map((sf) => (
              <button
                type="button"
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

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              جاري تحميل الأوردرات...
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              لا توجد أوردرات مطابقة للفلتر المحدد
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const badgeVariant =
              ORDER_STATUS_BADGE_MAP[order.status] || "default"
            const formattedDate = new Date(order.createdAt).toLocaleDateString(
              "ar-EG",
              {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            )

            return (
              <Card
                key={order.id}
                className="hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Card Header: Order #, Status, Date, Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-foreground">
                        أوردر #{order.orderNumber}
                      </span>
                      <Badge variant={badgeVariant}>{order.status}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={buildWhatsAppLink(
                          order.customerPhone,
                          `مرحباً ${order.customerName}، معاك ${storeName} بخصوص أوردرك رقم #${order.orderNumber}`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold shadow-sm transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>مراسلة على واتساب</span>
                      </a>

                      {/* Controlled status changer */}
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as OrderStatus
                          )
                        }
                        className="h-8 px-2.5 rounded-xl border border-input bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Customer details and products breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                    {/* Customer Info */}
                    <div className="space-y-2 text-xs">
                      <div className="font-bold text-sm text-foreground">
                        بيانات العميل والتوصيل:
                      </div>
                      <div className="text-foreground">
                        <span className="font-semibold text-muted-foreground">
                          الاسم:{" "}
                        </span>
                        {order.customerName}
                      </div>
                      <div className="text-foreground">
                        <span className="font-semibold text-muted-foreground">
                          الموبايل:{" "}
                        </span>
                        <span className="dir-ltr inline-block font-mono">
                          {order.customerPhone}
                        </span>
                      </div>
                      <div className="text-foreground flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>
                          {order.customerAddress} ({order.customerCity})
                        </span>
                      </div>
                      {order.customerNotes && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] font-medium">
                          📌 ملاحظة: {order.customerNotes}
                        </div>
                      )}
                    </div>

                    {/* Items Breakdown */}
                    <div className="space-y-2 text-xs bg-muted/20 p-4 rounded-2xl border border-border/40">
                      <div className="font-bold text-sm text-foreground">
                        المنتجات المطلوبة:
                      </div>
                      <div className="space-y-1.5 divide-y divide-border/40">
                        {order.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center pt-1.5"
                          >
                            <span className="text-foreground font-medium">
                              {item.name} ({item.size} - {item.color}) ×{" "}
                              {item.quantity}
                            </span>
                            <span className="font-bold text-foreground font-cairo">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-border flex justify-between text-muted-foreground">
                        <span>رسوم التوصيل:</span>
                        <span className="font-bold font-cairo">
                          {order.deliveryFee === 0
                            ? "مجاناً 🎉"
                            : formatPrice(order.deliveryFee)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-border text-sm font-black text-foreground">
                        <span>المجموع الإجمالي المطلوب كاش:</span>
                        <span className="text-primary text-base font-cairo">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
