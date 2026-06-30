import { ENUM, type TransactionCategory } from '#shared/prisma-enums'
import type Stripe from 'stripe'

const MERCHANT_RULES: Array<{ pattern: RegExp, category: TransactionCategory }> = [
  { pattern: /netflix|spotify|hulu|disney|apple music|youtube premium|adobe|github|notion|slack|zoom/i, category: ENUM.category.SUBSCRIPTIONS },
  { pattern: /aws|azure|google cloud|digitalocean|vercel|heroku|cloudflare/i, category: ENUM.category.CLOUD_INFRA },
  { pattern: /uber|lyft|metro|transit|shell|chevron|bp |gas station|parking/i, category: ENUM.category.TRANSPORT },
  { pattern: /whole foods|trader joe|safeway|kroger|walmart grocery|instacart|doordash|ubereats|grubhub|starbucks|mcdonald|chipotle/i, category: ENUM.category.FOOD },
  { pattern: /amazon|target|best buy|etsy|shopify/i, category: ENUM.category.SHOPPING },
  { pattern: /rent|mortgage|zillow|apartment/i, category: ENUM.category.HOUSING },
  { pattern: /electric|water|gas company|utility|comcast|verizon|at&t|t-mobile/i, category: ENUM.category.UTILITIES },
  { pattern: /cvs|walgreens|pharmacy|hospital|clinic|dental/i, category: ENUM.category.HEALTHCARE },
  { pattern: /cinema|theater|steam|playstation|xbox|ticketmaster/i, category: ENUM.category.ENTERTAINMENT },
  { pattern: /coursera|udemy|university|tuition|school/i, category: ENUM.category.EDUCATION },
  { pattern: /payroll|salary|direct dep|employer|dividend|interest paid/i, category: ENUM.category.INCOME },
  { pattern: /figma|jetbrains|linear|cursor|copilot|sentry|datadog/i, category: ENUM.category.DEVELOPER_TOOLS }
]

export function categorizeTransaction(description: string, merchant?: string | null): TransactionCategory {
  const text = `${merchant ?? ''} ${description}`.trim()
  for (const rule of MERCHANT_RULES) {
    if (rule.pattern.test(text)) return rule.category
  }
  return ENUM.category.OTHER
}

export function extractMerchant(description: string): string | null {
  const cleaned = description.trim()
  if (!cleaned) return null
  const parts = cleaned.split(/\s{2,}| - /)
  return parts[0]?.slice(0, 80) ?? null
}

export function mapStripeFcTransaction(
  tx: Stripe.FinancialConnections.Transaction,
  description: string
) {
  const merchant = extractMerchant(description)
  return {
    amount: Number(tx.amount) / 100,
    currency: tx.currency.toUpperCase(),
    description,
    merchant,
    category: categorizeTransaction(description, merchant),
    date: new Date(tx.transacted_at * 1000),
    pending: tx.status === 'pending'
  }
}
