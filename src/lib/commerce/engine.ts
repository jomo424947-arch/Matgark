import type {
  CatalogProduct,
  CatalogVariant,
  DiscountCode,
  OrderLifecycleStatus,
  ShippingMethod,
  StoreOrder,
  StoreSection,
} from "@/types/saas"

/**
 * Computes total stock across all variants of a product.
 */
export function getProductTotalStock(product: Pick<CatalogProduct, "variants">): number {
  return product.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0)
}

/**
 * Classifies stock health for a product based on its lowStockThreshold.
 */
export function getStockLevelStatus(
  product: Pick<CatalogProduct, "variants" | "lowStockThreshold">
): "in_stock" | "low_stock" | "out_of_stock" {
  const total = getProductTotalStock(product)
  if (total <= 0) return "out_of_stock"
  if (total <= Math.max(1, product.lowStockThreshold)) return "low_stock"
  return "in_stock"
}

/**
 * Formats variant attribute label cleanly (e.g. "Black / M" or "50ml").
 */
export function formatVariantLabel(variant: Pick<CatalogVariant, "color" | "size" | "material" | "capacity">): string {
  const parts = [variant.color, variant.size, variant.material, variant.capacity].filter(
    (p): p is string => Boolean(p && p.trim())
  )
  return parts.length > 0 ? parts.join(" / ") : "Standard"
}

/**
 * Multi-tenant isolation filter: returns only items belonging to `storeId`.
 */
export function scopeByTenant<T extends { storeId: string }>(
  records: T[],
  storeId: string
): T[] {
  return records.filter((item) => item.storeId === storeId)
}

export interface DiscountCalculationInput {
  code: string
  discounts: DiscountCode[]
  storeId: string
  subtotal: number
  shippingFee: number
  cartItems: { productId: string; categoryId?: string; lineTotal: number }[]
  isFirstOrder: boolean
  now?: Date
}

export interface DiscountCalculationResult {
  valid: boolean
  reason?:
    | "not_found"
    | "inactive"
    | "expired"
    | "not_started"
    | "usage_limit_reached"
    | "min_order_not_met"
    | "first_order_only"
    | "scope_not_matched"
  discountAmount: number
  freeShipping: boolean
  appliedDiscount?: DiscountCode
}

/**
 * Evaluates a coupon code against tenant scope, dates, usage cap, min order, and item eligibility.
 */
export function evaluateDiscountCode(
  input: DiscountCalculationInput
): DiscountCalculationResult {
  const normalized = input.code.trim().toUpperCase()
  if (!normalized) {
    return { valid: false, reason: "not_found", discountAmount: 0, freeShipping: false }
  }

  const discount = input.discounts.find(
    (d) => d.storeId === input.storeId && d.code.toUpperCase() === normalized
  )

  if (!discount) {
    return { valid: false, reason: "not_found", discountAmount: 0, freeShipping: false }
  }

  if (!discount.active) {
    return { valid: false, reason: "inactive", discountAmount: 0, freeShipping: false }
  }

  const nowMs = (input.now ?? new Date()).getTime()
  if (discount.startsAt && nowMs < new Date(discount.startsAt).getTime()) {
    return { valid: false, reason: "not_started", discountAmount: 0, freeShipping: false }
  }
  if (discount.expiresAt && nowMs > new Date(discount.expiresAt).getTime()) {
    return { valid: false, reason: "expired", discountAmount: 0, freeShipping: false }
  }

  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return {
      valid: false,
      reason: "usage_limit_reached",
      discountAmount: 0,
      freeShipping: false,
    }
  }

  if (input.subtotal < discount.minOrderValue) {
    return {
      valid: false,
      reason: "min_order_not_met",
      discountAmount: 0,
      freeShipping: false,
    }
  }

  if (discount.firstOrderOnly && !input.isFirstOrder) {
    return {
      valid: false,
      reason: "first_order_only",
      discountAmount: 0,
      freeShipping: false,
    }
  }

  let eligibleSubtotal = input.subtotal
  if (discount.scope === "product" && discount.targetIds?.length) {
    eligibleSubtotal = input.cartItems
      .filter((item) => discount.targetIds!.includes(item.productId))
      .reduce((sum, item) => sum + item.lineTotal, 0)
  } else if (discount.scope === "category" && discount.targetIds?.length) {
    eligibleSubtotal = input.cartItems
      .filter(
        (item) => item.categoryId && discount.targetIds!.includes(item.categoryId)
      )
      .reduce((sum, item) => sum + item.lineTotal, 0)
  }

  if (eligibleSubtotal <= 0) {
    return {
      valid: false,
      reason: "scope_not_matched",
      discountAmount: 0,
      freeShipping: false,
    }
  }

  if (discount.type === "free_shipping") {
    return {
      valid: true,
      discountAmount: Math.max(0, input.shippingFee),
      freeShipping: true,
      appliedDiscount: discount,
    }
  }

  if (discount.type === "percentage") {
    const raw = (eligibleSubtotal * Math.min(100, Math.max(0, discount.value))) / 100
    return {
      valid: true,
      discountAmount: Math.round(raw),
      freeShipping: false,
      appliedDiscount: discount,
    }
  }

  // Fixed amount
  return {
    valid: true,
    discountAmount: Math.min(eligibleSubtotal, Math.max(0, discount.value)),
    freeShipping: false,
    appliedDiscount: discount,
  }
}

