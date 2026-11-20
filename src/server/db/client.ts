import type {
  User,
  Store,
  Product,
  Customer,
  Order,
  Session,
  OtpCode,
  ProductStatus,
  DashboardStats,
  ProductVariant,
  OrderItem,
  OrderStatusHistoryEntry,
  Category,
  Discount,
  StaffMember,
  InventoryLogEntry,
} from "@/types/domain"
import { supabaseAdmin } from "@/server/db/supabase"

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export function computeProductStockAndStatus(variants: ProductVariant[]): {
  stock: number
  status: ProductStatus
} {
  const totalStock = variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0)
  let status: ProductStatus = "نشط"
  if (totalStock === 0) {
    status = "نفذ المخزون"
  } else if (totalStock < 5) {
    status = "مخزون منخفض"
  }
  return { stock: totalStock, status }
}

// ─────────────────────────────────────────────
// Row → Domain mappers
// ─────────────────────────────────────────────

function rowToUser(r: Record<string, unknown>): User {
  return {
    id: r.id as string,
    phone: (r.phone as string) || "",
    email: (r.email as string) || undefined,
    passwordHash: (r.password_hash as string) || undefined,
    name: (r.name as string) || undefined,
    role: (r.role as string) || "merchant",
    createdAt: (r.created_at as string) || new Date().toISOString(),
  }
}

function rowToStore(r: Record<string, unknown>): Store {
  return {
    id: r.id as string,
    ownerId: r.owner_id as string,
    name: r.name as string,
    slug: r.slug as string,
    slogan: (r.slogan as string) || undefined,
    phone: (r.phone as string) || "",
    whatsapp: (r.whatsapp as string) || "",
    deliveryType: (r.delivery_type as "flat" | "by_city") || "flat",
    flatFee: typeof r.flat_fee === "number" ? r.flat_fee : 40,
    freeAbove: (r.free_above as number) ?? null,
    cityFees: (r.city_fees as Record<string, number>) || undefined,
    themeColor: (r.theme_color as string) || "#E8732A",
    logoUrl: (r.logo_url as string) || undefined,
    orderSeq: typeof r.order_seq === "number" ? r.order_seq : 1000,
    plan: (r.plan as "free" | "pro") || "free",
    themeConfig: (r.theme_config as Record<string, unknown>) || undefined,
    sectionsConfig: (r.sections_config as unknown[]) || undefined,
    paymentConfig: (r.payment_config as Record<string, unknown>) || undefined,
    currency: (r.currency as string) || "EGP",
    primaryLocale: (r.primary_locale as string) || "ar",
    status: (r.status as string) || "published",
    createdAt: (r.created_at as string) || new Date().toISOString(),
  }
}

function rowToCategory(r: Record<string, unknown>): Category {
  return {
    id: r.id as string,
    storeId: r.store_id as string,
    nameAr: r.name_ar as string,
    nameEn: (r.name_en as string) || undefined,
    slug: r.slug as string,
    description: (r.description as string) || undefined,
    displayOrder: (r.display_order as number) || 0,
    isActive: r.is_active !== false,
    createdAt: (r.created_at as string) || new Date().toISOString(),
  }
}

function rowToDiscount(r: Record<string, unknown>): Discount {
  return {
    id: r.id as string,
    storeId: r.store_id as string,
    code: r.code as string,
    type: r.type as "percentage" | "fixed" | "free_shipping",
    value: r.value as number,
    minOrderValue: (r.min_order_value as number) || 0,
    maxDiscount: (r.max_discount as number) || undefined,
    usageLimit: (r.usage_limit as number) || undefined,
    usedCount: (r.used_count as number) || 0,
    expiresAt: (r.expires_at as string) || undefined,
    isActive: r.is_active !== false,
    createdAt: (r.created_at as string) || new Date().toISOString(),
  }
}

function rowToStaff(r: Record<string, unknown>): StaffMember {
  return {
    id: r.id as string,
    storeId: r.store_id as string,
    userId: (r.user_id as string) || undefined,
    name: r.name as string,
    email: r.email as string,
    role: (r.role as "owner" | "manager" | "staff") || "staff",
    status: (r.status as "active" | "invited") || "active",
    createdAt: (r.created_at as string) || new Date().toISOString(),
  }
}

function rowToInventoryLog(r: Record<string, unknown>): InventoryLogEntry {
  return {
    id: r.id as string,
    storeId: r.store_id as string,
    productId: r.product_id as string,
    variantId: (r.variant_id as string) || undefined,
    changeQty: r.change_qty as number,
    newStock: r.new_stock as number,
    reason: r.reason as string,
    actor: (r.actor as string) || undefined,
    createdAt: (r.created_at as string) || new Date().toISOString(),
  }
}

function rowToProduct(
  r: Record<string, unknown>,
  variants: ProductVariant[]
): Product {
  return {
    id: r.id as string,
    storeId: r.store_id as string,
    name: r.name as string,
    price: r.price as number,
    category: r.category as string,
    description: (r.description as string) || undefined,
    image: (r.image as string) || undefined,
    variants,
    stock: r.stock as number,
    status: r.status as ProductStatus,
    createdAt: r.created_at as string,
  }
}

function rowToVariant(r: Record<string, unknown>): ProductVariant {
  return {
    id: r.id as string,
    size: r.size as string,
    color: r.color as string,
    stock: r.stock as number,
  }
}

