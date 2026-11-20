import { z } from "zod"
import type {
  CatalogCategory,
  CatalogProduct,
  DiscountCode,
  OrderLifecycleStatus,
  StoreOrder,
  StoreThemePresetId,
  TenantStore,
} from "@/types/saas"
import { computeStoreOrderMetrics, getProductTotalStock } from "@/lib/commerce/engine"

export const assistantActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create_product"),
    payload: z.object({
      nameAr: z.string().min(1).max(160),
      nameEn: z.string().min(1).max(160),
      price: z.number().positive().max(1_000_000),
      stock: z.number().int().min(1).max(10_000).default(15),
      sizes: z.array(z.string().min(1).max(12)).min(1).max(10).default(["M", "L", "XL"]),
      color: z.string().min(1).max(40).default("Classic"),
      colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#111111"),
      categoryId: z.string().optional(),
      visualType: z
        .enum(["hoodie", "coat", "tshirt", "trousers", "dress", "bag", "sneakers"])
        .default("coat"),
    }),
  }),
  z.object({
    type: z.literal("update_product_price"),
    payload: z.object({
      productId: z.string().min(1),
      price: z.number().positive().max(1_000_000),
    }),
  }),
  z.object({
    type: z.literal("adjust_variant_stock"),
    payload: z.object({
      productId: z.string().min(1),
      variantId: z.string().min(1),
      delta: z.number().int().min(-10_000).max(10_000),
      note: z.string().max(200).optional(),
    }),
  }),
  z.object({
    type: z.literal("create_discount"),
    payload: z.object({
      code: z.string().min(2).max(24),
      type: z.enum(["percentage", "fixed", "free_shipping"]),
      value: z.number().min(0).max(100_000),
      minOrderValue: z.number().min(0).max(100_000).default(0),
    }),
  }),
  z.object({
    type: z.literal("toggle_discount"),
    payload: z.object({
      discountId: z.string().min(1),
      active: z.boolean(),
    }),
  }),
  z.object({
    type: z.literal("update_order_status"),
    payload: z.object({
      orderId: z.string().min(1),
      status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]),
      note: z.string().max(200).optional(),
    }),
  }),
  z.object({
    type: z.literal("update_store_status"),
    payload: z.object({
      status: z.enum(["published", "draft"]),
    }),
  }),
  z.object({
    type: z.literal("update_theme"),
    payload: z.object({
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      presetId: z.enum(["minimal-fashion", "modern-cosmetics", "electronics-pro"]).optional(),
      publish: z.boolean().default(true),
    }),
  }),
  z.object({
    type: z.literal("update_shipping"),
    payload: z.object({
      rate: z.number().min(0).max(10_000),
      freeAbove: z.number().min(0).max(500_000).nullable().optional(),
    }),
  }),
  z.object({
    type: z.literal("create_category"),
    payload: z.object({
      nameAr: z.string().min(1).max(100),
      nameEn: z.string().min(1).max(100),
      descriptionAr: z.string().max(240).default(""),
      descriptionEn: z.string().max(240).default(""),
    }),
  }),
])

export type AssistantAction = z.infer<typeof assistantActionSchema>

export const assistantMemorySchema = z.object({
  key: z.string().min(2).max(110),
  value: z.string().min(2).max(600),
  category: z
    .enum(["preference", "business", "inventory", "pricing", "customer", "general"])
    .default("general"),
  importance: z.number().int().min(1).max(5).default(4),
})

export type AssistantMemoryInput = z.infer<typeof assistantMemorySchema>

export interface ExecutedActionReceipt {
  id: string
  type: AssistantAction["type"]
  ok: boolean
  titleAr: string
  titleEn: string
  href?: string
  dbPersisted?: boolean
}

export interface AssistantSseEvent {
  type: "meta" | "token" | "action" | "memory" | "conversation" | "error" | "done"
  engine?: "groq" | "python-local"
  model?: string
  delta?: string
  action?: unknown
  dbPersisted?: boolean
  dbDetailAr?: string
  dbDetailEn?: string
  memory?: {
    id?: string
    key: string
    value: string
    category: string
  }
  conversationId?: string
  title?: string
  dbConnected?: boolean
  memoryBackend?: string
  message?: string
}

