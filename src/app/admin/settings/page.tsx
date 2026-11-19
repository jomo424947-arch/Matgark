"use client"

import React, { useState } from "react"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { ADMIN_ROLE_PERMISSIONS } from "@/lib/permissions/rbac"
import { Logo } from "@/components/ui/Logo"
import { toast } from "sonner"

export default function AdminSettingsPage() {
  const { pick, t } = useI18n()
  const settings = usePlatformStore((s) => s.platformSettings)
  const updatePlatformSettings = usePlatformStore((s) => s.updatePlatformSettings)

  const [form, setForm] = useState(settings)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updatePlatformSettings(form)
    toast.success(pick("تم حفظ إعدادات المنصة", "Platform settings saved"))
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t.admin.settings}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {pick(
            "الهوية العامة للمنصة، اللغات، العملة الافتراضية، التنبيهات، ومصفوفة صلاحيات المشرفين.",
            "Global branding, default localization, operator notifications, and admin role permissions."
          )}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="border border-border rounded-xl bg-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {pick("الهوية واللغات الافتراضية", "Platform Identity & Localization")}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {pick("الشعار الرسمي المعتمد للمنصة", "Active official platform brand mark")}
              </p>
            </div>
            <Logo size="md" href="" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">{pick("اسم المنصة (عربي)", "Platform Name (AR)")}</label>
              <input
                value={form.platformNameAr}
                onChange={(e) => setForm({ ...form, platformNameAr: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">{pick("اسم المنصة (إنجليزي)", "Platform Name (EN)")}</label>
              <input
                value={form.platformNameEn}
                onChange={(e) => setForm({ ...form, platformNameEn: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">{pick("اللغة الافتراضية", "Default Language")}</label>
              <select
                value={form.defaultLanguage}
                onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value as "ar" | "en" })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background"
              >
                <option value="ar">العربية (RTL)</option>
                <option value="en">English (LTR)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">{pick("العملة الافتراضية", "Default Currency")}</label>
              <select
                value={form.defaultCurrency}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultCurrency: e.target.value as "EGP" | "SAR" | "AED" | "USD",
                  })
                }
                className="w-full h-10 px-3 rounded-lg border border-border bg-background"
              >
                <option value="EGP">EGP — Egyptian Pound</option>
                <option value="SAR">SAR — Saudi Riyal</option>
                <option value="AED">AED — UAE Dirham</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border border-border rounded-xl bg-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-foreground">
            {pick("ملف المشرف والإشعارات", "Admin Profile & Global Controls")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">{pick("اسم المشرف", "Admin Name")}</label>
              <input
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">{pick("بريد المشرف", "Admin Email")}</label>
              <input
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background font-mono"
              />
            </div>
          </div>

          <div className="space-y-2.5 pt-2 text-xs">
            {[
              { key: "allowNewRegistrations" as const, label: pick("السماح بتسجيل تجار جدد", "Allow new merchant registrations") },
              { key: "notifyNewMerchant" as const, label: pick("تنبيه عند تسجيل تاجر جديد", "Notify on new merchant sign-up") },
              { key: "notifySupportTicket" as const, label: pick("تنبيه عند فتح تذكرة دعم", "Notify on new support ticket") },
              { key: "maintenanceMode" as const, label: pick("وضع الصيانة العام", "Enable global maintenance banner") },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[item.key]}
                  onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                  className="rounded border-border"
                />
                <span className="text-foreground">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="border border-border rounded-xl bg-card p-6 space-y-3">
          <h2 className="text-sm font-bold text-foreground">
            {pick("مصفوفة صلاحيات إدارة المنصة (RBAC)", "Admin Role Permission Matrix")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {(Object.entries(ADMIN_ROLE_PERMISSIONS) as [string, string[]][]).map(([role, perms]) => (
              <div key={role} className="p-4 rounded-lg bg-muted/40 space-y-2">
                <div className="font-mono font-bold text-foreground">{role}</div>
                <ul className="space-y-1 text-muted-foreground font-mono text-[11px]">
                  {perms.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 cursor-pointer"
        >
          {t.common.save}
        </button>
      </form>
    </div>
  )
}
