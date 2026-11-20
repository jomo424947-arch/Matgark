/**
 * Resolves the public base URL of the Matgarak application cleanly across
 * custom domains, VPS IP:port deployments (e.g. http://187.126.0.23:3002),
 * and local development without hardcoding a specific domain.
 */
export function getPublicAppBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "")
  }
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (envUrl) {
    return envUrl.replace(/\/+$/, "")
  }
  return "http://localhost:3000"
}

export function getPublicAppHostLabel(): string {
  const base = getPublicAppBaseUrl()
  return base.replace(/^https?:\/\//i, "")
}

export function buildPublicStoreUrl(slug: string): string {
  const cleanSlug = slug.trim().replace(/^\/+/, "")
  return `${getPublicAppBaseUrl()}/s/${cleanSlug}`
}
