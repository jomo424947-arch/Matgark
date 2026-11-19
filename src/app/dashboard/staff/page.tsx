"use client"

import React, { useState } from "react"
import { Shield, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { usePlatformStore } from "@/stores/platformStore"
import { useI18n } from "@/components/providers/LanguageProvider"
import { STAFF_ROLE_PERMISSIONS } from "@/lib/permissions/rbac"
import { formatStaffRoleLabel } from "@/lib/i18n/translations"
import type { StaffRole } from "@/types/saas"

const ROLES: StaffRole[] = [
  "owner",
  "admin",
  "manager",
  "order_manager",
  "inventory_manager",
]

export default function MerchantStaffPage() {
  const { locale, pick } = useI18n()
  const { store } = useActiveMerchantStore()
  const addStaffMember = usePlatformStore((s) => s.addStaffMember)
  const updateStaffRole = usePlatformStore((s) => s.updateStaffRole)
  const removeStaffMember = usePlatformStore((s) => s.removeStaffMember)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<StaffRole>("order_manager")

  if (!store) return null

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    addStaffMember(store.id, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status: "invited",
    })
    setName("")
    setEmail("")
    toast.success(pick("تمت إضافة عضو الفريق", "Team member added"))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {pick("فريق العمل والصلاحيات (RBAC)", "Team Members & Role Permissions")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pick(
            "أضف أعضاء فريقك وحدد صلاحيات كل دور بدقة.",
            "Manage store staff accounts and inspect role-based access control permissions."
          )}
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleInvite}
          className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold">{pick("إضافة عضو جديد", "Add Team Member")}</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("الاسم", "Full Name")}</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={pick("مثال: رنا محمود", "e.g. Rana Mahmoud")}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("البريد الإلكتروني", "Email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@brand.com"
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm dir-ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{pick("الدور الوظيفي", "Role")}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
            >
              {ROLES.filter((r) => r !== "owner").map((r) => (
                <option key={r} value={r}>
                  {formatStaffRoleLabel(r, locale)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{pick("إضافة للفريق", "Invite Member")}</span>
          </button>
        </form>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-bold">
                {pick("أعضاء الفريق الحاليون", "Active Team")} ({store.staff.length})
              </h2>
            </div>
            <div className="divide-y divide-border">
              {store.staff.map((m) => (
                <div key={m.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.email} · {m.status === "active" ? pick("نشط", "Active") : pick("مدعو", "Invited")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      disabled={m.role === "owner"}
                      value={m.role}
                      onChange={(e) => {
                        updateStaffRole(store.id, m.id, e.target.value as StaffRole)
                        toast.success(pick("تم تحديث صلاحية العضو", "Staff role updated"))
                      }}
                      className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold disabled:opacity-60"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {formatStaffRoleLabel(r, locale)}
                        </option>
                      ))}
                    </select>
                    {m.role !== "owner" && (
                      <button
                        type="button"
                        onClick={() => {
                          removeStaffMember(store.id, m.id)
                          toast.success(pick("تمت إزالة العضو", "Member removed"))
                        }}
                        className="w-8 h-8 rounded-lg border border-border text-rose-600 flex items-center justify-center hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold">{pick("مصفوفة الصلاحيات حسب الدور", "Role Permissions Matrix")}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {ROLES.map((r) => (
                <div key={r} className="p-3 rounded-xl border border-border bg-muted/30">
                  <p className="text-xs font-bold mb-1.5">{formatStaffRoleLabel(r, locale)}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-mono">
                    {STAFF_ROLE_PERMISSIONS[r].join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
