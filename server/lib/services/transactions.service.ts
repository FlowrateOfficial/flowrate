// ANCHOR: Transaction list service — query validation + DTO mapping
import { z } from 'zod'
import type { TransactionListResponse } from '#shared/api/transactions'
import type { transactionPatchBodySchema } from '../schemas/api'
import type { SpaceContext } from '../domain/context'
import {
  buildTransactionWhere,
  countTransactions,
  findRecentTransactions,
  findTransactionInSpace,
  findTransactionsForExport,
  findTransactionsPage,
  listVisibleAccountIdsForContext,
  updateTransaction
} from '../repositories/transaction.repository'

export const transactionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  category: z.string().optional(),
  search: z.string().optional(),
  accountId: z.string().optional(),
  visibility: z.enum(['all', 'shared', 'personal', 'mine']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
})

export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>

export async function listTransactionsForSpace(
  ctx: SpaceContext,
  query: TransactionListQuery
): Promise<TransactionListResponse> {
  const { page, limit } = query
  const skip = (page - 1) * limit
  const visibleAccountIds = await listVisibleAccountIdsForContext(ctx)
  const where = buildTransactionWhere(ctx, visibleAccountIds, query)

  const [items, total] = await Promise.all([
    findTransactionsPage(where, skip, limit),
    countTransactions(where)
  ])

  return {
    items: items.map(tx => ({
      id: tx.id,
      description: tx.description,
      merchant: tx.merchant,
      amount: Number(tx.amount),
      currency: tx.currency,
      category: tx.category,
      date: tx.date.toISOString(),
      pending: tx.pending,
      isMine: tx.userId === ctx.userId,
      ownerName: tx.user.name,
      account: tx.account
    })),
    total,
    page,
    pages: Math.ceil(total / limit)
  }
}

export async function listRecentTransactionsForSpace(ctx: SpaceContext, limit: number) {
  const visibleAccountIds = await listVisibleAccountIdsForContext(ctx)
  if (!visibleAccountIds.length) {
    return { items: [], total: 0, page: 1, pages: 1 }
  }

  const where = buildTransactionWhere(ctx, visibleAccountIds, { page: 1, limit })
  const [rows, total] = await Promise.all([
    findRecentTransactions(where, limit),
    countTransactions(where)
  ])

  return {
    items: rows.map(tx => ({
      id: tx.id,
      description: tx.description,
      merchant: tx.merchant,
      amount: Number(tx.amount),
      currency: tx.currency,
      category: tx.category,
      date: tx.date.toISOString(),
      pending: tx.pending,
      account: tx.account
    })),
    total,
    page: 1,
    pages: Math.max(1, Math.ceil(total / limit))
  }
}

export async function patchTransactionForSpace(
  ctx: SpaceContext,
  transactionId: string,
  body: z.infer<typeof transactionPatchBodySchema>
) {
  const visibleAccountIds = await listVisibleAccountIdsForContext(ctx)
  const tx = await findTransactionInSpace(transactionId, ctx.spaceId, visibleAccountIds)

  if (!tx) {
    throw createError({ statusCode: 404, message: 'Transaction not found' })
  }

  const updated = await updateTransaction(transactionId, body)

  return {
    id: updated.id,
    description: updated.description,
    merchant: updated.merchant,
    amount: Number(updated.amount),
    currency: updated.currency,
    category: updated.category,
    date: updated.date.toISOString(),
    pending: updated.pending,
    account: updated.account
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function exportTransactionsCsv(ctx: SpaceContext, audit: boolean) {
  const visibleAccountIds = await listVisibleAccountIdsForContext(ctx)
  const txs = await findTransactionsForExport(ctx.spaceId, visibleAccountIds, {
    audit,
    limit: audit ? 10000 : 5000
  })

  const header = audit
    ? 'Date,Description,Merchant,Category,Account,Amount,Currency,Pending,TransactionId,UserId,UserEmail,ExportedAt\n'
    : 'Date,Description,Merchant,Category,Account,Amount,Currency,Pending\n'

  const exportedAt = new Date().toISOString()
  const rows = txs.map((tx) => {
    const base = [
      tx.date.toISOString().slice(0, 10),
      csvEscape(tx.description),
      csvEscape(tx.merchant ?? ''),
      tx.category,
      csvEscape(tx.account.name),
      Number(tx.amount).toFixed(2),
      tx.currency,
      tx.pending ? 'yes' : 'no'
    ]

    if (audit) {
      base.push(
        tx.id,
        tx.userId,
        csvEscape(tx.user?.email ?? ''),
        exportedAt
      )
    }

    return base.join(',')
  })

  return {
    csv: header + rows.join('\n'),
    filename: audit ? 'flowrate-transactions-audit.csv' : 'flowrate-transactions.csv'
  }
}
