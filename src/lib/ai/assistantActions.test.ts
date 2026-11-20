import test from "node:test"
import assert from "node:assert/strict"
import {
  parseAssistantSseEvents,
  assistantActionSchema,
  assistantMemorySchema,
  executeAssistantAction,
} from "./assistantActions"
import { buildPublicStoreUrl } from "../appUrl"
import type { TenantStore } from "../../types/saas"

test("parseAssistantSseEvents parses multi-frame streams including memory and conversation events", () => {
  const chunk1 =
    'data: {"type":"conversation","conversationId":"c-1","dbConnected":true}\n\n' +
    'data: {"type":"meta","engine":"groq","model":"qwen/qwen3.8-27b"}\n\n' +
    'data: {"type":"token","delta":"مرحباً "}\n\n' +
    'data: {"type":"token","del'

  const res1 = parseAssistantSseEvents(chunk1)
  assert.equal(res1.events.length, 3)
  assert.equal(res1.events[0].conversationId, "c-1")
  assert.equal(res1.events[1].engine, "groq")
  assert.equal(res1.events[2].delta, "مرحباً ")
  assert.equal(res1.remainder, 'data: {"type":"token","del')

  const res2 = parseAssistantSseEvents(
    res1.remainder +
      'ta":"بك"}\n\ndata: {"type":"memory","memory":{"key":"vip_rule","value":"Free shipping over 2000 EGP","category":"pricing"}}\n\ndata: {"type":"done"}\n\n'
  )
  assert.equal(res2.events.length, 3)
  assert.equal(res2.events[0].delta, "بك")
  assert.equal(res2.events[1].memory?.key, "vip_rule")
  assert.equal(res2.events[2].type, "done")
  assert.equal(res2.remainder, "")
})

test("assistantActionSchema and assistantMemorySchema validate safe payloads and reject invalid inputs", () => {
  const validCoupon = assistantActionSchema.safeParse({
    type: "create_discount",
    payload: { code: "VIP20", type: "percentage", value: 20, minOrderValue: 0 },
  })
  assert.equal(validCoupon.success, true)

  const invalidHex = assistantActionSchema.safeParse({
    type: "update_theme",
    payload: { primaryColor: "javascript:alert(1)" },
  })
  assert.equal(invalidHex.success, false)

  const validMem = assistantMemorySchema.safeParse({
    key: "vip_shipping",
    value: "Free shipping for VIP orders above 2000 EGP",
    category: "pricing",
    importance: 5,
  })
  assert.equal(validMem.success, true)

  const invalidMem = assistantMemorySchema.safeParse({
    key: "a",
    value: "",
    importance: 99,
  })
  assert.equal(invalidMem.success, false)
})

test("buildPublicStoreUrl respects NEXT_PUBLIC_APP_URL for VPS IP:port deployments", () => {
  const prev = process.env.NEXT_PUBLIC_APP_URL
  process.env.NEXT_PUBLIC_APP_URL = "http://187.126.0.23:3002/"
  try {
    assert.equal(buildPublicStoreUrl("menz-club"), "http://187.126.0.23:3002/s/menz-club")
  } finally {
    if (prev === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL
    } else {
      process.env.NEXT_PUBLIC_APP_URL = prev
    }
  }
})

test("executeAssistantAction executes create_discount and update_store_status cleanly", () => {
  const createdDiscounts: Array<{ code: string; value: number }> = []
  let latestStatus: string | null = null

  const mockStore = {
    id: "store-nova",
    slug: "menz-club",
    logoMonogram: "MC",
    localization: { currency: "EGP" },
    theme: { primaryColor: "#111111", accentColor: "#B45309" },
    shippingMethods: [],
  } as unknown as TenantStore

  const noop = () => {}
  const ctx = {
    store: mockStore,
    categories: [],
    products: [],
    orders: [],
    discounts: [],
    actorName: "Karim",
    createProduct: (() => ({ id: "p1", nameAr: "", nameEn: "", price: 100 })) as never,
    updateProduct: noop,
    adjustVariantStock: noop,
    createDiscount: ((d: { code: string; value: number }) => {
      createdDiscounts.push({ code: d.code, value: d.value })
      return { ...d, id: "d-new", usedCount: 0 }
    }) as never,
    updateDiscount: noop,
    updateOrderStatus: noop,
    updateStoreStatus: (_id: string, st: "published" | "draft") => {
      latestStatus = st
    },
    updateStore: noop,
    updateDraftTheme: noop,
    applyThemePresetToDraft: noop,
    publishStoreDesign: noop,
    createCategory: (() => ({ id: "c1", nameAr: "", nameEn: "" })) as never,
  }

  const r1 = executeAssistantAction(
    { type: "create_discount", payload: { code: "vip20", type: "percentage", value: 20 } },
    ctx
  )
  assert.ok(r1?.ok)
  assert.equal(createdDiscounts[0]?.code, "VIP20")

  const r2 = executeAssistantAction(
    { type: "update_store_status", payload: { status: "draft" } },
    ctx
  )
  assert.ok(r2?.ok)
  assert.equal(latestStatus, "draft")
})
