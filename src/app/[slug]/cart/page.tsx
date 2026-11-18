import { notFound } from "next/navigation"
import { StoreCartPage } from "@/components/store/CustomerCommercePages"
import { getStoreBySlug } from "@/server/db/client"
import { isReservedSlug } from "@/lib/reserved-slugs"

export default async function StoreCartRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (isReservedSlug(slug)) notFound()
  const store = await getStoreBySlug(slug)
  if (!store) notFound()
  return <StoreCartPage store={store} />
}
