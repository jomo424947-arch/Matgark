"use server"

import { requireSessionContext } from "@/server/auth/dal"
import { discountInputSchema, updateDiscountInputSchema } from "@/lib/validation/schemas"
import {
  getDiscountsByStore,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscountCode,
  addAuditLog,
} from "@/server/db/client"
import type { Discount } from "@/types/domain"

export async function getDiscountsAction(): Promise<{
  ok: boolean
  discounts: Discount[]
  error?: string
}> {
  try {
    const { store } = await requireSessionContext()
    const discounts = await getDiscountsByStore(store.id)
    return { ok: true, discounts }
  } catch (err) {
    return {
      ok: false,
      discounts: [],
      error: err instanceof Error ? err.message : "فشل جلب الخصومات",
    }
  }
}

export async function createDiscountAction(input: {
  code: string
  type: "percentage" | "fixed" | "free_shipping"
  value: number
  minOrderValue?: number
  maxDiscount?: number
  usageLimit?: number
  expiresAt?: string
  isActive?: boolean
}): Promise<{ ok: boolean; error?: string; discount?: Discount }> {
  const { store } = await requireSessionContext()

  const parsed = discountInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "بيانات كود الخصم غير صحيحة",
    }
  }

  try {
    const discount = await createDiscount({
      storeId: store.id,
      code: parsed.data.code,
      type: parsed.data.type,
      value: parsed.data.value,
      minOrderValue: parsed.data.minOrderValue,
      maxDiscount: parsed.data.maxDiscount,
      usageLimit: parsed.data.usageLimit,
      expiresAt: parsed.data.expiresAt,
      isActive: parsed.data.isActive,
    })

    await addAuditLog(
      store.id,
      "discount_created",
      `Created discount code: ${discount.code}`
    )

    return { ok: true, discount }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل إنشاء كود الخصم",
    }
  }
}

export async function updateDiscountAction(
  discountId: string,
  input: Partial<{
    code: string
    type: "percentage" | "fixed" | "free_shipping"
    value: number
    minOrderValue: number
    maxDiscount: number
    usageLimit: number
    expiresAt: string
    isActive: boolean
  }>
): Promise<{ ok: boolean; error?: string; discount?: Discount }> {
  const { store } = await requireSessionContext()

  const parsed = updateDiscountInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "بيانات تحديث كود الخصم غير صحيحة",
    }
  }

  try {
    const updated = await updateDiscount(store.id, discountId, parsed.data)
    if (!updated) {
      return { ok: false, error: "كود الخصم غير موجود أو فشل التحديث" }
    }

    await addAuditLog(
      store.id,
      "discount_updated",
      `Updated discount code: ${updated.code}`
    )

    return { ok: true, discount: updated }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل تحديث كود الخصم",
    }
  }
}

export async function deleteDiscountAction(
  discountId: string
): Promise<{ ok: boolean; error?: string }> {
  const { store } = await requireSessionContext()

  try {
    const success = await deleteDiscount(store.id, discountId)
    if (!success) {
      return { ok: false, error: "فشل حذف كود الخصم" }
    }

    await addAuditLog(
      store.id,
      "discount_deleted",
      `Deleted discount ID: ${discountId}`
    )

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل حذف كود الخصم",
    }
  }
}

export async function validateDiscountAction(
  storeId: string,
  code: string,
  cartSubtotal: number
): Promise<{
  valid: boolean
  discount?: Discount
  discountAmount?: number
  error?: string
}> {
  return validateDiscountCode(storeId, code, cartSubtotal)
}