function rowToCustomer(r: Record<string, unknown>): Customer {
  return {
    id: r.id as string,
    storeId: r.store_id as string,
    name: r.name as string,
    phone: r.phone as string,
    city: r.city as string,
    totalOrders: r.total_orders as number,
    totalSpent: r.total_spent as number,
    lastOrder: (r.last_order as string) || "",
    tag: r.tag as string,
    createdAt: r.created_at as string,
  }
}

function rowToOrderItem(r: Record<string, unknown>): OrderItem {
  return {
    id: r.id as string,
    productId: r.product_id as string,
    variantId: (r.variant_id as string) || undefined,
    name: r.name_snapshot as string,
    price: r.unit_price as number,
    size: r.size as string,
    color: r.color as string,
    quantity: r.quantity as number,
  }
}

function rowToStatusHistory(
  r: Record<string, unknown>
): OrderStatusHistoryEntry {
  return {
    status: r.status as OrderStatusHistoryEntry["status"],
    timestamp: r.created_at as string,
    note: (r.note as string) || undefined,
  }
}

// ─────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null
  return rowToUser(data)
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("phone", phone)
    .maybeSingle()

  if (error || !data) return null
  return rowToUser(data)
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const clean = email.toLowerCase().trim()
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", clean)
    .maybeSingle()

  if (error || !data) return null
  return rowToUser(data)
}

