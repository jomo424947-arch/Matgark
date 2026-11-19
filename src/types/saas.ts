export type Locale = "ar" | "en"

export type StoreStatus = "draft" | "published" | "suspended"

export type MerchantAccountStatus = "active" | "suspended" | "pending_verification"

export type OrderLifecycleStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready_for_shipment"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded"

export type PaymentMethodType = "cod" | "bank_transfer" | "online_gateway"

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export type ProductPublishStatus = "active" | "draft" | "archived"

export type CustomerSegment = "vip" | "returning" | "new" | "at_risk"

export type DiscountType = "percentage" | "fixed" | "free_shipping"

export type DiscountScope = "all" | "product" | "category"

export type StaffRole =
  | "owner"
  | "admin"
  | "manager"
  | "order_manager"
  | "inventory_manager"

export type PlatformAdminRole = "super_admin" | "operations" | "support"

export type StoreThemePresetId =
  | "minimal-fashion"
  | "modern-cosmetics"
  | "electronics-pro"

export interface StoreTheme {
  presetId: StoreThemePresetId
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  mutedTextColor: string
  fontFamily: "editorial" | "modern-sans" | "technical"
  borderRadius: "none" | "sm" | "md" | "lg" | "xl"
  buttonStyle: "rounded" | "square" | "pill"
  headerStyle: "minimal" | "centered" | "structured"
  productCardStyle: "editorial" | "soft-card" | "spec-grid"
}

export type StoreSectionType =
  | "announcement"
  | "hero"
  | "promo_banner"
  | "featured_categories"
  | "best_sellers"
  | "new_arrivals"
  | "product_grid"
  | "brand_story"
  | "newsletter"
  | "footer"

export interface StoreSection {
  id: string
  type: StoreSectionType
  visible: boolean
  order: number
  titleAr: string
  titleEn: string
  subtitleAr: string
  subtitleEn: string
  ctaLabelAr?: string
  ctaLabelEn?: string
  ctaHref?: string
  badgeAr?: string
  badgeEn?: string
  visualVariant?: "fashion" | "cosmetics" | "electronics" | "minimal"
  accentBg?: string
  featuredIds?: string[]
}

export interface StoreNavigationLink {
  id: string
  labelAr: string
  labelEn: string
  href: string
}

export interface ShippingMethod {
  id: string
  nameAr: string
  nameEn: string
  type: "flat" | "by_zone" | "local_delivery" | "pickup"
  rate: number
  freeAbove: number | null
  estimatedDaysAr: string
  estimatedDaysEn: string
  zones?: Record<string, number>
  enabled: boolean
}

export interface PaymentConfig {
  codEnabled: boolean
  codFee: number
  bankTransferEnabled: boolean
  bankName: string
  bankAccountName: string
  bankIban: string
  onlineGatewayProvider: "none" | "stripe" | "paymob" | "tap"
  onlineGatewayConnected: boolean // Always false unless backend verified
}

export interface StaffMember {
  id: string
  name: string
  email: string
  role: StaffRole
  status: "active" | "invited"
  joinedAt: string
}

export interface StoreSeoConfig {
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  socialImageLabel?: string
}

export interface StoreLocalizationConfig {
  primaryLanguage: Locale
  supportedLanguages: Locale[]
  currency: "EGP" | "SAR" | "AED" | "USD"
  currencySymbolPosition: "before" | "after"
  region: string
}

export interface TenantStore {
  id: string
  merchantId: string
  nameAr: string
  nameEn: string
  slug: string
  taglineAr: string
  taglineEn: string
  descriptionAr: string
  descriptionEn: string
  category: "fashion" | "cosmetics" | "electronics" | "home" | "food" | "other"
  logoMonogram: string
  logoColor: string
  logoDataUrl?: string
  faviconMonogram?: string
  status: StoreStatus
  visible: boolean
  planId: string
  contactEmail: string
  contactPhone: string
  whatsapp: string
  socialLinks: {
    instagram?: string
    tiktok?: string
    facebook?: string
    website?: string
  }
  theme: StoreTheme
  draftTheme: StoreTheme
  previousTheme?: StoreTheme
  sections: StoreSection[]
  draftSections: StoreSection[]
  navigationLinks: StoreNavigationLink[]
  shippingMethods: ShippingMethod[]
  paymentConfig: PaymentConfig
  localization: StoreLocalizationConfig
  seo: StoreSeoConfig
  staff: StaffMember[]
  onboardingCompleted: boolean
  onboardingStep: number
  newsletterSubscribers: string[]
  createdAt: string
  lastActivityAt: string
}

export interface CatalogVariant {
  id: string
  sku: string
  size?: string
  color?: string
  colorHex?: string
  material?: string
  capacity?: string
  price: number
  stock: number
  available: boolean
  imageTone?: string
}

export interface ProductReview {
  id: string
  authorName: string
  rating: number
  comment: string
  createdAt: string
  verified: boolean
}

