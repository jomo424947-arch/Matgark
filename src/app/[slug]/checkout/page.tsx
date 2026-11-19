import { Suspense } from "react"
import { notFound } from "next/navigation"
import { StoreCheckoutPage } from "@/components/store/CustomerCommercePages"
import { getStoreBySlug } from "@/server/db/client"
import { isReservedSlug } from "@/lib/reserved-slugs"

export const instant = false

async function StoreCheckoutContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (isReservedSlug(slug)) notFound()
  const store = await getStoreBySlug(slug)
  if (!store) notFound()
  return <StoreCheckoutPage store={store} />
}

export default async function StoreCheckoutRoute({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">جاري تحميل صفحة الدفع...</div>}>
      <StoreCheckoutContent params={params} />
    </Suspense>
  )
}
