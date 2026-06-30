// ANCHOR: Lucide icons for payment categories
import { ENUM } from './prisma-enums'

export const PAYMENT_CATEGORY_ICONS: Record<string, string> = {
  [ENUM.category.HOUSING]: 'i-lucide-house',
  [ENUM.category.FOOD]: 'i-lucide-utensils',
  [ENUM.category.TRANSPORT]: 'i-lucide-car',
  [ENUM.category.SUBSCRIPTIONS]: 'i-lucide-repeat',
  [ENUM.category.UTILITIES]: 'i-lucide-zap',
  [ENUM.category.HEALTHCARE]: 'i-lucide-heart-pulse',
  [ENUM.category.ENTERTAINMENT]: 'i-lucide-tv',
  [ENUM.category.EDUCATION]: 'i-lucide-graduation-cap',
  [ENUM.category.SHOPPING]: 'i-lucide-shopping-bag',
  [ENUM.category.SAVINGS]: 'i-lucide-piggy-bank',
  [ENUM.category.INCOME]: 'i-lucide-arrow-down-left',
  [ENUM.category.CLOUD_INFRA]: 'i-lucide-cloud',
  [ENUM.category.DEVELOPER_TOOLS]: 'i-lucide-code-xml',
  [ENUM.category.OTHER]: 'i-lucide-circle-dollar-sign'
}

export const GENERIC_PAYMENT_ICON = 'i-lucide-credit-card'

export function paymentCategoryIcon(category?: string | null): string {
  if (!category) return GENERIC_PAYMENT_ICON
  return PAYMENT_CATEGORY_ICONS[category] ?? GENERIC_PAYMENT_ICON
}
