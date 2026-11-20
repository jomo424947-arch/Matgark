import { test, describe } from "node:test"
import assert from "node:assert/strict"

// 1. Utilities
import { normalizeEgyptPhone, normalizeLocalEgyptPhone, buildWhatsAppLink } from "../src/lib/whatsapp"
import { sanitizeSlug, isReservedSlug, getStorePath, getStoreDisplayUrl } from "../src/lib/reserved-slugs"

// 2. Validation schemas
import {
  egyptPhoneSchema,
  slugSchema,
  verifyOtpSchema,
  productInputSchema,
  updateProductInputSchema,
  loginWithEmailSchema,
  registerWithEmailSchema,
  categoryInputSchema,
  discountInputSchema,
  updateDiscountInputSchema,
  inventoryAdjustmentSchema,
} from "../src/lib/validation/schemas"

// 3. Auth
import { signSessionId, verifySessionToken } from "../src/server/auth/session"
import { hashPassword, verifyPassword } from "../src/server/auth/passwords"

describe("WhatsApp Utilities & Encoding", () => {
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

describe("Slug Registry & Routing", () => {
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

describe("Zod Validation Schemas", () => {
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

  test("validates partial product updates and rejects malformed values", () => {
    const validPatch = updateProductInputSchema.safeParse({
      price: 499,
      isActive: false,
    })
    assert.equal(validPatch.success, true)

    const negativePricePatch = updateProductInputSchema.safeParse({
      price: -10,
    })
    assert.equal(negativePricePatch.success, false)

    const emptyVariantsPatch = updateProductInputSchema.safeParse({
      variants: [],
    })
    assert.equal(emptyVariantsPatch.success, false)

    const validVariantsPatch = updateProductInputSchema.safeParse({
      variants: [{ id: "v1", size: "L", color: "أسود", stock: 5 }],
    })
    assert.equal(validVariantsPatch.success, true)
  })
})

describe("Session Security", () => {
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

  test("scrypt password hashing verifies correct passwords and rejects wrong/malformed hashes", () => {
    const hash = hashPassword("StrongPass2026!")
    assert.ok(hash.includes(":"))
    assert.equal(verifyPassword("StrongPass2026!", hash), true)
    assert.equal(verifyPassword("WrongPass2026!", hash), false)
    assert.equal(verifyPassword("StrongPass2026!", "malformed-hash"), false)
    assert.equal(verifyPassword("StrongPass2026!", ""), false)
  })
})

describe("SaaS Extended Validation Schemas", () => {
  test("validates email login & registration schemas", () => {
    assert.equal(
      loginWithEmailSchema.safeParse({ email: "KARIM@NOVA-ATELIER.COM", password: "nova123" }).success,
      true
    )
    assert.equal(
      loginWithEmailSchema.safeParse({ email: "invalid-email", password: "123" }).success,
      false
    )
    assert.equal(
      registerWithEmailSchema.safeParse({
        name: "Karim",
        email: "karim@brand.com",
        password: "password123",
        brandName: "Kairo Studio",
        slug: "kairo-studio",
      }).success,
      true
    )
  })

  test("enforces discount percentage <= 100 and category/inventory constraints", () => {
    assert.equal(
      discountInputSchema.safeParse({
        code: "SAVE20",
        type: "percentage",
        value: 20,
      }).success,
      true
    )
    assert.equal(
      discountInputSchema.safeParse({
        code: "OVER100",
        type: "percentage",
        value: 150,
      }).success,
      false
    )
    assert.equal(
      updateDiscountInputSchema.safeParse({
        type: "percentage",
        value: 120,
      }).success,
      false
    )
    assert.equal(
      categoryInputSchema.safeParse({
        nameAr: "ملابس شتوية",
        slug: "winter-wear",
      }).success,
      true
    )
    assert.equal(
      inventoryAdjustmentSchema.safeParse({
        productId: "prod-1",
        changeQty: -3,
        reason: "تعديل جرد",
      }).success,
      true
    )
  })
})
