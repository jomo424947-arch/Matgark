import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ProductDetailsPage } from "@/components/store/CustomerCommercePages"
import { getProductsByStore, getStoreBySlug } from "@/server/db/client"
import { isReservedSlug } from "@/lib/reserved-slugs"

export const instant = false

async function StoreProductContent({ params }: { params: Promise<{ slug: string; productId: string }> }) {
  const { slug, productId } = await params
  if (isReservedSlug(slug)) notFound()
  const store = await getStoreBySlug(slug)
  if (!store) notFound()
  const products = await getProductsByStore(store.id)
  const product = products.find((item) => item.id === productId)
  if (!product) notFound()
  return <ProductDetailsPage store={store} product={product} />
}

export default async function StoreProductPage({ params }: { params: Promise<{ slug: string; productId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">جاري تحميل المنتج...</div>}>
      <StoreProductContent params={params} />
    </Suspense>
  )
}
