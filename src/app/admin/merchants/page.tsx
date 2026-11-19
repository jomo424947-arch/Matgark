"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { StatusText } from "@/components/common/StatusText"
import type { PlatformMerchant } from "@/types/saas"
import { Search, X, ExternalLink, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function AdminMerchantsPage() {
  const { pick, locale, t } = useI18n()
  const merchants = usePlatformStore((s) => s.merchants)
  const stores = usePlatformStore((s) => s.stores)
  const plans = usePlatformStore((s) => s.plans)
  const updateMerchantStatus = usePlatformStore((s) => s.updateMerchantStatus)
  const updateMerchantPlan = usePlatformStore((s) => s.updateMerchantPlan)

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return merchants.filter((m) => {
      const matchStatus = statusFilter === "all" || m.status === statusFilter
      const ownedStores = stores.filter((s) => m.storeIds.includes(s.id))
      const matchQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        ownedStores.some(
          (s) =>
            s.nameEn.toLowerCase().includes(q) ||
            s.nameAr.toLowerCase().includes(q) ||
            s.slug.includes(q)
        )
      return matchStatus && matchQuery
    })
  }, [merchants, stores, query, statusFilter])

  const selected: PlatformMerchant | null =
    merchants.find((m) => m.id === selectedId) ?? null

  const handleToggleStatus = (merchant: PlatformMerchant) => {
    const next = merchant.status === "active" ? "suspended" : "active"
    updateMerchantStatus(merchant.id, next)
    toast.success(
      next === "active"
        ? pick(`تم تفعيل حساب ${merchant.name}`, `Activated ${merchant.name}`)
        : pick(`تم إيقاف حساب ${merchant.name}`, `Suspended ${merchant.name}`)
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {pick("إدارة التجار والحسابات", "Merchant Management")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {pick(
            "ابحث واستعرض حسابات التجار، المتاجر المملوكة، باقات الاشتراك، والبلاغات.",
            "Search registered merchants, inspect owned storefronts, adjust plans, and manage account status."
          )}
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute top-3 start-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={pick("ابحث بالاسم، البريد، أو اسم المتجر...", "Search by name, email, or store...")}
            className="w-full h-10 ps-9 pe-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg border border-border self-start">
          {[
            { id: "all", label: t.common.all },
            { id: "active", label: t.common.active },
            { id: "suspended", label: t.common.suspended },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
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

      {/* Merchants Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">{pick("التاجر", "Merchant")}</th>
                <th className="py-3 px-4 text-start font-semibold">{pick("المتاجر", "Stores")}</th>
                <th className="py-3 px-4 text-start font-semibold">{pick("الباقة", "Plan")}</th>
                <th className="py-3 px-4 text-start font-semibold">{t.common.status}</th>
                <th className="py-3 px-4 text-start font-semibold">{pick("البلاغات", "Issues")}</th>
                <th className="py-3 px-4 text-start font-semibold">{pick("تاريخ التسجيل", "Joined")}</th>
                <th className="py-3 px-4 text-end font-semibold">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    {t.common.noResults}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const ownedStores = stores.filter((s) => m.storeIds.includes(s.id))
                  const plan = plans.find((p) => p.id === m.planId)
                  return (
                    <tr key={m.id} className="hover:bg-muted/20">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{m.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {m.email} · {m.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {ownedStores.map((s) => (
                          <div key={s.id} className="font-medium text-foreground">
                            {pick(s.nameAr, s.nameEn)}
                          </div>
                        ))}
                      </td>
                      <td className="py-3.5 px-4 text-foreground font-medium">
                        {plan ? pick(plan.nameAr, plan.nameEn) : m.planId}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusText
                          tone={m.status === "active" ? "success" : "danger"}
                          icon={m.status === "active" ? "check" : "x"}
                          label={m.status === "active" ? t.common.active : t.common.suspended}
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums">
                        {m.reportedIssues > 0 ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {m.reportedIssues}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString(
                          locale === "ar" ? "ar-EG" : "en-US"
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedId(m.id)}
                            className="px-2.5 py-1.5 rounded-md border border-border text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                          >
                            {pick("التفاصيل", "Details")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(m)}
                            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                              m.status === "active"
                                ? "text-rose-600 hover:bg-rose-500/10"
                                : "text-emerald-600 hover:bg-emerald-500/10"
                            }`}
                          >
                            {m.status === "active"
                              ? pick("إيقاف", "Suspend")
                              : pick("تفعيل", "Activate")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merchant Details Drawer */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selected.name}
          className="fixed inset-0 z-50 bg-black/50 flex justify-end"
        >
          <div className="w-full max-w-lg bg-card h-full border-s border-border p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">{selected.name}</h2>
                <p className="text-xs font-mono text-muted-foreground">{selected.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label={t.common.close}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                <div className="text-muted-foreground">{pick("رقم الهاتف", "Phone")}</div>
                <div className="font-mono font-semibold text-foreground">{selected.phone}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                <div className="text-muted-foreground">{pick("آخر نشاط", "Last Active")}</div>
                <div className="font-mono font-semibold text-foreground">
                  {new Date(selected.lastActiveAt).toLocaleDateString(
                    locale === "ar" ? "ar-EG" : "en-US"
                  )}
                </div>
              </div>
            </div>

            {/* Subscription Plan Switcher */}
            <div className="space-y-2">
              <label htmlFor="merchant-plan-select" className="block text-xs font-semibold text-foreground">
                {pick("باقة الاشتراك الحالية", "Assigned Subscription Plan")}
              </label>
              <select
                id="merchant-plan-select"
                value={selected.planId}
                onChange={(e) => {
                  updateMerchantPlan(selected.id, e.target.value)
                  toast.success(pick("تم تحديث باقة التاجر", "Merchant plan updated"))
                }}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {pick(p.nameAr, p.nameEn)}
                  </option>
                ))}
              </select>
            </div>

            {/* Owned Stores */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-foreground">
                {pick("المتاجر المملوكة", "Owned Storefronts")}
              </h3>
              {stores
                .filter((s) => selected.storeIds.includes(s.id))
                .map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl border border-border flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {pick(s.nameAr, s.nameEn)}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">/s/{s.slug}</div>
                    </div>
                    <Link
                      href={`/s/${s.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>{t.common.viewStorefront}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleStatus(selected)}
                className={`h-10 px-4 rounded-lg text-xs font-semibold cursor-pointer ${
                  selected.status === "active"
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {selected.status === "active"
                  ? pick("إيقاف الحساب", "Suspend Account")
                  : pick("إعادة تفعيل الحساب", "Activate Account")}
              </button>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="h-10 px-4 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
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
