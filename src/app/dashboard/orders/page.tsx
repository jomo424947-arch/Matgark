"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { Search, Eye } from "lucide-react"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { ALL_ORDER_STATUSES } from "@/lib/commerce/engine"
import { formatOrderStatusLabel } from "@/lib/i18n/translations"
import { StatusText } from "@/components/common/StatusText"
import type { OrderLifecycleStatus } from "@/types/saas"

export default function MerchantOrdersPage() {
  const { locale, pick, formatCurrency } = useI18n()
  const { store, storeOrders } = useActiveMerchantStore()

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | OrderLifecycleStatus>("all")
  const [paymentFilter, setPaymentFilter] = useState("all")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return storeOrders.filter((ord) => {
      const matchQuery =
        !q ||
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.customerPhone.toLowerCase().includes(q)
      const matchStatus = statusFilter === "all" || ord.status === statusFilter
      const matchPay = paymentFilter === "all" || ord.paymentMethod === paymentFilter
      return matchQuery && matchStatus && matchPay
    })
  }, [storeOrders, query, statusFilter, paymentFilter])

  if (!store) return null
  const currency = store.localization.currency

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {pick("إدارة الطلبات", "Order Management")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pick(
            "تابع جميع طلبات متجرك، حدّث حالات الشحن، واطبع الفواتير.",
            "Manage full 9-stage order fulfillment, timelines, internal notes, and printable invoices."
          )}
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={pick("ابحث برقم الطلب أو اسم العميل أو الهاتف...", "Search order #, customer, or phone...")}
            className="w-full h-10 rounded-xl border border-border bg-background ps-9 pe-3 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | OrderLifecycleStatus)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
        >
          <option value="all">{pick("كل حالات الطلب", "All Order Statuses")}</option>
          {ALL_ORDER_STATUSES.map((st) => (
            <option key={st} value={st}>
              {formatOrderStatusLabel(st, locale)}
            </option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
        >
          <option value="all">{pick("كل طرق الدفع", "All Payment Methods")}</option>
          <option value="cod">{pick("الدفع عند الاستلام", "Cash on Delivery")}</option>
          <option value="bank_transfer">{pick("تحويل بنكي", "Bank Transfer")}</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <th className="text-start py-3 px-4 font-semibold">{pick("رقم الطلب", "Order #")}</th>
                <th className="text-start py-3 px-4 font-semibold">{pick("العميل", "Customer")}</th>
                <th className="text-start py-3 px-4 font-semibold">{pick("العناصر", "Items")}</th>
                <th className="text-start py-3 px-4 font-semibold">{pick("الدفع", "Payment")}</th>
                <th className="text-start py-3 px-4 font-semibold">{pick("الحالة", "Status")}</th>
                <th className="text-end py-3 px-4 font-semibold">{pick("الإجمالي", "Total")}</th>
                <th className="text-end py-3 px-4 font-semibold">{pick("التفاصيل", "View")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((ord) => (
                <tr key={ord.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-semibold text-xs">
                    <Link href={`/dashboard/orders/${ord.id}`} className="text-primary hover:underline">
                      {ord.orderNumber}
                    </Link>
                    <p className="text-[11px] font-sans font-normal text-muted-foreground">
                      {ord.createdAt.slice(0, 10)}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-xs">{ord.customerName}</p>
                    <p className="text-[11px] text-muted-foreground dir-ltr text-start">
                      {ord.customerPhone}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-xs tabular-nums">
                    {ord.items.reduce((s, i) => s + i.quantity, 0)} {pick("قطع", "items")}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {ord.paymentMethod === "cod"
                      ? pick("دفع عند الاستلام", "COD")
                      : pick("تحويل بنكي", "Bank Transfer")}
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
                  <td className="py-3 px-4 text-end">
                    <Link
                      href={`/dashboard/orders/${ord.id}`}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{pick("عرض", "Inspect")}</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    {pick("لا توجد طلبات مطابقة.", "No matching orders found.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
