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
  loginWithEmailSchema,
  registerWithEmailSchema,
  categoryInputSchema,
  discountInputSchema,
  inventoryAdjustmentSchema,
} from "../src/lib/validation/schemas"

// 3. Auth & Passwords
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
})

describe("Session Security & Password Hashing", () => {
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

  test("securely hashes and verifies passwords with scrypt and salt", () => {
    const password = "SuperSecretPassword2026!"
    const hash = hashPassword(password)
    assert.ok(hash.includes(":"))

    assert.equal(verifyPassword(password, hash), true)
    assert.equal(verifyPassword("WrongPassword123", hash), false)
    assert.equal(verifyPassword("", hash), false)
  })
})

describe("Extended Schemas & Business Rules", () => {
  test("validates email authentication schemas", () => {
    const validLogin = loginWithEmailSchema.safeParse({
      email: "Merchant@Example.COM",
      password: "secretpassword",
    })
    assert.equal(validLogin.success, true)
    if (validLogin.success) {
      assert.equal(validLogin.data.email, "merchant@example.com")
    }

    const invalidEmail = loginWithEmailSchema.safeParse({
      email: "not-an-email",
      password: "secretpassword",
    })
    assert.equal(invalidEmail.success, false)

    const shortPassword = loginWithEmailSchema.safeParse({
      email: "test@example.com",
      password: "123",
    })
    assert.equal(shortPassword.success, false)
  })

  test("validates category and discount schemas", () => {
    const validCat = categoryInputSchema.safeParse({
      nameAr: "أزياء رجالية",
      slug: "mens-fashion",
      displayOrder: 1,
      isActive: true,
    })
    assert.equal(validCat.success, true)

    const validDiscount = discountInputSchema.safeParse({
      code: "winter2026",
      type: "percentage",
      value: 20,
      minOrderValue: 500,
    })
    assert.equal(validDiscount.success, true)
    if (validDiscount.success) {
      assert.equal(validDiscount.data.code, "WINTER2026")
    }
  })

  test("validates inventory adjustment schema", () => {
    const validAdjustment = inventoryAdjustmentSchema.safeParse({
      productId: "prod-123",
      changeQty: -5,
      reason: "تالف في الشحن",
    })
    assert.equal(validAdjustment.success, true)

    const missingReason = inventoryAdjustmentSchema.safeParse({
      productId: "prod-123",
      changeQty: 10,
      reason: "",
    })
    assert.equal(missingReason.success, false)
  })
})
