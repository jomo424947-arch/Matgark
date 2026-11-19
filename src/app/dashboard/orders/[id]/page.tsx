"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Printer,
  Send,
  MapPin,
  User,
  Clock,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { ALL_ORDER_STATUSES } from "@/lib/commerce/engine"
import { formatOrderStatusLabel } from "@/lib/i18n/translations"
import { StatusText } from "@/components/common/StatusText"
import { ProductVisual } from "@/components/common/ProductVisual"
import type { OrderLifecycleStatus } from "@/types/saas"

export default function MerchantOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const { locale, pick, formatCurrency } = useI18n()
  const { merchantSession, store, storeOrders } = useActiveMerchantStore()
  const updateOrderStatus = usePlatformStore((s) => s.updateOrderStatus)
  const addOrderInternalNote = usePlatformStore((s) => s.addOrderInternalNote)

  const order = storeOrders.find((o) => o.id === params.id)
  const [noteText, setNoteText] = useState("")
  const [statusNote, setStatusNote] = useState("")

  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft

  if (!store || !order) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
        <p className="font-bold">{pick("الطلب غير موجود", "Order not found")}</p>
        <Link
          href="/dashboard/orders"
          className="inline-flex h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold items-center"
        >
          {pick("العودة للطلبات", "Back to Orders")}
        </Link>
      </div>
    )
  }

  const currency = store.localization.currency
  const actor = merchantSession?.name || "Merchant"

  const handleStatusChange = (nextStatus: OrderLifecycleStatus) => {
    updateOrderStatus(order.id, nextStatus, actor, statusNote.trim() || undefined)
    setStatusNote("")
    toast.success(
      pick(
        `تم تحديث حالة الطلب إلى ${formatOrderStatusLabel(nextStatus, "ar")}`,
        `Order updated to ${formatOrderStatusLabel(nextStatus, "en")}`
      )
    )
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return
    addOrderInternalNote(order.id, noteText, actor)
    setNoteText("")
    toast.success(pick("تمت إضافة الملاحظة الداخلية", "Internal note added"))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders"
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted"
          >
            <BackIcon className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono">{order.orderNumber}</h1>
              <StatusText
                tone={
                  order.status === "delivered"
                    ? "success"
                    : order.status === "cancelled" || order.status === "refunded"
                      ? "danger"
                      : "info"
                }
                label={formatOrderStatusLabel(order.status, locale)}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(order.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="h-10 px-4 rounded-xl border border-border bg-card text-xs font-semibold inline-flex items-center gap-2 hover:bg-muted"
        >
          <Printer className="w-4 h-4" />
          <span>{pick("طباعة الفاتورة", "Print Invoice")}</span>
        </button>
      </div>

      {/* Print-only Invoice Header */}
      <div className="hidden print:block border-b border-border pb-4 mb-4">
        <h2 className="text-xl font-bold">{pick(store.nameAr, store.nameEn)}</h2>
        <p className="text-xs">
          {pick("فاتورة طلب رقم:", "Invoice Order #")} {order.orderNumber} · {order.createdAt.slice(0, 10)}
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: Items & Totals + Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-bold">{pick("المنتجات المطلوبة", "Order Line Items")}</h2>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0">
                      <ProductVisual type={item.visualType} palette={item.visualPalette} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{pick(item.nameAr, item.nameEn)}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.variantLabel} · <span className="font-mono">{item.sku}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-end shrink-0 text-xs tabular-nums">
                    <p className="font-semibold">
                      {formatCurrency(item.unitPrice * item.quantity, currency)}
                    </p>
                    <p className="text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPrice, currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-muted/30 border-t border-border space-y-1.5 text-sm">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{pick("المجموع الفرعي", "Subtotal")}</span>
                <span className="tabular-nums">{formatCurrency(order.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {pick("الشحن", "Shipping")} ({pick(order.shippingMethodNameAr, order.shippingMethodNameEn)})
                </span>
                <span className="tabular-nums">
                  {order.shippingFee === 0
                    ? pick("مجاني", "Free")
                    : formatCurrency(order.shippingFee, currency)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                  <span>
                    {pick("الخصم", "Discount")} {order.discountCode ? `(${order.discountCode})` : ""}
                  </span>
                  <span className="tabular-nums">-{formatCurrency(order.discountAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>{pick("الإجمالي النهائي", "Grand Total")}</span>
                <span className="tabular-nums">{formatCurrency(order.total, currency)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold">{pick("سجل مراحل الطلب", "Order Lifecycle Timeline")}</h2>
            </div>
            <ol className="space-y-4">
              {order.timeline.map((step, idx) => (
                <li key={`${step.timestamp}-${idx}`} className="flex items-start gap-3 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold">
                        {formatOrderStatusLabel(step.status, locale)}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {new Date(step.timestamp).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{pick(step.noteAr, step.noteEn)}</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">{step.actor}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right: Status Updater, Customer, Notes */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 no-print">
            <h2 className="text-sm font-bold">{pick("تحديث حالة الطلب", "Update Fulfillment Status")}</h2>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value as OrderLifecycleStatus)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-semibold"
            >
              {ALL_ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {formatOrderStatusLabel(st, locale)}
                </option>
              ))}
            </select>
            <input
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder={pick("ملاحظة اختيارية عند تغيير الحالة...", "Optional timeline note...")}
              className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {pick(
                "إلغاء الطلب يعيد الكميات تلقائياً إلى رصيد المخزون.",
                "Setting status to Cancelled automatically restores variant stock quantities."
              )}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm">
              <User className="w-4 h-4 text-primary" />
              <span>{pick("بيانات العميل والشحن", "Customer & Shipping")}</span>
            </div>
            <div>
              <p className="font-semibold text-sm">{order.customerName}</p>
              <p className="text-muted-foreground">{order.customerEmail}</p>
              <p className="text-muted-foreground dir-ltr text-start">{order.customerPhone}</p>
            </div>
            <div className="pt-3 border-t border-border flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-muted-foreground">
                <p className="font-semibold text-foreground">
                  {order.shippingAddress.city}, {order.shippingAddress.country}
                </p>
                <p>{order.shippingAddress.street}</p>
                {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 no-print">
            <div className="flex items-center gap-2 font-bold text-sm">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>{pick("ملاحظات داخلية للفريق", "Internal Staff Notes")}</span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {order.internalNotes.map((n) => (
                <div key={n.id} className="p-2.5 rounded-xl bg-muted/50 text-xs">
                  <p>{n.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {n.author} · {n.createdAt.slice(0, 10)}
                  </p>
                </div>
              ))}
              {order.internalNotes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {pick("لا توجد ملاحظات داخلية.", "No internal notes yet.")}
                </p>
              )}
            </div>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={pick("أضف ملاحظة...", "Add internal note...")}
                className="flex-1 h-9 rounded-xl border border-border bg-background px-3 text-xs"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
