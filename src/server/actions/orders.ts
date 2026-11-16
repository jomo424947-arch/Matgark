"use server"

import { requireSessionContext } from "@/server/auth/dal"
import {
  updateOrderStatusSchema,
  checkoutOrderSchema,
} from "@/lib/validation/schemas"
import { checkRateLimit } from "@/server/auth/rate-limit"
import {
  placeOrderTransaction,
  updateOrderStatusTransaction,
  addAuditLog,
} from "@/server/db/client"
import type { Order, OrderStatus } from "@/types/domain"

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus,
  note?: string
): Promise<{ ok: boolean; error?: string; order?: Order }> {
  const { store } = await requireSessionContext()

  const parsed = updateOrderStatusSchema.safeParse({
    orderId,
    status: newStatus,
    note,
  })

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "بيانات الحالة غير صحيحة",
    }
  }

  const updatedOrder = await updateOrderStatusTransaction(
    orderId,
    store.id,
    parsed.data.status as OrderStatus,
    parsed.data.note
  )

  if (!updatedOrder) {
    return { ok: false, error: "الأوردر غير موجود أو ليس لديك صلاحية تعديله" }
  }

  await addAuditLog(
    store.id,
    "order_status_updated",
    `Order #${updatedOrder.orderNumber} status changed to ${updatedOrder.status}`
  )

  return { ok: true, order: updatedOrder }
}

export async function placeOrderAction(input: {
  storeSlug: string
  customerName: string
  customerPhone: string
  customerCity: string
  customerAddress: string
  customerNotes?: string
  items: {
    productId: string
    variantId?: string
    size: string
    color: string
    quantity: number
  }[]
  honeypot?: string
}): Promise<{
  ok: boolean
  error?: string
  orderNumber?: string
  subtotal?: number
  deliveryFee?: number
  total?: number
}> {
  // 1. Honeypot check for bots
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { ok: false, error: "Invalid submission" }
  }

  // 2. Validate input schema
  const parsed = checkoutOrderSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "بيانات الطلب غير مكتملة",
    }
  }

  // 3. Checkout rate limiting (10 orders per 10 mins per phone)
  const rate = checkRateLimit(
    `order:${parsed.data.customerPhone}`,
    10,
    10 * 60 * 1000
  )
  if (!rate.allowed) {
    return {
      ok: false,
      error: "تم إرسال عدة طلبات خلال وقت قصير. يرجى الانتظار قليلاً قبل المحاولة مجدداً.",
    }
  }

  // 4. Run order creation via Supabase
  return placeOrderTransaction({
    storeSlug: parsed.data.storeSlug,
    customerName: parsed.data.customerName,
    customerPhone: parsed.data.customerPhone,
    customerCity: parsed.data.customerCity,
    customerAddress: parsed.data.customerAddress,
    customerNotes: parsed.data.customerNotes,
    items: parsed.data.items,
  })
}