export async function createUserWithEmail(input: {
  email: string
  passwordHash: string
  name?: string
  phone?: string
  role?: string
}): Promise<User> {
  const cleanEmail = input.email.toLowerCase().trim()
  const payload: Record<string, unknown> = {
    email: cleanEmail,
    password_hash: input.passwordHash,
    name: input.name || null,
    phone: input.phone || `temp-${Date.now()}`,
    role: input.role || "merchant",
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert(payload)
    .select()
    .single()

  if (error) {
    // If the database has not executed migration 0002 yet, fall back gracefully
    const fallbackPhone = input.phone || `010${Date.now().toString().slice(-8)}`
    const { data: fbData, error: fbErr } = await supabaseAdmin
      .from("users")
      .upsert({ phone: fallbackPhone }, { onConflict: "phone" })
      .select()
      .single()

    if (fbErr) throw new Error(`Failed to create user: ${error.message || fbErr.message}`)
    return rowToUser({ ...fbData, email: cleanEmail, name: input.name })
  }

  return rowToUser(data)
}

export async function updateUserPassword(
  userId: string,
  passwordHash: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", userId)
  return !error
}

export async function createUser(phone: string): Promise<User> {
  // Upsert to handle race conditions
  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert({ phone }, { onConflict: "phone" })
    .select()
    .single()

  if (error) throw new Error(`Failed to create user: ${error.message}`)
  return rowToUser(data)
}

// ─────────────────────────────────────────────
// Stores
// ─────────────────────────────────────────────

export async function getStoreById(id: string): Promise<Store | null> {
  const { data, error } = await supabaseAdmin
    .from("stores")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null
  return rowToStore(data)
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const clean = slug.toLowerCase().trim()
  const { data, error } = await supabaseAdmin
    .from("stores")
    .select("*")
    .eq("slug", clean)
    .maybeSingle()

  if (error || !data) return null
  return rowToStore(data)
}

export async function getStoreByOwnerId(
  ownerId: string
): Promise<Store | null> {
  const { data, error } = await supabaseAdmin
    .from("stores")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle()

  if (error || !data) return null
  return rowToStore(data)
}

export async function createStore(
  storeData: Omit<Store, "id" | "createdAt" | "orderSeq">
): Promise<Store> {
  const { data, error } = await supabaseAdmin
    .from("stores")
    .insert({
      owner_id: storeData.ownerId,
      name: storeData.name,
      slug: storeData.slug,
      slogan: storeData.slogan || null,
      phone: storeData.phone,
      whatsapp: storeData.whatsapp,
      delivery_type: storeData.deliveryType,
      flat_fee: storeData.flatFee,
      free_above: storeData.freeAbove,
      city_fees: storeData.cityFees || {},
      theme_color: storeData.themeColor,
      logo_url: storeData.logoUrl || null,
      plan: storeData.plan,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create store: ${error.message}`)
  return rowToStore(data)
}

export async function updateStore(
  id: string,
  updates: Partial<Store>
): Promise<Store | null> {
  // Map camelCase to snake_case
  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug
  if (updates.slogan !== undefined) dbUpdates.slogan = updates.slogan
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone
  if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp
  if (updates.deliveryType !== undefined)
    dbUpdates.delivery_type = updates.deliveryType
  if (updates.flatFee !== undefined) dbUpdates.flat_fee = updates.flatFee
  if (updates.freeAbove !== undefined) dbUpdates.free_above = updates.freeAbove
  if (updates.cityFees !== undefined) dbUpdates.city_fees = updates.cityFees
  if (updates.themeColor !== undefined)
    dbUpdates.theme_color = updates.themeColor
  if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl
  if (updates.orderSeq !== undefined) dbUpdates.order_seq = updates.orderSeq
  if (updates.plan !== undefined) dbUpdates.plan = updates.plan
  if (updates.themeConfig !== undefined)
    dbUpdates.theme_config = updates.themeConfig
  if (updates.sectionsConfig !== undefined)
    dbUpdates.sections_config = updates.sectionsConfig
  if (updates.paymentConfig !== undefined)
    dbUpdates.payment_config = updates.paymentConfig
  if (updates.currency !== undefined) dbUpdates.currency = updates.currency
  if (updates.primaryLocale !== undefined)
    dbUpdates.primary_locale = updates.primaryLocale
  if (updates.status !== undefined) dbUpdates.status = updates.status

  const { data, error } = await supabaseAdmin
    .from("stores")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error || !data) return null
  return rowToStore(data)
}

// ─────────────────────────────────────────────
// Products (with variants)
// ─────────────────────────────────────────────

async function fetchVariantsForProduct(
  productId: string
): Promise<ProductVariant[]> {
  const { data } = await supabaseAdmin
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)

  return (data || []).map(rowToVariant)
}

async function fetchVariantsForProducts(
  productIds: string[]
): Promise<Map<string, ProductVariant[]>> {
  if (productIds.length === 0) return new Map()

  const { data } = await supabaseAdmin
    .from("product_variants")
    .select("*")
    .in("product_id", productIds)

  const map = new Map<string, ProductVariant[]>()
  for (const row of data || []) {
    const pid = row.product_id as string
    if (!map.has(pid)) map.set(pid, [])
    map.get(pid)!.push(rowToVariant(row))
  }
  return map
}

export async function getProductsByStore(
  storeId: string
): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("store_id", storeId)

  if (error || !data) return []

  const productIds = data.map((p) => p.id as string)
  const variantsMap = await fetchVariantsForProducts(productIds)

  return data.map((row) =>
    rowToProduct(row, variantsMap.get(row.id as string) || [])
  )
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null

  const variants = await fetchVariantsForProduct(id)
  return rowToProduct(data, variants)
}

export async function createProduct(
  productData: Omit<Product, "id" | "createdAt" | "stock" | "status">
): Promise<Product> {
  const { stock, status } = computeProductStockAndStatus(productData.variants)

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert({
      store_id: productData.storeId,
      name: productData.name,
      price: productData.price,
      category: productData.category,
      description: productData.description || null,
      image: productData.image || null,
      stock,
      status,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create product: ${error.message}`)

  // Insert variants with explicit error check
  const productId = data.id as string
  if (productData.variants.length > 0) {
    const variantRows = productData.variants.map((v) => ({
      product_id: productId,
      size: v.size,
      color: v.color,
      stock: v.stock,
    }))

    const { error: varError } = await supabaseAdmin
      .from("product_variants")
      .insert(variantRows)
    if (varError) {
      await supabaseAdmin.from("products").delete().eq("id", productId)
      throw new Error(`Failed to create product variants: ${varError.message}`)
    }
  }

  const variants = await fetchVariantsForProduct(productId)
  return rowToProduct(data, variants)
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  // First get current product to compute stock
  const current = await getProductById(id)
  if (!current) return null

  const variants = updates.variants ?? current.variants
  const { stock, status } = computeProductStockAndStatus(variants)

  const dbUpdates: Record<string, unknown> = { stock, status }
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.price !== undefined) dbUpdates.price = updates.price
  if (updates.category !== undefined) dbUpdates.category = updates.category
  if (updates.description !== undefined)
    dbUpdates.description = updates.description
  if (updates.image !== undefined) dbUpdates.image = updates.image

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error || !data) return null

  // Preserve existing variant UUIDs so historical order_items.variant_id references stay intact
  if (updates.variants) {
    const existingIds = new Set(current.variants.map((v) => v.id))
    const retainedIds = new Set<string>()

    for (const v of updates.variants) {
      if (v.id && existingIds.has(v.id)) {
        retainedIds.add(v.id)
        const { error: updErr } = await supabaseAdmin
          .from("product_variants")
          .update({ size: v.size, color: v.color, stock: v.stock })
          .eq("id", v.id)
        if (updErr) {
          throw new Error(`Failed to update variant: ${updErr.message}`)
        }
      } else {
        const { error: insErr } = await supabaseAdmin
          .from("product_variants")
          .insert({
            product_id: id,
            size: v.size,
            color: v.color,
            stock: v.stock,
          })
        if (insErr) {
          throw new Error(`Failed to insert variant: ${insErr.message}`)
        }
      }
    }

    const removedIds = current.variants
      .map((v) => v.id)
      .filter((vid) => !retainedIds.has(vid))

    if (removedIds.length > 0) {
      const { error: delErr } = await supabaseAdmin
        .from("product_variants")
        .delete()
        .in("id", removedIds)
      if (delErr) {
        throw new Error(`Failed to remove old variants: ${delErr.message}`)
      }
    }
  }

  const newVariants = await fetchVariantsForProduct(id)
  return rowToProduct(data, newVariants)
}

export async function deleteProduct(id: string): Promise<boolean> {
  // Variants are cascade deleted
  const { error } = await supabaseAdmin.from("products").delete().eq("id", id)
  return !error
}

// ─────────────────────────────────────────────
// Orders (with items + status history)
// ─────────────────────────────────────────────

async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data } = await supabaseAdmin
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)

  return (data || []).map(rowToOrderItem)
}

async function fetchOrderItemsBatch(
  orderIds: string[]
): Promise<Map<string, OrderItem[]>> {
  if (orderIds.length === 0) return new Map()

  const { data } = await supabaseAdmin
    .from("order_items")
    .select("*")
    .in("order_id", orderIds)

  const map = new Map<string, OrderItem[]>()
  for (const row of data || []) {
    const oid = row.order_id as string
    if (!map.has(oid)) map.set(oid, [])
    map.get(oid)!.push(rowToOrderItem(row))
  }
  return map
}

