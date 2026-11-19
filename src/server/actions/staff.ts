"use server"

import { requireSessionContext } from "@/server/auth/dal"
import { z } from "zod"
import {
  getStaffByStore,
  addStaffMember,
  deleteStaffMember,
  addAuditLog,
} from "@/server/db/client"
import type { StaffMember } from "@/types/domain"

const addStaffSchema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب"),
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
  role: z.enum(["owner", "manager", "staff"]).default("staff"),
})

export async function getStaffAction(): Promise<{
  ok: boolean
  staff: StaffMember[]
  error?: string
}> {
  try {
    const { store } = await requireSessionContext()
    const staff = await getStaffByStore(store.id)
    return { ok: true, staff }
  } catch (err) {
    return {
      ok: false,
      staff: [],
      error: err instanceof Error ? err.message : "فشل جلب فريق العمل",
    }
  }
}

export async function addStaffAction(input: {
  name: string
  email: string
  role?: "owner" | "manager" | "staff"
}): Promise<{ ok: boolean; error?: string; staffMember?: StaffMember }> {
  const { store } = await requireSessionContext()

  const parsed = addStaffSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "بيانات الموظف غير صحيحة",
    }
  }

  try {
    const member = await addStaffMember({
      storeId: store.id,
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      status: "active",
    })

    await addAuditLog(
      store.id,
      "staff_added",
      `Added staff member: ${member.name} (${member.role})`
    )

    return { ok: true, staffMember: member }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل إضافة الموظف",
    }
  }
}

export async function deleteStaffAction(
  staffId: string
): Promise<{ ok: boolean; error?: string }> {
  const { store } = await requireSessionContext()

  try {
    const success = await deleteStaffMember(staffId)
    if (!success) {
      return { ok: false, error: "فشل حذف الموظف" }
    }

    await addAuditLog(
      store.id,
      "staff_deleted",
      `Removed staff member ID: ${staffId}`
    )

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل حذف الموظف",
    }
  }
}
