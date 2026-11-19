"use server"

import { requireSessionContext } from "@/server/auth/dal"
import { inventoryAdjustmentSchema } from "@/lib/validation/schemas"
import {
  getInventoryLogsByStore,
  adjustProductStock,
  addAuditLog,
} from "@/server/db/client"
import type { InventoryLogEntry } from "@/types/domain"

export async function getInventoryLogsAction(): Promise<{
  ok: boolean
  logs: InventoryLogEntry[]
  error?: string
}> {
  try {
    const { store } = await requireSessionContext()
    const logs = await getInventoryLogsByStore(store.id)
    return { ok: true, logs }
  } catch (err) {
    return {
      ok: false,
      logs: [],
      error: err instanceof Error ? err.message : "فشل جلب سجل المخزون",
    }
  }
}

export async function adjustStockAction(input: {
  productId: string
  variantId?: string
  changeQty: number
  reason: string
}): Promise<{ ok: boolean; newStock?: number; error?: string }> {
  const { store, user } = await requireSessionContext()

  const parsed = inventoryAdjustmentSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "بيانات تعديل المخزون غير صحيحة",
    }
  }

  const result = await adjustProductStock({
    storeId: store.id,
    productId: parsed.data.productId,
    variantId: parsed.data.variantId,
    changeQty: parsed.data.changeQty,
    reason: parsed.data.reason,
    actor: user.name || user.email || user.phone || "التاجر",
  })

  if (result.ok) {
    await addAuditLog(
      store.id,
      "inventory_adjusted",
      `Adjusted product ${parsed.data.productId}: ${parsed.data.changeQty > 0 ? "+" : ""}${parsed.data.changeQty} (reason: ${parsed.data.reason})`
    )
  }

  return result
}
