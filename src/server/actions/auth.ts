"use server"

import {
  requestOtpSchema,
  verifyOtpSchema,
  registerMerchantSchema,
  loginWithEmailSchema,
  registerWithEmailSchema,
} from "@/lib/validation/schemas"
import { createAndSendOtp, verifyOtpCode } from "@/server/auth/otp"
import {
  createSessionCookie,
  destroySessionCookie,
  createAdminSessionCookie,
  destroyAdminSessionCookie,
} from "@/server/auth/session"
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
import { isSupabaseConfigured } from "@/server/db/supabase"
import { sanitizeSlug } from "@/lib/reserved-slugs"

const DEMO_ACCOUNTS: Record<
  string,
  { password: string; brand: string; slug: string; phone: string; storeId: string }
> = {
  "karim@menz-club.com": {
    password: "menz123",
    brand: "Men’z Club",
    slug: "menz-club",
    phone: "01011112222",
    storeId: "store-nova",
  },
  "karim@nova-atelier.com": {
    password: "nova123",
    brand: "Men’z Club",
    slug: "menz-club",
    phone: "01011112222",
    storeId: "store-nova",
  },
  "salma@luminabotanics.com": {
    password: "lumina123",
    brand: "لومينا بوتانيكس",
    slug: "lumina-botanics",
    phone: "01033334444",
    storeId: "store-lumina",
  },
  "tarek@voltixtech.io": {
    password: "voltix123",
    brand: "فولتيكس تك",
    slug: "voltix-tech",
    phone: "01055556666",
    storeId: "store-voltix",
  },
}

export async function establishLocalDemoSessionAction(
  merchantId: string,
  storeId: string
): Promise<{ ok: boolean }> {
  // Strictly disabled whenever a real Supabase database is configured
  if (isSupabaseConfigured) {
    return { ok: false }
  }
  await createSessionCookie(merchantId, storeId)
  return { ok: true }
}

