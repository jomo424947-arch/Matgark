"use client"

import React, { useState } from "react"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { StatusText } from "@/components/common/StatusText"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

export default function AdminSubscriptionsPage() {
  const { pick, t, formatCurrency } = useI18n()
  const plans = usePlatformStore((s) => s.plans)
  const subscriptions = usePlatformStore((s) => s.subscriptions)
  const createPlan = usePlatformStore((s) => s.createPlan)
  const updatePlan = usePlatformStore((s) => s.updatePlan)

  const [modalOpen, setModalOpen] = useState(false)
  const [nameEn, setNameEn] = useState("")
  const [nameAr, setNameAr] = useState("")
  const [monthlyPrice, setMonthlyPrice] = useState("799")
  const [yearlyPrice, setYearlyPrice] = useState("7990")
  const [productLimit, setProductLimit] = useState("200")
  const [staffLimit, setStaffLimit] = useState("10")

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameEn.trim() || !nameAr.trim()) return
    createPlan({
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      descriptionEn: "Custom SaaS merchant tier",
      descriptionAr: "باقة مخصصة لأصحاب المتاجر",
      monthlyPrice: Number(monthlyPrice) || 0,
      yearlyPrice: Number(yearlyPrice) || 0,
      currency: "EGP",
      productLimit: productLimit ? Number(productLimit) : null,
      staffLimit: Number(staffLimit) || 3,
      customDomain: true,
      storeBuilderAccess: true,
      analyticsAccess: true,
      featuresEn: [`Up to ${productLimit || "Unlimited"} products`, `${staffLimit} team members`],
      featuresAr: [`حتى ${productLimit || "غير محدود"} منتج`, `${staffLimit} أعضاء فريق`],
      active: true,
    })
    setModalOpen(false)
    setNameEn("")
    setNameAr("")
    toast.success(pick("تم إنشاء الباقة الجديدة بنجاح", "New subscription plan created"))
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {pick("إدارة الباقات والاشتراكات", "Plans & Subscriptions")}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {pick(
              "تحديد الأسعار وحدود المنتجات والمزايا ومتابعة الاشتراكات النشطة والمدفوعات.",
              "Configure plan pricing, product limits, team caps, and inspect active/expired subscriptions."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{pick("إنشاء باقة جديدة", "Create Plan")}</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="border border-border rounded-xl bg-card p-5 flex flex-col justify-between space-y-5"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {pick(plan.nameAr, plan.nameEn)}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {pick(plan.descriptionAr, plan.descriptionEn)}
                  </p>
                </div>
                <StatusText
                  tone={plan.active ? "success" : "neutral"}
                  label={plan.active ? t.common.active : pick("معطّل", "Disabled")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/40">
                  <div className="text-muted-foreground">{pick("شهري", "Monthly")}</div>
                  <div className="font-mono font-bold text-sm text-foreground mt-0.5">
                    {formatCurrency(plan.monthlyPrice)}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40">
                  <div className="text-muted-foreground">{pick("سنوي", "Yearly")}</div>
                  <div className="font-mono font-bold text-sm text-foreground mt-0.5">
                    {formatCurrency(plan.yearlyPrice)}
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
                <div className="flex justify-between">
                  <span>{pick("حد المنتجات", "Product Limit")}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {plan.productLimit ?? pick("غير محدود", "Unlimited")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{pick("أعضاء الفريق", "Staff Seats")}</span>
                  <span className="font-mono font-semibold text-foreground">{plan.staffLimit}</span>
                </div>
                <div className="flex justify-between">
                  <span>{pick("مصمم المتجر", "Store Builder")}</span>
                  <span className="font-semibold text-foreground">
                    {plan.storeBuilderAccess ? pick("مشمول", "Included") : "—"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                updatePlan(plan.id, { active: !plan.active })
                toast.success(pick("تم تحديث حالة الباقة", "Plan availability updated"))
              }}
              className="w-full h-9 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
            >
              {plan.active ? pick("تعطيل الباقة", "Disable Plan") : pick("تفعيل الباقة", "Enable Plan")}
            </button>
          </div>
        ))}
      </div>

      {/* Active & Expired Subscriptions Ledger */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">
            {pick("سجل الاشتراكات والمدفوعات", "Subscriptions & Payment Records")}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">{pick("التاجر / المتجر", "Merchant / Store")}</th>
                <th className="py-3 px-4 text-start font-semibold">{pick("الباقة", "Plan")}</th>
                <th className="py-3 px-4 text-start font-semibold">{pick("الفترة", "Billing")}</th>
                <th className="py-3 px-4 text-end font-semibold">{pick("المبلغ", "Amount")}</th>
                <th className="py-3 px-4 text-start font-semibold">{pick("تاريخ التجديد", "Renewal")}</th>
                <th className="py-3 px-4 text-start font-semibold">{t.common.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-muted/20">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground">{sub.storeName}</div>
                    <div className="text-[11px] text-muted-foreground">{sub.merchantName}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">{sub.planName}</td>
                  <td className="py-3 px-4 text-muted-foreground">{sub.billingPeriod}</td>
                  <td className="py-3 px-4 text-end font-mono tabular-nums font-semibold">
                    {formatCurrency(sub.amount)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-muted-foreground">
                    {sub.renewDate}
                  </td>
                  <td className="py-3 px-4">
                    <StatusText
                      tone={sub.status === "active" ? "success" : "danger"}
                      icon={sub.status === "active" ? "check" : "x"}
                      label={sub.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Plan Modal */}
      {modalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">
                {pick("إنشاء باقة اشتراك جديدة", "Create Subscription Plan")}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label={t.common.close}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">{pick("الاسم (عربي)", "Name (AR)")}</label>
                  <input
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="باقة الأعمال"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">{pick("الاسم (إنجليزي)", "Name (EN)")}</label>
                  <input
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Business Plus"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">{pick("السعر الشهري", "Monthly Price")}</label>
                  <input
                    type="number"
                    min="0"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">{pick("السعر السنوي", "Yearly Price")}</label>
                  <input
                    type="number"
                    min="0"
                    value={yearlyPrice}
                    onChange={(e) => setYearlyPrice(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">{pick("حد المنتجات", "Product Limit")}</label>
                  <input
                    type="number"
                    min="1"
                    value={productLimit}
                    onChange={(e) => setProductLimit(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">{pick("حد الفريق", "Staff Limit")}</label>
                  <input
                    type="number"
                    min="1"
                    value={staffLimit}
                    onChange={(e) => setStaffLimit(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-9 px-4 rounded-lg border border-border font-semibold cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold cursor-pointer"
                >
                  {t.common.create}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
