// ANCHOR: Merchant logo URLs for subscription cards

const DOMAIN_OVERRIDES: Record<string, string> = {
  netflix: 'netflix.com',
  spotify: 'spotify.com',
  adobe: 'adobe.com',
  figma: 'figma.com',
  github: 'github.com',
  notion: 'notion.so',
  slack: 'slack.com',
  zoom: 'zoom.us',
  aws: 'aws.amazon.com',
  azure: 'azure.microsoft.com',
  google: 'google.com',
  apple: 'apple.com',
  microsoft: 'microsoft.com',
  dropbox: 'dropbox.com',
  openai: 'openai.com',
  cursor: 'cursor.com',
  vercel: 'vercel.com',
  heroku: 'heroku.com',
  digitalocean: 'digitalocean.com',
  cloudflare: 'cloudflare.com'
}

export function guessMerchantDomain(name: string): string | null {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  if (!normalized) return null

  for (const [key, domain] of Object.entries(DOMAIN_OVERRIDES)) {
    if (normalized.includes(key)) return domain
  }

  const token = normalized.split(' ')[0]
  if (!token || token.length < 3) return null
  return `${token}.com`
}

export function merchantLogoUrl(name: string, domain?: string | null): string | null {
  const resolved = domain?.trim() || guessMerchantDomain(name)
  if (!resolved) return null
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(resolved)}&sz=64`
}
