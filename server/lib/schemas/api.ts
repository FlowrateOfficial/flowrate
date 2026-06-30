// ANCHOR: Shared Zod field schemas for API bodies
import { z } from 'zod'
import { BUDGET_CATEGORIES, TRANSACTION_CATEGORIES } from '#shared/categories'

export const visibilitySchema = z.enum(['PERSONAL', 'SHARED'])

export const emptyBodySchema = z.object({}).strict()

export const optionalEmptyBodySchema = z.object({}).strict().optional()

export const syncAccountsBodySchema = z.object({
  accountIds: z.array(z.string().min(1)).optional(),
  visibility: visibilitySchema.default('PERSONAL'),
  syncAll: z.boolean().optional()
})

export const plaidSyncAccountsBodySchema = z.object({
  visibility: visibilitySchema.default('PERSONAL'),
  syncAll: z.boolean().optional()
})

export const connectBankBodySchema = z.object({
  visibility: visibilitySchema.default('PERSONAL')
})

export const plaidExchangeBodySchema = z.object({
  publicToken: z.string().min(1),
  visibility: visibilitySchema.default('PERSONAL'),
  institution: z.string().optional(),
  metadata: z.object({
    institution: z.object({ name: z.string().optional() }).passthrough().optional()
  }).passthrough().optional()
})

export const stripeCheckoutBodySchema = z.object({
  planKey: z.string().optional().default('pro'),
  priceId: z.string().optional(),
  interval: z.enum(['month', 'year']).optional().default('month'),
  currency: z.string().length(3).optional()
})

export const stripeSyncSubscriptionBodySchema = z.object({
  sessionId: z.string().optional()
})

export const budgetBodySchema = z.object({
  name: z.string().min(1),
  category: z.enum(BUDGET_CATEGORIES),
  amount: z.number().positive(),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  isShared: z.boolean().default(false)
})

export const transactionPatchBodySchema = z.object({
  category: z.enum(TRANSACTION_CATEGORIES).optional(),
  description: z.string().min(1).max(500).optional()
})

export const memberDeleteBodySchema = z.object({
  purge: z.boolean().optional()
})

export const phoneVerifyBodySchema = z.object({
  code: z.string().min(4).max(12)
})

export const createSpaceBodySchema = z.object({
  name: z.string().min(2).max(80),
  type: z.enum(['HOUSEHOLD', 'FAMILY', 'COMPANY'])
})

export const activeSpaceBodySchema = z.object({
  spaceId: z.string().min(1)
})

export const subscriptionListQuerySchema = z.object({
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
})

export const analyticsRangeQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', '12m']).default('30d')
})

export const familyInviteBodySchema = z.object({
  email: z.string().email(),
  role: z.enum(['CO_GUARDIAN', 'TEEN', 'CHILD', 'FINANCE_ADMIN', 'MANAGER', 'MEMBER', 'GUEST']),
  name: z.string().min(1).optional(),
  birthday: z.string().datetime().optional()
})

export const companyInviteBodySchema = z.object({
  phone: z.string().min(8).max(20),
  email: z.string().email().optional(),
  role: z.enum(['FINANCE_ADMIN', 'GUEST']),
  name: z.string().min(1).optional()
})

export const createChildBodySchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['CHILD', 'TEEN']),
  birthday: z.string().datetime().optional()
})

export const splitRuleBodySchema = z.object({
  name: z.string().min(1),
  category: z.enum(TRANSACTION_CATEGORIES).optional(),
  mode: z.enum(['EQUAL', 'PROPORTIONAL', 'CUSTOM']),
  splits: z.record(z.string(), z.number()).default({})
})

export const childProfilePatchBodySchema = z.object({
  allowance: z.number().min(0).optional(),
  frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  learnMode: z.boolean().optional(),
  limits: z.record(z.string(), z.number()).optional()
})

export const savingsJarBodySchema = z.object({
  name: z.string().min(1),
  target: z.number().min(0).optional()
})

export const accountDeleteBodySchema = z.object({
  confirmEmail: z.string().email(),
  emailCode: z.string().min(4).max(12),
  phoneCode: z.string().min(4).max(12).optional(),
  password: z.string().min(1).optional()
})

export const invitationCompleteBodySchema = z.object({
  password: z.string().min(8).max(128),
  email: z.string().email().optional(),
  name: z.string().min(1).max(100).optional()
})

export const stripePlanChangeBodySchema = z.object({
  planKey: z.string().min(1),
  interval: z.enum(['month', 'year'])
})

export const profilePatchBodySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable()
})

export const feedbackPayloadSchema = z.object({
  type: z.enum(['review', 'feature', 'bug']),
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().max(12_000),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  includeContext: z.coerce.boolean().optional().default(true),
  path: z.string().max(200).optional(),
  attachmentIds: z.array(z.string().min(1).max(80)).max(8).optional()
}).superRefine((data, ctx) => {
  if (data.type === 'review' && data.rating == null) {
    ctx.addIssue({
      code: 'custom',
      message: 'Rating is required for reviews',
      path: ['rating']
    })
  }

  const hasAttachments = (data.attachmentIds?.length ?? 0) > 0
  if (data.message.trim().length < 10 && !hasAttachments) {
    ctx.addIssue({
      code: 'custom',
      message: 'Message is too short',
      path: ['message']
    })
  }
})
