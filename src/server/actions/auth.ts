"use server"

import {
  requestOtpSchema,
  verifyOtpSchema,
  registerMerchantSchema,
  loginWithEmailSchema,
  registerWithEmailSchema,
} from "@/lib/validation/schemas"
import { createAndSendOtp, verifyOtpCode } from "@/server/auth/otp"
import { createSessionCookie, destroySessionCookie } from "@/server/auth/session"
import { hashPassword, verifyPassword } from "@/server/auth/passwords"
import {
  getUserByPhone,
  getUserByEmail,
  createUser,
  createUserWithEmail,
  getStoreByOwnerId,
  getStoreBySlug,
  createStore,
} from "@/server/db/client"
import { sanitizeSlug } from "@/lib/reserved-slugs"

export async function loginWithEmailAction(input: {
  email: string
  password: string
}): Promise<{
  ok: boolean
  error?: string
  redirectTo?: string
}> {
  const parsed = loginWithEmailSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    }
  }

  const cleanEmail = parsed.data.email.toLowerCase().trim()
  let user = await getUserByEmail(cleanEmail)

  // Demo accounts fallback if user is not in database yet
  const DEMO_ACCOUNTS: Record<string, { password: string; brand: string; slug: string; phone: string }> = {
    "karim@nova-atelier.com": { password: "nova123", brand: "نوفا أتيليه", slug: "nova-atelier", phone: "01011112222" },
    "salma@luminabotanics.com": { password: "lumina123", brand: "لومينا بوتانيكس", slug: "lumina-botanics", phone: "01033334444" },
    "tarek@voltixtech.io": { password: "voltix123", brand: "فولتيكس تك", slug: "voltix-tech", phone: "01055556666" },
  }

  if (!user && DEMO_ACCOUNTS[cleanEmail]) {
    const demo = DEMO_ACCOUNTS[cleanEmail]
    if (parsed.data.password === demo.password) {
      // Auto-provision demo account into DB
      const pwHash = hashPassword(demo.password)
      user = await createUserWithEmail({
        email: cleanEmail,
        passwordHash: pwHash,
        name: demo.brand,
        phone: demo.phone,
      })

      let demoStore = await getStoreBySlug(demo.slug)
      if (!demoStore) {
        demoStore = await createStore({
          ownerId: user.id,
          name: demo.brand,
          slug: demo.slug,
          phone: demo.phone,
          whatsapp: demo.phone,
          deliveryType: "flat",
          flatFee: 40,
          freeAbove: 1000,
          themeColor: "#E8732A",
          plan: "pro",
        })
      }
      await createSessionCookie(user.id, demoStore.id)
      return { ok: true, redirectTo: "/dashboard" }
    } else {
      return { ok: false, error: "كلمة المرور غير صحيحة" }
    }
  }

  if (!user) {
    return { ok: false, error: "لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني" }
  }

  if (user.passwordHash) {
    const isValid = verifyPassword(parsed.data.password, user.passwordHash)
    if (!isValid) {
      return { ok: false, error: "كلمة المرور غير صحيحة" }
    }
  }

  let store = await getStoreByOwnerId(user.id)
  if (!store) {
    const baseSlug = `store-${user.id.slice(0, 6)}`
    store = await createStore({
      ownerId: user.id,
      name: user.name || `متجر ${user.email}`,
      slug: baseSlug,
      phone: user.phone || "01000000000",
      whatsapp: user.phone || "01000000000",
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

export async function registerWithEmailAction(input: {
  name: string
  email: string
  password: string
  brandName: string
  slug: string
  phone?: string
}): Promise<{
  ok: boolean
  error?: string
  redirectTo?: string
}> {
  const parsed = registerWithEmailSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "بيانات التسجيل غير مكتملة",
    }
  }

  const cleanEmail = parsed.data.email.toLowerCase().trim()
  const existingUser = await getUserByEmail(cleanEmail)
  if (existingUser) {
    return {
      ok: false,
      error: "يوجد حساب مسجل بالفعل بهذا البريد الإلكتروني. يرجى تسجيل الدخول.",
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

  const pwHash = hashPassword(parsed.data.password)
  const user = await createUserWithEmail({
    email: cleanEmail,
    passwordHash: pwHash,
    name: parsed.data.name,
    phone: parsed.data.phone,
  })

  const store = await createStore({
    ownerId: user.id,
    name: parsed.data.brandName,
    slug: cleanSlug,
    phone: parsed.data.phone || "01000000000",
    whatsapp: parsed.data.phone || "01000000000",
    deliveryType: "flat",
    flatFee: 40,
    freeAbove: 1000,
    themeColor: "#E8732A",
    plan: "free",
  })

  await createSessionCookie(user.id, store.id)

  return {
    ok: true,
    redirectTo: "/dashboard",
  }
}

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
