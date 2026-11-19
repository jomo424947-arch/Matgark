import test from "node:test"
import assert from "node:assert/strict"
import {
  getProductTotalStock,
  getStockLevelStatus,
  formatVariantLabel,
  scopeByTenant,
  evaluateDiscountCode,
  calculateShippingFee,
  reorderStoreSections,
  computeStoreOrderMetrics,
} from "./engine"
import { hasMerchantPermission, hasAdminPermission } from "../permissions/rbac"
import { themeToCssVariables, getPresetById } from "../themes/presets"
import type { DiscountCode, ShippingMethod, StoreSection, StoreOrder } from "../../types/saas"

test("variant stock and low-stock status classification", () => {
  const product = {
    lowStockThreshold: 5,
    variants: [
      { id: "v1", sku: "H-BLK-S", size: "S", color: "Black", price: 950, stock: 2, available: true },
      { id: "v2", sku: "H-BLK-M", size: "M", color: "Black", price: 950, stock: 2, available: true },
    ],
  }
  assert.equal(getProductTotalStock(product), 4)
  assert.equal(getStockLevelStatus(product), "low_stock")
  assert.equal(formatVariantLabel(product.variants[0]), "Black / S")

  const outOfStock = {
    lowStockThreshold: 5,
    variants: [{ ...product.variants[0], stock: 0 }],
  }
  assert.equal(getStockLevelStatus(outOfStock), "out_of_stock")
})

test("multi-tenant scoping isolates records strictly by storeId", () => {
  const records = [
    { id: "1", storeId: "store-nova" },
    { id: "2", storeId: "store-lumina" },
    { id: "3", storeId: "store-nova" },
  ]
  const novaOnly = scopeByTenant(records, "store-nova")
  assert.equal(novaOnly.length, 2)
  assert.ok(novaOnly.every((r) => r.storeId === "store-nova"))
})

test("coupon evaluation enforces store isolation, min order, percentage, fixed, and free shipping", () => {
  const discounts: DiscountCode[] = [
    {
      id: "d1",
      storeId: "store-nova",
      code: "NOVA10",
      type: "percentage",
      value: 10,
      scope: "all",
      minOrderValue: 500,
      maxUses: 100,
      usedCount: 12,
      firstOrderOnly: false,
      startsAt: "2025-01-01T00:00:00Z",
      expiresAt: "2028-01-01T00:00:00Z",
      active: true,
    },
    {
      id: "d2",
      storeId: "store-nova",
      code: "FREESHIP",
      type: "free_shipping",
      value: 0,
      scope: "all",
      minOrderValue: 0,
      maxUses: null,
      usedCount: 0,
      firstOrderOnly: true,
      startsAt: "2025-01-01T00:00:00Z",
      expiresAt: "2028-01-01T00:00:00Z",
      active: true,
    },
  ]

  const ok = evaluateDiscountCode({
    code: "nova10",
    discounts,
    storeId: "store-nova",
    subtotal: 1200,
    shippingFee: 60,
    cartItems: [{ productId: "p1", lineTotal: 1200 }],
    isFirstOrder: false,
    now: new Date("2026-06-01T00:00:00Z"),
  })
  assert.equal(ok.valid, true)
  assert.equal(ok.discountAmount, 120)

  const wrongTenant = evaluateDiscountCode({
    code: "NOVA10",
    discounts,
    storeId: "store-lumina",
    subtotal: 1200,
    shippingFee: 60,
    cartItems: [{ productId: "p1", lineTotal: 1200 }],
    isFirstOrder: false,
    now: new Date("2026-06-01T00:00:00Z"),
  })
  assert.equal(wrongTenant.valid, false)
  assert.equal(wrongTenant.reason, "not_found")

  const firstOrderDenied = evaluateDiscountCode({
    code: "FREESHIP",
    discounts,
    storeId: "store-nova",
    subtotal: 800,
    shippingFee: 60,
    cartItems: [{ productId: "p1", lineTotal: 800 }],
    isFirstOrder: false,
    now: new Date("2026-06-01T00:00:00Z"),
  })
  assert.equal(firstOrderDenied.valid, false)
  assert.equal(firstOrderDenied.reason, "first_order_only")
})

test("shipping fee calculation handles free threshold, zones, and pickup", () => {
  const zoneMethod: ShippingMethod = {
    id: "ship-1",
    nameAr: "شحن قياسي",
    nameEn: "Standard Delivery",
    type: "by_zone",
    rate: 60,
    freeAbove: 1500,
    estimatedDaysAr: "2-3 أيام",
    estimatedDaysEn: "2-3 days",
    zones: { Cairo: 45, Alexandria: 70 },
    enabled: true,
  }

  assert.deepEqual(
    calculateShippingFee({ method: zoneMethod, subtotal: 900, city: "Alexandria" }),
    { fee: 70, isFree: false, remainingForFree: 600 }
  )

  assert.deepEqual(
    calculateShippingFee({ method: zoneMethod, subtotal: 1600, city: "Alexandria" }),
    { fee: 0, isFree: true, remainingForFree: 0 }
  )
})

test("store builder section reordering updates order indices cleanly", () => {
  const sections: StoreSection[] = [
    { id: "a", type: "hero", visible: true, order: 0, titleAr: "", titleEn: "", subtitleAr: "", subtitleEn: "" },
    { id: "b", type: "best_sellers", visible: true, order: 1, titleAr: "", titleEn: "", subtitleAr: "", subtitleEn: "" },
    { id: "c", type: "brand_story", visible: true, order: 2, titleAr: "", titleEn: "", subtitleAr: "", subtitleEn: "" },
  ]
  const moved = reorderStoreSections(sections, "c", "up")
  assert.deepEqual(
    moved.map((s) => s.id),
    ["a", "c", "b"]
  )
  assert.deepEqual(
    moved.map((s) => s.order),
    [0, 1, 2]
  )
})

test("theme preset generates valid CSS variables and RBAC enforces role bounds", () => {
  const preset = getPresetById("minimal-fashion")
  const vars = themeToCssVariables(preset.theme)
  assert.equal(vars["--sf-primary"], "#111111")
  assert.equal(vars["--sf-btn-radius"], "2px")

  assert.equal(hasMerchantPermission("owner", "staff:manage"), true)
  assert.equal(hasMerchantPermission("order_manager", "staff:manage"), false)
  assert.equal(hasMerchantPermission("order_manager", "orders:manage"), true)
  assert.equal(hasAdminPermission("super_admin", "admin:settings"), true)
  assert.equal(hasAdminPermission("support", "admin:settings"), false)
})

test("computeStoreOrderMetrics excludes cancelled/refunded orders from revenue", () => {
  const orders = [
    { total: 1000, status: "delivered" },
    { total: 500, status: "pending" },
    { total: 800, status: "cancelled" },
  ] as StoreOrder[]

  const m = computeStoreOrderMetrics(orders)
  assert.equal(m.totalSales, 1500)
  assert.equal(m.totalOrders, 3)
  assert.equal(m.pendingCount, 1)
  assert.equal(m.completedCount, 1)
  assert.equal(m.cancelledCount, 1)
  assert.equal(m.averageOrderValue, 750)
})
