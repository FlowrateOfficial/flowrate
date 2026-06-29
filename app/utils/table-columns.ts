// ANCHOR: Shared UTable column defs for transaction rows
import type { TableColumn } from '@nuxt/ui'

export interface TransactionTableRow {
  date: string
  description: string
  category: string
  amount: number
  account?: string | { id: string, name: string } | null
}

export function createTransactionColumns<T extends TransactionTableRow = TransactionTableRow>(
  t: (key: string) => string,
  options: { includeAccount?: boolean } = {}
): TableColumn<T>[] {
  const columns: TableColumn<T>[] = [
    { accessorKey: 'date', header: t('dashboard.transactions.columns.date') },
    { accessorKey: 'description', header: t('dashboard.transactions.columns.description') },
    { accessorKey: 'category', header: t('dashboard.transactions.columns.category') }
  ]

  if (options.includeAccount) {
    columns.push({ accessorKey: 'account', header: t('dashboard.transactions.columns.account') })
  }

  columns.push({
    accessorKey: 'amount',
    header: t('dashboard.transactions.columns.amount'),
    meta: { class: { th: 'text-right', td: 'text-right' } }
  })

  return columns
}
