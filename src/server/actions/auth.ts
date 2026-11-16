"use server"

import {
  requestOtpSchema,
  verifyOtpSchema,
  registerMerchantSchema,
} from "@/lib/validation/schemas"
import { createAndSendOtp, verifyOtpCode } from "@/server/auth/otp"
import { createSessionCookie, destroySessionCookie } from "@/server/auth/session"
import {
  getUserByPhone,
  createUser,
  getStoreByOwnerId,
  getStoreBySlug,
  createStore,
} from "@/server/db/client"
import { sanitizeSlug } from "@/lib/reserved-slugs"

export async function requestOtpAction(phone: string): Promise<{
  ok: boolean
  error?: string
  devOtp?: string
}> {
  const parsed = requestOtpSchema.safeParse({ phone })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "رقم الموبايل غير صحيح",
    }
  }

  return createAndSendOtp(parsed.data.phone)
}

export async function verifyOtpAction(
  phone: string,
  code: string
): Promise<{
  ok: boolean
  error?: string
  redirectTo?: string
}> {
  const parsed = verifyOtpSchema.safeParse({ phone, code })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "بيانات التأكيد غير صحيحة",
    }
  }

  const result = await verifyOtpCode(parsed.data.phone, parsed.data.code)
  if (!result.ok) {
    return result
  }

  // Find or create user
  let user = await getUserByPhone(parsed.data.phone)
  if (!user) {
    user = await createUser(parsed.data.phone)
  }

  // Find or create merchant's store
  let store = await getStoreByOwnerId(user.id)
  if (!store) {
    const baseSlug = `store-${parsed.data.phone.slice(-4)}`
    store = await createStore({
      ownerId: user.id,
      name: `متجر ${parsed.data.phone}`,
      slug: baseSlug,
      phone: parsed.data.phone,
      whatsapp: parsed.data.phone,
      deliveryType: "flat",
      flatFee: 40,
      freeAbove: 1000,
      themeColor: "#E8732A",
      plan: "free",
    })
  }

  await createSessionCookie(user.id, store.id)

  return {
    ok: true,
    redirectTo: "/dashboard",
  }
}

export async function registerMerchantAction(input: {
  storeName: string
  slug: string
  phone: string
  whatsapp: string
  plan?: "free" | "pro"
}): Promise<{
  ok: boolean
  error?: string
  slug?: string
  redirectTo?: string
}> {
  const parsed = registerMerchantSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "البيانات المدخلة غير صحيحة",
    }
  }

  const cleanSlug = sanitizeSlug(parsed.data.slug)
  const existingStore = await getStoreBySlug(cleanSlug)
  if (existingStore) {
    return {
      ok: false,
      error: "رابط هذا المتجر محجوز بالفعل لمتجر آخر. يرجى اختيار رابط مختلف.",
    }
  }

  let user = await getUserByPhone(parsed.data.phone)
  if (!user) {
    user = await createUser(parsed.data.phone)
  }

  const store = await createStore({
    ownerId: user.id,
    name: parsed.data.storeName,
    slug: cleanSlug,
    phone: parsed.data.phone,
    whatsapp: parsed.data.whatsapp,
    deliveryType: "flat",
    flatFee: 40,
    freeAbove: 1000,
    themeColor: "#E8732A",
    plan: parsed.data.plan ?? "free",
  })

  await createSessionCookie(user.id, store.id)

  return {
    ok: true,
    slug: store.slug,
    redirectTo: "/onboarding",
  }
}

export async function logoutAction(): Promise<{ ok: boolean; redirectTo: string }> {
  await destroySessionCookie()
  return {
    ok: true,
    redirectTo: "/",
  }
}
