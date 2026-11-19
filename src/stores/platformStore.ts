import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  CatalogCategory,
  CatalogProduct,
  CatalogVariant,
  DiscountCode,
  InventoryLog,
  OrderLifecycleStatus,
  PaymentMethodType,
  PlatformActivityLog,
  PlatformAnnouncement,
  PlatformMerchant,
  PlatformSettings,
  ShippingAddress,
  StaffMember,
  StoreCustomer,
  StoreOrder,
  StoreSection,
  StoreStatus,
  StoreTheme,
  StoreThemePresetId,
  SubscriptionPlan,
  SubscriptionRecord,
  SupportTicket,
  TenantStore,
} from "@/types/saas"
import {
  SEED_ACTIVITY_LOGS,
  SEED_ANNOUNCEMENTS,
  SEED_CATEGORIES,
  SEED_CUSTOMERS,
  SEED_DISCOUNTS,
  SEED_INVENTORY_LOGS,
  SEED_MERCHANTS,
  SEED_ORDERS,
  SEED_PLATFORM_SETTINGS,
  SEED_PRODUCTS,
  SEED_STORES,
  SEED_SUBSCRIPTION_PLANS,
  SEED_SUBSCRIPTION_RECORDS,
  SEED_SUPPORT_TICKETS,
} from "@/lib/api/seedPlatformData"
import { createDefaultSections, getPresetById } from "@/lib/themes/presets"
import { formatVariantLabel, reorderStoreSections } from "@/lib/commerce/engine"

/**
 * Centralized frontend state & development data adapter.
 * Designed with clean method contracts so each action can be bound to REST/Server Action endpoints.
 */
interface PlatformState {
  dataSource: "local-dev-adapter"
  merchants: PlatformMerchant[]
  stores: TenantStore[]
  categories: CatalogCategory[]
  products: CatalogProduct[]
  orders: StoreOrder[]
  customers: StoreCustomer[]
  discounts: DiscountCode[]
  inventoryLogs: InventoryLog[]
  plans: SubscriptionPlan[]
  subscriptions: SubscriptionRecord[]
  tickets: SupportTicket[]
  announcements: PlatformAnnouncement[]
  platformSettings: PlatformSettings
  activityLogs: PlatformActivityLog[]

  // Merchant & Store Registration / Onboarding
  registerMerchantAndStore: (input: {
    ownerName: string
    email: string
    phone: string
    password: string
    brandNameAr: string
    brandNameEn: string
    slug: string
    category: TenantStore["category"]
    presetId?: StoreThemePresetId
  }) => { merchant: PlatformMerchant; store: TenantStore }

  updateStore: (storeId: string, updates: Partial<TenantStore>) => void
  updateStoreStatus: (storeId: string, status: StoreStatus) => void
  toggleStoreVisibility: (storeId: string) => void

  // Store Builder (Draft / Save / Publish / Restore / Theme Preset / Sections)
  updateDraftTheme: (storeId: string, updates: Partial<StoreTheme>) => void
  applyThemePresetToDraft: (storeId: string, presetId: StoreThemePresetId) => void
  updateDraftSections: (storeId: string, sections: StoreSection[]) => void
  toggleDraftSectionVisibility: (storeId: string, sectionId: string) => void
  moveDraftSection: (
    storeId: string,
    sectionId: string,
    direction: "up" | "down"
  ) => void
  updateDraftSectionContent: (
    storeId: string,
    sectionId: string,
    updates: Partial<StoreSection>
  ) => void
  publishStoreDesign: (storeId: string) => void
  restorePreviousTheme: (storeId: string) => boolean

  // Products & Variants
  createProduct: (product: Omit<CatalogProduct, "id" | "createdAt" | "salesCount">) => CatalogProduct
  updateProduct: (productId: string, updates: Partial<CatalogProduct>) => void
  duplicateProduct: (productId: string) => CatalogProduct | null
  deleteProduct: (productId: string) => void
  addProductReview: (
    productId: string,
    review: { authorName: string; rating: number; comment: string }
  ) => void

  // Categories
  createCategory: (cat: Omit<CatalogCategory, "id">) => CatalogCategory
  updateCategory: (catId: string, updates: Partial<CatalogCategory>) => void
  deleteCategory: (catId: string) => void
  moveCategoryOrder: (storeId: string, catId: string, direction: "up" | "down") => void