export function parseAssistantSseEvents(rawBuffer: string): {
  events: AssistantSseEvent[]
  remainder: string
} {
  const parts = rawBuffer.split("\n\n")
  const remainder = parts.pop() ?? ""
  const events: AssistantSseEvent[] = []

  for (const part of parts) {
    for (const line of part.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue
      const jsonStr = trimmed.slice(5).trim()
      if (!jsonStr) continue
      try {
        const parsed = JSON.parse(jsonStr) as AssistantSseEvent
        if (parsed && typeof parsed === "object" && "type" in parsed) {
          events.push(parsed)
        }
      } catch {
        // Ignore malformed SSE frame
      }
    }
  }

  return { events, remainder }
}

export function buildStoreAiContext(params: {
  store: TenantStore
  products: CatalogProduct[]
  categories: CatalogCategory[]
  orders: StoreOrder[]
  discounts: DiscountCode[]
}): Record<string, unknown> {
  const { store, products, categories, orders, discounts } = params
  const metrics = computeStoreOrderMetrics(orders)

  return {
    store: {
      id: store.id,
      nameAr: store.nameAr,
      nameEn: store.nameEn,
      slug: store.slug,
      status: store.status,
      currency: store.localization.currency,
      theme: {
        presetId: store.theme.presetId,
        primaryColor: store.theme.primaryColor,
        accentColor: store.theme.accentColor,
      },
      paymentConfig: {
        codEnabled: store.paymentConfig.codEnabled,
        bankTransferEnabled: store.paymentConfig.bankTransferEnabled,
      },
    },
    metrics,
    categories: categories.map((c) => ({
      id: c.id,
      nameAr: c.nameAr,
      nameEn: c.nameEn,
      slug: c.slug,
    })),
    products: products.map((p) => ({
      id: p.id,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      price: p.price,
      sku: p.sku,
      status: p.status,
      totalStock: getProductTotalStock(p),
      lowStockThreshold: p.lowStockThreshold,
      salesCount: p.salesCount,
      variants: p.variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
      })),
    })),
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      city: o.shippingAddress.city,
      status: o.status,
      total: o.total,
      itemsCount: o.items.length,
    })),
    discounts: discounts.map((d) => ({
      id: d.id,
      code: d.code,
      type: d.type,
      value: d.value,
      active: d.active,
      usedCount: d.usedCount,
    })),
    shippingMethods: store.shippingMethods.map((s) => ({
      id: s.id,
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      rate: s.rate,
      freeAbove: s.freeAbove,
      enabled: s.enabled,
    })),
  }
}

export interface StoreActionMutators {
  store: TenantStore
  categories: CatalogCategory[]
  products: CatalogProduct[]
  orders: StoreOrder[]
  discounts: DiscountCode[]
  actorName: string
  createProduct: (product: Omit<CatalogProduct, "id" | "createdAt" | "salesCount">) => CatalogProduct
  updateProduct: (productId: string, updates: Partial<CatalogProduct>) => void
  adjustVariantStock: (input: {
    storeId: string
    productId: string
    variantId: string
    delta: number
    reason: "restock" | "manual_adjustment"
    note?: string
    actor: string
  }) => void
  createDiscount: (discount: Omit<DiscountCode, "id" | "usedCount">) => DiscountCode
  updateDiscount: (id: string, updates: Partial<DiscountCode>) => void
  updateOrderStatus: (orderId: string, status: OrderLifecycleStatus, actor: string, note?: string) => void
  updateStoreStatus: (storeId: string, status: "published" | "draft") => void
  updateStore: (storeId: string, updates: Partial<TenantStore>) => void
  updateDraftTheme: (storeId: string, updates: Partial<TenantStore["theme"]>) => void
  applyThemePresetToDraft: (storeId: string, presetId: StoreThemePresetId) => void
  publishStoreDesign: (storeId: string) => void
  createCategory: (cat: Omit<CatalogCategory, "id">) => CatalogCategory
}

