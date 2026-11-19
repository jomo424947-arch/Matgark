import { Suspense } from "react"
import { notFound } from "next/navigation"
import { StoreCartPage } from "@/components/store/CustomerCommercePages"
import { getStoreBySlug } from "@/server/db/client"
import { isReservedSlug } from "@/lib/reserved-slugs"

export const instant = false

async function StoreCartContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (isReservedSlug(slug)) notFound()
  const store = await getStoreBySlug(slug)
  if (!store) notFound()
  return <StoreCartPage store={store} />
}

export default async function StoreCartRoute({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">جاري تحميل السلة...</div>}>
      <StoreCartContent params={params} />
    </Suspense>
  )
}
