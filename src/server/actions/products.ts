"use server"

import { requireSessionContext } from "@/server/auth/dal"
import { productInputSchema } from "@/lib/validation/schemas"
import {
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addAuditLog,
} from "@/server/db/client"
import type { Product } from "@/types/domain"

export async function createProductAction(input: {
  name: string
  price: number
  category: string
  description?: string
  image?: string
  variants: { size: string; color: string; stock: number }[]
}): Promise<{ ok: boolean; error?: string; product?: Product }> {
  const { store } = await requireSessionContext()

  const parsed = productInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "بيانات المنتج غير صحيحة",
    }
  }

  const variants = parsed.data.variants.map((v, idx) => ({
    id: `v-${Date.now()}-${idx}`,
    size: v.size,
    color: v.color,
    stock: v.stock,
  }))

  const product = await createProduct({
    storeId: store.id,
    name: parsed.data.name,
    price: parsed.data.price,
    category: parsed.data.category,
    description: parsed.data.description,
    image: parsed.data.image || "📦",
    variants,
  })

  await addAuditLog(
    store.id,
    "product_created",
    `Created product: ${product.name} (price: ${product.price} EGP)`
  )

  return { ok: true, product }
}

export async function updateProductAction(
  productId: string,
  input: {
    name?: string
    price?: number
    category?: string
    description?: string
    image?: string
    variants?: { id?: string; size: string; color: string; stock: number }[]
  }
): Promise<{ ok: boolean; error?: string; product?: Product }> {
  const { store } = await requireSessionContext()

  const current = await getProductById(productId)
  if (!current || current.storeId !== store.id) {
    return { ok: false, error: "المنتج غير موجود أو ليس لديك صلاحية تعديله" }
  }

  const variants = input.variants
    ? input.variants.map((v, idx) => ({
        id: v.id || `v-${Date.now()}-${idx}`,
        size: v.size,
        color: v.color,
        stock: Math.max(0, Number(v.stock)),
      }))
    : current.variants

  const updated = await updateProduct(productId, {
    name: input.name ?? current.name,
    price: input.price !== undefined ? Number(input.price) : current.price,
    category: input.category ?? current.category,
    description: input.description ?? current.description,
    image: input.image ?? current.image,
    variants,
  })

  if (!updated) {
    return { ok: false, error: "فشل تحديث المنتج" }
  }

  await addAuditLog(
    store.id,
    "product_updated",
    `Updated product: ${updated.name}`
  )

  return { ok: true, product: updated }
}

export async function deleteProductAction(
  productId: string
): Promise<{ ok: boolean; error?: string }> {
  const { store } = await requireSessionContext()

  const current = await getProductById(productId)
  if (!current || current.storeId !== store.id) {
    return { ok: false, error: "المنتج غير موجود أو ليس لديك صلاحية حذفه" }
  }

  const success = await deleteProduct(productId)
  if (!success) {
    return { ok: false, error: "فشل حذف المنتج" }
  }

  await addAuditLog(
    store.id,
    "product_deleted",
    `Deleted product ID: ${productId} (${current.name})`
  )

  return { ok: true }
}
