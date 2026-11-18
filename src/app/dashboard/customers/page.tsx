"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { getMerchantDashboardDataAction } from "@/server/actions/store"
import { buildWhatsAppLink } from "@/lib/whatsapp"
import { formatPrice } from "@/lib/utils"
import type { Customer, Store } from "@/types/domain"
import {
  Users,
  Search,
  MessageCircle,
  Download,
  ShoppingBag,
  MapPin,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const data = await getMerchantDashboardDataAction()
      setCustomers(data.customers ?? [])
      setStore(data.store)
    } catch {
      setLoadError(true)
      toast.error("تعذر تحميل بيانات العملاء. حاولي إعادة المحاولة.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("ar")
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLocaleLowerCase("ar").includes(normalizedSearch) ||
    customer.phone.includes(normalizedSearch) ||
    customer.city.toLocaleLowerCase("ar").includes(normalizedSearch)
  )

  const totalCompletedOrders = customers.reduce(
    (sum, c) => sum + c.totalOrders,
    0
  )
  const uniqueCitiesCount = new Set(customers.map((c) => c.city)).size

  const handleExportCsv = () => {
    if (customers.length === 0) {
      toast.error("لا توجد بيانات عملاء لتصديرها")
      return
    }

    const headers = ["الاسم", "رقم الموبايل", "المحافظة", "عدد الأوردرات", "إجمالي المشتريات", "آخر أوردر", "التصنيف"]
    const escapeCsvCell = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`
    const rows = customers.map((customer) => [
      customer.name,
      customer.phone,
      customer.city,
      customer.totalOrders,
      customer.totalSpent,
      customer.lastOrder,
      customer.tag,
    ])

    // UTF-8 BOM for Arabic Excel compatibility; quote and escape every field.
    const csvContent =
      "\uFEFF" +
      [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute(
      "download",
      `customers-${store?.slug || "store"}-${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)

    toast.success("تم تصدير ملف العملاء بنجاح!")
  }

  const storeName = store?.name || "متجرك"

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            قائمة عملاء متجرك
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            سجل منظم لجميع العملاء الذين طلبوا من متجرك مع تفاصيل مشترياتهم
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={loading || loadError || customers.length === 0}
          className="font-bold gap-2"
        >
          <Download className="w-4 h-4" />
          <span>تصدير القائمة (CSV)</span>
        </Button>
      </div>

      {loadError && (
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p role="alert" className="text-sm text-muted-foreground">تعذر تحميل بيانات العملاء. لم يتم عرض أرقام افتراضية.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadCustomers()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black text-foreground font-cairo">
                {loading ? "..." : loadError ? "—" : `${customers.length} عميل`}
              </div>
              <div className="text-xs text-muted-foreground">
                إجمالي العملاء المسجلين
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black text-foreground font-cairo">
                {loading ? "..." : loadError ? "—" : `${totalCompletedOrders} أوردر`}
              </div>
              <div className="text-xs text-muted-foreground">
                إجمالي الأوردرات المسجلة
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black text-foreground font-cairo">
                {loading ? "..." : loadError ? "—" : `${uniqueCitiesCount} محافظات`}
              </div>
              <div className="text-xs text-muted-foreground">
                مناطق وصول طلبات متجرك
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="p-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="ابحث باسم العميل، رقم التليفون، أو المحافظة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pr-10 pl-4 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3.5" />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs font-bold border-b border-border">
                <tr>
                  <th className="py-3 px-4">العميل</th>
                  <th className="py-3 px-4">رقم الموبايل</th>
                  <th className="py-3 px-4">الموقع</th>
                  <th className="py-3 px-4 text-center">الأوردرات</th>
                  <th className="py-3 px-4">إجمالي المشتريات</th>
                  <th className="py-3 px-4">آخر أوردر</th>
                  <th className="py-3 px-4 text-center">تواصل سريع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">جاري تحميل العملاء...</td>
                  </tr>
                ) : loadError ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">تعذر تحميل بيانات العملاء. استخدمي زر إعادة المحاولة بالأعلى.</td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا يوجد عملاء مطابقين للبحث
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr
                      key={cust.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-bold text-foreground">
                          {cust.name}
                        </div>
                        <div className="text-[11px] text-primary font-semibold">
                          {cust.tag}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs dir-ltr text-right">
                        {cust.phone}
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground">
                        {cust.city}
                      </td>
                      <td className="py-4 px-4 text-center font-bold font-cairo">
                        {cust.totalOrders}
                      </td>
                      <td className="py-4 px-4 font-black text-foreground font-cairo">
                        {formatPrice(cust.totalSpent)}
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground">
                        {cust.lastOrder}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <a
                          href={buildWhatsAppLink(
                            cust.phone,
                            `مرحباً ${cust.name}، معاك ${storeName} على منصة متجرك`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
