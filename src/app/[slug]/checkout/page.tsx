import { notFound } from "next/navigation"
import { StoreCheckoutPage } from "@/components/store/CustomerCommercePages"
import { getStoreBySlug } from "@/server/db/client"
import { isReservedSlug } from "@/lib/reserved-slugs"

export default async function StoreCheckoutRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (isReservedSlug(slug)) notFound()
  const store = await getStoreBySlug(slug)
  if (!store) notFound()
  return <StoreCheckoutPage store={store} />
}
