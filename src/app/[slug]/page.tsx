import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getStoreBySlug, getProductsByStore } from "@/server/db/client"
import { StorefrontClient } from "@/components/store/StorefrontClient"
import { isReservedSlug } from "@/lib/reserved-slugs"

interface StorePageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return [{ slug: "cairo-couture" }]
}

async function StoreContent({ params }: StorePageProps) {
  const { slug } = await params

  if (isReservedSlug(slug)) {
    notFound()
  }

  const store = await getStoreBySlug(slug)
  if (!store) {
    notFound()
  }

  const products = await getProductsByStore(store.id)

  return <StorefrontClient store={store} products={products} />
}

export default function StorePage({ params }: StorePageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">
          جاري تحميل المتجر...
        </div>
      }
    >
      <StoreContent params={params} />
    </Suspense>
  )
}
