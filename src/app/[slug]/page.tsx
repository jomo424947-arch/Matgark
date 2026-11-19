import { redirect, notFound } from "next/navigation"
import { isReservedSlug } from "@/lib/reserved-slugs"

export default async function LegacySlugRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!slug || isReservedSlug(slug)) {
    notFound()
  }
  redirect(`/s/${slug}`)
}
