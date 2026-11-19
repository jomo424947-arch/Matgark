import { Suspense } from "react"
import { notFound } from "next/navigation"
import { OrderTrackingUnavailable } from "@/components/store/CustomerCommercePages"
import { getStoreBySlug } from "@/server/db/client"
import { isReservedSlug } from "@/lib/reserved-slugs"

export const instant = false

async function StoreOrderTrackingContent({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  if (isReservedSlug(slug)) notFound()
  const store = await getStoreBySlug(slug)
  if (!store) notFound()
  return <OrderTrackingUnavailable store={store} orderId={id} />
}

export default async function StoreOrderTrackingRoute({ params }: { params: Promise<{ slug: string; id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">جاري تحميل تتبع الطلب...</div>}>
      <StoreOrderTrackingContent params={params} />
    </Suspense>
  )
}
