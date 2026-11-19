"use client"

import React, { useState } from "react"
import { Tag, Plus, Trash2, Mail, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { StatusText } from "@/components/common/StatusText"
import type { DiscountScope, DiscountType } from "@/types/saas"

export default function MerchantDiscountsPage() {
  const { pick, formatCurrency } = useI18n()
  const { store, storeDiscounts } = useActiveMerchantStore()
  const createDiscount = usePlatformStore((s) => s.createDiscount)
  const updateDiscount = usePlatformStore((s) => s.updateDiscount)
  const deleteDiscount = usePlatformStore((s) => s.deleteDiscount)

  const [code, setCode] = useState("")
  const [type, setType] = useState<DiscountType>("percentage")
  const [value, setValue] = useState("15")
  const [scope, setScope] = useState<DiscountScope>("all")
  const [minOrderValue, setMinOrderValue] = useState("500")
  const [maxUses, setMaxUses] = useState("100")
  const [firstOrderOnly, setFirstOrderOnly] = useState(false)
  const [expiresAt, setExpiresAt] = useState("2026-12-31")

  if (!store) return null
  const currency = store.localization.currency

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) return
    createDiscount({
      storeId: store.id,
      code: cleanCode,
      type,
      value: type === "free_shipping" ? 0 : Math.max(1, Number(value) || 10),
      scope,
      minOrderValue: Math.max(0, Number(minOrderValue) || 0),
      maxUses: Number(maxUses) > 0 ? Number(maxUses) : null,
      firstOrderOnly,
      startsAt: new Date().toISOString().slice(0, 10),
      expiresAt,
      active: true,
    })
    setCode("")
    toast.success(pick(`تم إنشاء الكوبون ${cleanCode}`, `Coupon ${cleanCode} created`))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {pick("الخصومات والتسويق", "Discounts & Marketing")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pick(
            "أنشئ كوبونات خصم فعالة مباشرة في سلة التسوق وإتمام الطلب لمتجرك.",
            "Create tenant-scoped discount codes that validate immediately at storefront checkout."
          )}
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleCreate}
          className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold">{pick("إنشاء كوبون جديد", "Create Coupon Code")}</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("كود الخصم", "Coupon Code")}</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER15"
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-mono uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("نوع الخصم", "Type")}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DiscountType)}
                className="w-full h-10 rounded-xl border border-border bg-background px-2.5 text-xs"
              >
                <option value="percentage">{pick("نسبة مئوية %", "Percentage %")}</option>
                <option value="fixed">{pick("مبلغ ثابت", "Fixed Amount")}</option>
                <option value="free_shipping">{pick("شحن مجاني", "Free Shipping")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("القيمة", "Value")}</label>
              <input
                type="number"
                disabled={type === "free_shipping"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-mono disabled:opacity-40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("الحد الأدنى للطلب", "Min Order")}</label>
              <input
                type="number"
                min={0}
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("حد الاستخدام", "Max Uses")}</label>
              <input
                type="number"
                min={0}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("النطاق", "Scope")}</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as DiscountScope)}
                className="w-full h-10 rounded-xl border border-border bg-background px-2.5 text-xs"
              >
                <option value="all">{pick("كل المتجر", "Entire Store")}</option>
                <option value="category">{pick("أقسام محددة", "Categories")}</option>
                <option value="product">{pick("منتجات محددة", "Products")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("تاريخ الانتهاء", "Expires On")}</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-2.5 text-xs font-mono"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={firstOrderOnly}
              onChange={(e) => setFirstOrderOnly(e.target.checked)}
            />
            <span>{pick("لأول طلب للعميل فقط", "First-time customers only")}</span>
          </label>

          <button
            type="submit"
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{pick("إنشاء الكوبون", "Create Discount")}</span>
          </button>
        </form>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-bold">
                {pick("الأكواد النشطة والمجدولة", "Store Coupon Codes")} ({storeDiscounts.length})
              </h2>
            </div>
            <div className="divide-y divide-border">
              {storeDiscounts.map((d) => (
                <div key={d.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm">{d.code}</span>
                      <StatusText
                        tone={d.active ? "success" : "neutral"}
                        label={d.active ? pick("نشط", "Active") : pick("متوقف", "Paused")}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                      {d.type === "percentage"
                        ? `${d.value}% ${pick("خصم", "off")}`
                        : d.type === "fixed"
                          ? `${formatCurrency(d.value, currency)} ${pick("خصم", "off")}`
                          : pick("شحن مجاني", "Free Shipping")}
                      {" · "}
                      {pick("الحد الأدنى:", "Min:")} {formatCurrency(d.minOrderValue, currency)}
                      {" · "}
                      {pick("الاستخدام:", "Used:")} {d.usedCount}/{d.maxUses ?? "∞"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateDiscount(d.id, { active: !d.active })}
                      className="h-8 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                    >
                      {d.active ? pick("إيقاف", "Pause") : pick("تفعيل", "Activate")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteDiscount(d.id)
                        toast.success(pick("تم حذف الكوبون", "Discount deleted"))
                      }}
                      className="w-8 h-8 rounded-lg border border-border text-rose-600 flex items-center justify-center hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Marketing Overview */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Mail className="w-4 h-4 text-primary" />
                <span>{pick("مشتركو النشرة البريدية", "Newsletter Subscribers")}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{store.newsletterSubscribers.length}</p>
              <p className="text-xs text-muted-foreground">
                {store.newsletterSubscribers.slice(0, 3).join(", ") ||
                  pick("لا يوجد مشتركون بعد.", "No subscribers collected yet.")}
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>{pick("استرداد السلات المتروكة", "Abandoned Cart Recovery")}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {pick(
                  "يتطلب ربط خدمة أتمتة البريد أو واتساب في الخلفية (غير مفعّل في وضع التطوير المحلي).",
                  "Requires a connected backend email/WhatsApp automation provider (not active in local dev mode)."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
