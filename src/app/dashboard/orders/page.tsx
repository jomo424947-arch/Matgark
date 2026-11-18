"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
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
import { Search, MessageCircle, Clock, MapPin, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({})
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const data = await getMerchantDashboardDataAction()
      setOrders(data.recentOrders ?? [])
      setStore(data.store)
    } catch {
      setLoadError(true)
      toast.error("تعذر تحميل الأوردرات. حاولي إعادة المحاولة.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const statusFilters = [
    { id: "all", label: "كل الأوردرات المتاحة" },
    { id: "جديد", label: "جديد" },
    { id: "مؤكد", label: "مؤكد" },
    { id: "جاري الشحن", label: "جاري الشحن" },
    { id: "تم التسليم", label: "تم التسليم" },
    { id: "ملغي", label: "ملغي" },
  ]

  const filteredOrders = orders.filter((order) => {
    if (filter !== "all" && order.status !== filter) return false
    const query = searchTerm.trim().toLocaleLowerCase("ar")
    if (
      query &&
      !order.customerName.toLocaleLowerCase("ar").includes(query) &&
      !order.orderNumber.toLocaleLowerCase("ar").includes(query) &&
      !order.customerPhone.includes(query)
    ) return false
    return true
  })

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((item) => item.id === orderId)
    if (!order || order.status === newStatus || updatingOrderId) return

    setUpdatingOrderId(orderId)
    try {
      const note = statusNotes[orderId]?.trim()
      const res = await updateOrderStatusAction(orderId, newStatus, note || undefined)
      if (!res.ok) {
        toast.error(res.error || "فشل تحديث حالة الأوردر")
        return
      }

      if (res.order) {
        setOrders((prev) => prev.map((item) => item.id === orderId ? res.order! : item))
      } else {
        setOrders((prev) => prev.map((item) => item.id === orderId ? { ...item, status: newStatus } : item))
      }
      setStatusNotes((prev) => ({ ...prev, [orderId]: "" }))
      toast.success(`تم تحديث حالة الأوردر إلى "${newStatus}"`)
    } catch {
      toast.error("حدث خطأ أثناء تحديث الأوردر. حاولي مرة أخرى.")
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const storeName = store?.name || "متجرك"

  return (
    <div className="space-y-6 text-right">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground">إدارة ومتابعة أحدث الأوردرات</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          يعرض هذا القسم أحدث 5 أوردرات متاحة حاليًا. يمكن للفريق إضافة دعم سجل الطلبات الكامل لاحقًا.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map((sf) => (
              <button
                type="button"
                key={sf.id}
                onClick={() => setFilter(sf.id)}
                aria-pressed={filter === sf.id}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === sf.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >{sf.label}</button>
            ))}
          </div>
          <div className="relative w-full">
            <input
              type="search"
              placeholder="ابحث برقم الأوردر، اسم العميل، أو رقم التليفون..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="البحث في الأوردرات المتاحة"
              className="w-full h-11 pr-10 pl-4 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3.5" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">جاري تحميل الأوردرات...</CardContent></Card>
        ) : loadError ? (
          <Card><CardContent className="p-8 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">حصلت مشكلة أثناء تحميل الأوردرات. بيانات الطلبات لم يتم تحميلها.</p>
            <Button type="button" variant="outline" onClick={() => void loadData()} className="gap-2"><RefreshCw className="w-4 h-4" />إعادة المحاولة</Button>
          </CardContent></Card>
        ) : filteredOrders.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            {orders.length === 0 ? "لا توجد أوردرات متاحة حاليًا" : "لا توجد أوردرات مطابقة للبحث أو الفلتر المحدد"}
          </CardContent></Card>
        ) : filteredOrders.map((order) => {
          const badgeVariant = ORDER_STATUS_BADGE_MAP[order.status] || "default"
          const formattedDate = new Date(order.createdAt).toLocaleDateString("ar-EG", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          })
          const isUpdating = updatingOrderId === order.id

          return (
            <Card key={order.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-black text-foreground">أوردر #{order.orderNumber}</span>
                    <Badge variant={badgeVariant}>{order.status}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formattedDate}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={buildWhatsAppLink(order.customerPhone, `مرحباً ${order.customerName}، معاك ${storeName} بخصوص أوردرك رقم #${order.orderNumber}`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold shadow-sm transition-colors">
                      <MessageCircle className="w-4 h-4" /><span>مراسلة على واتساب</span>
                    </a>
                    <select
                      aria-label={`تغيير حالة الأوردر ${order.orderNumber}`}
                      value={order.status}
                      disabled={Boolean(updatingOrderId)}
                      onChange={(e) => void handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className="h-9 px-2.5 rounded-xl border border-input bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-right disabled:opacity-60"
                    >
                      {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-sm text-foreground">بيانات العميل والتوصيل:</div>
                    <div className="text-foreground"><span className="font-semibold text-muted-foreground">الاسم: </span>{order.customerName}</div>
                    <div className="text-foreground"><span className="font-semibold text-muted-foreground">الموبايل: </span><span className="dir-ltr inline-block font-mono">{order.customerPhone}</span></div>
                    <div className="text-foreground flex items-start gap-1"><MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /><span>{order.customerAddress} ({order.customerCity})</span></div>
                    {order.customerNotes && <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] font-medium">📌 ملاحظة العميل: {order.customerNotes}</div>}
                    <div className="pt-2 space-y-2">
                      <label htmlFor={`status-note-${order.id}`} className="block font-bold text-foreground">ملاحظة مع تحديث الحالة (اختياري)</label>
                      <textarea
                        id={`status-note-${order.id}`}
                        value={statusNotes[order.id] ?? ""}
                        maxLength={200}
                        onChange={(e) => setStatusNotes((prev) => ({ ...prev, [order.id]: e.target.value }))}
                        placeholder="مثال: تم تسليم الطلب لشركة الشحن..."
                        rows={2}
                        disabled={Boolean(updatingOrderId)}
                        className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                      />
                      <p className="text-[10px] text-muted-foreground">تُرسل الملاحظة عند تغيير حالة الأوردر، بحد أقصى 200 حرف.</p>
                      {isUpdating && <p role="status" className="text-xs text-primary">جاري تحديث الأوردر...</p>}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs bg-muted/20 p-4 rounded-2xl border border-border/40">
                    <div className="font-bold text-sm text-foreground">المنتجات المطلوبة:</div>
                    <div className="space-y-1.5 divide-y divide-border/40">
                      {order.items.map((item) => <div key={item.id} className="flex justify-between items-center gap-3 pt-1.5">
                        <span className="text-foreground font-medium">{item.name} ({item.size} - {item.color}) × {item.quantity}</span>
                        <span className="font-bold text-foreground font-cairo whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                      </div>)}
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between text-muted-foreground"><span>رسوم التوصيل:</span><span className="font-bold font-cairo">{order.deliveryFee === 0 ? "مجاناً 🎉" : formatPrice(order.deliveryFee)}</span></div>
                    <div className="flex justify-between items-center gap-2 pt-2 border-t border-border text-sm font-black text-foreground"><span>المجموع الإجمالي المطلوب كاش:</span><span className="text-primary text-base font-cairo whitespace-nowrap">{formatPrice(order.total)}</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
