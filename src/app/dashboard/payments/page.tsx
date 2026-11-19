"use client"

import React, { useState } from "react"
import { CreditCard, Banknote, Landmark, Save, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { StatusText } from "@/components/common/StatusText"

export default function MerchantPaymentsPage() {
  const { pick } = useI18n()
  const { store } = useActiveMerchantStore()
  const updateStore = usePlatformStore((s) => s.updateStore)

  const [codEnabled, setCodEnabled] = useState(store?.paymentConfig.codEnabled ?? true)
  const [codFee, setCodFee] = useState(String(store?.paymentConfig.codFee ?? 0))
  const [bankEnabled, setBankEnabled] = useState(
    store?.paymentConfig.bankTransferEnabled ?? false
  )
  const [bankName, setBankName] = useState(store?.paymentConfig.bankName || "")
  const [bankAccountName, setBankAccountName] = useState(
    store?.paymentConfig.bankAccountName || ""
  )
  const [bankIban, setBankIban] = useState(store?.paymentConfig.bankIban || "")

  if (!store) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateStore(store.id, {
      paymentConfig: {
        ...store.paymentConfig,
        codEnabled,
        codFee: Math.max(0, Number(codFee) || 0),
        bankTransferEnabled: bankEnabled,
        bankName: bankName.trim(),
        bankAccountName: bankAccountName.trim(),
        bankIban: bankIban.trim(),
        onlineGatewayConnected: false,
      },
    })
    toast.success(pick("تم حفظ إعدادات الدفع بنجاح", "Payment settings saved"))
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {pick("إعدادات طرق الدفع", "Payment Methods")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pick(
              "فعّل الدفع عند الاستلام أو التحويل البنكي، واستعرض حالة بوابات الدفع الإلكتروني.",
              "Configure Cash on Delivery and bank transfer instructions, and inspect online gateway status."
            )}
          </p>
        </div>
        <button
          type="submit"
          className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{pick("حفظ الإعدادات", "Save Payments")}</span>
        </button>
      </div>

      {/* COD */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold">{pick("الدفع عند الاستلام (COD)", "Cash on Delivery (COD)")}</h2>
              <p className="text-xs text-muted-foreground">
                {pick("يدفع العميل نقداً لمندوب الشحن عند استلام الطلب.", "Customer pays cash to the courier upon delivery.")}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={codEnabled}
            onChange={(e) => setCodEnabled(e.target.checked)}
            className="w-5 h-5 accent-primary cursor-pointer"
          />
        </div>
        {codEnabled && (
          <div className="max-w-xs">
            <label className="block text-xs font-semibold mb-1.5">
              {pick("رسوم إضافية للدفع عند الاستلام (اختياري)", "Extra COD Fee (Optional)")} ({store.localization.currency})
            </label>
            <input
              type="number"
              min={0}
              value={codFee}
              onChange={(e) => setCodFee(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-mono"
            />
          </div>
        )}
      </div>

      {/* Bank Transfer */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold">{pick("التحويل البنكي المباشر", "Direct Bank Transfer")}</h2>
              <p className="text-xs text-muted-foreground">
                {pick("تظهر بيانات الحساب البنكي للعميل بعد تأكيد الطلب.", "Bank details are presented to shoppers during checkout.")}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={bankEnabled}
            onChange={(e) => setBankEnabled(e.target.checked)}
            className="w-5 h-5 accent-primary cursor-pointer"
          />
        </div>

        {bankEnabled && (
          <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-border">
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("اسم البنك", "Bank Name")}</label>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="CIB Egypt"
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">{pick("اسم صاحب الحساب", "Account Holder")}</label>
              <input
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">IBAN</label>
              <input
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-mono dir-ltr"
              />
            </div>
          </div>
        )}
      </div>

      {/* Honest Disconnected Online Gateways */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold">{pick("بوابات الدفع الإلكتروني", "Online Payment Gateways")}</h2>
              <p className="text-xs text-muted-foreground">
                Stripe · Paymob · Tap Payments
              </p>
            </div>
          </div>
          <StatusText
            tone="warning"
            icon="warn"
            label={pick("غير مرتبط — يتطلب إعداد الخادم", "Not Connected — Requires Backend Keys")}
          />
        </div>

        <div className="rounded-xl bg-muted/50 border border-border p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <p className="leading-relaxed">
            {pick(
              "لأسباب أمنية لا يتم تفعيل حقول بطاقات الائتمان في الواجهة الأمامية بدون ربط خادم دفع حقيقي (Webhook + Secret Key). يمكنك حالياً قبول الطلبات عبر الدفع عند الاستلام والتحويل البنكي.",
              "For security compliance, live credit card collection is disabled until a backend payment gateway webhook and secret key are provisioned. Orders currently run through COD and Bank Transfer."
            )}
          </p>
        </div>
      </div>
    </form>
  )
}