async function fetchStatusHistoryBatch(
  orderIds: string[]
): Promise<Map<string, OrderStatusHistoryEntry[]>> {
  if (orderIds.length === 0) return new Map()

  const { data } = await supabaseAdmin
    .from("order_status_history")
    .select("*")
    .in("order_id", orderIds)
    .order("created_at", { ascending: true })

  const map = new Map<string, OrderStatusHistoryEntry[]>()
  for (const row of data || []) {
    const oid = row.order_id as string
    if (!map.has(oid)) map.set(oid, [])
    map.get(oid)!.push(rowToStatusHistory(row))
  }
  return map
}

async function fetchStatusHistory(
  orderId: string
): Promise<OrderStatusHistoryEntry[]> {
  const { data } = await supabaseAdmin
    .from("order_status_history")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })

  return (data || []).map(rowToStatusHistory)
}

function rowToOrder(
  r: Record<string, unknown>,
  items: OrderItem[],
  statusHistory: OrderStatusHistoryEntry[]
): Order {
  return {
    id: r.id as string,
    orderNumber: r.order_number as string,
    storeId: r.store_id as string,
    customerId: r.customer_id as string,
    customerName: r.customer_name as string,
    customerPhone: r.customer_phone as string,
    customerCity: r.customer_city as string,
    customerAddress: r.customer_address as string,
    customerNotes: (r.customer_notes as string) || undefined,
    items,
    subtotal: r.subtotal as number,
    deliveryFee: r.delivery_fee as number,
    total: r.total as number,
    status: r.status as Order["status"],
    statusHistory,
    createdAt: r.created_at as string,
  }
}

export async function getOrdersByStore(storeId: string): Promise<Order[]> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("store_id", storeId)
    .order("order_number", { ascending: false })

  if (error || !data) return []

  const orderIds = data.map((o) => o.id as string)
  const [itemsMap, historyMap] = await Promise.all([
    fetchOrderItemsBatch(orderIds),
    fetchStatusHistoryBatch(orderIds),
  ])

  return data.map((row) =>
    rowToOrder(
      row,
      itemsMap.get(row.id as string) || [],
      historyMap.get(row.id as string) || []
    )
  )
}

export async function getOrderById(id: string): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null

  const [items, statusHistory] = await Promise.all([
    fetchOrderItems(id),
    fetchStatusHistory(id),
  ])

  return rowToOrder(data, items, statusHistory)
}

// ─────────────────────────────────────────────
// Customers
// ─────────────────────────────────────────────

export async function getCustomersByStore(
  storeId: string
): Promise<Customer[]> {
  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("store_id", storeId)

  if (error || !data) return []
  return data.map(rowToCustomer)
}

// ─────────────────────────────────────────────
// Sessions (OTP / Auth)
// ─────────────────────────────────────────────

export async function getSessionById(
  sessionId: string
): Promise<Session | null> {
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .gt("expires_at", Date.now())
    .maybeSingle()

  if (error || !data) return null
  return {
    id: data.id as string,
    userId: data.user_id as string,
    storeId: data.store_id as string,
    expiresAt: data.expires_at as number,
  }
}

export async function createSession(session: Session): Promise<void> {
  // Clean up expired sessions first
  await supabaseAdmin
    .from("sessions")
    .delete()
    .lt("expires_at", Date.now())

  const { error } = await supabaseAdmin.from("sessions").insert({
    id: session.id,
    user_id: session.userId,
    store_id: session.storeId,
    expires_at: session.expiresAt,
  })
  if (error) throw new Error(`Failed to create session: ${error.message}`)
}

export async function deleteSession(sessionId: string): Promise<void> {
  await supabaseAdmin.from("sessions").delete().eq("id", sessionId)
}

// ─────────────────────────────────────────────
// OTP Codes
// ─────────────────────────────────────────────

export async function createOtpCode(otp: OtpCode): Promise<void> {
  // Invalidate existing unused codes for this phone
  await supabaseAdmin
    .from("otp_codes")
    .update({ used: true })
    .eq("phone", otp.phone)
    .eq("used", false)

  const { error } = await supabaseAdmin.from("otp_codes").insert({
    phone: otp.phone,
    code_hash: otp.codeHash,
    attempts: otp.attempts,
    expires_at: otp.expiresAt,
    used: false,
  })
  if (error) throw new Error(`Failed to create OTP code: ${error.message}`)
}

export async function getLatestActiveOtp(
  phone: string
): Promise<OtpCode | null> {
  const { data, error } = await supabaseAdmin
    .from("otp_codes")
    .select("*")
    .eq("phone", phone)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return {
    id: data.id as string,
    phone: data.phone as string,
    codeHash: data.code_hash as string,
    attempts: data.attempts as number,
    expiresAt: data.expires_at as number,
    used: data.used as boolean,
  }
}

export async function updateOtpCode(
  id: string,
  updates: Partial<{ attempts: number; used: boolean }>
): Promise<void> {
  await supabaseAdmin.from("otp_codes").update(updates).eq("id", id)
}

// ─────────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────────

