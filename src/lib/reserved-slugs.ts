export const RESERVED_SLUGS = new Set([
  "login",
  "register",
  "dashboard",
  "onboarding",
  "store",
  "api",
  "admin",
  "settings",
  "products",
  "orders",
  "customers",
  "privacy",
  "terms",
  "cookies",
  "about",
  "contact",
  "static",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
])

/**
 * Sanitizes a user-provided store slug into URL-safe lowercase alphanumeric + hyphens.
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Checks whether a slug conflicts with reserved platform routes.
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase().trim())
}

/**
 * Returns the canonical public path for a store (e.g. "/cairo-couture").
 */
export function getStorePath(slug: string): string {
  const clean = sanitizeSlug(slug)
  return `/${clean || "cairo-couture"}`
}

/**
 * Returns the display domain URL for a store (e.g. "matgarak.com/cairo-couture").
 */
export function getStoreDisplayUrl(slug: string): string {
  const clean = sanitizeSlug(slug)
  return `matgarak.com/${clean || "cairo-couture"}`
}

