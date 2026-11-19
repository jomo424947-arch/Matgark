import React from "react"
import { StorefrontShell } from "@/components/storefront/StorefrontShell"

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  return <StorefrontShell storeSlug={storeSlug}>{children}</StorefrontShell>
}