  // Inventory
  adjustVariantStock: (input: {
    storeId: string
    productId: string
    variantId: string
    delta: number
    reason: InventoryLog["reason"]
    note?: string
    actor: string
  }) => void

  // Orders
  placeStorefrontOrder: (input: {
    storeId: string
    customerId?: string
    customerName: string
    customerEmail: string
    customerPhone: string
    shippingAddress: ShippingAddress
    shippingMethodId: string
    shippingMethodNameAr: string
    shippingMethodNameEn: string
    paymentMethod: PaymentMethodType
    items: StoreOrder["items"]
    subtotal: number
    shippingFee: number
    discountCode?: string
    discountAmount: number
    total: number
  }) => StoreOrder

  updateOrderStatus: (
    orderId: string,
    status: OrderLifecycleStatus,
    actor: string,
    note?: string
  ) => void
  addOrderInternalNote: (orderId: string, text: string, author: string) => void

  // Customers (Store-Scoped)
  registerStoreCustomer: (input: {
    storeId: string
    name: string
    email: string
    phone: string
    password: string
  }) => { ok: true; customer: StoreCustomer } | { ok: false; error: string }
  updateCustomerProfile: (
    customerId: string,
    updates: Partial<Pick<StoreCustomer, "name" | "phone" | "addresses">>
  ) => void
  toggleCustomerWishlist: (customerId: string, productId: string) => void
  subscribeStoreNewsletter: (storeId: string, email: string) => void

  // Discounts
  createDiscount: (discount: Omit<DiscountCode, "id" | "usedCount">) => DiscountCode
  updateDiscount: (id: string, updates: Partial<DiscountCode>) => void
  deleteDiscount: (id: string) => void

  // Staff
  addStaffMember: (storeId: string, member: Omit<StaffMember, "id" | "joinedAt">) => void
  updateStaffRole: (storeId: string, staffId: string, role: StaffMember["role"]) => void
  removeStaffMember: (storeId: string, staffId: string) => void

  // Admin Operations
  updateMerchantStatus: (merchantId: string, status: PlatformMerchant["status"]) => void
  updateMerchantPlan: (merchantId: string, planId: string) => void
  createPlan: (plan: Omit<SubscriptionPlan, "id">) => void
  updatePlan: (planId: string, updates: Partial<SubscriptionPlan>) => void
  updateTicketStatus: (
    ticketId: string,
    status: SupportTicket["status"],
    reply?: string
  ) => void
  publishAnnouncement: (ann: Omit<PlatformAnnouncement, "id" | "publishedAt">) => void
  updatePlatformSettings: (updates: Partial<PlatformSettings>) => void
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      dataSource: "local-dev-adapter",
      merchants: SEED_MERCHANTS,
      stores: SEED_STORES,
      categories: SEED_CATEGORIES,
      products: SEED_PRODUCTS,
      orders: SEED_ORDERS,
      customers: SEED_CUSTOMERS,
      discounts: SEED_DISCOUNTS,
      inventoryLogs: SEED_INVENTORY_LOGS,
      plans: SEED_SUBSCRIPTION_PLANS,
      subscriptions: SEED_SUBSCRIPTION_RECORDS,
      tickets: SEED_SUPPORT_TICKETS,
      announcements: SEED_ANNOUNCEMENTS,
      platformSettings: SEED_PLATFORM_SETTINGS,
      activityLogs: SEED_ACTIVITY_LOGS,

      registerMerchantAndStore: (input) => {
        const now = new Date().toISOString()
        const merchantId = `merch-${Date.now()}`
        const storeId = `store-${Date.now()}`
        const preset = getPresetById(input.presetId ?? "minimal-fashion")
        const cleanSlug =
          input.slug
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "") || `brand-${Date.now().toString().slice(-4)}`

        const visualVariant =
          input.category === "cosmetics"
            ? "cosmetics"
            : input.category === "electronics"
              ? "electronics"
              : "fashion"

        const defaultSections = createDefaultSections({
          brandNameAr: input.brandNameAr || input.brandNameEn,
          brandNameEn: input.brandNameEn || input.brandNameAr,
          visualVariant,
        })

        const newMerchant: PlatformMerchant = {
          id: merchantId,
          name: input.ownerName,
          email: input.email.toLowerCase(),
          phone: input.phone,
          passwordDemo: input.password,
          status: "active",
          planId: "plan-starter",
          storeIds: [storeId],
          reportedIssues: 0,
          createdAt: now,
          lastActiveAt: now,
        }

