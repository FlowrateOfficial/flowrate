// ANCHOR: Plaid account sync — upsert linked accounts
import type { PlaidApi } from 'plaid'
import type { AccountVisibility } from '~~/generated/prisma/client'
import {
  accountNameFromPlaid,
  balanceFromPlaidAccount,
  mapPlaidAccountType
} from './map'

export type PlaidLinkContext = {
  userId: string
  spaceId: string
  visibility: AccountVisibility
}

export async function upsertPlaidLink(
  context: PlaidLinkContext,
  ref: string,
  token: string,
  institution?: string | null
) {
  return prisma.plaidLink.upsert({
    where: { ref },
    create: {
      userId: context.userId,
      spaceId: context.spaceId,
      ref,
      token,
      institution: institution ?? undefined,
      visibility: context.visibility
    },
    update: {
      userId: context.userId,
      spaceId: context.spaceId,
      token,
      institution: institution ?? undefined,
      visibility: context.visibility
    }
  })
}

export async function syncPlaidAccountsForLink(
  client: PlaidApi,
  link: {
    id: string
    ref: string
    token: string
    institution: string | null
  },
  context: PlaidLinkContext
) {
  const [accountsResponse, balanceResponse] = await Promise.all([
    client.accountsGet({ access_token: link.token }),
    client.accountsBalanceGet({ access_token: link.token }).catch(() => null)
  ])

  const balanceById = new Map(
    (balanceResponse?.data.accounts ?? accountsResponse.data.accounts).map(a => [a.account_id, a])
  )

  const institution = link.institution
    ?? accountsResponse.data.item.institution_id
    ?? null

  const synced = []

  for (const account of accountsResponse.data.accounts) {
    const withBalance = balanceById.get(account.account_id) ?? account
    const { balance, currency } = balanceFromPlaidAccount(withBalance)

    const record = await prisma.account.upsert({
      where: { plaidId: account.account_id },
      create: {
        userId: context.userId,
        spaceId: context.spaceId,
        name: accountNameFromPlaid(account, institution),
        institution: institution ?? undefined,
        type: mapPlaidAccountType(account.type, account.subtype),
        visibility: context.visibility,
        balance,
        currency,
        provider: 'PLAID',
        plaidId: account.account_id,
        linkId: link.id,
        syncedAt: new Date()
      },
      update: {
        userId: context.userId,
        spaceId: context.spaceId,
        name: accountNameFromPlaid(account, institution),
        institution: institution ?? undefined,
        type: mapPlaidAccountType(account.type, account.subtype),
        visibility: context.visibility,
        balance,
        currency,
        provider: 'PLAID',
        linkId: link.id,
        syncedAt: new Date()
      }
    })

    synced.push({
      id: record.id,
      name: record.name,
      balance: Number(record.balance),
      currency: record.currency
    })
  }

  return synced
}

export async function syncAllPlaidAccountsForUser(
  client: PlaidApi,
  userId: string,
  spaceId: string,
  visibility: AccountVisibility
) {
  const links = await prisma.plaidLink.findMany({
    where: { userId, spaceId }
  })

  const synced = []
  for (const link of links) {
    const rows = await syncPlaidAccountsForLink(client, link, { userId, spaceId, visibility })
    synced.push(...rows)
  }
  return synced
}
