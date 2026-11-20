import test from "node:test"
import assert from "node:assert/strict"
import {
  parseAssistantSseEvents,
  assistantActionSchema,
  executeAssistantAction,
} from "./assistantActions"
import type { TenantStore } from "../../types/saas"

test("parseAssistantSseEvents parses multi-frame streams and preserves incomplete remainder", () => {
  const chunk1 =
    'data: {"type":"meta","engine":"groq","model":"llama-3.3-70b-versatile"}\n\n' +
    'data: {"type":"token","delta":"مرحباً "}\n\n' +
    'data: {"type":"token","del'

  const res1 = parseAssistantSseEvents(chunk1)
  assert.equal(res1.events.length, 2)
  assert.equal(res1.events[0].engine, "groq")
  assert.equal(res1.events[1].delta, "مرحباً ")
  assert.equal(res1.remainder, 'data: {"type":"token","del')

  const res2 = parseAssistantSseEvents(res1.remainder + 'ta":"بك"}\n\ndata: {"type":"done"}\n\n')
  assert.equal(res2.events.length, 2)
  assert.equal(res2.events[0].delta, "بك")
  assert.equal(res2.events[1].type, "done")
  assert.equal(res2.remainder, "")
})

test("assistantActionSchema validates safe actions and rejects invalid payloads", () => {
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