        const newStore: TenantStore = {
          id: storeId,
          merchantId,
          nameAr: input.brandNameAr || input.brandNameEn,
          nameEn: input.brandNameEn || input.brandNameAr,
          slug: cleanSlug,
          taglineAr: "متجر إلكتروني مستقل",
          taglineEn: "Independent Online Storefront",
          descriptionAr: `مرحباً بك في متجر ${input.brandNameAr || input.brandNameEn}`,
          descriptionEn: `Welcome to ${input.brandNameEn || input.brandNameAr}`,
          category: input.category,
          logoMonogram: (input.brandNameEn || input.brandNameAr || "M")
            .trim()
            .charAt(0)
            .toUpperCase(),
          logoColor: preset.theme.primaryColor,
          status: "draft",
          visible: true,
          planId: "plan-starter",
          contactEmail: input.email.toLowerCase(),
          contactPhone: input.phone,
          whatsapp: input.phone,
          socialLinks: {},
          theme: preset.theme,
          draftTheme: preset.theme,
          sections: defaultSections,
          draftSections: defaultSections,
          navigationLinks: [
            { id: "n-home", labelAr: "الرئيسية", labelEn: "Home", href: "" },
            { id: "n-shop", labelAr: "المنتجات", labelEn: "Shop All", href: "products" },
          ],
          shippingMethods: [
            {
              id: `ship-${Date.now()}`,
              nameAr: "شحن قياسي",
              nameEn: "Standard Delivery",
              type: "flat",
              rate: 50,
              freeAbove: 1000,
              estimatedDaysAr: "2 - 4 أيام",
              estimatedDaysEn: "2 - 4 days",
              enabled: true,
            },
          ],
          paymentConfig: {
            codEnabled: true,
            codFee: 0,
            bankTransferEnabled: false,
            bankName: "",
            bankAccountName: "",
            bankIban: "",
            onlineGatewayProvider: "none",
            onlineGatewayConnected: false,
          },
          localization: {
            primaryLanguage: "ar",
            supportedLanguages: ["ar", "en"],
            currency: "EGP",
            currencySymbolPosition: "after",
            region: "Egypt",
          },
          seo: {
            titleAr: input.brandNameAr || input.brandNameEn,
            titleEn: input.brandNameEn || input.brandNameAr,
            descriptionAr: "",
            descriptionEn: "",
          },
          staff: [
            {
              id: `stf-${Date.now()}`,
              name: input.ownerName,
              email: input.email.toLowerCase(),
              role: "owner",
              status: "active",
              joinedAt: now.slice(0, 10),
            },
          ],
          onboardingCompleted: false,
          onboardingStep: 3,
          newsletterSubscribers: [],
          createdAt: now,
          lastActivityAt: now,
        }

        set((state) => ({
          merchants: [newMerchant, ...state.merchants],
          stores: [newStore, ...state.stores],
          activityLogs: [
            {
              id: `act-${Date.now()}`,
              actor: input.ownerName,
              actionAr: `تسجيل متجر جديد: ${newStore.nameAr}`,
              actionEn: `Registered new store: ${newStore.nameEn}`,
              target: storeId,
              timestamp: now,
            },
            ...state.activityLogs,
          ],
        }))

