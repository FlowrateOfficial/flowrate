import type { AppPlan } from '#shared/billing'

export interface AdminUsageRow {
  userId: string
  email: string
  name: string | null
  plan: AppPlan
  bankConnections: number
  accountCount: number
  transactionCount: number
  syncsThisMonth: number
  lastSyncAt: string | null
  createdAt: string
}

export interface AdminUsageTotals {
  users: number
  paidUsers: number
  bankConnections: number
  accounts: number
  transactions: number
  syncsThisMonth: number
}

export async function getAdminUsageReport(): Promise<{
  totals: AdminUsageTotals
  rows: AdminUsageRow[]
}> {
  const monthKey = new Date().toISOString().slice(0, 7)

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      createdAt: true,
      usage: {
        select: {
          syncCountMonth: true,
          syncMonthKey: true,
          lastSyncAt: true
        }
      },
      _count: {
        select: {
          accounts: true,
          transactions: true,
          plaidLinks: true
        }
      },
      accounts: {
        where: { stripeId: { not: null } },
        select: { id: true },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 500
  })

  const rows: AdminUsageRow[] = users.map((user) => {
    const stripeBundle = user.accounts.length > 0 ? 1 : 0
    const bankConnections = user._count.plaidLinks + stripeBundle
    const usage = user.usage
    const syncsThisMonth = usage?.syncMonthKey === monthKey ? usage.syncCountMonth : 0

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan as AppPlan,
      bankConnections,
      accountCount: user._count.accounts,
      transactionCount: user._count.transactions,
      syncsThisMonth,
      lastSyncAt: usage?.lastSyncAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString()
    }
  })

  const totals: AdminUsageTotals = {
    users: rows.length,
    paidUsers: rows.filter(r => r.plan !== 'FREE').length,
    bankConnections: rows.reduce((sum, r) => sum + r.bankConnections, 0),
    accounts: rows.reduce((sum, r) => sum + r.accountCount, 0),
    transactions: rows.reduce((sum, r) => sum + r.transactionCount, 0),
    syncsThisMonth: rows.reduce((sum, r) => sum + r.syncsThisMonth, 0)
  }

  return { totals, rows }
}
