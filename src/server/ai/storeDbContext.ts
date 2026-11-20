import {
  getStoreById,
  getProductsByStore,
  getOrdersByStore,
  getCustomersByStore,
  getCategoriesByStore,
  getDiscountsByStore,
} from "@/server/db/client"
import { isSupabaseConfigured } from "@/server/db/supabase"
import { isUuid } from "@/server/ai/memoryStore"

export interface LiveDbContextResult {
  connected: boolean
  storeId: string
  storeName?: string
  storeSlug?: string
  mergedContext: Record<string, unknown>
  dbSummary: {
    productsCount: number
    ordersCount: number
    customersCount: number
    totalRevenue: number
    pendingOrders: number
  }
}

function mapArabicOrderStatusToEnglish(status: string): string {
  switch (status) {
    case "جديد":
      return "pending"
    case "مؤكد":
      return "confirmed"
    case "جاري الشحن":
      return "shipped"
    case "تم التسليم":
      return "delivered"
    case "ملغي":
      return "cancelled"
    default:
      return status
  }
}

/**
 * Queries the authenticated merchant's live Supabase PostgreSQL tables directly
 * (strictly isolated by verifiedStoreId) and merges them cleanly with storefront UI context.
 */
export async function buildDirectSupabaseStoreContext(
  verifiedStoreId: string,
  clientFallbackContext: Record<string, unknown>
): Promise<LiveDbContextResult> {
  if (!isSupabaseConfigured || !isUuid(verifiedStoreId)) {
    return {
      connected: false,
      storeId: verifiedStoreId,
      mergedContext: clientFallbackContext,
      dbSummary: {
        productsCount: 0,
        ordersCount: 0,
        customersCount: 0,
        totalRevenue: 0,
        pendingOrders: 0,
      },
    }
  }

  const dbStore = await getStoreById(verifiedStoreId)
  if (!dbStore) {
    return {
      connected: false,
      storeId: verifiedStoreId,
      mergedContext: clientFallbackContext,
      dbSummary: {
        productsCount: 0,
        ordersCount: 0,
        customersCount: 0,
        totalRevenue: 0,
        pendingOrders: 0,
      },
    }
  }

  // Parallel strictly tenant-isolated Supabase queries
  const [products, orders, customers, categories, discounts] = await Promise.all([
    getProductsByStore(verifiedStoreId),
    getOrdersByStore(verifiedStoreId),
    getCustomersByStore(verifiedStoreId),
    getCategoriesByStore(verifiedStoreId).catch(() => []),
    getDiscountsByStore(verifiedStoreId).catch(() => []),
  ])

  const validOrders = orders.filter((o) => o.status !== "ملغي")
  const totalSales = validOrders.reduce((acc, o) => acc + (o.total || 0), 0)
  const pendingCount = orders.filter((o) => o.status === "جديد").length
  const completedCount = orders.filter((o) => o.status === "تم التسليم").length
  const averageOrderValue =
    validOrders.length > 0 ? Math.round(totalSales / validOrders.length) : 0

  // Prefer live Supabase rows whenever the store has real DB data,
  // while keeping UI showcase context available if this DB store was just initialized empty.
  const hasDbCatalog = products.length > 0
  const hasDbOrders = orders.length > 0

  const clientStore = (clientFallbackContext.store as Record<string, unknown>) || {}
  const clientProducts = Array.isArray(clientFallbackContext.products)
    ? clientFallbackContext.products
    : []
  const clientOrders = Array.isArray(clientFallbackContext.orders)
    ? clientFallbackContext.orders
    : []
  const clientDiscounts = Array.isArray(clientFallbackContext.discounts)
    ? clientFallbackContext.discounts
    : []
  const clientCategories = Array.isArray(clientFallbackContext.categories)
    ? clientFallbackContext.categories
    : []

  const dbProductsMapped = products.map((p) => ({
    id: p.id,
    nameAr: p.name,
    nameEn: p.name,
    price: p.price,
    category: p.category,
    totalStock: p.stock,
    lowStockThreshold: 5,
    status: p.status,
    salesCount: 0,
    source: "supabase",
    variants: p.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stock: v.stock,
    })),
  }))

  const dbOrdersMapped = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    city: o.customerCity,
    address: o.customerAddress,
    status: mapArabicOrderStatusToEnglish(o.status),
    statusAr: o.status,
    total: o.total,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    itemsCount: o.items.reduce((s, i) => s + i.quantity, 0),
    items: o.items.map((i) => ({
      name: i.name,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      price: i.price,
    })),
    createdAt: o.createdAt,
    source: "supabase",
  }))

  const dbCustomersMapped = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    city: c.city,
    totalOrders: c.totalOrders,
    totalSpent: c.totalSpent,
    tag: c.tag,
    lastOrder: c.lastOrder,
  }))

  const dbCategoriesMapped = categories.map((c) => ({
    id: c.id,
    nameAr: c.nameAr,
    nameEn: c.nameEn || c.nameAr,
    slug: c.slug,
  }))

  const dbDiscountsMapped = discounts.map((d) => ({
    id: d.id,
    code: d.code,
    type: d.type,
    value: d.value,
    active: d.isActive,
    usedCount: d.usedCount,
    minOrderValue: d.minOrderValue,
  }))

  const mergedContext: Record<string, unknown> = {
    ...clientFallbackContext,
    database: {
      connected: true,
      engine: "Supabase PostgreSQL",
      storeId: dbStore.id,
      productsInDb: products.length,
      ordersInDb: orders.length,
      customersInDb: customers.length,
    },
    store: {
      ...clientStore,
      id: dbStore.id,
      nameAr: dbStore.name,
      nameEn: dbStore.name,
      slug: dbStore.slug,
      phone: dbStore.phone,
      whatsapp: dbStore.whatsapp,
      status: dbStore.status || "published",
      currency: dbStore.currency || "EGP",
      plan: dbStore.plan,
      theme: {
        ...((clientStore.theme as Record<string, unknown>) || {}),
        primaryColor: dbStore.themeColor,
      },
    },
    metrics: hasDbOrders
      ? {
          totalSales,
          totalOrders: orders.length,
          pendingCount,
          completedCount,
          averageOrderValue,
          customersCount: customers.length,
        }
      : {
          ...((clientFallbackContext.metrics as Record<string, unknown>) || {}),
          dbOrdersCount: 0,
          customersCount: customers.length,
        },
    products: hasDbCatalog ? dbProductsMapped : clientProducts,
    orders: hasDbOrders ? dbOrdersMapped : clientOrders,
    customers: dbCustomersMapped,
    categories: dbCategoriesMapped.length > 0 ? dbCategoriesMapped : clientCategories,
    discounts: dbDiscountsMapped.length > 0 ? dbDiscountsMapped : clientDiscounts,
    shippingMethods: [
      {
        id: "db-shipping-primary",
        nameAr: dbStore.deliveryType === "by_city" ? "شحن حسب المحافظة" : "شحن قياسي",
        nameEn: dbStore.deliveryType === "by_city" ? "City-based Shipping" : "Standard Shipping",
        rate: dbStore.flatFee,
        freeAbove: dbStore.freeAbove,
        cityFees: dbStore.cityFees || {},
        enabled: true,
      },
    ],
  }

  return {
    connected: true,
    storeId: dbStore.id,
    storeName: dbStore.name,
    storeSlug: dbStore.slug,
    mergedContext,
    dbSummary: {
      productsCount: products.length,
      ordersCount: orders.length,
      customersCount: customers.length,
      totalRevenue: totalSales,
      pendingOrders: pendingCount,
    },
  }
}