export async function loginWithEmailAction(input: {
  email: string
  password: string
}): Promise<{
  ok: boolean
  error?: string
  redirectTo?: string
  mode?: "supabase" | "local"
}> {
  const parsed = loginWithEmailSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    }
  }

  const cleanEmail = parsed.data.email.toLowerCase().trim()

  // Local dev adapter mode (Supabase env vars not set)
  if (!isSupabaseConfigured) {
    const demo = DEMO_ACCOUNTS[cleanEmail]
    if (demo) {
      if (parsed.data.password !== demo.password) {
        return { ok: false, mode: "local", error: "كلمة المرور غير صحيحة" }
      }
      await createSessionCookie(`demo-${demo.slug}`, demo.storeId)
      return { ok: true, mode: "local", redirectTo: "/dashboard" }
    }
    return {
      ok: false,
      mode: "local",
      error: "لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني",
    }
  }

  try {
    let user = await getUserByEmail(cleanEmail)

    if (!user && DEMO_ACCOUNTS[cleanEmail]) {
      const demo = DEMO_ACCOUNTS[cleanEmail]
      if (parsed.data.password !== demo.password) {
        return { ok: false, mode: "supabase", error: "كلمة المرور غير صحيحة" }
      }

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
          themeColor: "#945B2E",
          plan: "pro",
        })
      }
      await createSessionCookie(user.id, demoStore.id)
      return { ok: true, mode: "supabase", redirectTo: "/dashboard" }
    }

    if (!user) {
      return {
        ok: false,
        mode: "supabase",
        error: "لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني",
      }
    }

    // Strictly require passwordHash for email+password authentication
    if (!user.passwordHash || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return { ok: false, mode: "supabase", error: "كلمة المرور غير صحيحة" }
    }

    let store = await getStoreByOwnerId(user.id)
    if (!store) {
      let baseSlug = `store-${user.id.slice(0, 6)}`
      if (await getStoreBySlug(baseSlug)) {
        baseSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`
      }
      store = await createStore({
        ownerId: user.id,
        name: user.name || `متجر ${user.email}`,
        slug: baseSlug,
        phone: user.phone || "01000000000",
        whatsapp: user.phone || "01000000000",
        deliveryType: "flat",
        flatFee: 40,
        freeAbove: 1000,
        themeColor: "#945B2E",
        plan: "free",
      })
    }

    await createSessionCookie(user.id, store.id)

    return {
      ok: true,
      mode: "supabase",
      redirectTo: "/dashboard",
    }
  } catch (err) {
    console.error("[loginWithEmailAction] Error:", err)
    return {
      ok: false,
      mode: "supabase",
      error: "تعذر الاتصال بقاعدة البيانات حالياً. يرجى المحاولة مرة أخرى.",
    }
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
  mode?: "supabase" | "local"
}> {
  const parsed = registerWithEmailSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "بيانات التسجيل غير مكتملة",
    }
  }

  const cleanEmail = parsed.data.email.toLowerCase().trim()
  const cleanSlug = sanitizeSlug(parsed.data.slug)

  if (!isSupabaseConfigured) {
    await createSessionCookie(`local-${Date.now()}`, `store-${cleanSlug}`)
    return {
      ok: true,
      mode: "local",
      redirectTo: "/merchant/onboarding",
    }
  }

  try {
    const existingUser = await getUserByEmail(cleanEmail)
    if (existingUser) {
      return {
        ok: false,
        mode: "supabase",
        error: "يوجد حساب مسجل بالفعل بهذا البريد الإلكتروني. يرجى تسجيل الدخول.",
      }
    }

    const existingStore = await getStoreBySlug(cleanSlug)
    if (existingStore) {
      return {
        ok: false,
        mode: "supabase",
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
      themeColor: "#945B2E",
      plan: "free",
    })

    await createSessionCookie(user.id, store.id)

    return {
      ok: true,
      mode: "supabase",
      redirectTo: "/merchant/onboarding",
    }
  } catch (err) {
    console.error("[registerWithEmailAction] Error:", err)
    return {
      ok: false,
      mode: "supabase",
      error: "تعذر إنشاء الحساب حالياً. يرجى المحاولة مرة أخرى.",
    }
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

  try {
    // Find or create user
    let user = await getUserByPhone(parsed.data.phone)
    if (!user) {
      user = await createUser(parsed.data.phone)
    }

    // Find or create merchant's store (avoiding slug collisions)
    let store = await getStoreByOwnerId(user.id)
    if (!store) {
      let candidateSlug = `store-${parsed.data.phone.slice(-4)}`
      const existing = await getStoreBySlug(candidateSlug)
      if (existing) {
        candidateSlug = `${candidateSlug}-${Date.now().toString(36).slice(-4)}`
      }
      store = await createStore({
        ownerId: user.id,
        name: `متجر ${parsed.data.phone}`,
        slug: candidateSlug,
        phone: parsed.data.phone,
        whatsapp: parsed.data.phone,
        deliveryType: "flat",
        flatFee: 40,
        freeAbove: 1000,
        themeColor: "#945B2E",
        plan: "free",
      })
    }

    await createSessionCookie(user.id, store.id)

    return {
      ok: true,
      redirectTo: "/dashboard",
    }
  } catch (err) {
    console.error("[verifyOtpAction] Database error:", err)
    return {
      ok: false,
      error: "تعذر إتمام تسجيل الدخول حالياً. يرجى المحاولة مرة أخرى.",
    }
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

  try {
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
      themeColor: "#945B2E",
      plan: parsed.data.plan ?? "free",
    })

    await createSessionCookie(user.id, store.id)

    return {
      ok: true,
      slug: store.slug,
      redirectTo: "/merchant/onboarding",
    }
  } catch (err) {
    console.error("[registerMerchantAction] Database error:", err)
    return {
      ok: false,
      error: "حدث خطأ أثناء إنشاء المتجر. يرجى التحقق من البيانات والمحاولة مجدداً.",
    }
  }
}

export async function logoutAction(): Promise<{ ok: boolean; redirectTo: string }> {
  await destroySessionCookie()
  return {
    ok: true,
    redirectTo: "/",
  }
}

export async function adminLoginAction(input: {
  email: string
  password: string
}): Promise<{
  ok: boolean
  error?: string
  admin?: { id: string; name: string; email: string; role: "super_admin" }
}> {
  const parsed = loginWithEmailSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "يرجى إدخال البريد الإلكتروني وكلمة المرور بشكل صحيح",
    }
  }

  const cleanEmail = parsed.data.email.toLowerCase().trim()
  const configuredEmail = (process.env.ADMIN_EMAIL || "admin@matgarak.com").toLowerCase().trim()
  const configuredPassword = process.env.ADMIN_PASSWORD || "admin2026"

  const matchesEnvAdmin =
    cleanEmail === configuredEmail && parsed.data.password === configuredPassword

  if (matchesEnvAdmin) {
    await createAdminSessionCookie("admin-1")
    return {
      ok: true,
      admin: {
        id: "admin-1",
        name: "Amr El-Sherbiny",
        email: cleanEmail,
        role: "super_admin",
      },
    }
  }

  // If Supabase is configured, also support database-backed admin user accounts with passwordHash
  if (isSupabaseConfigured) {
    try {
      const user = await getUserByEmail(cleanEmail)
      if (
        user &&
        user.passwordHash &&
        verifyPassword(parsed.data.password, user.passwordHash) &&
        cleanEmail.endsWith("@matgarak.com")
      ) {
        await createAdminSessionCookie(user.id)
        return {
          ok: true,
          admin: {
            id: user.id,
            name: user.name || "Platform Admin",
            email: cleanEmail,
            role: "super_admin",
          },
        }
      }
    } catch (err) {
      console.error("[adminLoginAction] Supabase lookup failed:", err)
    }
  }

  return {
    ok: false,
    error: "بيانات دخول المشرف العام غير صحيحة أو الحساب غير مصرح له.",
  }
}

export async function adminLogoutAction(): Promise<{ ok: boolean }> {
  await destroyAdminSessionCookie()
  return { ok: true }
}
