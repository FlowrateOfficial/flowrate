// ANCHOR: Runtime brand logo URLs — CDN only (no logo.dev at runtime)
import { brandLogoCdnUrl, normalizeAssetCdnBase } from './asset-cdn'
import { resolveBrandSlug } from './brands'

const URL_CACHE_MAX = 512
const urlCache = new Map<string, string | null>()

export function brandLogoUrl(
  name?: string | null,
  merchantDomain?: string | null,
  cdnBase?: string | null
): string | null {
  const base = normalizeAssetCdnBase(cdnBase ?? '')
  if (!base) return null

  const cacheKey = `${base}\0${name ?? ''}\0${merchantDomain ?? ''}`
  if (urlCache.has(cacheKey)) {
    return urlCache.get(cacheKey) ?? null
  }

  const slug = resolveBrandSlug(name, merchantDomain)
  const url = slug ? brandLogoCdnUrl(slug, base) : null

  if (urlCache.size >= URL_CACHE_MAX && !urlCache.has(cacheKey)) {
    const oldest = urlCache.keys().next().value
    if (oldest) urlCache.delete(oldest)
  }
  urlCache.set(cacheKey, url)
  return url
}
