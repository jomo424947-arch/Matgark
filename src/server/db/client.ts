import fs from "node:fs"
import path from "node:path"
import type {
  User,
  Store,
  Product,
  Customer,
  Order,
  Session,
  OtpCode,
  AuditLogEntry,
  ProductStatus,
  DashboardStats,
  ProductVariant,
} from "@/types/domain"
import {
  INITIAL_USER,
  INITIAL_STORE,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
} from "@/server/db/seed-data"

export interface DatabaseSchema {
  users: User[]
  stores: Store[]
  products: Product[]
  customers: Customer[]
  orders: Order[]
  sessions: Session[]
  otpCodes: OtpCode[]
  auditLogs: AuditLogEntry[]
}

function getDatabasePath(): string {
  if (process.env.MATGARAK_DB_PATH) {
    return process.env.MATGARAK_DB_PATH
  }
  return path.join(process.cwd(), ".data", "matgarak-db.json")
}

function getInitialData(): DatabaseSchema {
  return {
    users: [INITIAL_USER],
    stores: [INITIAL_STORE],
    products: INITIAL_PRODUCTS,
    customers: INITIAL_CUSTOMERS,
    orders: INITIAL_ORDERS,
    sessions: [],
    otpCodes: [],
    auditLogs: [],
  }
}

let txQueue: Promise<unknown> = Promise.resolve()

function readDbRaw(filePath: string): DatabaseSchema {
  if (!fs.existsSync(filePath)) {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const initial = getInitialData()
    writeDbRaw(filePath, initial)
    return initial
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(content) as DatabaseSchema
  } catch (err) {
    console.error("Failed to parse matgarak-db.json, resetting to seed:", err)
    const initial = getInitialData()
    writeDbRaw(filePath, initial)
    return initial
  }
}

function writeDbRaw(filePath: string, data: DatabaseSchema): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8")
  fs.renameSync(tempPath, filePath)
}

/**
 * Runs a transactional operation with an exclusive async mutex.
 */
export async function withTransaction<T>(
  fn: (db: DatabaseSchema) => Promise<T> | T
): Promise<T> {
  const filePath = getDatabasePath()

  const operation = async (): Promise<T> => {
    const db = readDbRaw(filePath)
    const result = await fn(db)
    writeDbRaw(filePath, db)
    return result
  }

  const resultPromise = txQueue.then(operation, operation)
  txQueue = resultPromise.then(
    () => {},
    () => {}
  )
  return resultPromise
}

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

export async function getUserById(id: string): Promise<User | null> {
  return withTransaction((db) => db.users.find((u) => u.id === id) ?? null)
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  return withTransaction((db) => db.users.find((u) => u.phone === phone) ?? null)
}

export async function createUser(phone: string): Promise<User> {
  return withTransaction((db) => {
    const existing = db.users.find((u) => u.phone === phone)
    if (existing) return existing

    const user: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      phone,
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)
    return user
  })
}

export async function getStoreById(id: string): Promise<Store | null> {
  return withTransaction((db) => db.stores.find((s) => s.id === id) ?? null)
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const clean = slug.toLowerCase().trim()
  return withTransaction(
    (db) => db.stores.find((s) => s.slug.toLowerCase().trim() === clean) ?? null
  )
}

export async function getStoreByOwnerId(ownerId: string): Promise<Store | null> {
  return withTransaction((db) => db.stores.find((s) => s.ownerId === ownerId) ?? null)
}

export async function createStore(
  storeData: Omit<Store, "id" | "createdAt" | "orderSeq">
): Promise<Store> {
  return withTransaction((db) => {
    const store: Store = {
      ...storeData,
      id: `str-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderSeq: 1000,
      createdAt: new Date().toISOString(),
    }
    db.stores.push(store)
    return store
  })
}

export async function updateStore(
  id: string,
  updates: Partial<Store>
): Promise<Store | null> {
  return withTransaction((db) => {
    const index = db.stores.findIndex((s) => s.id === id)
    if (index === -1) return null

    const updated: Store = {
      ...db.stores[index],
      ...updates,
    }
    db.stores[index] = updated
    return updated
  })
}

export async function getProductsByStore(storeId: string): Promise<Product[]> {
  return withTransaction((db) =>
    db.products.filter((p) => p.storeId === storeId)
  )
}

export async function getProductById(id: string): Promise<Product | null> {
  return withTransaction((db) => db.products.find((p) => p.id === id) ?? null)
}

export async function createProduct(
  productData: Omit<Product, "id" | "createdAt" | "stock" | "status">
): Promise<Product> {
  return withTransaction((db) => {
    const { stock, status } = computeProductStockAndStatus(productData.variants)
    const product: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      stock,
      status,
      createdAt: new Date().toISOString(),
    }
    db.products.unshift(product)
    return product
  })
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  return withTransaction((db) => {
    const index = db.products.findIndex((p) => p.id === id)
    if (index === -1) return null

    const current = db.products[index]
    const variants = updates.variants ?? current.variants
    const { stock, status } = computeProductStockAndStatus(variants)

    const updated: Product = {
      ...current,
      ...updates,
      variants,
      stock,
      status,
    }
    db.products[index] = updated
    return updated
  })
}

export async function deleteProduct(id: string): Promise<boolean> {
  return withTransaction((db) => {
    const initialLen = db.products.length
    db.products = db.products.filter((p) => p.id !== id)
    return db.products.length < initialLen
  })
}

export async function getOrdersByStore(storeId: string): Promise<Order[]> {
  return withTransaction((db) =>
    db.orders
      .filter((o) => o.storeId === storeId)
      .sort((a, b) => Number(b.orderNumber) - Number(a.orderNumber))
  )
}

export async function getOrderById(id: string): Promise<Order | null> {
  return withTransaction((db) => db.orders.find((o) => o.id === id) ?? null)
}

export async function getCustomersByStore(storeId: string): Promise<Customer[]> {
  return withTransaction((db) =>
    db.customers.filter((c) => c.storeId === storeId)
  )
}

export async function getDashboardStats(storeId: string): Promise<DashboardStats> {
  return withTransaction((db) => {
    const storeOrders = db.orders.filter((o) => o.storeId === storeId)
    const storeProducts = db.products.filter((p) => p.storeId === storeId)
    const storeCustomers = db.customers.filter((c) => c.storeId === storeId)

    const todayDate = new Date().toISOString().slice(0, 10)
    const todayOrders = storeOrders.filter(
      (o) => o.createdAt.slice(0, 10) === todayDate
    )

    const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0)
    const newOrdersCount = storeOrders.filter((o) => o.status === "جديد").length
    const lowStockProductsCount = storeProducts.filter(
      (p) => p.status === "مخزون منخفض" || p.status === "نفذ المخزون"
    ).length

    return {
      todaySales,
      todayOrdersCount: todayOrders.length,
      newOrdersCount,
      totalProductsCount: storeProducts.length,
      lowStockProductsCount,
      totalCustomersCount: storeCustomers.length,
    }
  })
}

export async function addAuditLog(
  storeId: string,
  action: string,
  details: string
): Promise<void> {
  await withTransaction((db) => {
    db.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      storeId,
      action,
      details,
      timestamp: new Date().toISOString(),
    })
  })
}
