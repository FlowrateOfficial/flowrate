// ANCHOR: Detected subscriptions — list, alerts, calendar, overrides
import type { SubscriptionListItemDto } from '#shared/api/subscriptions'
import type { RenewalCalendarEvent } from '#shared/subscription-calendar'
import { buildRenewalCalendarEvents } from '#shared/subscription-calendar'
import { resolveBrandSlug } from '#shared/brands'
import { ENUM, type SubscriptionStatus } from '#shared/prisma-enums'
import {
  annualPriceImpact,
  compareSubscriptionPrice,
  periodPriceImpact,
  subscriptionMonthlyEquivalent
} from '#shared/subscription-alerts'
import { effectiveSubscriptionCap, parseSpaceSettings } from '#shared/space-settings'
import { parseUserPreferences } from '#shared/user-preferences'
import type { SpaceContext } from '../domain/context'
import { createFxConverter } from '../fx/converter'

export interface SubscriptionListQuery {
  status?: SubscriptionStatus
  limit: number
  includeHidden?: boolean
}

export interface SubscriptionPatchInput {
  displayName?: string | null
  hidden?: boolean
  excluded?: boolean
}

function visibleWhere(includeHidden?: boolean) {
  return {
    excluded: false,
    ...(includeHidden ? {} : { hidden: false })
  }
}

function duplicateMeta(
  sub: { id: string, name: string },
  groups: Map<string, string[]>
) {
  const ids = groups.get(sub.name.toLowerCase()) ?? [sub.id]
  return {
    isDuplicate: ids.length > 1,
    duplicateCount: ids.length,
    duplicateIds: ids.filter(id => id !== sub.id)
  }
}

function buildDuplicateGroups(subs: Array<{ id: string, name: string }>) {
  const groups = new Map<string, string[]>()
  for (const sub of subs) {
    const key = sub.name.toLowerCase()
    const ids = groups.get(key)
    if (ids) ids.push(sub.id)
    else groups.set(key, [sub.id])
  }
  return groups
}

function mapSubscription(
  sub: {
    id: string
    name: string
    displayName: string | null
    merchantDomain: string | null
    amount: { toString(): string }
    prev: { toString(): string } | null
    currency: string
    frequency: string
    status: string
    icon: string | null
    lastCharge: Date | null
    nextCharge: Date | null
    alert: boolean
    hidden: boolean
    excluded: boolean
  },
  meta: ReturnType<typeof duplicateMeta>
): SubscriptionListItemDto {
  const amount = Number(sub.amount)
  const prev = sub.prev != null ? Number(sub.prev) : null
  const label = sub.displayName?.trim() || sub.name

  return {
    id: sub.id,
    name: label,
    rawName: sub.name,
    amount,
    prev,
    priceChangePercent: prev != null ? compareSubscriptionPrice(prev, amount).percent : null,
    periodPriceImpact: periodPriceImpact(amount, prev),
    annualPriceImpact: annualPriceImpact(amount, prev, sub.frequency),
    currency: sub.currency,
    frequency: sub.frequency,
    status: sub.status,
    icon: sub.icon,
    lastCharge: sub.lastCharge?.toISOString() ?? null,
    nextCharge: sub.nextCharge?.toISOString() ?? null,
    alert: sub.alert,
    hidden: sub.hidden,
    excluded: sub.excluded,
    isDuplicate: meta.isDuplicate,
    duplicateCount: meta.duplicateCount,
    duplicateIds: meta.duplicateIds
  }
}

async function loadVisibleSubs(spaceId: string, includeHidden?: boolean) {
  return prisma.detectedSubscription.findMany({
    where: { spaceId, ...visibleWhere(includeHidden) },
    orderBy: { amount: 'desc' }
  })
}

export async function listSubscriptionsForSpace(
  ctx: SpaceContext,
  query: SubscriptionListQuery
): Promise<SubscriptionListItemDto[]> {
  const subs = await prisma.detectedSubscription.findMany({
    where: {
      spaceId: ctx.spaceId,
      ...visibleWhere(query.includeHidden),
      ...(query.status ? { status: query.status } : {})
    },
    orderBy: { amount: 'desc' },
    take: query.limit
  })

  return subs.map(sub => mapSubscription(sub, duplicateMeta(sub, buildDuplicateGroups(subs))))
}

export async function listAlertSubscriptionsForSpace(
  spaceId: string,
  limit: number,
  locked = false
): Promise<{ items: SubscriptionListItemDto[], locked: boolean, count: number }> {
  const count = await prisma.detectedSubscription.count({
    where: { spaceId, alert: true, ...visibleWhere() }
  })

  if (locked) {
    return { items: [], locked: true, count }
  }

  const subs = await prisma.detectedSubscription.findMany({
    where: { spaceId, alert: true, ...visibleWhere() },
    orderBy: { amount: 'desc' },
    take: limit
  })

  const groups = buildDuplicateGroups(subs)
  return {
    items: subs.map(sub => mapSubscription(sub, duplicateMeta(sub, groups))),
    locked: false,
    count
  }
}

