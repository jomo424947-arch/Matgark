import { z } from "zod"
import { isReservedSlug, sanitizeSlug } from "@/lib/reserved-slugs"
import { normalizeLocalEgyptPhone } from "@/lib/whatsapp"

export const egyptPhoneSchema = z
  .string()
  .transform((val) => normalizeLocalEgyptPhone(val.trim()))
  .pipe(
    z
      .string()
      .regex(
        /^01[0125]\d{8}$/,
        "يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقم (مثال: 01012345678)"
      )
  )

export const slugSchema = z
  .string()
  .transform((val) => sanitizeSlug(val))
  .pipe(
    z
      .string()
      .min(3, "رابط المتجر يجب أن يتكون من 3 أحرف على الأقل")
      .max(40, "رابط المتجر يجب ألا يتجاوز 40 حرفاً")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "الرابط يجب أن يحتوي على أحرف إنجليزية وأرقام وعلامة (-) فقط"
      )
      .refine(
        (slug) => !isReservedSlug(slug),
        "هذا الرابط محجوز للنظام، يرجى اختيار رابط آخر"
      )
  )

export const requestOtpSchema = z.object({
  phone: egyptPhoneSchema,
})

export const verifyOtpSchema = z.object({
  phone: egyptPhoneSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "كود التأكيد يجب أن يتكون من 6 أرقام"),
})

export const registerMerchantSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(2, "اسم المتجر يجب أن يكون حرفين على الأقل")
    .max(60, "اسم المتجر يجب ألا يتجاوز 60 حرفاً"),
  slug: slugSchema,
  phone: egyptPhoneSchema,
  whatsapp: egyptPhoneSchema,
  plan: z.enum(["free", "pro"]).default("free"),
})

export const productVariantSchema = z.object({
  id: z.string().optional(),
  size: z.string().trim().min(1, "المقاس مطلوب"),
  color: z.string().trim().min(1, "اللون مطلوب"),
  stock: z.coerce.number().int().min(0, "المخزون لا يمكن أن يكون سالباً"),
})

export const productInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "اسم المنتج يجب أن يكون حرفين على الأقل")
    .max(120, "اسم المنتج طويل جداً"),
  price: z.coerce.number().positive("السعر يجب أن يكون أكبر من صفر"),
  category: z.string().trim().min(1, "الفئة مطلوبة"),
  description: z.string().trim().max(1000).optional(),
  image: z.string().optional(),
  variants: z
    .array(productVariantSchema)
    .min(1, "يجب تحديد خيار مقاس ولون واحد على الأقل"),
})

export const onboardingSchema = z.object({
  storeName: z.string().trim().min(2, "اسم المتجر مطلوب").max(60),
  storeSlug: slugSchema,
  category: z.string().trim().min(1, "المجال مطلوب"),
  whatsapp: egyptPhoneSchema,
  deliveryFee: z.coerce
    .number()
    .min(0, "رسوم التوصيل لا يمكن أن تكون سالبة"),
  productName: z.string().trim().min(2, "اسم المنتج مطلوب"),
  productPrice: z.coerce.number().positive("السعر يجب أن يكون أكبر من صفر"),
  productSizes: z.string().optional(),
  productImage: z.string().optional(),
})

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(2, "اسم المتجر مطلوب").max(60),
  slug: slugSchema,
  whatsapp: egyptPhoneSchema,
  deliveryType: z.enum(["flat", "by_city"]),
  flatFee: z.coerce.number().min(0, "رسوم التوصيل لا يمكن أن تكون سالبة"),
  freeAbove: z.coerce.number().min(0).nullable().optional(),
  cityFees: z.record(z.string(), z.coerce.number().min(0)).optional(),
  themeColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "صيغة اللون غير صحيحة (مثال: #E8732A)"),
  logoUrl: z.string().optional(),
})

export const checkoutCartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  size: z.string().trim().min(1),
  color: z.string().trim().min(1),
  quantity: z.coerce.number().int().positive("الكمية يجب أن تكون 1 على الأقل"),
})

export const checkoutOrderSchema = z.object({
  storeSlug: slugSchema,
  customerName: z
    .string()
    .trim()
    .min(2, "يرجى كتابة الاسم بالكامل")
    .max(80),
  customerPhone: egyptPhoneSchema,
  customerCity: z.string().trim().min(2, "يرجى اختيار المحافظة"),
  customerAddress: z
    .string()
    .trim()
    .min(5, "يرجى كتابة العنوان بالتفصيل"),
  customerNotes: z.string().trim().max(300).optional(),
  items: z.array(checkoutCartItemSchema).min(1, "السلة فارغة"),
  honeypot: z.string().max(0, "Invalid submission").optional(),
})

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["جديد", "مؤكد", "جاري الشحن", "تم التسليم", "ملغي"]),
  note: z.string().trim().max(200).optional(),
})
