import { redirect } from "next/navigation"

export default async function LegacyStoreRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/s/${slug}`)
}
