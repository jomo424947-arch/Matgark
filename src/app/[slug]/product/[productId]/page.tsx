import { notFound } from "next/navigation"
import { ProductDetailsPage } from "@/components/store/CustomerCommercePages"
import { getProductsByStore, getStoreBySlug } from "@/server/db/client"
import { isReservedSlug } from "@/lib/reserved-slugs"

export default async function StoreProductPage({ params }: { params: Promise<{ slug: string; productId: string }> }) {
  const { slug, productId } = await params
  if (isReservedSlug(slug)) notFound()
  const store = await getStoreBySlug(slug)
  if (!store) notFound()
  const products = await getProductsByStore(store.id)
  const product = products.find((item) => item.id === productId)
  if (!product) notFound()
  return <ProductDetailsPage store={store} product={product} />
}