export interface CatalogProduct {
  id: string
  storeId: string
  categoryId: string
  nameAr: string
  nameEn: string
  slug: string
  descriptionAr: string
  descriptionEn: string
  price: number
  compareAtPrice?: number
  sku: string
  barcode?: string
  status: ProductPublishStatus
  lowStockThreshold: number
  weightKg?: number
  dimensions?: string
  seoTitle?: string
  seoDescription?: string
  visualType:
    | "hoodie"
    | "coat"
    | "trousers"
    | "tshirt"
    | "dress"
    | "bag"
    | "sneakers"
    | "serum"
    | "cream"
    | "perfume"
    | "palette"
    | "headphones"
    | "keyboard"
    | "speaker"
    | "watch"
  visualPalette: [string, string]
  galleryTones: string[]
  variants: CatalogVariant[]
  specs: { labelAr: string; labelEn: string; valueAr: string; valueEn: string }[]
  reviews: ProductReview[]
  featured: boolean
  bestSeller: boolean
  newArrival: boolean
  salesCount: number
  createdAt: string
}

export interface CatalogCategory {
  id: string
  storeId: string
  parentId: string | null
  nameAr: string
  nameEn: string
  slug: string
  descriptionAr: string
  descriptionEn: string
  isCollection: boolean
  featured: boolean
  displayOrder: number
  accentColor: string
  seoTitle?: string
}

export interface InventoryLog {
  id: string
  storeId: string
  productId: string
  productNameEn: string
  productNameAr: string
  variantId: string
  variantLabel: string
  delta: number
  previousStock: number
  newStock: number
  reason: "manual_adjustment" | "order_placed" | "order_cancelled" | "restock"
  note?: string
  actor: string
  createdAt: string
}

export interface OrderLineItem {
  id: string
  productId: string
  variantId: string
  nameAr: string
  nameEn: string
  variantLabel: string
  sku: string
  unitPrice: number
  quantity: number
  visualType: CatalogProduct["visualType"]
  visualPalette: [string, string]
}

export interface OrderTimelineEntry {
  status: OrderLifecycleStatus
  timestamp: string
  noteAr: string
  noteEn: string
  actor: string
}

export interface ShippingAddress {
  id?: string
  label?: string
  fullName: string
  phone: string
  country: string
  city: string
  street: string
  apartment?: string
  deliveryInstructions?: string
  isDefault?: boolean
}

export interface StoreOrder {
  id: string
  orderNumber: string
  storeId: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: ShippingAddress
  shippingMethodId: string
  shippingMethodNameAr: string
  shippingMethodNameEn: string
  paymentMethod: PaymentMethodType
  paymentStatus: PaymentStatus
  items: OrderLineItem[]
  subtotal: number
  shippingFee: number
  discountCode?: string
  discountAmount: number
  total: number
  status: OrderLifecycleStatus
  internalNotes: { id: string; text: string; author: string; createdAt: string }[]
  timeline: OrderTimelineEntry[]
  createdAt: string
}

export interface StoreCustomer {
  id: string
  storeId: string
  name: string
  email: string
  phone: string
  passwordDemo: string
  segment: CustomerSegment
  addresses: ShippingAddress[]
  wishlistProductIds: string[]
  totalOrders: number
  totalSpent: number
  lastOrderAt?: string
  createdAt: string
}

export interface DiscountCode {
  id: string
  storeId: string
  code: string
  type: DiscountType
  value: number
  scope: DiscountScope
  targetIds?: string[]
  minOrderValue: number
  maxUses: number | null
  usedCount: number
  firstOrderOnly: boolean
  startsAt: string
  expiresAt: string
  active: boolean
}

export interface PlatformMerchant {
  id: string
  name: string
  email: string
  phone: string
  passwordDemo: string
  status: MerchantAccountStatus
  planId: string
  storeIds: string[]
  reportedIssues: number
  createdAt: string
  lastActiveAt: string
}

export interface SubscriptionPlan {
  id: string
  nameAr: string
  nameEn: string
  descriptionAr: string
  descriptionEn: string
  monthlyPrice: number
  yearlyPrice: number
  currency: string
  productLimit: number | null
  staffLimit: number
  customDomain: boolean
  storeBuilderAccess: boolean
  analyticsAccess: boolean
  featuresAr: string[]
  featuresEn: string[]
  active: boolean
}

export interface SubscriptionRecord {
  id: string
  merchantId: string
  merchantName: string
  storeName: string
  planId: string
  planName: string
  billingPeriod: "monthly" | "yearly"
  amount: number
  status: "active" | "expired" | "past_due" | "cancelled"
  renewDate: string
  lastPaymentDate: string
}

export interface SupportTicket {
  id: string
  merchantId: string
  merchantName: string
  storeName: string
  subject: string
  category: "billing" | "storefront" | "orders" | "technical"
  priority: "low" | "medium" | "high"
  status: "open" | "in_progress" | "resolved"
  messages: { sender: "merchant" | "admin"; text: string; timestamp: string }[]
  createdAt: string
}

export interface PlatformAnnouncement {
  id: string
  titleAr: string
  titleEn: string
  bodyAr: string
  bodyEn: string
  audience: "all_merchants" | "pro_merchants"
  publishedAt: string
}

export interface PlatformSettings {
  platformNameAr: string
  platformNameEn: string
  defaultLanguage: Locale
  supportedLanguages: Locale[]
  defaultCurrency: "EGP" | "SAR" | "AED" | "USD"
  maintenanceMode: boolean
  allowNewRegistrations: boolean
  adminEmail: string
  adminName: string
  notifyNewMerchant: boolean
  notifySupportTicket: boolean
  notifySuspendedStore: boolean
}

export interface PlatformActivityLog {
  id: string
  actor: string
  actionAr: string
  actionEn: string
  target: string
  timestamp: string
}
