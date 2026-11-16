"use server"

import { requireSessionContext } from "@/server/auth/dal"
import {
  onboardingSchema,
  storeSettingsSchema,
} from "@/lib/validation/schemas"
import {
  updateStore,
  getStoreBySlug,
  getProductsByStore,
  getOrdersByStore,
  getCustomersByStore,
  getDashboardStats,
  createProduct,
  addAuditLog,
} from "@/server/db/client"
import { sanitizeSlug } from "@/lib/reserved-slugs"
import type {
  Store,
  Product,
  Order,
  Customer,
  DashboardStats,
} from "@/types/domain"

export async function getMerchantDashboardDataAction(): Promise<{
  store: Store
  stats: DashboardStats
  recentOrders: Order[]
  products: Product[]
  customers: Customer[]
}> {
  const { store } = await requireSessionContext()

  const [stats, orders, products, customers] = await Promise.all([
    getDashboardStats(store.id),
    getOrdersByStore(store.id),
    getProductsByStore(store.id),
    getCustomersByStore(store.id),
  ])

  return {
    store,
    stats,
    recentOrders: orders.slice(0, 5),
    products,
    customers,
  }
}

export async function completeOnboardingAction(input: {
  storeName: string
  storeSlug: string
  category: string
  whatsapp: string
  deliveryFee: number
  productName: string
  productPrice: number
  productSizes?: string
  productImage?: string
}): Promise<{ ok: boolean; error?: string; storeSlug?: string }> {
  const { store } = await requireSessionContext()

  const parsed = onboardingSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "البيانات المدخلة غير صحيحة",
    }
  }

  const cleanSlug = sanitizeSlug(parsed.data.storeSlug)
  if (cleanSlug !== store.slug) {
    const existing = await getStoreBySlug(cleanSlug)
    if (existing && existing.id !== store.id) {
      return {
        ok: false,
        error: "هذا الرابط محجوز بالفعل لمتجر آخر. يرجى اختيار رابط مختلف.",
      }
    }
  }

  // Update store details
  await updateStore(store.id, {
    name: parsed.data.storeName,
    slug: cleanSlug,
    whatsapp: parsed.data.whatsapp,
    flatFee: parsed.data.deliveryFee,
  })

  // Parse product sizes (e.g. "S, M, L" or "38, 39, 40")
  const rawSizes = (parsed.data.productSizes || "قياسي")
    .split(/[,،]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const sizes = rawSizes.length > 0 ? rawSizes : ["قياسي"]
  const variants = sizes.map((size, idx) => ({
    id: `v-${Date.now()}-${idx}`,
    size,
    color: "افتراضي",
    stock: 10,
  }))

  await createProduct({
    storeId: store.id,
    name: parsed.data.productName,
    price: parsed.data.productPrice,
    category: parsed.data.category,
    image: parsed.data.productImage || "📦",
    variants,
  })

  await addAuditLog(
    store.id,
    "onboarding_completed",
    `Completed onboarding with initial product ${parsed.data.productName}`
  )

  return {
    ok: true,
    storeSlug: cleanSlug,
  }
}

export async function updateStoreSettingsAction(input: {
  storeName: string
  slug: string
  whatsapp: string
  deliveryType: "flat" | "by_city"
  flatFee: number
  freeAbove?: number | null
  cityFees?: Record<string, number>
  themeColor: string
  logoUrl?: string
}): Promise<{ ok: boolean; error?: string; store?: Store }> {
  const { store } = await requireSessionContext()

  const parsed = storeSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "بيانات الإعدادات غير صحيحة",
    }
  }

  const cleanSlug = sanitizeSlug(parsed.data.slug)
  if (cleanSlug !== store.slug) {
    const existing = await getStoreBySlug(cleanSlug)
    if (existing && existing.id !== store.id) {
      return {
        ok: false,
        error: "هذا الرابط محجوز بالفعل لمتجر آخر. يرجى اختيار رابط مختلف.",
      }
    }
  }

  const updated = await updateStore(store.id, {
    name: parsed.data.storeName,
    slug: cleanSlug,
    whatsapp: parsed.data.whatsapp,
    deliveryType: parsed.data.deliveryType,
    flatFee: parsed.data.flatFee,
    freeAbove: parsed.data.freeAbove ?? null,
    cityFees: parsed.data.cityFees ?? store.cityFees,
    themeColor: parsed.data.themeColor,
    logoUrl: parsed.data.logoUrl ?? store.logoUrl,
  })

  if (!updated) {
    return { ok: false, error: "فشل تحديث بيانات المتجر" }
  }

  await addAuditLog(
    store.id,
    "settings_updated",
    `Updated store settings for ${updated.name}`
  )

  return { ok: true, store: updated }
}
