"use client"

import React, { useState } from "react"
import { Truck, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import type { ShippingMethod } from "@/types/saas"

export default function MerchantShippingPage() {
  const { pick, formatCurrency } = useI18n()
  const { store } = useActiveMerchantStore()
  const updateStore = usePlatformStore((s) => s.updateStore)

  const [nameAr, setNameAr] = useState("")
  const [nameEn, setNameEn] = useState("")
  const [type, setType] = useState<ShippingMethod["type"]>("flat")
  const [rate, setRate] = useState("65")
  const [freeAbove, setFreeAbove] = useState("1500")
  const [daysEn, setDaysEn] = useState("2 - 4 business days")
  const [daysAr, setDaysAr] = useState("2 - 4 أيام عمل")

  if (!store) return null
  const currency = store.localization.currency

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameEn.trim() && !nameAr.trim()) return
    const nextMethod: ShippingMethod = {
      id: `ship-${Date.now()}`,
      nameAr: nameAr.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      type,
      rate: type === "pickup" ? 0 : Math.max(0, Number(rate) || 0),
      freeAbove: Number(freeAbove) > 0 ? Number(freeAbove) : null,
      estimatedDaysAr: daysAr.trim() || "2 - 4 أيام",
      estimatedDaysEn: daysEn.trim() || "2 - 4 days",
      enabled: true,
    }
    updateStore(store.id, {
      shippingMethods: [...store.shippingMethods, nextMethod],
    })
    setNameAr("")
    setNameEn("")
    toast.success(pick("تمت إضافة وسيلة الشحن", "Shipping method added"))
  }

  const toggleMethod = (id: string) => {
    updateStore(store.id, {
      shippingMethods: store.shippingMethods.map((m) =>
        m.id === id ? { ...m, enabled: !m.enabled } : m
      ),
    })
  }

  const removeMethod = (id: string) => {
    updateStore(store.id, {
      shippingMethods: store.shippingMethods.filter((m) => m.id !== id),
    })
    toast.success(pick("تم حذف وسيلة الشحن", "Shipping method removed"))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {pick("إعدادات الشحن والتوصيل", "Shipping & Delivery Methods")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pick(
            "أضف طرق الشحن، حد الشحن المجاني، ومدة التوصيل التي تظهر للعميل عند إتمام الطلب.",
            "Configure flat rates, zone shipping, local pickup, and free-shipping thresholds."
          )}
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleAdd}
          className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold">{pick("إضافة طريقة شحن", "Add Shipping Method")}</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("الاسم (عربي)", "Name (Arabic)")}</label>
            <input
              required
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="توصيل سريع في نفس اليوم"
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("الاسم (إنجليزي)", "Name (English)")}</label>
            <input
              required
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Same-Day Express Courier"
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("النوع", "Method Type")}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ShippingMethod["type"])}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="flat">{pick("سعر ثابت", "Flat Rate")}</option>
              <option value="by_zone">{pick("حسب المحافظة / المنطقة", "Zone-Based")}</option>
              <option value="local_delivery">{pick("توصيل محلي سريع", "Local Delivery")}</option>
              <option value="pickup">{pick("استلام من الفرع", "Store Pickup")}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("التكلفة", "Rate")}</label>
              <input
                type="number"
                min={0}
                disabled={type === "pickup"}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-mono disabled:opacity-40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("مجاني فوق", "Free Above")}</label>
              <input
                type="number"
                min={0}
                value={freeAbove}
                onChange={(e) => setFreeAbove(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("المدة (عربي)", "ETA (AR)")}</label>
              <input
                value={daysAr}
                onChange={(e) => setDaysAr(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("المدة (إنجليزي)", "ETA (EN)")}</label>
              <input
                value={daysEn}
                onChange={(e) => setDaysEn(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{pick("إضافة وسيلة الشحن", "Add Shipping Method")}</span>
          </button>
        </form>

        <div className="lg:col-span-8 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-bold">
              {pick("طرق الشحن المفعّلة في المتجر", "Configured Shipping Methods")} ({store.shippingMethods.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {store.shippingMethods.map((m) => (
              <div key={m.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{pick(m.nameAr, m.nameEn)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                    {m.rate === 0 ? pick("مجاني", "Free") : formatCurrency(m.rate, currency)}
                    {" · "}
                    {pick(m.estimatedDaysAr, m.estimatedDaysEn)}
                    {m.freeAbove
                      ? ` · ${pick("مجاني فوق", "Free above")} ${formatCurrency(m.freeAbove, currency)}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMethod(m.id)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold border ${
                      m.enabled
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {m.enabled ? pick("مفعّل", "Enabled") : pick("معطّل", "Disabled")}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMethod(m.id)}
                    className="w-8 h-8 rounded-lg border border-border text-rose-600 flex items-center justify-center hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
