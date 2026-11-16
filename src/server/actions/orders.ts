"use server"

import { requireSessionContext } from "@/server/auth/dal"
import {
  updateOrderStatusSchema,
  checkoutOrderSchema,
} from "@/lib/validation/schemas"
import { checkRateLimit } from "@/server/auth/rate-limit"
import {
  withTransaction,
  computeProductStockAndStatus,
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

  const updatedOrder = await withTransaction((db) => {
    const order = db.orders.find((o) => o.id === orderId)
    if (!order || order.storeId !== store.id) {
      return null
    }

    const previousStatus = order.status
    const targetStatus = parsed.data.status

    if (previousStatus === targetStatus) {
      return order
    }

    // Inventory management on cancellation
    if (targetStatus === "ملغي" && previousStatus !== "ملغي") {
      // Restore stock
      for (const item of order.items) {
        const product = db.products.find((p) => p.id === item.productId)
        if (product) {
          const variant = product.variants.find(
            (v) =>
              (item.variantId && v.id === item.variantId) ||
              (v.size === item.size && v.color === item.color)
          )
          if (variant) {
            variant.stock += item.quantity
          }
          const { stock, status } = computeProductStockAndStatus(product.variants)
          product.stock = stock
          product.status = status
        }
      }
    } else if (previousStatus === "ملغي" && targetStatus !== "ملغي") {
      // Re-deduct stock if un-cancelling
      for (const item of order.items) {
        const product = db.products.find((p) => p.id === item.productId)
        if (product) {
          const variant = product.variants.find(
            (v) =>
              (item.variantId && v.id === item.variantId) ||
              (v.size === item.size && v.color === item.color)
          )
          if (variant) {
            variant.stock = Math.max(0, variant.stock - item.quantity)
          }
          const { stock, status } = computeProductStockAndStatus(product.variants)
          product.stock = stock
          product.status = status
        }
      }
    }

    order.status = targetStatus
    order.statusHistory.push({
      status: targetStatus,
      timestamp: new Date().toISOString(),
      note: parsed.data.note || undefined,
    })

    return order
  })

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

  // 4. Run authoritative order creation inside database transaction
  const result = await withTransaction(
    (
      db
    ):
      | { ok: false; error: string }
      | {
          ok: true
          orderNumber: string
          subtotal: number
          deliveryFee: number
          total: number
        } => {
      const store = db.stores.find((s) => s.slug === parsed.data.storeSlug)
      if (!store) {
        return { ok: false, error: "المتجر المطلوب غير موجود" }
      }

      // Check stock and compute server-side prices
      let subtotal = 0
      const orderItems = []

      for (const cartItem of parsed.data.items) {
        const product = db.products.find(
          (p) => p.id === cartItem.productId && p.storeId === store.id
        )

        if (!product) {
          return {
            ok: false,
            error: "أحد المنتجات الموجودة في السلة غير متوفر حالياً.",
          }
        }

        const variant = product.variants.find(
          (v) =>
            (cartItem.variantId && v.id === cartItem.variantId) ||
            (v.size === cartItem.size && v.color === cartItem.color)
        )

        if (!variant) {
          return {
            ok: false,
            error: `المقاس ${cartItem.size} أو اللون ${cartItem.color} للمنتج "${product.name}" غير متوفر.`,
          }
        }

        if (variant.stock < cartItem.quantity) {
          return {
            ok: false,
            error: `عذراً، الكمية المتوفرة في المخزن من "${product.name}" (${cartItem.size} - ${cartItem.color}) هي ${variant.stock} قطعة فقط.`,
          }
        }

        // Deduct variant stock
        variant.stock -= cartItem.quantity
        const { stock, status } = computeProductStockAndStatus(product.variants)
        product.stock = stock
        product.status = status

        // Use DB product.price
        const itemTotal = product.price * cartItem.quantity
        subtotal += itemTotal

        orderItems.push({
          id: `item-${Date.now()}-${orderItems.length + 1}`,
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          price: product.price,
          size: cartItem.size,
          color: cartItem.color,
          quantity: cartItem.quantity,
        })
      }

      // Compute Delivery Fee
      let deliveryFee = store.flatFee
      if (store.freeAbove !== null && subtotal >= store.freeAbove) {
        deliveryFee = 0
      } else if (store.deliveryType === "by_city" && store.cityFees) {
        deliveryFee = store.cityFees[parsed.data.customerCity] ?? store.flatFee
      }

      const grandTotal = subtotal + deliveryFee

      // Sequential order number
      store.orderSeq = (store.orderSeq || 1000) + 1
      const orderNumber = String(store.orderSeq)

      // Upsert Customer
      let customer = db.customers.find(
        (c) => c.storeId === store.id && c.phone === parsed.data.customerPhone
      )

      if (customer) {
        customer.name = parsed.data.customerName
        customer.city = parsed.data.customerCity
        customer.totalOrders += 1
        customer.totalSpent += grandTotal
        customer.lastOrder = "اليوم"
        if (customer.totalOrders >= 3) {
          customer.tag = "عميل مميز ⭐"
        }
      } else {
        customer = {
          id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          storeId: store.id,
          name: parsed.data.customerName,
          phone: parsed.data.customerPhone,
          city: parsed.data.customerCity,
          totalOrders: 1,
          totalSpent: grandTotal,
          lastOrder: "اليوم",
          tag: "جديد",
          createdAt: new Date().toISOString(),
        }
        db.customers.push(customer)
      }

      const order: Order = {
        id: `ord-${orderNumber}`,
        orderNumber,
        storeId: store.id,
        customerId: customer.id,
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        customerCity: parsed.data.customerCity,
        customerAddress: parsed.data.customerAddress,
        customerNotes: parsed.data.customerNotes || undefined,
        items: orderItems,
        subtotal,
        deliveryFee,
        total: grandTotal,
        status: "جديد",
        statusHistory: [
          {
            status: "جديد",
            timestamp: new Date().toISOString(),
            note: "تم استلام الطلب بنجاح عبر المتجر",
          },
        ],
        createdAt: new Date().toISOString(),
      }

      db.orders.unshift(order)

      return {
        ok: true,
        orderNumber,
        subtotal,
        deliveryFee,
        total: grandTotal,
      }
    }
  )

  return result
}
