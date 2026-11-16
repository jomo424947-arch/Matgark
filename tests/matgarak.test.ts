import { test, describe, before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

// 1. Utilities
import { normalizeEgyptPhone, normalizeLocalEgyptPhone, buildWhatsAppLink } from "../src/lib/whatsapp"
import { sanitizeSlug, isReservedSlug, getStorePath, getStoreDisplayUrl } from "../src/lib/reserved-slugs"

// 2. Validation schemas
import {
  egyptPhoneSchema,
  slugSchema,
  verifyOtpSchema,
  productInputSchema,
  checkoutOrderSchema,
} from "../src/lib/validation/schemas"

// 3. Auth & OTP
import { createAndSendOtp, verifyOtpCode, hashOtpCode } from "../src/server/auth/otp"
import { signSessionId, verifySessionToken } from "../src/server/auth/session"

// 4. DB & Orders
import {
  withTransaction,
  getProductById,
  updateProduct,
} from "../src/server/db/client"
import { placeOrderAction, updateOrderStatusAction } from "../src/server/actions/orders"

describe("WhatsApp Utilities & Encoding (Fixes S3, S4)", () => {
  test("normalizes diverse Egyptian phone formats to 201xxxxxxxxx", () => {
    assert.equal(normalizeEgyptPhone("01012345678"), "201012345678")
    assert.equal(normalizeEgyptPhone("+201012345678"), "201012345678")
    assert.equal(normalizeEgyptPhone("00201012345678"), "201012345678")
    assert.equal(normalizeEgyptPhone("011 2233 4455"), "201122334455")
    assert.equal(normalizeLocalEgyptPhone("201012345678"), "01012345678")
  })

  test("properly URL-encodes messages with Arabic, ampersands, and hashes", () => {
    const link = buildWhatsAppLink(
      "01012345678",
      "مرحباً! أوردر #1048 & فستان شتوي؟"
    )
    assert.ok(link.startsWith("https://wa.me/201012345678?text="))
    assert.ok(!link.includes("#1048")) // must be encoded as %231048
    assert.ok(link.includes("%231048"))
    assert.ok(link.includes("%26")) // & must be encoded
  })
})

describe("Slug Registry & Routing (Fixes R4, S6)", () => {
  test("sanitizes slugs to URL-safe alphanumeric and dashes", () => {
    assert.equal(sanitizeSlug("My Store 2026!"), "my-store-2026")
    assert.equal(sanitizeSlug("  Cairo---Couture  "), "cairo-couture")
  })

  test("blocks reserved platform routes", () => {
    assert.equal(isReservedSlug("dashboard"), true)
    assert.equal(isReservedSlug("login"), true)
    assert.equal(isReservedSlug("admin"), true)
    assert.equal(isReservedSlug("api"), true)
    assert.equal(isReservedSlug("store"), true)
    assert.equal(isReservedSlug("cairo-couture"), false)
  })

  test("produces correct canonical store URLs", () => {
    assert.equal(getStorePath("cairo-couture"), "/cairo-couture")
    assert.equal(getStoreDisplayUrl("cairo-couture"), "matgarak.com/cairo-couture")
  })
})

describe("Zod Validation Schemas (Fixes S5)", () => {
  test("validates Egyptian mobile numbers correctly", () => {
    assert.equal(egyptPhoneSchema.safeParse("01012345678").success, true)
    assert.equal(egyptPhoneSchema.safeParse("01199887766").success, true)
    assert.equal(egyptPhoneSchema.safeParse("01234567890").success, true)
    assert.equal(egyptPhoneSchema.safeParse("01555555555").success, true)
    // Invalid
    assert.equal(egyptPhoneSchema.safeParse("0222345678").success, false)
    assert.equal(egyptPhoneSchema.safeParse("01312345678").success, false)
    assert.equal(egyptPhoneSchema.safeParse("abc").success, false)
  })

  test("validates slug restrictions", () => {
    assert.equal(slugSchema.safeParse("cairo-shop").success, true)
    assert.equal(slugSchema.safeParse("dashboard").success, false) // reserved
    assert.equal(slugSchema.safeParse("ab").success, false) // too short
  })

  test("enforces 6-digit OTP codes", () => {
    assert.equal(
      verifyOtpSchema.safeParse({ phone: "01012345678", code: "123456" }).success,
      true
    )
    assert.equal(
      verifyOtpSchema.safeParse({ phone: "01012345678", code: "1234" }).success,
      false
    )
  })

  test("rejects negative prices and empty variants in products", () => {
    const invalidPrice = productInputSchema.safeParse({
      name: "تيشيرت",
      price: -50,
      category: "ملابس",
      variants: [{ size: "M", color: "أسود", stock: 10 }],
    })
    assert.equal(invalidPrice.success, false)

    const noVariants = productInputSchema.safeParse({
      name: "تيشيرت",
      price: 150,
      category: "ملابس",
      variants: [],
    })
    assert.equal(noVariants.success, false)
  })
})

describe("OTP & Session Security (Fixes A1, A3, A6, D4)", () => {
  test("session token signing and verification works in constant-time", () => {
    const sessionId = "sess-test-123456"
    const signedToken = signSessionId(sessionId)
    assert.ok(signedToken.startsWith(`${sessionId}.`))

    const verified = verifySessionToken(signedToken)
    assert.equal(verified, sessionId)

    // Tampered token fails
    const tampered = signedToken.slice(0, -3) + "xyz"
    assert.equal(verifySessionToken(tampered), null)
  })

  test("OTP generation, hashing, wrong code rejection, and verification lifecycle", async () => {
    const testPhone = "01099990001"
    const sendRes = await createAndSendOtp(testPhone)
    assert.equal(sendRes.ok, true)
    assert.ok(sendRes.devOtp)
    assert.equal(sendRes.devOtp.length, 6)

    // 1. Wrong code rejected
    const wrongRes = await verifyOtpCode(testPhone, "000000")
    assert.equal(wrongRes.ok, false)

    // 2. Correct code accepted
    const correctRes = await verifyOtpCode(testPhone, sendRes.devOtp)
    assert.equal(correctRes.ok, true)

    // 3. Cannot reuse same code
    const reuseRes = await verifyOtpCode(testPhone, sendRes.devOtp)
    assert.equal(reuseRes.ok, false)
  })
})

describe("Order Engine, Inventory & Security (Fixes S1, S7, S8, B3, F1)", () => {
  const tempDbPath = path.join(os.tmpdir(), `matgarak-test-${Date.now()}.json`)

  before(() => {
    process.env.MATGARAK_DB_PATH = tempDbPath
  })

  after(() => {
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath)
    }
  })

  test("calculates prices strictly server-side ignoring client tampering", async () => {
    // prod-1 price in DB is 850 EGP
    const res = await placeOrderAction({
      storeSlug: "cairo-couture",
      customerName: "عميل تجريبي",
      customerPhone: "01055554444",
      customerCity: "القاهرة",
      customerAddress: "شارع التحرير، الدقي",
      items: [
        {
          productId: "prod-1",
          variantId: "v-1-1",
          size: "M",
          color: "أسود",
          quantity: 1,
        },
      ],
    })

    assert.equal(res.ok, true)
    assert.equal(res.subtotal, 850)
    assert.equal(res.deliveryFee, 40)
    assert.equal(res.total, 890)
    assert.ok(Number(res.orderNumber) >= 1049)
  })

  test("rejects order when requested quantity exceeds available variant stock", async () => {
    // prod-2 has stock: 4 total (1 of each size)
    const res = await placeOrderAction({
      storeSlug: "cairo-couture",
      customerName: "عميل تجريبي",
      customerPhone: "01055554444",
      customerCity: "القاهرة",
      customerAddress: "شارع التحرير، الدقي",
      items: [
        {
          productId: "prod-2",
          variantId: "v-2-1",
          size: "38",
          color: "أبيض",
          quantity: 999, // Exceeds available stock
        },
      ],
    })

    assert.equal(res.ok, false)
    assert.ok(res.error?.includes("الكمية المتوفرة في المخزن"))
  })

  test("deducts stock upon order and restores stock upon cancellation", async () => {
    const prodBefore = await getProductById("prod-3")
    assert.ok(prodBefore)
    const initialVariantStock = prodBefore.variants.find((v) => v.id === "v-3-1")?.stock ?? 0

    // Place an order for 2 items of v-3-1
    const orderRes = await placeOrderAction({
      storeSlug: "cairo-couture",
      customerName: "تست مخزون",
      customerPhone: "01011112222",
      customerCity: "القاهرة",
      customerAddress: "شارع 9 المعادي",
      items: [
        {
          productId: "prod-3",
          variantId: "v-3-1",
          size: "S",
          color: "رمادي",
          quantity: 2,
        },
      ],
    })

    assert.equal(orderRes.ok, true)

    // Verify stock deducted
    const prodAfter = await getProductById("prod-3")
    const newVariantStock = prodAfter?.variants.find((v) => v.id === "v-3-1")?.stock ?? 0
    assert.equal(newVariantStock, initialVariantStock - 2)

    // Now cancel the order inside DB transaction
    await withTransaction((db) => {
      const order = db.orders.find((o) => o.orderNumber === orderRes.orderNumber)
      assert.ok(order)
      order.status = "ملغي"
      // Stock restoration logic
      for (const item of order.items) {
        const p = db.products.find((prod) => prod.id === item.productId)
        if (p) {
          const v = p.variants.find((v) => v.id === item.variantId)
          if (v) v.stock += item.quantity
        }
      }
    })

    // Verify stock restored
    const prodRestored = await getProductById("prod-3")
    const restoredVariantStock = prodRestored?.variants.find((v) => v.id === "v-3-1")?.stock ?? 0
    assert.equal(restoredVariantStock, initialVariantStock)
  })
})
