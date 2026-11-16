import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  type Product,
  type Order,
  type OrderStatus,
  type Customer,
  type StoreSettings,
  buildProductFromInput,
  getStatusBadgeVariant,
  getProductStatus,
  upsertCustomerFromOrder,
} from "@/lib/storeLogic"

const initialSettings: StoreSettings = {
  storeName: "براند كايرو كوتور",
  slug: "cairo-couture",
  slogan: "أحدث صيحات الملابس الشتوية والكاجوال العصرية في مصر",
  category: "ملابس",
  whatsapp: "01012345678",
  deliveryType: "flat",
  flatFee: 40,
  freeAbove: 1000,
  cityFees: {
    القاهرة: 40,
    الجيزة: 45,
    الإسكندرية: 60,
    القليوبية: 50,
    الدقهلية: 65,
    الشرقية: 65,
    المنوفية: 65,
    البحيرة: 70,
    "محافظة أخرى": 75,
  },
  themeColor: "#E8732A",
}

const initialProducts: Product[] = [
  {
    id: "1",
    name: "جاكيت شتوي أوفرسايز صوف فاخر",
    category: "ملابس شتوية",
    price: 850,
    stock: 14,
    variantsText: "M, L, XL • أسود، بيج، زيتي",
    sizes: ["M", "L", "XL"],
    colors: ["أسود", "بيج", "زيتي"],
    status: "نشط",
    emoji: "🧥",
    description: "جاكيت شتوي صوف معالج عالي الجودة ومبطن بالكامل للتدفئة الفائقة.",
  },
  {
    id: "2",
    name: "سنيكرز جلد أبيض كلاسيك",
    category: "أحذية",
    price: 620,
    stock: 3,
    variantsText: "38, 39, 40, 41, 42 • أبيض",
    sizes: ["38", "39", "40", "41", "42"],
    colors: ["أبيض"],
    status: "مخزون منخفض",
    emoji: "👟",
    description: "سنيكرز يومي مريح بنعل طبي مرن وخامة جلد سهلة التنظيف.",
  },
  {
    id: "3",
    name: "هودي قطن مصري 100% مبطن",
    category: "ملابس كاجوال",
    price: 550,
    stock: 22,
    variantsText: "S, M, L, XL • رمادي، كحلي، نبيتي",
    sizes: ["S", "M", "L", "XL"],
    colors: ["رمادي", "كحلي", "نبيتي"],
    status: "نشط",
    emoji: "👕",
    description: "هودي ميلتون قطن مصري أصلي ضد الوبرة والانكماش.",
  },
  {
    id: "4",
    name: "بنطلون كارجو قطن بجيوب متعددة",
    category: "بناطيل",
    price: 490,
    stock: 8,
    variantsText: "30, 32, 34, 36 • بيج، زيتي، أسود",
    sizes: ["30", "32", "34", "36"],
    colors: ["بيج", "زيتي", "أسود"],
    status: "نشط",
    emoji: "👖",
    description: "بنطلون كارجو عملي بقصة مريحة وخامة قطن ممتازة.",
  },
]

const initialOrders: Order[] = [
  {
    id: "1048",
    customer: "محمد علي",
    phone: "01098765432",
    city: "القاهرة",
    address: "مدينة نصر، شارع عباس العقاد، عمارة 14، شقة 5",
    items: [{ name: "جاكيت شتوي أوفرسايز صوف فاخر", size: "L", color: "أسود", qty: 1, price: 850 }],
    deliveryFee: 40,
    total: 890,
    status: "جديد",
    statusType: "warning",
    date: "اليوم، 05:40 م",
    notes: "يرجى الاتصال قبل الوصول",
  },
  {
    id: "1047",
    customer: "نورين شريف",
    phone: "01234567890",
    city: "الجيزة",
    address: "الدقي، شارع مصدق، برج الأطباء",
    items: [
      { name: "سنيكرز جلد أبيض كلاسيك", size: "38", color: "أبيض", qty: 1, price: 620 },
      { name: "تيشيرت أوفرسايز بيج", size: "M", color: "بيج", qty: 2, price: 300 },
    ],
    deliveryFee: 45,
    total: 1265,
    status: "مؤكد",
    statusType: "info",
    date: "اليوم، 03:15 م",
    notes: "",
  },
  {
    id: "1046",
    customer: "عمر خالد",
    phone: "01122334455",
    city: "الإسكندرية",
    address: "سموحة، بجوار نادي سموحة، عمارة الأمل",
    items: [{ name: "هودي قطن مصري 100% مبطن", size: "XL", color: "رمادي", qty: 1, price: 550 }],
    deliveryFee: 60,
    total: 610,
    status: "جاري الشحن",
    statusType: "default",
    date: "أمس، 08:30 م",
    notes: "مندوب الشحن: أ/ هاني (01011223344)",
  },
  {
    id: "1045",
    customer: "ياسمين فهمي",
    phone: "01599887766",
    city: "القاهرة",
    address: "التجمع الخامس، النرجس 2، فيلا 18",
    items: [{ name: "فستان بيج صيفي", size: "S", color: "بيج", qty: 1, price: 790 }],
    deliveryFee: 40,
    total: 830,
    status: "تم التسليم",
    statusType: "success",
    date: "منذ يومين",
    notes: "تم تحصيل المبلغ كاش",
  },
]

const initialCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "محمد علي",
    phone: "01098765432",
    city: "القاهرة (مدينة نصر)",
    totalOrders: 3,
    totalSpent: 2450,
    lastOrder: "اليوم",
    tag: "عميل مميز ⭐",
  },
  {
    id: "cust-2",
    name: "نورين شريف",
    phone: "01234567890",
    city: "الجيزة (الدقي)",
    totalOrders: 2,
    totalSpent: 1840,
    lastOrder: "اليوم",
    tag: "نشط",
  },
  {
    id: "cust-3",
    name: "عمر خالد",
    phone: "01122334455",
    city: "الإسكندرية (سموحة)",
    totalOrders: 1,
    totalSpent: 610,
    lastOrder: "أمس",
    tag: "جديد",
  },
  {
    id: "cust-4",
    name: "ياسمين فهمي",
    phone: "01599887766",
    city: "القاهرة (التجمع الخامس)",
    totalOrders: 4,
    totalSpent: 3120,
    lastOrder: "منذ يومين",
    tag: "عميل مميز ⭐",
  },
  {
    id: "cust-5",
    name: "أحمد حسام",
    phone: "01011223388",
    city: "المنصورة",
    totalOrders: 1,
    totalSpent: 490,
    lastOrder: "منذ 4 أيام",
    tag: "جديد",
  },
]

interface MerchantStore {
  settings: StoreSettings
  products: Product[]
  orders: Order[]
  customers: Customer[]
  updateSettings: (partial: Partial<StoreSettings>) => void
  addProduct: (input: {
    name: string
    price: number
    category: string
    description?: string
    variants: { size: string; color: string; stock: string | number }[]
    emoji?: string
  }) => Product
  deleteProduct: (id: string) => void
  updateProductStock: (id: string, newStock: number) => void
  placeOrder: (orderInput: {
    customer: string
    phone: string
    city: string
    address: string
    notes: string
    items: {
      productId: string
      name: string
      size: string
      color: string
      qty: number
      price: number
    }[]
    deliveryFee: number
    total: number
  }) => Order
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
}

export const useMerchantStore = create<MerchantStore>()(
  persist(
    (set, get) => ({
      settings: initialSettings,
      products: initialProducts,
      orders: initialOrders,
      customers: initialCustomers,

      updateSettings: (partial) => {
        set((state) => ({
          settings: { ...state.settings, ...partial },
        }))
      },

      addProduct: (input) => {
        const nextId = String(get().products.length + 1)
        const newProduct = buildProductFromInput({
          ...input,
          id: nextId,
        })
        set((state) => ({
          products: [newProduct, ...state.products],
        }))
        return newProduct
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }))
      },

      updateProductStock: (id, newStock) => {
        const safeStock = Math.max(0, newStock)
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? { ...p, stock: safeStock, status: getProductStatus(safeStock) }
              : p
          ),
        }))
      },

      placeOrder: (orderInput) => {
        const nextNum = 1049 + get().orders.length
        const newOrder: Order = {
          id: String(nextNum),
          customer: orderInput.customer,
          phone: orderInput.phone,
          city: orderInput.city,
          address: orderInput.address,
          notes: orderInput.notes,
          items: orderInput.items,
          deliveryFee: orderInput.deliveryFee,
          total: orderInput.total,
          status: "جديد",
          statusType: getStatusBadgeVariant("جديد"),
          date: "الآن",
        }

        // Decrement product stock
        const updatedProducts = get().products.map((p) => {
          const orderedQty = orderInput.items
            .filter((i) => i.productId === p.id)
            .reduce((sum, i) => sum + i.qty, 0)
          if (orderedQty === 0) return p
          const nextStock = Math.max(0, p.stock - orderedQty)
          return {
            ...p,
            stock: nextStock,
            status: getProductStatus(nextStock),
          }
        })

        const updatedCustomers = upsertCustomerFromOrder(
          get().customers,
          newOrder
        )

        set((state) => ({
          orders: [newOrder, ...state.orders],
          products: updatedProducts,
          customers: updatedCustomers,
        }))

        return newOrder
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, status, statusType: getStatusBadgeVariant(status) }
              : o
          ),
        }))
      },
    }),
    {
      name: "matgarak-merchant-storage",
      skipHydration: true,
    }
  )
)
