"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { Search, User, Mail, Phone, X } from "lucide-react"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { StatusText } from "@/components/common/StatusText"
import { formatOrderStatusLabel } from "@/lib/i18n/translations"
import type { CustomerSegment, StoreCustomer } from "@/types/saas"

export default function MerchantCustomersPage() {
  const { locale, pick, formatCurrency } = useI18n()
  const { store, storeCustomers, storeOrders } = useActiveMerchantStore()

  const [query, setQuery] = useState("")
  const [segmentFilter, setSegmentFilter] = useState<"all" | CustomerSegment>("all")
  const [selectedCustomer, setSelectedCustomer] = useState<StoreCustomer | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return storeCustomers.filter((c) => {
      const matchQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      const matchSeg = segmentFilter === "all" || c.segment === segmentFilter
      return matchQ && matchSeg
    })
  }, [storeCustomers, query, segmentFilter])

  if (!store) return null
  const currency = store.localization.currency

  const segmentLabel = (seg: CustomerSegment) => {
    switch (seg) {
      case "vip":
        return pick("عميل VIP", "VIP")
      case "returning":
        return pick("متكرر", "Returning")
      case "at_risk":
        return pick("معرض للفقد", "At Risk")
      case "new":
      default:
        return pick("جديد", "New")
    }
  }

  const customerOrders = selectedCustomer
    ? storeOrders.filter(
        (o) =>
          o.customerId === selectedCustomer.id ||
          o.customerEmail.toLowerCase() === selectedCustomer.email.toLowerCase()
      )
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {pick("دليل عملاء المتجر", "Store Customer Directory")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pick(
            "عرض العملاء المسجلين في هذا المتجر فقط مع شرائح الإنفاق وسجل طلباتهم.",
            "Tenant-isolated customer profiles, spending segments, and order history."
          )}
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={pick("ابحث بالاسم أو البريد أو الهاتف...", "Search name, email, or phone...")}
            className="w-full h-10 rounded-xl border border-border bg-background ps-9 pe-3 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "vip", "returning", "new", "at_risk"] as const).map((seg) => (
            <button
              key={seg}
              type="button"
              onClick={() => setSegmentFilter(seg)}
              className={`h-9 px-3 rounded-xl text-xs font-semibold transition-colors ${
                segmentFilter === seg
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-muted"
              }`}
            >
              {seg === "all" ? pick("الكل", "All") : segmentLabel(seg)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <th className="text-start py-3 px-4 font-semibold">{pick("العميل", "Customer")}</th>
                <th className="text-start py-3 px-4 font-semibold">{pick("الشريحة", "Segment")}</th>
                <th className="text-center py-3 px-4 font-semibold">{pick("الطلبات", "Orders")}</th>
                <th className="text-end py-3 px-4 font-semibold">{pick("إجمالي الإنفاق", "Total Spend")}</th>
                <th className="text-end py-3 px-4 font-semibold">{pick("الملف", "Profile")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((cust) => (
                <tr key={cust.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-xs">{cust.name}</p>
                    <p className="text-[11px] text-muted-foreground">{cust.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <StatusText
                      tone={
                        cust.segment === "vip"
                          ? "success"
                          : cust.segment === "returning"
                            ? "info"
                            : cust.segment === "at_risk"
                              ? "warning"
                              : "neutral"
                      }
                      label={segmentLabel(cust.segment)}
                    />
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs tabular-nums">
                    {cust.totalOrders}
                  </td>
                  <td className="py-3 px-4 text-end font-semibold tabular-nums text-xs">
                    {formatCurrency(cust.totalSpent, currency)}
                  </td>
                  <td className="py-3 px-4 text-end">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(cust)}
                      className="h-8 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                    >
                      {pick("عرض التفاصيل", "View Profile")}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    {pick("لا يوجد عملاء مطابقون.", "No matching customers found.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="bg-card border-s border-border w-full max-w-md h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold">{selectedCustomer.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                <span>{selectedCustomer.email}</span>
              </p>
              <p className="flex items-center gap-2 text-muted-foreground dir-ltr">
                <Phone className="w-3.5 h-3.5" />
                <span>{selectedCustomer.phone}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-muted/50 border border-border">
                <p className="text-[11px] text-muted-foreground">{pick("إجمالي الإنفاق", "Total Spend")}</p>
                <p className="text-base font-bold tabular-nums mt-0.5">
                  {formatCurrency(selectedCustomer.totalSpent, currency)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/50 border border-border">
                <p className="text-[11px] text-muted-foreground">{pick("عدد الطلبات", "Total Orders")}</p>
                <p className="text-base font-bold tabular-nums mt-0.5">
                  {selectedCustomer.totalOrders}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {pick("سجل طلبات العميل", "Order History")}
              </h3>
              {customerOrders.map((ord) => (
                <Link
                  key={ord.id}
                  href={`/dashboard/orders/${ord.id}`}
                  className="block p-3.5 rounded-xl border border-border hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-primary">{ord.orderNumber}</span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(ord.total, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                    <span>{ord.createdAt.slice(0, 10)}</span>
                    <span>{formatOrderStatusLabel(ord.status, locale)}</span>
                  </div>
                </Link>
              ))}
              {customerOrders.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {pick("لم يقم العميل بأي طلبات بعد.", "No orders placed yet.")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