/**
 * Calculates shipping fee for a selected shipping method, city, and subtotal.
 */
export function calculateShippingFee(params: {
  method: ShippingMethod | undefined
  subtotal: number
  city?: string
}): { fee: number; isFree: boolean; remainingForFree: number } {
  const { method, subtotal, city } = params
  if (!method || !method.enabled || subtotal <= 0) {
    return { fee: 0, isFree: true, remainingForFree: 0 }
  }

  if (method.type === "pickup") {
    return { fee: 0, isFree: true, remainingForFree: 0 }
  }

  if (method.freeAbove !== null && subtotal >= method.freeAbove) {
    return { fee: 0, isFree: true, remainingForFree: 0 }
  }

  const remainingForFree =
    method.freeAbove !== null ? Math.max(0, method.freeAbove - subtotal) : 0

  if (method.type === "by_zone" && method.zones && city) {
    const zoneRate = method.zones[city]
    if (typeof zoneRate === "number") {
      return { fee: zoneRate, isFree: zoneRate === 0, remainingForFree }
    }
  }

  return { fee: method.rate, isFree: method.rate === 0, remainingForFree }
}

/**
 * Reorders homepage sections immutably by moving a section up or down.
 */
export function reorderStoreSections(
  sections: StoreSection[],
  sectionId: string,
  direction: "up" | "down"
): StoreSection[] {
  const sorted = [...sections].sort((a, b) => a.order - b.order)
  const index = sorted.findIndex((s) => s.id === sectionId)
  if (index === -1) return sorted

  const targetIndex = direction === "up" ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= sorted.length) return sorted

  const copy = [...sorted]
  const [moved] = copy.splice(index, 1)
  copy.splice(targetIndex, 0, moved)

  return copy.map((sec, idx) => ({ ...sec, order: idx }))
}

/**
 * Computes merchant order summary metrics for a store.
 */
export function computeStoreOrderMetrics(orders: StoreOrder[]) {
  const nonCancelled = orders.filter(
    (o) => o.status !== "cancelled" && o.status !== "refunded"
  )
  const totalSales = nonCancelled.reduce((sum, o) => sum + o.total, 0)
  const pendingCount = orders.filter(
    (o) => o.status === "pending" || o.status === "confirmed" || o.status === "processing"
  ).length
  const completedCount = orders.filter((o) => o.status === "delivered").length
  const cancelledCount = orders.filter(
    (o) => o.status === "cancelled" || o.status === "returned" || o.status === "refunded"
  ).length
  const averageOrderValue =
    nonCancelled.length > 0 ? Math.round(totalSales / nonCancelled.length) : 0

  return {
    totalSales,
    totalOrders: orders.length,
    pendingCount,
    completedCount,
    cancelledCount,
    averageOrderValue,
  }
}

export const ALL_ORDER_STATUSES: OrderLifecycleStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "ready_for_shipment",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
]