        return { merchant: newMerchant, store: newStore }
      },

      updateStore: (storeId, updates) => {
        const now = new Date().toISOString()
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId ? { ...s, ...updates, lastActivityAt: now } : s
          ),
        }))
      },

      updateStoreStatus: (storeId, status) => {
        const now = new Date().toISOString()
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId
              ? { ...s, status, visible: status === "published", lastActivityAt: now }
              : s
          ),
          activityLogs: [
            {
              id: `act-${Date.now()}`,
              actor: "Platform",
              actionAr: `تغيير حالة المتجر إلى ${status}`,
              actionEn: `Changed store status to ${status}`,
              target: storeId,
              timestamp: now,
            },
            ...state.activityLogs,
          ],
        }))
      },

      toggleStoreVisibility: (storeId) => {
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId ? { ...s, visible: !s.visible } : s
          ),
        }))
      },

      updateDraftTheme: (storeId, updates) => {
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId
              ? { ...s, draftTheme: { ...s.draftTheme, ...updates } }
              : s
          ),
        }))
      },

      applyThemePresetToDraft: (storeId, presetId) => {
        const preset = getPresetById(presetId)
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId
              ? { ...s, draftTheme: { ...preset.theme } }
              : s
          ),
        }))
      },

      updateDraftSections: (storeId, sections) => {
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId ? { ...s, draftSections: sections } : s
          ),
        }))
      },

      toggleDraftSectionVisibility: (storeId, sectionId) => {
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId
              ? {
                  ...s,
                  draftSections: s.draftSections.map((sec) =>
                    sec.id === sectionId ? { ...sec, visible: !sec.visible } : sec
                  ),
                }
              : s
          ),
        }))
      },

      moveDraftSection: (storeId, sectionId, direction) => {
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId
              ? {
                  ...s,
                  draftSections: reorderStoreSections(
                    s.draftSections,
                    sectionId,
                    direction
                  ),
                }
              : s
          ),
        }))
      },

      updateDraftSectionContent: (storeId, sectionId, updates) => {
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId
              ? {
                  ...s,
                  draftSections: s.draftSections.map((sec) =>
                    sec.id === sectionId ? { ...sec, ...updates } : sec
                  ),
                }
              : s
          ),
        }))
      },

      publishStoreDesign: (storeId) => {
        const now = new Date().toISOString()
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId
              ? {
                  ...s,
                  previousTheme: { ...s.theme },
                  theme: { ...s.draftTheme },
                  sections: s.draftSections.map((sec) => ({ ...sec })),
                  status: s.status === "draft" ? "published" : s.status,
                  visible: true,
                  lastActivityAt: now,
                }
              : s
          ),
        }))
      },

      restorePreviousTheme: (storeId) => {
        const store = get().stores.find((s) => s.id === storeId)
        if (!store?.previousTheme) return false
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId && s.previousTheme
              ? {
                  ...s,
                  draftTheme: { ...s.previousTheme },
                  theme: { ...s.previousTheme },
                }
              : s
          ),
        }))
        return true
      },

      createProduct: (input) => {
        const created: CatalogProduct = {
          ...input,
          id: `prod-${Date.now()}`,
          salesCount: 0,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ products: [created, ...state.products] }))
        return created
      },

      updateProduct: (productId, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, ...updates } : p
          ),
        }))
      },

      duplicateProduct: (productId) => {
        const orig = get().products.find((p) => p.id === productId)
        if (!orig) return null
        const copyId = `prod-${Date.now()}`
        const copy: CatalogProduct = {
          ...orig,
          id: copyId,
          nameAr: `${orig.nameAr} (نسخة)`,
          nameEn: `${orig.nameEn} (Copy)`,
          slug: `${orig.slug}-copy-${copyId.slice(-4)}`,
          sku: `${orig.sku}-CPY`,
          status: "draft",
          salesCount: 0,
          variants: orig.variants.map((v, idx) => ({
            ...v,
            id: `v-${copyId}-${idx}`,
            sku: `${v.sku}-CPY`,
          })),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ products: [copy, ...state.products] }))
        return copy
      },

      deleteProduct: (productId) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        }))
      },

      addProductReview: (productId, review) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  reviews: [
                    {
                      id: `rev-${Date.now()}`,
                      authorName: review.authorName,
                      rating: review.rating,
                      comment: review.comment,
                      createdAt: new Date().toISOString().slice(0, 10),
                      verified: true,
                    },
                    ...p.reviews,
                  ],
                }
              : p
          ),
        }))
      },

      createCategory: (cat) => {
        const created: CatalogCategory = {
          ...cat,
          id: `cat-${Date.now()}`,
        }
        set((state) => ({ categories: [...state.categories, created] }))
        return created
      },

      updateCategory: (catId, updates) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === catId ? { ...c, ...updates } : c
          ),
        }))
      },

      deleteCategory: (catId) => {
        set((state) => ({
          categories: state.categories.filter(
            (c) => c.id !== catId && c.parentId !== catId
          ),
        }))
      },

      moveCategoryOrder: (storeId, catId, direction) => {
        const storeCats = get()
          .categories.filter((c) => c.storeId === storeId)
          .sort((a, b) => a.displayOrder - b.displayOrder)
        const idx = storeCats.findIndex((c) => c.id === catId)
        if (idx === -1) return
        const target = direction === "up" ? idx - 1 : idx + 1
        if (target < 0 || target >= storeCats.length) return
        const reordered = [...storeCats]
        const [moved] = reordered.splice(idx, 1)
        reordered.splice(target, 0, moved)
        const orderMap = new Map(reordered.map((c, i) => [c.id, i]))
        set((state) => ({
          categories: state.categories.map((c) =>
            orderMap.has(c.id) ? { ...c, displayOrder: orderMap.get(c.id)! } : c
          ),
        }))
      },

      adjustVariantStock: ({
        storeId,
        productId,
        variantId,
        delta,
        reason,
        note,
        actor,
      }) => {
        const product = get().products.find((p) => p.id === productId)
        if (!product) return
        const variant = product.variants.find((v) => v.id === variantId)
        if (!variant) return
        const previousStock = variant.stock
        const newStock = Math.max(0, previousStock + delta)
        const logEntry: InventoryLog = {
          id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          storeId,
          productId,
          productNameAr: product.nameAr,
          productNameEn: product.nameEn,
          variantId,
          variantLabel: formatVariantLabel(variant),
          delta: newStock - previousStock,
          previousStock,
          newStock,
          reason,
          note,
          actor,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  variants: p.variants.map((v: CatalogVariant) =>
                    v.id === variantId
                      ? { ...v, stock: newStock, available: newStock > 0 }
                      : v
                  ),
                }
              : p
          ),
          inventoryLogs: [logEntry, ...state.inventoryLogs],
        }))
      },

      placeStorefrontOrder: (input) => {
        const now = new Date().toISOString()
        const store = get().stores.find((s) => s.id === input.storeId)
        const prefix = (store?.logoMonogram || "MT").toUpperCase()
        const num = 2042 + get().orders.length
        const orderNumber = `${prefix}-${num}`

        // Find or create store-scoped customer
        const existingCustomer = get().customers.find(
          (c) =>
            c.storeId === input.storeId &&
            (c.id === input.customerId ||
              c.email.toLowerCase() === input.customerEmail.toLowerCase() ||
              c.phone === input.customerPhone)
        )

        const customerId = existingCustomer?.id ?? `cust-${Date.now()}`

        const newOrder: StoreOrder = {
          id: `ord-${Date.now()}`,
          orderNumber,
          storeId: input.storeId,
          customerId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          shippingAddress: input.shippingAddress,
          shippingMethodId: input.shippingMethodId,
          shippingMethodNameAr: input.shippingMethodNameAr,
          shippingMethodNameEn: input.shippingMethodNameEn,
          paymentMethod: input.paymentMethod,
          paymentStatus: "pending",
          items: input.items,
          subtotal: input.subtotal,
          shippingFee: input.shippingFee,
          discountCode: input.discountCode,
          discountAmount: input.discountAmount,
          total: input.total,
          status: "pending",
          internalNotes: [],
          timeline: [
            {
              status: "pending",
              timestamp: now,
              noteAr: "تم استلام الطلب من المتجر الإلكتروني",
              noteEn: "Order placed via storefront checkout",
              actor: input.customerName,
            },
          ],
          createdAt: now,
        }

        // Deduct stock per variant + log inventory
        const newLogs: InventoryLog[] = []
        const updatedProducts = get().products.map((p) => {
          if (p.storeId !== input.storeId) return p
          const matchingItems = input.items.filter((i) => i.productId === p.id)
          if (matchingItems.length === 0) return p

          let addedSales = 0
          const updatedVariants = p.variants.map((v) => {
            const orderedQty = matchingItems
              .filter((i) => i.variantId === v.id)
              .reduce((sum, i) => sum + i.quantity, 0)
            if (orderedQty === 0) return v
            addedSales += orderedQty
            const nextStock = Math.max(0, v.stock - orderedQty)
            newLogs.push({
              id: `inv-${Date.now()}-${v.id}`,
              storeId: input.storeId,
              productId: p.id,
              productNameAr: p.nameAr,
              productNameEn: p.nameEn,
              variantId: v.id,
              variantLabel: formatVariantLabel(v),
              delta: -orderedQty,
              previousStock: v.stock,
              newStock: nextStock,
              reason: "order_placed",
              note: `Order #${orderNumber}`,
              actor: "Checkout",
              createdAt: now,
            })
            return { ...v, stock: nextStock, available: nextStock > 0 }
          })

          return {
            ...p,
            variants: updatedVariants,
            salesCount: p.salesCount + addedSales,
          }
        })

        // Update or insert customer
        const updatedCustomers = existingCustomer
          ? get().customers.map((c) => {
              if (c.id !== existingCustomer.id) return c
              const totalOrders = c.totalOrders + 1
              return {
                ...c,
                name: input.customerName,
                totalOrders,
                totalSpent: c.totalSpent + input.total,
                lastOrderAt: now,
                segment:
                  totalOrders >= 3
                    ? ("vip" as const)
                    : ("returning" as const),
              }
            })
          : [
              {
                id: customerId,
                storeId: input.storeId,
                name: input.customerName,
                email: input.customerEmail,
                phone: input.customerPhone,
                passwordDemo: "shop123",
                segment: "new" as const,
                addresses: [{ ...input.shippingAddress, id: `addr-${Date.now()}`, isDefault: true }],
                wishlistProductIds: [],
                totalOrders: 1,
                totalSpent: input.total,
                lastOrderAt: now,
                createdAt: now,
              },
              ...get().customers,
            ]

        // Increment discount usage
        const updatedDiscounts = input.discountCode
          ? get().discounts.map((d) =>
              d.storeId === input.storeId &&
              d.code.toUpperCase() === input.discountCode!.toUpperCase()
                ? { ...d, usedCount: d.usedCount + 1 }
                : d
            )
          : get().discounts

        set((state) => ({
          orders: [newOrder, ...state.orders],
          products: updatedProducts,
          customers: updatedCustomers,
          discounts: updatedDiscounts,
          inventoryLogs: [...newLogs, ...state.inventoryLogs],
          activityLogs: [
            {
              id: `act-${Date.now()}`,
              actor: store?.nameEn || "Storefront",
              actionAr: `طلب جديد #${orderNumber} بقيمة ${input.total} ج.م`,
              actionEn: `New order #${orderNumber} placed (${input.total} EGP)`,
              target: input.storeId,
              timestamp: now,
            },
            ...state.activityLogs,
          ],
        }))

        return newOrder
      },

      updateOrderStatus: (orderId, status, actor, note) => {
        const now = new Date().toISOString()
        const order = get().orders.find((o) => o.id === orderId)
        if (!order || order.status === status) return

        // Restore stock if cancelling an uncancelled order
        if (status === "cancelled" && order.status !== "cancelled") {
          for (const item of order.items) {
            get().adjustVariantStock({
              storeId: order.storeId,
              productId: item.productId,
              variantId: item.variantId,
              delta: item.quantity,
              reason: "order_cancelled",
              note: `Cancelled #${order.orderNumber}`,
              actor,
            })
          }
        }

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  paymentStatus:
                    status === "delivered"
                      ? "paid"
                      : status === "refunded"
                        ? "refunded"
                        : o.paymentStatus,
                  timeline: [
                    ...o.timeline,
                    {
                      status,
                      timestamp: now,
                      noteAr: note || `تم تحديث حالة الطلب إلى ${status}`,
                      noteEn: note || `Order status updated to ${status}`,
                      actor,
                    },
                  ],
                }
              : o
          ),
        }))
      },

      addOrderInternalNote: (orderId, text, author) => {
        const clean = text.trim()
        if (!clean) return
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  internalNotes: [
                    ...o.internalNotes,
                    {
                      id: `note-${Date.now()}`,
                      text: clean,
                      author,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : o
          ),
        }))
      },

      registerStoreCustomer: ({ storeId, name, email, phone, password }) => {
        const cleanEmail = email.trim().toLowerCase()
        const exists = get().customers.find(
          (c) => c.storeId === storeId && c.email.toLowerCase() === cleanEmail
        )
        if (exists) {
          return {
            ok: false,
            error: "An account with this email already exists in this store.",
          }
        }
        const customer: StoreCustomer = {
          id: `cust-${Date.now()}`,
          storeId,
          name: name.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          passwordDemo: password,
          segment: "new",
          addresses: [],
          wishlistProductIds: [],
          totalOrders: 0,
          totalSpent: 0,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ customers: [customer, ...state.customers] }))
        return { ok: true, customer }
      },

      updateCustomerProfile: (customerId, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId ? { ...c, ...updates } : c
          ),
        }))
      },

      toggleCustomerWishlist: (customerId, productId) => {
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c
            const has = c.wishlistProductIds.includes(productId)
            return {
              ...c,
              wishlistProductIds: has
                ? c.wishlistProductIds.filter((id) => id !== productId)
                : [...c.wishlistProductIds, productId],
            }
          }),
        }))
      },

      subscribeStoreNewsletter: (storeId, email) => {
        const clean = email.trim().toLowerCase()
        if (!clean) return
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId && !s.newsletterSubscribers.includes(clean)
              ? { ...s, newsletterSubscribers: [...s.newsletterSubscribers, clean] }
              : s
          ),
        }))
      },

      createDiscount: (discount) => {
        const created: DiscountCode = {
          ...discount,
          id: `disc-${Date.now()}`,
          code: discount.code.trim().toUpperCase(),
          usedCount: 0,
        }
        set((state) => ({ discounts: [created, ...state.discounts] }))
        return created
      },

      updateDiscount: (id, updates) => {
        set((state) => ({
          discounts: state.discounts.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }))
      },

      deleteDiscount: (id) => {
        set((state) => ({
          discounts: state.discounts.filter((d) => d.id !== id),
        }))
      },

      addStaffMember: (storeId, member) => {
        const created: StaffMember = {
          ...member,
          id: `stf-${Date.now()}`,
          joinedAt: new Date().toISOString().slice(0, 10),
        }
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId ? { ...s, staff: [...s.staff, created] } : s
          ),
        }))
      },

      updateStaffRole: (storeId, staffId, role) => {
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId
              ? {
                  ...s,
                  staff: s.staff.map((m) =>
                    m.id === staffId ? { ...m, role } : m
                  ),
                }
              : s
          ),
        }))
      },

      removeStaffMember: (storeId, staffId) => {
        set((state) => ({
          stores: state.stores.map((s) =>
            s.id === storeId
              ? { ...s, staff: s.staff.filter((m) => m.id !== staffId) }
              : s
          ),
        }))
      },

      updateMerchantStatus: (merchantId, status) => {
        const now = new Date().toISOString()
        set((state) => ({
          merchants: state.merchants.map((m) =>
            m.id === merchantId ? { ...m, status } : m
          ),
          activityLogs: [
            {
              id: `act-${Date.now()}`,
              actor: "Super Admin",
              actionAr: `تحديث حالة حساب التاجر إلى ${status}`,
              actionEn: `Updated merchant account status to ${status}`,
              target: merchantId,
              timestamp: now,
            },
            ...state.activityLogs,
          ],
        }))
      },

      updateMerchantPlan: (merchantId, planId) => {
        const plan = get().plans.find((p) => p.id === planId)
        set((state) => ({
          merchants: state.merchants.map((m) =>
            m.id === merchantId ? { ...m, planId } : m
          ),
          stores: state.stores.map((s) =>
            s.merchantId === merchantId ? { ...s, planId } : s
          ),
          subscriptions: state.subscriptions.map((sub) =>
            sub.merchantId === merchantId && plan
              ? {
                  ...sub,
                  planId,
                  planName: plan.nameEn,
                  amount:
                    sub.billingPeriod === "yearly"
                      ? plan.yearlyPrice
                      : plan.monthlyPrice,
                  status: "active",
                }
              : sub
          ),
        }))
      },

      createPlan: (plan) => {
        set((state) => ({
          plans: [...state.plans, { ...plan, id: `plan-${Date.now()}` }],
        }))
      },

      updatePlan: (planId, updates) => {
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId ? { ...p, ...updates } : p
          ),
        }))
      },

      updateTicketStatus: (ticketId, status, reply) => {
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status,
                  messages: reply?.trim()
                    ? [
                        ...t.messages,
                        {
                          sender: "admin",
                          text: reply.trim(),
                          timestamp: new Date().toISOString(),
                        },
                      ]
                    : t.messages,
                }
              : t
          ),
        }))
      },

      publishAnnouncement: (ann) => {
        set((state) => ({
          announcements: [
            {
              ...ann,
              id: `ann-${Date.now()}`,
              publishedAt: new Date().toISOString(),
            },
            ...state.announcements,
          ],
        }))
      },

      updatePlatformSettings: (updates) => {
        set((state) => ({
          platformSettings: { ...state.platformSettings, ...updates },
        }))
      },
    }),
    {
      name: "matgarak-saas-platform-v2",
    }
  )
)
