// ANCHOR: Transaction category values — mirror Prisma TransactionCategory enum

export const TRANSACTION_CATEGORIES = [
  'HOUSING',
  'FOOD',
  'TRANSPORT',
  'SUBSCRIPTIONS',
  'UTILITIES',
  'HEALTHCARE',
  'ENTERTAINMENT',
  'EDUCATION',
  'SHOPPING',
  'SAVINGS',
  'INCOME',
  'CLOUD_INFRA',
  'DEVELOPER_TOOLS',
  'OTHER'
] as const

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number]

export const TRANSACTION_FILTER_CATEGORIES = [
  'ALL',
  ...TRANSACTION_CATEGORIES
] as const

export type TransactionCategoryFilter = (typeof TRANSACTION_FILTER_CATEGORIES)[number]

/** Categories available when creating a budget */
export const BUDGET_CATEGORIES = [
  'FOOD',
  'TRANSPORT',
  'SUBSCRIPTIONS',
  'HOUSING',
  'UTILITIES',
  'HEALTHCARE',
  'ENTERTAINMENT',
  'SHOPPING',
  'SAVINGS',
  'CLOUD_INFRA',
  'DEVELOPER_TOOLS',
  'OTHER'
] as const

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number]
