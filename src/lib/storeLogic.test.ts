import test from "node:test"
import assert from "node:assert/strict"
import {
  normalizeSlug,
  getStatusBadgeVariant,
  getProductStatus,
  buildProductFromInput,
  calculateOrderTotals,
  upsertCustomerFromOrder,
  type Customer,
  type Order,
} from "./storeLogic"

test("normalizeSlug cleans store names and falls back safely", () => {
  assert.equal(normalizeSlug("Cairo Couture 2026!"), "cairo-couture-2026")
  assert.equal(normalizeSlug("براند كايرو", "cairo-brand"), "cairo-brand")
})

test("buildProductFromInput computes total stock, unique sizes/colors, and status", () => {
  const prod = buildProductFromInput({
    id: "prod-99",
    name: "تيشيرت بولو قطن",
    price: 450,
    category: "ملابس",
    variants: [
      { size: "M", color: "أسود", stock: "2" },
      { size: "L", color: "أبيض", stock: "1" },
    ],
  })

  assert.equal(prod.stock, 3)
  assert.equal(prod.status, "مخزون منخفض")
  assert.deepEqual(prod.sizes, ["M", "L"])
  assert.deepEqual(prod.colors, ["أسود", "أبيض"])
})

test("calculateOrderTotals applies flat fee, city fee, and free delivery threshold", () => {
  const settings = {
    deliveryType: "flat" as const,
    flatFee: 40,
    freeAbove: 1000,
    cityFees: { القاهرة: 40, الإسكندرية: 65 },
  }

  const belowFree = calculateOrderTotals({
    subtotal: 850,
    city: "الإسكندرية",
    settings,
  })
  assert.equal(belowFree.isFreeDelivery, false)
  assert.equal(belowFree.deliveryFee, 40)
  assert.equal(belowFree.grandTotal, 890)
  assert.equal(belowFree.amountToFreeDelivery, 150)

  const aboveFree = calculateOrderTotals({
    subtotal: 1200,
    city: "الإسكندرية",
    settings,
  })
  assert.equal(aboveFree.isFreeDelivery, true)
  assert.equal(aboveFree.deliveryFee, 0)
  assert.equal(aboveFree.grandTotal, 1200)

  const byCity = calculateOrderTotals({
    subtotal: 500,
    city: "الإسكندرية",
    settings: { ...settings, deliveryType: "by_city" },
  })
  assert.equal(byCity.deliveryFee, 65)
  assert.equal(byCity.grandTotal, 565)
})

test("upsertCustomerFromOrder adds new customer or increments existing customer stats", () => {
  const initialCustomers: Customer[] = [
    {
      id: "cust-1",
      name: "محمد علي",
      phone: "01098765432",
      city: "القاهرة",
      totalOrders: 2,
      totalSpent: 1000,
      lastOrder: "أمس",
      tag: "نشط",
    },
  ]

  const repeatOrder: Order = {
    id: "1050",
    customer: "محمد علي",
    phone: "01098765432",
    city: "القاهرة",
    address: "مدينة نصر",
    items: [{ name: "جاكيت", size: "L", qty: 1, price: 850 }],
    deliveryFee: 40,
    total: 890,
    status: "جديد",
    statusType: getStatusBadgeVariant("جديد"),
    date: "الآن",
    notes: "",
  }

  const afterRepeat = upsertCustomerFromOrder(initialCustomers, repeatOrder)
  assert.equal(afterRepeat.length, 1)
  assert.equal(afterRepeat[0].totalOrders, 3)
  assert.equal(afterRepeat[0].totalSpent, 1890)
  assert.equal(afterRepeat[0].tag, "عميل مميز ⭐")
})

test("getProductStatus returns accurate stock status label", () => {
  assert.equal(getProductStatus(0), "نفذ المخزون")
  assert.equal(getProductStatus(4), "مخزون منخفض")
  assert.equal(getProductStatus(10), "نشط")
})