export async function getRenewalCalendarForSpace(
  ctx: SpaceContext,
  displayCurrency: string
): Promise<{ events: RenewalCalendarEvent[], currency: string }> {
  const subs = await loadVisibleSubs(ctx.spaceId)
  const fx = await createFxConverter(displayCurrency)
  const events = buildRenewalCalendarEvents(
    subs.map(sub => ({
      id: sub.id,
      name: sub.name,
      displayName: sub.displayName,
      amount: Number(sub.amount),
      currency: sub.currency,
      frequency: sub.frequency,
      nextCharge: sub.nextCharge,
      status: sub.status
    }))
  ).map(event => ({
    ...event,
    amount: fx.convert(event.amount, event.currency),
    currency: displayCurrency,
    monthlyEquivalent: fx.convert(event.monthlyEquivalent, event.currency)
  }))

  return { events, currency: displayCurrency }
}

export async function checkSubscriptionCapForSpace(
  spaceId: string,
  userId: string,
  displayCurrency: string
) {
  const [space, user, subs] = await Promise.all([
    prisma.financialSpace.findUnique({ where: { id: spaceId }, select: { settings: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { prefs: true } }),
    prisma.detectedSubscription.findMany({
      where: { spaceId, excluded: false, hidden: false, status: { not: ENUM.subscription.CANCELLED } },
      select: { amount: true, currency: true, frequency: true }
    })
  ])

  const cap = effectiveSubscriptionCap(
    parseUserPreferences(user?.prefs),
    parseSpaceSettings(space?.settings)
  )
  if (cap == null) return null

  const fx = await createFxConverter(displayCurrency)
  const monthlyTotal = subs.reduce((sum, sub) => {
    const monthly = subscriptionMonthlyEquivalent(Number(sub.amount), sub.frequency)
    return sum + fx.convert(monthly, sub.currency)
  }, 0)

  if (monthlyTotal <= cap) return null

  return {
    cap,
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
    currency: displayCurrency
  }
}

export async function dismissSubscriptionAlert(
  ctx: SpaceContext,
  subscriptionId: string
): Promise<SubscriptionListItemDto> {
  const sub = await prisma.detectedSubscription.findFirst({
    where: { id: subscriptionId, spaceId: ctx.spaceId }
  })
  if (!sub) throw createError({ statusCode: 404, message: 'Subscription not found' })

  const updated = await prisma.detectedSubscription.update({
    where: { id: sub.id },
    data: {
      alert: false,
      alertDismissedAt: new Date(),
      status: sub.status === ENUM.subscription.PRICE_CHANGED ? ENUM.subscription.ACTIVE : sub.status
    }
  })

  const all = await loadVisibleSubs(ctx.spaceId, true)
  const groups = buildDuplicateGroups(all)
  return mapSubscription(updated, duplicateMeta(updated, groups))
}

export async function patchSubscriptionForSpace(
  ctx: SpaceContext,
  subscriptionId: string,
  patch: SubscriptionPatchInput
): Promise<SubscriptionListItemDto> {
  const sub = await prisma.detectedSubscription.findFirst({
    where: { id: subscriptionId, spaceId: ctx.spaceId }
  })
  if (!sub) throw createError({ statusCode: 404, message: 'Subscription not found' })

  const updated = await prisma.detectedSubscription.update({
    where: { id: sub.id },
    data: {
      ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
      ...(patch.hidden !== undefined ? { hidden: patch.hidden } : {}),
      ...(patch.excluded !== undefined ? {
        excluded: patch.excluded,
        hidden: patch.excluded ? true : patch.hidden ?? sub.hidden
      } : {})
    }
  })

  const all = await loadVisibleSubs(ctx.spaceId, true)
  const groups = buildDuplicateGroups(all)
  return mapSubscription(updated, duplicateMeta(updated, groups))
}

export async function mergeDuplicateSubscriptions(
  ctx: SpaceContext,
  keepId: string
): Promise<SubscriptionListItemDto> {
  const keep = await prisma.detectedSubscription.findFirst({
    where: { id: keepId, spaceId: ctx.spaceId }
  })
  if (!keep) throw createError({ statusCode: 404, message: 'Subscription not found' })

  const dupes = await prisma.detectedSubscription.findMany({
    where: {
      spaceId: ctx.spaceId,
      id: { not: keep.id },
      name: { equals: keep.name, mode: 'insensitive' }
    }
  })
  if (!dupes.length) {
    throw createError({ statusCode: 400, message: 'No duplicate subscriptions to merge' })
  }

  await prisma.detectedSubscription.deleteMany({
    where: { id: { in: dupes.map(d => d.id) } }
  })

  const all = await loadVisibleSubs(ctx.spaceId, true)
  const groups = buildDuplicateGroups(all)
  return mapSubscription(keep, duplicateMeta(keep, groups))
}

export function merchantDomainForName(name: string) {
  return resolveBrandSlug(name)
}