export async function getDashboardStats(
  storeId: string
): Promise<DashboardStats> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayISO = todayStart.toISOString()

  // Parallel queries (single today-orders query returning status + total + count)
  const [todayOrdersRes, newOrdersRes, productsRes, lowStockRes, customersRes] =
    await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("total, status", { count: "exact" })
        .eq("store_id", storeId)
        .gte("created_at", todayISO),
      supabaseAdmin
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("status", "جديد"),
      supabaseAdmin
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId),
      supabaseAdmin
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId)
        .or("status.eq.مخزون منخفض,status.eq.نفذ المخزون"),
      supabaseAdmin
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId),
    ])

  const todaySales = (todayOrdersRes.data || [])
    .filter((o) => o.status !== "ملغي")
    .reduce((sum, o) => sum + ((o.total as number) || 0), 0)

  return {
    todaySales,
    todayOrdersCount: todayOrdersRes.count || 0,
    newOrdersCount: newOrdersRes.count || 0,
    totalProductsCount: productsRes.count || 0,
    lowStockProductsCount: lowStockRes.count || 0,
    totalCustomersCount: customersRes.count || 0,
  }
}

// ─────────────────────────────────────────────
// Audit Logs
// ─────────────────────────────────────────────

export async function addAuditLog(
  storeId: string,
  action: string,
  details: string
): Promise<void> {
  await supabaseAdmin.from("audit_logs").insert({
    store_id: storeId,
    action,
    details,
  })
}

// ─────────────────────────────────────────────
// Transaction-like operations for orders
// ─────────────────────────────────────────────

/**
 * Places a new order with full inventory management.
 * Since Supabase doesn't support true transactions via REST,
 * we use careful sequential operations with validation.
 */
export async function placeOrderTransaction(input: {
  storeSlug: string
  customerName: string
  customerPhone: string
  customerCity: string
  customerAddress: string
  customerNotes?: string
  items: {
    productId: string
    variantId?: string
    size: string
    color: string
    quantity: number
  }[]
}): Promise<
  | { ok: false; error: string }
  | {
      ok: true
      orderNumber: string
      subtotal: number
      deliveryFee: number
      total: number
    }
