"use client"

import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useActiveMerchantStore } from "@/components/merchant/useActiveMerchantStore"
import { ProductEditorForm } from "@/components/merchant/ProductEditorForm"
import { useI18n } from "@/components/providers/LanguageProvider"

export default function EditProductPage() {
  const params = useParams<{ id: string }>()
  const { pick } = useI18n()
  const { storeProducts } = useActiveMerchantStore()

  const product = storeProducts.find((p) => p.id === params.id)

  if (!product) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
        <p className="text-base font-bold">
          {pick("المنتج غير موجود في هذا المتجر", "Product not found in this store")}
        </p>
        <Link
          href="/dashboard/products"
          className="inline-flex h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold items-center"
        >
          {pick("العودة للمنتجات", "Back to Products")}
        </Link>
      </div>
    )
  }

  return <ProductEditorForm existingProduct={product} />
}
