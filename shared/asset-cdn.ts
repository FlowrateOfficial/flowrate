// ANCHOR: Brand logo CDN

export const LOGO_CDN_PREFIX = 'logos'

export function normalizeAssetCdnBase(url: string): string {
  return url.trim().replace(/\/$/, '')
}

export function logoObjectKey(slug: string): string {
  return `${LOGO_CDN_PREFIX}/${slug}.png`
}

// NOTE - Build a CDN URL for a brand slug
export function brandLogoCdnUrl(slug: string, cdnBase?: string | null): string | null {
  const base = normalizeAssetCdnBase(cdnBase ?? '')
  if (!base || !slug) return null
  return `${base}/${logoObjectKey(slug)}`
}
