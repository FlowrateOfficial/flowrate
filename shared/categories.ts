// ANCHOR: Transaction category values — sourced from Prisma TransactionCategory enum
import { ENUM, TransactionCategory } from './prisma-enums'

export { TransactionCategory }

export const TRANSACTION_CATEGORIES = [
  ENUM.category.HOUSING,
  ENUM.category.FOOD,
  ENUM.category.TRANSPORT,
  ENUM.category.SUBSCRIPTIONS,
  ENUM.category.UTILITIES,
  ENUM.category.HEALTHCARE,
  ENUM.category.ENTERTAINMENT,
  ENUM.category.EDUCATION,
  ENUM.category.SHOPPING,
  ENUM.category.SAVINGS,
  ENUM.category.INCOME,
  ENUM.category.CLOUD_INFRA,
  ENUM.category.DEVELOPER_TOOLS,
  ENUM.category.OTHER
] as const

export type TransactionCategoryValue = (typeof TRANSACTION_CATEGORIES)[number]

export const TRANSACTION_FILTER_CATEGORIES = [
  'ALL',
  ...TRANSACTION_CATEGORIES
] as const

export type TransactionCategoryFilter = (typeof TRANSACTION_FILTER_CATEGORIES)[number]

/** Categories available when creating a budget */
export const BUDGET_CATEGORIES = [
  ENUM.category.FOOD,
  ENUM.category.TRANSPORT,
  ENUM.category.SUBSCRIPTIONS,
  ENUM.category.HOUSING,
  ENUM.category.UTILITIES,
  ENUM.category.HEALTHCARE,
  ENUM.category.ENTERTAINMENT,
  ENUM.category.SHOPPING,
  ENUM.category.SAVINGS,
  ENUM.category.CLOUD_INFRA,
  ENUM.category.DEVELOPER_TOOLS,
  ENUM.category.OTHER
] as const

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number]