> {
  // 1. Get store
  const store = await getStoreBySlug(input.storeSlug)
  if (!store) {
    return { ok: false, error: "المتجر المطلوب غير موجود" }
  }

  // 2A. Validate ALL cart items first (including aggregated quantities per variant)
  let subtotal = 0
  const productCache = new Map<string, Product>()
  const requestedByVariant = new Map<string, number>()
  const variantMeta = new Map<
    string,
    { product: Product; variant: ProductVariant }
  >()
  const orderItems: {
    product_id: string
    variant_id: string
    name_snapshot: string
    unit_price: number
    size: string
    color: string
    quantity: number
  }[] = []

  for (const cartItem of input.items) {
    let product = productCache.get(cartItem.productId)
    if (!product) {
      const fetched = await getProductById(cartItem.productId)
      if (!fetched || fetched.storeId !== store.id) {
        return {
          ok: false,
          error: "أحد المنتجات الموجودة في السلة غير متوفر حالياً.",
        }
      }
      product = fetched
      productCache.set(cartItem.productId, product)
    }

    const variant = product.variants.find(
      (v) =>
        (cartItem.variantId && v.id === cartItem.variantId) ||
        (v.size === cartItem.size && v.color === cartItem.color)
    )

    if (!variant) {
      return {
        ok: false,
        error: `المقاس ${cartItem.size} أو اللون ${cartItem.color} للمنتج "${product.name}" غير متوفر.`,
      }
    }

    const totalRequested =
      (requestedByVariant.get(variant.id) ?? 0) + cartItem.quantity
    if (variant.stock < totalRequested) {
      return {
        ok: false,
        error: `عذراً، الكمية المتوفرة في المخزن من "${product.name}" (${cartItem.size} - ${cartItem.color}) هي ${variant.stock} قطعة فقط.`,
      }
    }

    requestedByVariant.set(variant.id, totalRequested)
    variantMeta.set(variant.id, { product, variant })

    subtotal += product.price * cartItem.quantity

    orderItems.push({
      product_id: product.id,
      variant_id: variant.id,
      name_snapshot: product.name,
      unit_price: product.price,
      size: cartItem.size,
      color: cartItem.color,
      quantity: cartItem.quantity,
    })
  }

  // 2B. Deduct variant stock with rollback snapshots in case a downstream insert fails
  const deductedSnapshots: {
    variantId: string
    productId: string
    previousStock: number
  }[] = []
  const affectedProductIds = new Set<string>()

  const rollbackStock = async () => {
    for (const snap of deductedSnapshots) {
      await supabaseAdmin
        .from("product_variants")
        .update({ stock: snap.previousStock })
        .eq("id", snap.variantId)
    }
    for (const pid of affectedProductIds) {
      const prod = await getProductById(pid)
      if (prod) {
        const { stock, status } = computeProductStockAndStatus(prod.variants)
        await supabaseAdmin
          .from("products")
          .update({ stock, status })
          .eq("id", pid)
      }
    }
  }

  try {
    for (const [variantId, qty] of requestedByVariant.entries()) {
      const meta = variantMeta.get(variantId)!
      const newVariantStock = meta.variant.stock - qty
      const { error: stockErr } = await supabaseAdmin
        .from("product_variants")
        .update({ stock: newVariantStock })
        .eq("id", variantId)
      if (stockErr) {
        throw new Error(`Failed to deduct variant stock: ${stockErr.message}`)
      }
      deductedSnapshots.push({
        variantId,
        productId: meta.product.id,
        previousStock: meta.variant.stock,
      })
      affectedProductIds.add(meta.product.id)
    }

    for (const pid of affectedProductIds) {
      const freshProduct = await getProductById(pid)
      if (freshProduct) {
        const { stock, status } = computeProductStockAndStatus(
          freshProduct.variants
        )
        const { error: prodErr } = await supabaseAdmin
          .from("products")
          .update({ stock, status })
          .eq("id", pid)
        if (prodErr) {
          throw new Error(`Failed to update product stock: ${prodErr.message}`)
        }
      }
    }

    // 3. Compute delivery fee
    let deliveryFee = store.flatFee
    if (store.freeAbove !== null && subtotal >= store.freeAbove) {
      deliveryFee = 0
    } else if (store.deliveryType === "by_city" && store.cityFees) {
      deliveryFee = store.cityFees[input.customerCity] ?? store.flatFee
    }

    const grandTotal = subtotal + deliveryFee

    // 4. Increment order sequence
    const newSeq = (store.orderSeq || 1000) + 1
    const seqUpdated = await updateStore(store.id, { orderSeq: newSeq })
    if (!seqUpdated) {
      throw new Error("Failed to increment store order sequence")
    }
    const orderNumber = String(newSeq)

    // 5. Upsert customer
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("store_id", store.id)
      .eq("phone", input.customerPhone)
      .maybeSingle()

    let customerId: string

    if (existingCustomer) {
      customerId = existingCustomer.id as string
      const totalOrders = (existingCustomer.total_orders as number) + 1
      const totalSpent = (existingCustomer.total_spent as number) + grandTotal
      const { error: custUpdErr } = await supabaseAdmin
        .from("customers")
        .update({
          name: input.customerName,
          city: input.customerCity,
          total_orders: totalOrders,
          total_spent: totalSpent,
          last_order: "اليوم",
          tag: totalOrders >= 3 ? "عميل مميز ⭐" : existingCustomer.tag,
        })
        .eq("id", customerId)
      if (custUpdErr) {
        throw new Error(`Failed to update customer: ${custUpdErr.message}`)
      }
    } else {
      const { data: newCustomer, error } = await supabaseAdmin
        .from("customers")
        .insert({
          store_id: store.id,
          name: input.customerName,
          phone: input.customerPhone,
          city: input.customerCity,
          total_orders: 1,
          total_spent: grandTotal,
          last_order: "اليوم",
          tag: "جديد",
        })
        .select()
        .single()

      if (error) throw new Error(`Failed to create customer: ${error.message}`)
      customerId = newCustomer.id as string
    }

    // 6. Create order
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        store_id: store.id,
        customer_id: customerId,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        customer_city: input.customerCity,
        customer_address: input.customerAddress,
        customer_notes: input.customerNotes || null,
        subtotal,
        delivery_fee: deliveryFee,
        total: grandTotal,
        status: "جديد",
      })
      .select()
      .single()

    if (orderError)
      throw new Error(`Failed to create order: ${orderError.message}`)

    const orderId = orderData.id as string

    // 7. Insert order items
    const itemRows = orderItems.map((item) => ({
      order_id: orderId,
      ...item,
    }))
    const { error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(itemRows)
    if (itemsErr) {
      await supabaseAdmin.from("orders").delete().eq("id", orderId)
      throw new Error(`Failed to insert order items: ${itemsErr.message}`)
    }

    // 8. Insert initial status history
    const { error: histErr } = await supabaseAdmin
      .from("order_status_history")
      .insert({
        order_id: orderId,
        status: "جديد",
        note: "تم استلام الطلب بنجاح عبر المتجر",
      })
    if (histErr) {
      console.error("[placeOrderTransaction] Failed to insert status history:", histErr.message)
    }

    return {
      ok: true,
      orderNumber,
      subtotal,
      deliveryFee,
      total: grandTotal,
    }
  } catch (err) {
    await rollbackStock()
    console.error("[placeOrderTransaction] Transaction failed & rolled back:", err)
    return {
      ok: false,
      error: "تعذر إتمام الطلب حالياً وتمت استعادة المخزون تلقائياً. يرجى المحاولة مرة أخرى.",
    }
  }
}

/**
 * Updates an order's status with inventory management for cancellation/un-cancellation.
 */
