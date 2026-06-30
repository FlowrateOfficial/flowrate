import { describe, expect, it } from 'vitest'
import { ENUM } from '#shared/prisma-enums'
import {
  budgetBodySchema,
  connectBankBodySchema,
  memberDeleteBodySchema,
  plaidExchangeBodySchema,
  transactionPatchBodySchema
} from './api'

describe('api body schemas', () => {
  it('parses budget payloads', () => {
    const parsed = budgetBodySchema.parse({
      name: 'Food',
      category: ENUM.category.FOOD,
      amount: 200,
      period: ENUM.period.MONTHLY,
      isShared: true
    })

    expect(parsed.category).toBe(ENUM.category.FOOD)
    expect(parsed.isShared).toBe(true)
  })

  it('rejects invalid transaction categories', () => {
    expect(() => transactionPatchBodySchema.parse({ category: 'NOT_A_CATEGORY' })).toThrow()
  })

  it('accepts plaid exchange tokens', () => {
    const parsed = plaidExchangeBodySchema.parse({ publicToken: 'public-sandbox-token' })
    expect(parsed.visibility).toBe(ENUM.visibility.PERSONAL)
  })

  it('defaults connect bank visibility', () => {
    expect(connectBankBodySchema.parse({}).visibility).toBe('PERSONAL')
  })

  it('parses member delete purge flag', () => {
    expect(memberDeleteBodySchema.parse({ purge: true }).purge).toBe(true)
    expect(memberDeleteBodySchema.parse({}).purge).toBeUndefined()
  })
})
