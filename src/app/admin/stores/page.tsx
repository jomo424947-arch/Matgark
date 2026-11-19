"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { StatusText } from "@/components/common/StatusText"
import { formatStoreStatusLabel } from "@/lib/i18n/translations"
import { Search, ExternalLink, Eye, EyeOff, X } from "lucide-react"
import { toast } from "sonner"

export default function AdminStoresPage() {
  const { pick, locale, t, formatCurrency } = useI18n()
  const stores = usePlatformStore((s) => s.stores)
  const merchants = usePlatformStore((s) => s.merchants)
  const products = usePlatformStore((s) => s.products)
  const orders = usePlatformStore((s) => s.orders)
  const plans = usePlatformStore((s) => s.plans)
  const updateStoreStatus = usePlatformStore((s) => s.updateStoreStatus)
  const toggleStoreVisibility = usePlatformStore((s) => s.toggleStoreVisibility)

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return stores.filter((s) => {
      const owner = merchants.find((m) => m.id === s.merchantId)
      const matchStatus = statusFilter === "all" || s.status === statusFilter
      const matchQuery =
        !q ||
        s.nameAr.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (owner?.name.toLowerCase().includes(q) ?? false)
      return matchStatus && matchQuery
    })
  }, [stores, merchants, query, statusFilter])

  const selectedStore = stores.find((s) => s.id === selectedStoreId) ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {pick("إدارة المتاجر", "Store Management")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {pick(
            "مراجعة جميع المتاجر المستقلة، المنتجات، الطلبات، التخصيص، والتحكم بالتفعيل والظهور.",
            "Inspect all tenant storefronts, catalog counts, theme configurations, visibility, and active status."
          )}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute top-3 start-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={pick("ابحث باسم المتجر أو المالك...", "Search by store name, slug, or owner...")}
            className="w-full h-10 ps-9 pe-3 rounded-lg border border-border bg-card text-xs text-foreground"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg border border-border self-start">
          {[
            { id: "all", label: t.common.all },
            { id: "published", label: t.common.published },
            { id: "draft", label: t.common.draft },
            { id: "suspended", label: t.common.suspended },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">{pick("المتجر", "Store")}</th>
                <th className="py-3 px-4 text-start font-semibold">{pick("المالك", "Owner")}</th>
                <th className="py-3 px-4 text-start font-semibold">{pick("المنتجات / الطلبات", "Products / Orders")}</th>
                <th className="py-3 px-4 text-start font-semibold">{t.common.status}</th>
                <th className="py-3 px-4 text-start font-semibold">{pick("الظهور", "Visibility")}</th>
                <th className="py-3 px-4 text-end font-semibold">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => {
                const owner = merchants.find((m) => m.id === s.merchantId)
                const prodCount = products.filter((p) => p.storeId === s.id).length
                const orderCount = orders.filter((o) => o.storeId === s.id).length
                return (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-7 h-7 rounded-md text-white text-xs font-bold flex items-center justify-center shrink-0"
                          style={{ backgroundColor: s.theme.primaryColor }}
                        >
                          {s.logoMonogram}
                        </span>
                        <div>
                          <div className="font-semibold text-foreground">
                            {pick(s.nameAr, s.nameEn)}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            /s/{s.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-foreground">{owner?.name || "—"}</td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-muted-foreground">
                      {prodCount} / {orderCount}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusText
                        tone={
                          s.status === "published"
                            ? "success"
                            : s.status === "suspended"
                              ? "danger"
                              : "warning"
                        }
                        icon={
                          s.status === "published"
                            ? "check"
                            : s.status === "suspended"
                              ? "x"
                              : "clock"
                        }
                        label={formatStoreStatusLabel(s.status, locale)}
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          toggleStoreVisibility(s.id)
                          toast.success(pick("تم تحديث ظهور المتجر", "Store visibility toggled"))
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {s.visible ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{s.visible ? pick("ظاهر", "Public") : pick("مخفي", "Hidden")}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStoreId(s.id)}
                          className="px-2.5 py-1.5 rounded-md border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
                        >
                          {pick("فحص", "Inspect")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = s.status === "published" ? "suspended" : "published"
                            updateStoreStatus(s.id, next)
                            toast.success(
                              next === "published"
                                ? pick("تم تفعيل المتجر", "Store activated")
                                : pick("تم إيقاف المتجر", "Store suspended")
                            )
                          }}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                            s.status === "published"
                              ? "text-rose-600 hover:bg-rose-500/10"
                              : "text-emerald-600 hover:bg-emerald-500/10"
                          }`}
                        >
                          {s.status === "published"
                            ? pick("إيقاف", "Deactivate")
                            : pick("تفعيل", "Activate")}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStore && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex justify-end"
        >
          <div className="w-full max-w-lg bg-card h-full border-s border-border p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {pick(selectedStore.nameAr, selectedStore.nameEn)}
                </h2>
                <p className="text-xs font-mono text-muted-foreground">/s/{selectedStore.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStoreId(null)}
                aria-label={t.common.close}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted/40">
                <div className="text-lg font-bold font-mono tabular-nums">
                  {products.filter((p) => p.storeId === selectedStore.id).length}
                </div>
                <div className="text-[11px] text-muted-foreground">{pick("منتجات", "Products")}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40">
                <div className="text-lg font-bold font-mono tabular-nums">
                  {orders.filter((o) => o.storeId === selectedStore.id).length}
                </div>
                <div className="text-[11px] text-muted-foreground">{pick("طلبات", "Orders")}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40">
                <div className="text-lg font-bold font-mono tabular-nums">
                  {formatCurrency(
                    orders
                      .filter((o) => o.storeId === selectedStore.id)
                      .reduce((s, o) => s + o.total, 0)
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">{pick("مبيعات", "Sales")}</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-foreground">{pick("تكوين القالب والهوية", "Theme & Configuration")}</h3>
              <div className="p-4 rounded-xl border border-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{pick("القالب النشط", "Active Preset")}</span>
                  <span className="font-mono font-semibold">{selectedStore.theme.presetId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{pick("الألوان", "Palette")}</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      selectedStore.theme.primaryColor,
                      selectedStore.theme.secondaryColor,
                      selectedStore.theme.accentColor,
                      selectedStore.theme.backgroundColor,
                    ].map((hex, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-sm border border-border"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{pick("الباقة", "Plan")}</span>
                  <span className="font-semibold">
                    {plans.find((p) => p.id === selectedStore.planId)?.nameEn || selectedStore.planId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{pick("الأقسام المفعلة", "Visible Sections")}</span>
                  <span className="font-mono">
                    {selectedStore.sections.filter((sec) => sec.visible).length} / {selectedStore.sections.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Link
                href={`/s/${selectedStore.slug}`}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                <span>{t.common.viewStorefront}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedStoreId(null)}
                className="h-10 px-4 rounded-lg border border-border text-xs font-semibold cursor-pointer"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