export async function updateOrderStatusTransaction(
  orderId: string,
  storeId: string,
  newStatus: Order["status"],
  note?: string
): Promise<Order | null> {
  const order = await getOrderById(orderId)
  if (!order || order.storeId !== storeId) return null
  if (order.status === newStatus) return order

  const previousStatus = order.status

  // Inventory management on cancellation
  if (newStatus === "ملغي" && previousStatus !== "ملغي") {
    // Restore stock
    for (const item of order.items) {
      if (item.variantId) {
        const { data: variant } = await supabaseAdmin
          .from("product_variants")
          .select("*")
          .eq("id", item.variantId)
          .maybeSingle()

        if (variant) {
          await supabaseAdmin
            .from("product_variants")
            .update({ stock: (variant.stock as number) + item.quantity })
            .eq("id", item.variantId)
        }
      }

      // Recompute product stock
      const product = await getProductById(item.productId)
      if (product) {
        const { stock, status } = computeProductStockAndStatus(product.variants)
        await supabaseAdmin
          .from("products")
          .update({ stock, status })
          .eq("id", product.id)
      }
    }
  } else if (previousStatus === "ملغي" && newStatus !== "ملغي") {
    // Re-deduct stock
    for (const item of order.items) {
      if (item.variantId) {
        const { data: variant } = await supabaseAdmin
          .from("product_variants")
          .select("*")
          .eq("id", item.variantId)
          .maybeSingle()

        if (variant) {
          const newStock = Math.max(
            0,
            (variant.stock as number) - item.quantity
          )
          await supabaseAdmin
            .from("product_variants")
            .update({ stock: newStock })
            .eq("id", item.variantId)
        }
      }

      const product = await getProductById(item.productId)
      if (product) {
        const { stock, status } = computeProductStockAndStatus(product.variants)
        await supabaseAdmin
          .from("products")
          .update({ stock, status })
          .eq("id", product.id)
      }
    }
  }

  // Update order status
  const { error: statusUpdErr } = await supabaseAdmin
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId)
  if (statusUpdErr) {
    throw new Error(`Failed to update order status: ${statusUpdErr.message}`)
  }

  // Add status history
  const { error: histErr } = await supabaseAdmin
    .from("order_status_history")
    .insert({
      order_id: orderId,
      status: newStatus,
      note: note || null,
    })
  if (histErr) {
    console.error("[updateOrderStatusTransaction] Failed to record history:", histErr.message)
  }

  return getOrderById(orderId)
}

// ─────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────

export async function getCategoriesByStore(
  storeId: string
): Promise<Category[]> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("store_id", storeId)
    .order("display_order", { ascending: true })

  if (error || !data) return []
  return data.map(rowToCategory)
}

export async function createCategory(
  categoryData: Omit<Category, "id" | "createdAt">
): Promise<Category> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert({
      store_id: categoryData.storeId,
      name_ar: categoryData.nameAr,
      name_en: categoryData.nameEn || null,
      slug: categoryData.slug,
      description: categoryData.description || null,
      display_order: categoryData.displayOrder || 0,
      is_active: categoryData.isActive,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create category: ${error.message}`)
  return rowToCategory(data)
}

export async function updateCategory(
  storeId: string,
  id: string,
  updates: Partial<Category>
): Promise<Category | null> {
  const dbUpdates: Record<string, unknown> = {}
  if (updates.nameAr !== undefined) dbUpdates.name_ar = updates.nameAr
  if (updates.nameEn !== undefined) dbUpdates.name_en = updates.nameEn
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug
  if (updates.description !== undefined)
    dbUpdates.description = updates.description
  if (updates.displayOrder !== undefined)
    dbUpdates.display_order = updates.displayOrder
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

  const { data, error } = await supabaseAdmin
    .from("categories")
    .update(dbUpdates)
    .eq("store_id", storeId)
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error || !data) return null
  return rowToCategory(data)
}

export async function deleteCategory(
  storeId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("store_id", storeId)
    .eq("id", id)
  return !error
}

// ─────────────────────────────────────────────
// Discounts
// ─────────────────────────────────────────────

export async function getDiscountsByStore(
  storeId: string
): Promise<Discount[]> {
  const { data, error } = await supabaseAdmin
    .from("discounts")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })

  if (error || !data) return []
  return data.map(rowToDiscount)
}

export async function createDiscount(
  discountData: Omit<Discount, "id" | "createdAt" | "usedCount">
): Promise<Discount> {
  const { data, error } = await supabaseAdmin
    .from("discounts")
    .insert({
      store_id: discountData.storeId,
      code: discountData.code.trim().toUpperCase(),
      type: discountData.type,
      value: discountData.value,
      min_order_value: discountData.minOrderValue || 0,
      max_discount: discountData.maxDiscount || null,
      usage_limit: discountData.usageLimit || null,
      used_count: 0,
      expires_at: discountData.expiresAt || null,
      is_active: discountData.isActive,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create discount: ${error.message}`)
  return rowToDiscount(data)
}

export async function updateDiscount(
  storeId: string,
  id: string,
  updates: Partial<Discount>
): Promise<Discount | null> {
  const dbUpdates: Record<string, unknown> = {}
  if (updates.code !== undefined) dbUpdates.code = updates.code.trim().toUpperCase()
  if (updates.type !== undefined) dbUpdates.type = updates.type
  if (updates.value !== undefined) dbUpdates.value = updates.value
  if (updates.minOrderValue !== undefined)
    dbUpdates.min_order_value = updates.minOrderValue
  if (updates.maxDiscount !== undefined)
    dbUpdates.max_discount = updates.maxDiscount
  if (updates.usageLimit !== undefined)
    dbUpdates.usage_limit = updates.usageLimit
  if (updates.expiresAt !== undefined)
    dbUpdates.expires_at = updates.expiresAt
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

  const { data, error } = await supabaseAdmin
    .from("discounts")
    .update(dbUpdates)
    .eq("store_id", storeId)
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error || !data) return null
  return rowToDiscount(data)
}

export async function deleteDiscount(
  storeId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("discounts")
    .delete()
    .eq("store_id", storeId)
    .eq("id", id)
  return !error
}

