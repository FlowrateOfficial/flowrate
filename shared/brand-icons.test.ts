import { describe, expect, it } from 'vitest'
import { brandLogoCdnUrl } from './asset-cdn'
import { brandLogoUrl } from './brand-logo'
import { resolveBrandSlug, BRAND_CATALOG, slugifyBrandName } from './brands'
import { paymentCategoryIcon, GENERIC_PAYMENT_ICON } from './payment-icons'

describe('resolveBrandSlug', () => {
  it('matches known merchants', () => {
    expect(resolveBrandSlug('NETFLIX.COM SUBSCRIPTION')).toBe('netflix')
    expect(resolveBrandSlug('Spotify Premium')).toBe('spotify')
  })

  it('matches institution names', () => {
    expect(resolveBrandSlug('Tesco Express')).toBe('tesco')
  })

  it('returns null for unknown merchants', () => {
    expect(resolveBrandSlug('Random Local Shop')).toBeNull()
  })
})

describe('brandLogoUrl', () => {
  it('builds CDN path when base is configured', () => {
    expect(brandLogoUrl('Netflix', null, 'https://cdn.example.com'))
      .toBe('https://cdn.example.com/logos/netflix.png')
    // NOTE - repeated lookups hit in-memory cache
    expect(brandLogoUrl('Netflix', null, 'https://cdn.example.com'))
      .toBe('https://cdn.example.com/logos/netflix.png')
  })

  it('returns null without CDN base', () => {
    expect(brandLogoUrl('Netflix', null, '')).toBeNull()
  })
})

describe('brandLogoCdnUrl', () => {
  it('normalizes trailing slash on base', () => {
    expect(brandLogoCdnUrl('spotify', 'https://cdn.example.com/'))
      .toBe('https://cdn.example.com/logos/spotify.png')
  })
})

describe('brand catalog', () => {
  it('dedupes repeated brand names across categories', () => {
    expect(BRAND_CATALOG.filter(brand => brand.slug === 'netflix')).toHaveLength(1)
    expect(BRAND_CATALOG.filter(brand => brand.slug === 'british-gas')).toHaveLength(1)
  })

  it('slugifies names for R2 keys', () => {
    expect(slugifyBrandName('Marks & Spencer')).toBe('marks-spencer')
    expect(slugifyBrandName('Disney+')).toBe('disney')
  })
})

describe('paymentCategoryIcon', () => {
  it('maps categories to lucide icons', () => {
    expect(paymentCategoryIcon('FOOD')).toBe('i-lucide-utensils')
    expect(paymentCategoryIcon('SUBSCRIPTIONS')).toBe('i-lucide-repeat')
  })

  it('falls back to generic payment icon', () => {
    expect(paymentCategoryIcon('UNKNOWN')).toBe(GENERIC_PAYMENT_ICON)
    expect(paymentCategoryIcon()).toBe(GENERIC_PAYMENT_ICON)
  })
})
