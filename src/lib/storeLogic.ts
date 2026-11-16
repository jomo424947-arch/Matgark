export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "info"

export type OrderStatus =
  | "جديد"
  | "مؤكد"
  | "جاري الشحن"
  | "تم التسليم"
  | "ملغي"

export interface ProductVariant {
  size: string
  color: string
  stock: number
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  variantsText: string
  sizes: string[]
  colors: string[]
  status: "نشط" | "مخزون منخفض" | "نفذ المخزون"
  emoji: string
  description?: string
}

export interface OrderItem {
  productId?: string
  name: string
  size: string
  color?: string
  qty: number
  price: number
}

export interface Order {
  id: string
  customer: string
  phone: string
  city: string
  address: string
  items: OrderItem[]
  deliveryFee: number
  total: number
  status: OrderStatus
  statusType: BadgeVariant
  date: string
  notes: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  city: string
  totalOrders: number
  totalSpent: number
  lastOrder: string
  tag: string
}

export interface StoreSettings {
  storeName: string
  slug: string
  slogan: string
  category: string
  whatsapp: string
  deliveryType: "flat" | "by_city"
  flatFee: number
  freeAbove: number
  cityFees: Record<string, number>
  themeColor: string
}

export function normalizeSlug(input: string, fallback = "my-shop"): string {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return cleaned || fallback
}

export function getStatusBadgeVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case "جديد":
      return "warning"
    case "مؤكد":
      return "info"
    case "جاري الشحن":
      return "default"
    case "تم التسليم":
      return "success"
    case "ملغي":
      return "danger"
    default:
      return "default"
  }
}

export function getProductStatus(stock: number): Product["status"] {
  if (stock <= 0) return "نفذ المخزون"
  if (stock < 5) return "مخزون منخفض"
  return "نشط"
}

export function getCategoryEmoji(category: string): string {
  if (category.includes("أحذية")) return "👟"
  if (category.includes("إكسسوارات") || category.includes("شنط")) return "👜"
  if (category.includes("أكل") || category.includes("حلويات")) return "🧁"
  if (category.includes("يدوية") || category.includes("كروشيه")) return "🧶"
  if (category.includes("بناطيل")) return "👖"
  if (category.includes("شتوية")) return "🧥"
  return "👕"
}

export function buildProductFromInput(input: {
  id?: string
  name: string
  price: number
  category: string
  description?: string
  variants: { size: string; color: string; stock: string | number }[]
  emoji?: string
}): Product {
  const totalStock = input.variants.reduce(
    (sum, v) => sum + Math.max(0, Number(v.stock) || 0),
    0
  )
  const sizes = Array.from(
    new Set(input.variants.map((v) => v.size.trim()).filter(Boolean))
  )
  const colors = Array.from(
    new Set(input.variants.map((v) => v.color.trim()).filter(Boolean))
  )
  const effectiveSizes = sizes.length > 0 ? sizes : ["موحد"]
  const effectiveColors = colors.length > 0 ? colors : ["أساسي"]
  const variantsText = `${effectiveSizes.join(", ")} • ${effectiveColors.join("، ")}`

  return {
    id: input.id || `prod-${Date.now()}`,
    name: input.name.trim(),
    category: input.category,
    price: Math.max(0, Number(input.price) || 0),
    stock: totalStock,
    variantsText,
    sizes: effectiveSizes,
    colors: effectiveColors,
    status: getProductStatus(totalStock),
    emoji: input.emoji || getCategoryEmoji(input.category),
    description: input.description?.trim() || "",
  }
}

export function calculateOrderTotals(params: {
  subtotal: number
  city?: string
  settings: Pick<
    StoreSettings,
    "deliveryType" | "flatFee" | "freeAbove" | "cityFees"
  >
}): {
  subtotal: number
  isFreeDelivery: boolean
  deliveryFee: number
  grandTotal: number
  amountToFreeDelivery: number
} {
  const subtotal = Math.max(0, params.subtotal)
  const freeAbove = Number(params.settings.freeAbove) || 0
  const isFreeDelivery = freeAbove > 0 && subtotal >= freeAbove
  const amountToFreeDelivery =
    freeAbove > 0 ? Math.max(0, freeAbove - subtotal) : 0

  let baseFee = Number(params.settings.flatFee) || 0
  if (
    params.settings.deliveryType === "by_city" &&
    params.city &&
    params.settings.cityFees[params.city] !== undefined
  ) {
    baseFee = params.settings.cityFees[params.city]
  }

  const deliveryFee = subtotal === 0 ? 0 : isFreeDelivery ? 0 : baseFee
  const grandTotal = subtotal + deliveryFee

  return {
    subtotal,
    isFreeDelivery,
    deliveryFee,
    grandTotal,
    amountToFreeDelivery,
  }
}

export function upsertCustomerFromOrder(
  customers: Customer[],
  order: Order
): Customer[] {
  const cleanPhone = order.phone.trim()
  const existingIndex = customers.findIndex(
    (c) => c.phone.trim() === cleanPhone || c.name.trim() === order.customer.trim()
  )

  if (existingIndex >= 0) {
    const existing = customers[existingIndex]
    const newTotalOrders = existing.totalOrders + 1
    const newTotalSpent = existing.totalSpent + order.total
    const updated: Customer = {
      ...existing,
      name: order.customer.trim() || existing.name,
      city: order.city,
      totalOrders: newTotalOrders,
      totalSpent: newTotalSpent,
      lastOrder: "الآن",
      tag: newTotalOrders >= 3 ? "عميل مميز ⭐" : "نشط",
    }
    const next = [...customers]
    next[existingIndex] = updated
    return next
  }

  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    name: order.customer.trim(),
    phone: cleanPhone,
    city: order.city,
    totalOrders: 1,
    totalSpent: order.total,
    lastOrder: "الآن",
    tag: "جديد",
  }

  return [newCustomer, ...customers]
}