export async function validateDiscountCode(
  storeId: string,
  code: string,
  cartSubtotal: number
): Promise<{
  valid: boolean
  discount?: Discount
  error?: string
  discountAmount?: number
}> {
  const cleanCode = code.trim().toUpperCase()
  const { data, error } = await supabaseAdmin
    .from("discounts")
    .select("*")
    .eq("store_id", storeId)
    .eq("code", cleanCode)
    .maybeSingle()

  if (error || !data) {
    return { valid: false, error: "كود الخصم غير صحيح أو غير موجود" }
  }

  const discount = rowToDiscount(data)

  if (!discount.isActive) {
    return { valid: false, error: "كود الخصم غير مفعّل حالياً" }
  }

  if (discount.expiresAt && new Date(discount.expiresAt).getTime() < Date.now()) {
    return { valid: false, error: "كود الخصم منتهي الصلاحية" }
  }

  if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
    return { valid: false, error: "تم الوصول إلى الحد الأقصى لاستخدام كود الخصم" }
  }

  if (discount.minOrderValue && cartSubtotal < discount.minOrderValue) {
    return {
      valid: false,
      error: `الحد الأدنى لتطبيق هذا الخصم هو ${discount.minOrderValue} ج.م`,
    }
  }

  let discountAmount = 0
  if (discount.type === "percentage") {
    discountAmount = Math.round((cartSubtotal * discount.value) / 100)
    if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
      discountAmount = discount.maxDiscount
    }
  } else if (discount.type === "fixed") {
    discountAmount = Math.min(discount.value, cartSubtotal)
  }

  return { valid: true, discount, discountAmount }
}

// ─────────────────────────────────────────────
// Inventory Adjustments & Logs
// ─────────────────────────────────────────────

export async function getInventoryLogsByStore(
  storeId: string
): Promise<InventoryLogEntry[]> {
  const { data, error } = await supabaseAdmin
    .from("inventory_logs")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })

  if (error || !data) return []
  return data.map(rowToInventoryLog)
}

export async function adjustProductStock(input: {
  storeId: string
  productId: string
  variantId?: string
  changeQty: number
  reason: string
  actor?: string
}): Promise<{ ok: boolean; newStock?: number; error?: string }> {
  const product = await getProductById(input.productId)
  if (!product || product.storeId !== input.storeId) {
    return { ok: false, error: "المنتج غير موجود" }
  }

  let finalStock = product.stock

  if (input.variantId) {
    const variant = product.variants.find((v) => v.id === input.variantId)
    if (!variant) return { ok: false, error: "المتغير المطلوب غير موجود" }

    const newVariantStock = Math.max(0, variant.stock + input.changeQty)
    const { error: varErr } = await supabaseAdmin
      .from("product_variants")
      .update({ stock: newVariantStock })
      .eq("product_id", product.id)
      .eq("id", input.variantId)

    if (varErr) {
      return { ok: false, error: "فشل تحديث مخزون المتغير" }
    }

    const updatedVariants = product.variants.map((v) =>
      v.id === input.variantId ? { ...v, stock: newVariantStock } : v
    )
    const { stock, status } = computeProductStockAndStatus(updatedVariants)
    finalStock = stock

    const { error: prodErr } = await supabaseAdmin
      .from("products")
      .update({ stock, status })
      .eq("store_id", input.storeId)
      .eq("id", product.id)

    if (prodErr) {
      return { ok: false, error: "فشل تحديث إجمالي مخزون المنتج" }
    }
  } else {
    finalStock = Math.max(0, product.stock + input.changeQty)
    let status: ProductStatus = "نشط"
    if (finalStock === 0) status = "نفذ المخزون"
    else if (finalStock < 5) status = "مخزون منخفض"

    const { error: prodErr } = await supabaseAdmin
      .from("products")
      .update({ stock: finalStock, status })
      .eq("store_id", input.storeId)
      .eq("id", product.id)

    if (prodErr) {
      return { ok: false, error: "فشل تحديث مخزون المنتج" }
    }
  }

  // Insert log
  const { error: logErr } = await supabaseAdmin.from("inventory_logs").insert({
    store_id: input.storeId,
    product_id: input.productId,
    variant_id: input.variantId || null,
    change_qty: input.changeQty,
    new_stock: finalStock,
    reason: input.reason,
    actor: input.actor || "التاجر",
  })
  if (logErr) {
    console.error("[adjustProductStock] Failed to write inventory log:", logErr.message)
  }

  return { ok: true, newStock: finalStock }
}

// ─────────────────────────────────────────────
// Staff
// ─────────────────────────────────────────────

export async function getStaffByStore(
  storeId: string
): Promise<StaffMember[]> {
  const { data, error } = await supabaseAdmin
    .from("staff")
    .select("*")
    .eq("store_id", storeId)

  if (error || !data) return []
  return data.map(rowToStaff)
}

export async function addStaffMember(
  staffData: Omit<StaffMember, "id" | "createdAt">
): Promise<StaffMember> {
  const { data, error } = await supabaseAdmin
    .from("staff")
    .insert({
      store_id: staffData.storeId,
      user_id: staffData.userId || null,
      name: staffData.name,
      email: staffData.email.toLowerCase().trim(),
      role: staffData.role,
      status: staffData.status || "active",
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to add staff member: ${error.message}`)
  return rowToStaff(data)
}

export async function deleteStaffMember(
  storeId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("staff")
    .delete()
    .eq("store_id", storeId)
    .eq("id", id)
  return !error
}
