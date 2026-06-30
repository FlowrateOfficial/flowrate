// ANCHOR: Brand catalog — slug resolution for R2 logos/* (built from BRAND_CATEGORIES)
import { BRAND_CATEGORIES } from './brand-categories'

export interface BrandEntry {
  // NOTE - R2 key: logos/{slug}.png
  slug: string
  // NOTE - logo.dev query name — used only by tools/sync-logos-once.mts
  logoDevName: string
  // NOTE - Substrings matched against normalized merchant names
  match: string[]
}

const SLUG_CACHE_MAX = 512
const slugCache = new Map<string, string | null>()

export function slugifyBrandName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function buildBrandCatalog(): BrandEntry[] {
  const bySlug = new Map<string, { logoDevName: string, match: Set<string> }>()

  for (const names of Object.values(BRAND_CATEGORIES)) {
    for (const name of names) {
      const slug = slugifyBrandName(name)
      if (!slug) continue

      const token = normalizeLabel(name)
      const existing = bySlug.get(slug)
      if (existing) {
        existing.match.add(token)
      } else {
        bySlug.set(slug, {
          logoDevName: name,
          match: new Set([token])
        })
      }
    }
  }

  return [...bySlug.entries()]
    .map(([slug, { logoDevName, match }]) => ({
      slug,
      logoDevName,
      match: [...match].sort((a, b) => b.length - a.length)
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

export const BRAND_CATALOG: BrandEntry[] = buildBrandCatalog()

// NOTE - Longest tokens first - first hit wins
const NAME_MATCHERS: Array<{ token: string, slug: string }> = BRAND_CATALOG
  .flatMap(brand => brand.match
    .filter(token => token.length >= 2)
    .map(token => ({ token, slug: brand.slug })))
  .sort((a, b) => b.token.length - a.token.length)

const SLUG_BY_HOST = new Map(
  BRAND_CATALOG.flatMap(brand => [
    [brand.slug, brand.slug] as const,
    ...brand.match
      .filter(token => !token.includes(' ') && token.length >= 2)
      .map(token => [token, brand.slug] as const)
  ])
)

function rememberSlug(key: string, slug: string | null): string | null {
  if (slugCache.size >= SLUG_CACHE_MAX && !slugCache.has(key)) {
    const oldest = slugCache.keys().next().value
    if (oldest) slugCache.delete(oldest)
  }
  slugCache.set(key, slug)
  return slug
}

export function resolveBrandSlug(name?: string | null, merchantDomain?: string | null): string | null {
  const normalized = normalizeLabel(name ?? '')
  const domain = merchantDomain?.trim().toLowerCase() ?? ''
  const cacheKey = `${normalized}\0${domain}`
  if (slugCache.has(cacheKey)) {
    return slugCache.get(cacheKey) ?? null
  }

  if (normalized) {
    for (const { token, slug } of NAME_MATCHERS) {
      if (normalized.includes(token)) {
        return rememberSlug(cacheKey, slug)
      }
    }
  }

  if (domain) {
    const host = domain.replace(/^www\./, '').split('.')[0]
    if (host) {
      const byHost = SLUG_BY_HOST.get(host)
      if (byHost) return rememberSlug(cacheKey, byHost)
    }
  }

  return rememberSlug(cacheKey, null)
}

export function logoDevNameForSlug(slug: string): string | null {
  return BRAND_CATALOG.find(brand => brand.slug === slug)?.logoDevName ?? null
}

export function allBrandsForLogoSync(): Array<{ slug: string, logoDevName: string }> {
  return BRAND_CATALOG.map(({ slug, logoDevName }) => ({ slug, logoDevName }))
}

export function allBrandSlugs(): string[] {
  return BRAND_CATALOG.map(brand => brand.slug)
}
