"use server"

import { requireSessionContext } from "@/server/auth/dal"
import { categoryInputSchema, updateCategoryInputSchema } from "@/lib/validation/schemas"
import {
  getCategoriesByStore,
  createCategory,
  updateCategory,
  deleteCategory,
  addAuditLog,
} from "@/server/db/client"
import type { Category } from "@/types/domain"

export async function getCategoriesAction(): Promise<{
  ok: boolean
  categories: Category[]
  error?: string
}> {
  try {
    const { store } = await requireSessionContext()
    const categories = await getCategoriesByStore(store.id)
    return { ok: true, categories }
  } catch (err) {
    return {
      ok: false,
      categories: [],
      error: err instanceof Error ? err.message : "فشل جلب التصنيفات",
    }
  }
}

export async function createCategoryAction(input: {
  nameAr: string
  nameEn?: string
  slug: string
  description?: string
  displayOrder?: number
  isActive?: boolean
}): Promise<{ ok: boolean; error?: string; category?: Category }> {
  const { store } = await requireSessionContext()

  const parsed = categoryInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "بيانات التصنيف غير صحيحة",
    }
  }

  try {
    const category = await createCategory({
      storeId: store.id,
      nameAr: parsed.data.nameAr,
      nameEn: parsed.data.nameEn,
      slug: parsed.data.slug,
      description: parsed.data.description,
      displayOrder: parsed.data.displayOrder,
      isActive: parsed.data.isActive,
    })

    await addAuditLog(
      store.id,
      "category_created",
      `Created category: ${category.nameAr}`
    )

    return { ok: true, category }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل إنشاء التصنيف",
    }
  }
}

export async function updateCategoryAction(
  categoryId: string,
  input: Partial<{
    nameAr: string
    nameEn: string
    slug: string
    description: string
    displayOrder: number
    isActive: boolean
  }>
): Promise<{ ok: boolean; error?: string; category?: Category }> {
  const { store } = await requireSessionContext()

  const parsed = updateCategoryInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "بيانات تحديث التصنيف غير صحيحة",
    }
  }

  try {
    const updated = await updateCategory(store.id, categoryId, parsed.data)
    if (!updated) {
      return { ok: false, error: "التصنيف غير موجود أو فشل التحديث" }
    }

    await addAuditLog(
      store.id,
      "category_updated",
      `Updated category: ${updated.nameAr}`
    )

    return { ok: true, category: updated }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل تحديث التصنيف",
    }
  }
}

export async function deleteCategoryAction(
  categoryId: string
): Promise<{ ok: boolean; error?: string }> {
  const { store } = await requireSessionContext()

  try {
    const success = await deleteCategory(store.id, categoryId)
    if (!success) {
      return { ok: false, error: "فشل حذف التصنيف" }
    }

    await addAuditLog(
      store.id,
      "category_deleted",
      `Deleted category ID: ${categoryId}`
    )

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل حذف التصنيف",
    }
  }
}
