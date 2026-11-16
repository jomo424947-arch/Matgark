import type { BadgeVariant } from "@/components/ui/Badge"

export type OrderStatus = "جديد" | "مؤكد" | "جاري الشحن" | "تم التسليم" | "ملغي"
export type ProductStatus = "نشط" | "مخزون منخفض" | "نفذ المخزون"
export type DeliveryType = "flat" | "by_city"

export const ORDER_STATUSES: OrderStatus[] = [
  "جديد",
  "مؤكد",
  "جاري الشحن",
  "تم التسليم",
  "ملغي",
]

export const ORDER_STATUS_BADGE_MAP: Record<OrderStatus, BadgeVariant> = {
  جديد: "warning",
  مؤكد: "info",
  "جاري الشحن": "default",
  "تم التسليم": "success",
  ملغي: "danger",
}

export const PRODUCT_STATUS_BADGE_MAP: Record<ProductStatus, BadgeVariant> = {
  نشط: "success",
  "مخزون منخفض": "warning",
  "نفذ المخزون": "danger",
}

export interface User {
  id: string
  phone: string
  createdAt: string
}

export interface OtpCode {
  id: string
  phone: string
  codeHash: string
  attempts: number
  expiresAt: number
  used?: boolean
}

export interface Session {
  id: string
  userId: string
  storeId: string
  expiresAt: number
}

export interface ProductVariant {
  id: string
  size: string
  color: string
  stock: number
}

export interface Product {
  id: string
  storeId: string
  name: string
  price: number
  category: string
  description?: string
  image?: string
  variants: ProductVariant[]
  stock: number
  status: ProductStatus
  createdAt: string
}

export interface OrderItem {
  id: string
  productId: string
  variantId?: string
  name: string
  price: number
  size: string
  color: string
  quantity: number
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus
  timestamp: string
  note?: string
}

export interface Order {
  id: string
  orderNumber: string
  storeId: string
  customerId: string
  customerName: string
  customerPhone: string
  customerCity: string
  customerAddress: string
  customerNotes?: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  statusHistory: OrderStatusHistoryEntry[]
  createdAt: string
}

export interface Customer {
  id: string
  storeId: string
  name: string
  phone: string
  city: string
  totalOrders: number
  totalSpent: number
  lastOrder: string
  tag: string
  createdAt: string
}

export interface Store {
  id: string
  ownerId: string
  name: string
  slug: string
  slogan?: string
  phone: string
  whatsapp: string
  deliveryType: DeliveryType
  flatFee: number
  freeAbove: number | null
  cityFees?: Record<string, number>
  themeColor: string
  logoUrl?: string
  orderSeq: number
  plan: "free" | "pro"
  createdAt: string
}

export interface DashboardStats {
  todaySales: number
  todayOrdersCount: number
  newOrdersCount: number
  totalProductsCount: number
  lowStockProductsCount: number
  totalCustomersCount: number
}

export interface AuditLogEntry {
  id: string
  storeId: string
  action: string
  details: string
  timestamp: string
}