export function executeAssistantAction(
  rawAction: unknown,
  ctx: StoreActionMutators
): ExecutedActionReceipt | null {
  const parsed = assistantActionSchema.safeParse(rawAction)
  if (!parsed.success) return null

  const action = parsed.data
  const receiptId = `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const currency = ctx.store.localization.currency

  switch (action.type) {
    case "create_product": {
      const p = action.payload
      const categoryId =
        (p.categoryId && ctx.categories.some((c) => c.id === p.categoryId)
          ? p.categoryId
          : ctx.categories[0]?.id) || "cat-general"

      const slugBase =
        p.nameEn
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `garment-${Date.now().toString().slice(-4)}`

      const skuBase = `${ctx.store.logoMonogram}-${Date.now().toString().slice(-4)}`
      const created = ctx.createProduct({
        storeId: ctx.store.id,
        categoryId,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        slug: `${slugBase}-${Date.now().toString().slice(-3)}`,
        descriptionAr: `قطعة ملابس مضافة عبر المساعد الذكي — ${p.nameAr}.`,
        descriptionEn: `Apparel piece created via AI Store Copilot — ${p.nameEn}.`,
        price: p.price,
        sku: skuBase,
        status: "active",
        lowStockThreshold: 5,
        visualType: p.visualType,
        visualPalette: [p.colorHex, ctx.store.theme.accentColor],
        galleryTones: [p.colorHex, "#E5E0D8"],
        variants: p.sizes.map((sz, i) => ({
          id: `v-${Date.now()}-${i}`,
          sku: `${skuBase}-${sz}`,
          size: sz,
          color: p.color,
          colorHex: p.colorHex,
          price: p.price,
          stock: p.stock,
          available: true,
        })),
        specs: [],
        reviews: [],
        featured: true,
        bestSeller: false,
        newArrival: true,
      })

      return {
        id: receiptId,
        type: action.type,
        ok: true,
        titleAr: `تمت إضافة المنتج "${created.nameAr}" (${created.price} ${currency})`,
        titleEn: `Added product "${created.nameEn}" (${created.price} ${currency})`,
        href: `/dashboard/products/${created.id}`,
      }
    }

    case "update_product_price": {
      const target = ctx.products.find((pr) => pr.id === action.payload.productId)
      if (!target) return null
      ctx.updateProduct(target.id, {
        price: action.payload.price,
        variants: target.variants.map((v) => ({ ...v, price: action.payload.price })),
      })
      return {
        id: receiptId,
        type: action.type,
        ok: true,
        titleAr: `تم تعديل سعر "${target.nameAr}" إلى ${action.payload.price} ${currency}`,
        titleEn: `Updated "${target.nameEn}" price to ${action.payload.price} ${currency}`,
        href: `/dashboard/products/${target.id}`,
      }
    }

    case "adjust_variant_stock": {
      const target = ctx.products.find((pr) => pr.id === action.payload.productId)
      if (!target) return null
      ctx.adjustVariantStock({
        storeId: ctx.store.id,
        productId: target.id,
        variantId: action.payload.variantId,
        delta: action.payload.delta,
        reason: action.payload.delta >= 0 ? "restock" : "manual_adjustment",
        note: action.payload.note || "AI Store Copilot",
        actor: ctx.actorName,
      })
      return {
        id: receiptId,
        type: action.type,
        ok: true,
        titleAr: `تم تعديل مخزون "${target.nameAr}" بمقدار ${action.payload.delta > 0 ? `+${action.payload.delta}` : action.payload.delta}`,
        titleEn: `Adjusted stock for "${target.nameEn}" by ${action.payload.delta > 0 ? `+${action.payload.delta}` : action.payload.delta}`,
        href: "/dashboard/inventory",
      }
    }

    case "create_discount": {
      const cleanCode = action.payload.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "")
      const existing = ctx.discounts.find((d) => d.code.toUpperCase() === cleanCode)
      if (existing) {
        ctx.updateDiscount(existing.id, {
          active: true,
          type: action.payload.type,
          value: action.payload.value,
        })
      } else {
        ctx.createDiscount({
          storeId: ctx.store.id,
          code: cleanCode,
          type: action.payload.type,
          value: action.payload.value,
          scope: "all",
          minOrderValue: action.payload.minOrderValue,
          maxUses: 500,
          firstOrderOnly: false,
          startsAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          active: true,
        })
      }
      return {
        id: receiptId,
        type: action.type,
        ok: true,
        titleAr: `تم تفعيل كود الخصم ${cleanCode} بنجاح`,
        titleEn: `Promo code ${cleanCode} activated`,
        href: "/dashboard/discounts",
      }
    }

    case "toggle_discount": {
      const target = ctx.discounts.find((d) => d.id === action.payload.discountId)
      if (!target) return null
      ctx.updateDiscount(target.id, { active: action.payload.active })
      return {
        id: receiptId,
        type: action.type,
        ok: true,
        titleAr: `${action.payload.active ? "تم تفعيل" : "تم تعطيل"} الكوبون ${target.code}`,
        titleEn: `${action.payload.active ? "Enabled" : "Disabled"} promo ${target.code}`,
        href: "/dashboard/discounts",
      }
    }

    case "update_order_status": {
      const target = ctx.orders.find((o) => o.id === action.payload.orderId)
      if (!target) return null
      ctx.updateOrderStatus(target.id, action.payload.status, ctx.actorName, action.payload.note)
      return {
        id: receiptId,
        type: action.type,
        ok: true,
        titleAr: `تم تحديث حالة الطلب #${target.orderNumber} إلى ${action.payload.status}`,
        titleEn: `Order #${target.orderNumber} updated to ${action.payload.status}`,
        href: `/dashboard/orders/${target.id}`,
      }
    }

    case "update_store_status": {
      ctx.updateStoreStatus(ctx.store.id, action.payload.status)
      return {
        id: receiptId,
        type: action.type,
        ok: true,
        titleAr:
          action.payload.status === "published"
            ? "تم نشر المتجر للعملاء"
            : "تم تحويل المتجر إلى وضع المسودة",
        titleEn:
          action.payload.status === "published"
            ? "Store published live"
            : "Store switched to draft mode",
        href: `/s/${ctx.store.slug}`,
      }
    }

    case "update_theme": {
      if (action.payload.presetId) {
        ctx.applyThemePresetToDraft(ctx.store.id, action.payload.presetId)
      }
      const themePatch: Partial<TenantStore["theme"]> = {}
      if (action.payload.primaryColor) themePatch.primaryColor = action.payload.primaryColor
      if (action.payload.accentColor) themePatch.accentColor = action.payload.accentColor
      if (Object.keys(themePatch).length > 0) {
        ctx.updateDraftTheme(ctx.store.id, themePatch)
      }
      if (action.payload.publish) {
        ctx.publishStoreDesign(ctx.store.id)
      }
      return {
        id: receiptId,
        type: action.type,
        ok: true,
        titleAr: `تم تحديث تصميم المتجر (${action.payload.primaryColor || action.payload.presetId || "الثيم"}) ونشره`,
        titleEn: `Updated & published store theme (${action.payload.primaryColor || action.payload.presetId || "theme"})`,
        href: "/dashboard/store-design",
      }
    }

    case "update_shipping": {
      const updated = ctx.store.shippingMethods.map((m, idx) =>
        idx === 0
          ? {
              ...m,
              rate: action.payload.rate,
              freeAbove:
                action.payload.freeAbove !== undefined ? action.payload.freeAbove : m.freeAbove,
            }
          : m
      )
      ctx.updateStore(ctx.store.id, { shippingMethods: updated })
      return {
        id: receiptId,
        type: action.type,
        ok: true,
        titleAr: `تم تحديث سعر الشحن إلى ${action.payload.rate} ${currency}`,
        titleEn: `Shipping rate updated to ${action.payload.rate} ${currency}`,
        href: "/dashboard/shipping",
      }
    }

    case "create_category": {
      const slugBase =
        action.payload.nameEn
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `cat-${Date.now().toString().slice(-4)}`
      const created = ctx.createCategory({
        storeId: ctx.store.id,
        parentId: null,
        nameAr: action.payload.nameAr,
        nameEn: action.payload.nameEn,
        slug: slugBase,
        descriptionAr: action.payload.descriptionAr,
        descriptionEn: action.payload.descriptionEn,
        isCollection: false,
        featured: true,
        displayOrder: ctx.categories.length,
        accentColor: ctx.store.theme.primaryColor,
      })
      return {
        id: receiptId,
        type: action.type,
        ok: true,
        titleAr: `تم إنشاء قسم الملابس "${created.nameAr}"`,
        titleEn: `Created category "${created.nameEn}"`,
        href: "/dashboard/categories",
      }
    }
  }
}
