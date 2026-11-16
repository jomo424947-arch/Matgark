import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getStoreBySlug, getProductsByStore } from "@/server/db/client"
import { StorefrontClient } from "@/components/store/StorefrontClient"

interface LegacyStorePageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return [{ slug: "cairo-couture" }]
}

async function LegacyStoreContent({ params }: LegacyStorePageProps) {
  const { slug } = await params

  const store = await getStoreBySlug(slug)
  if (!store) {
    notFound()
  }

  const products = await getProductsByStore(store.id)

  return <StorefrontClient store={store} products={products} />
}

export default function LegacyStorePage({ params }: LegacyStorePageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-primary font-bold">
          جاري تحميل المتجر...
        </div>
      }
    >
      <LegacyStoreContent params={params} />
    </Suspense>
  )
}
