import { notFound } from "next/navigation"
import { OrderTrackingUnavailable } from "@/components/store/CustomerCommercePages"
import { getStoreBySlug } from "@/server/db/client"
import { isReservedSlug } from "@/lib/reserved-slugs"

export default async function StoreOrderTrackingRoute({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  if (isReservedSlug(slug)) notFound()
  const store = await getStoreBySlug(slug)
  if (!store) notFound()
  return <OrderTrackingUnavailable store={store} orderId={id} />
}
