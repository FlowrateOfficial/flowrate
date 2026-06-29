import type Stripe from 'stripe'
import type {
  BillingAddress,
  BillingAddressInput
} from '#shared/billing-address'
import type {
  StripeCustomerInvoiceSummary,
  StripeCustomerProfile,
  StripeCustomerProfileInput
} from '#shared/stripe-customer-profile'
import { ensureStripeCustomer, getValidStripeCustomerId } from './customer'
import { isStaleStripeCustomer } from './errors'
import {
  billingAddressFromStripe,
  stripeAddressFromInput
} from './address'
import type { StripeUserRef } from './types'

const TIMEZONE_METADATA_KEY = 'timezone'

export function stripeCustomerInvoiceSettings(
  templateId: string | undefined
): Stripe.CustomerUpdateParams['invoice_settings'] | undefined {
  if (!templateId) return undefined
  return {
    rendering_options: { template: templateId }
  }
}

export function stripeCustomerProfileFromCustomer(
  customer: Stripe.Customer,
  invoiceTemplateConfigured: boolean,
  phoneVerified = false
): StripeCustomerProfile {
  return {
    customerId: customer.id,
    name: customer.name ?? null,
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    phoneVerified,
    timezone: customer.metadata?.[TIMEZONE_METADATA_KEY] ?? null,
    address: billingAddressFromStripe(customer.address),
    invoiceTemplateConfigured
  }
}

export async function verifiedPhoneForUser(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, phoneVerified: true }
  })
  if (!user?.phone || !user.phoneVerified) return null
  return user.phone
}

export async function syncStripeCustomerPhone(
  stripe: Stripe,
  userId: string,
  phone: string | null
): Promise<void> {
  const customerId = await getValidStripeCustomerId(stripe, userId)
  if (!customerId) return

  await stripe.customers.update(customerId, {
    phone: phone ?? ''
  })
}

export async function attachDbPhoneToProfile(
  userId: string,
  profile: StripeCustomerProfile
): Promise<StripeCustomerProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, phoneVerified: true }
  })
  const verified = user?.phoneVerified != null
  const phone = verified ? user?.phone ?? null : null

  return {
    ...profile,
    phone,
    phoneVerified: verified
  }
}

export async function reconcileStripeCustomerPhone(
  stripe: Stripe,
  userId: string,
  profile: StripeCustomerProfile
): Promise<StripeCustomerProfile> {
  const merged = await attachDbPhoneToProfile(userId, profile)
  if (!merged.phoneVerified || !merged.phone || !profile.customerId) {
    return merged
  }

  if (profile.phone !== merged.phone) {
    await syncStripeCustomerPhone(stripe, userId, merged.phone)
    return { ...merged, phone: merged.phone }
  }

  return merged
}

export async function getStripeCustomerProfile(
  stripe: Stripe,
  userId: string,
  invoiceTemplateConfigured: boolean
): Promise<StripeCustomerProfile> {
  const customerId = await getValidStripeCustomerId(stripe, userId)
  if (!customerId) {
    return {
      customerId: null,
      name: null,
      email: null,
      phone: null,
      phoneVerified: false,
      timezone: null,
      address: null,
      invoiceTemplateConfigured
    }
  }

  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) {
    return {
      customerId: null,
      name: null,
      email: null,
      phone: null,
      phoneVerified: false,
      timezone: null,
      address: null,
      invoiceTemplateConfigured
    }
  }

  return stripeCustomerProfileFromCustomer(customer, invoiceTemplateConfigured)
}

export async function updateStripeCustomerProfile(
  stripe: Stripe,
  user: StripeUserRef,
  input: StripeCustomerProfileInput,
  metadata: Record<string, string>,
  invoiceTemplateId: string | undefined
): Promise<StripeCustomerProfile> {
  const customerId = await ensureStripeCustomer(stripe, user, metadata, invoiceTemplateId)

  const update: Stripe.CustomerUpdateParams = {}

  if (input.timezone !== undefined) {
    const existing = await stripe.customers.retrieve(customerId)
    const existingMetadata = 'deleted' in existing && existing.deleted
      ? {}
      : existing.metadata ?? {}
    update.metadata = {
      ...existingMetadata,
      ...metadata,
      userId: user.id,
      [TIMEZONE_METADATA_KEY]: input.timezone ?? ''
    }
  }

  if (input.address) {
    update.address = stripeAddressFromInput(input.address)
  }

  const invoiceSettings = stripeCustomerInvoiceSettings(invoiceTemplateId)
  if (invoiceSettings) {
    update.invoice_settings = invoiceSettings
  }

  const customer = await stripe.customers.update(customerId, update)

  return stripeCustomerProfileFromCustomer(
    customer,
    Boolean(invoiceTemplateId)
  )
}

export function invoiceSummaryFromStripe(invoice: Stripe.Invoice): StripeCustomerInvoiceSummary {
  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status ?? 'draft',
    amountDue: invoice.amount_due,
    currency: invoice.currency.toUpperCase(),
    created: new Date(invoice.created * 1000).toISOString(),
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null
  }
}

export async function listStripeCustomerInvoices(
  stripe: Stripe,
  customerId: string,
  limit = 12
): Promise<StripeCustomerInvoiceSummary[]> {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit
    })

    return invoices.data.map(invoiceSummaryFromStripe)
  } catch (error) {
    if (isStaleStripeCustomer(error)) {
      return []
    }
    throw error
  }
}

export async function generateStripeCustomerInvoice(
  stripe: Stripe,
  customerId: string,
  subscriptionId: string | null,
  invoiceTemplateId: string | undefined
): Promise<StripeCustomerInvoiceSummary> {
  const createParams: Stripe.InvoiceCreateParams = {
    customer: customerId,
    auto_advance: false
  }

  if (subscriptionId) {
    createParams.subscription = subscriptionId
  }

  if (invoiceTemplateId) {
    createParams.rendering = { template: invoiceTemplateId }
  }

  const draft = await stripe.invoices.create(createParams)

  if (!draft.id) {
    throw createError({ statusCode: 502, message: 'Stripe did not return an invoice id' })
  }

  if ((draft.total ?? 0) === 0 && (draft.lines?.data.length ?? 0) === 0) {
    await stripe.invoices.del(draft.id).catch(() => undefined)
    throw createError({
      statusCode: 400,
      message: 'Nothing to invoice yet. Complete your billing profile or wait for your next subscription period.'
    })
  }

  const finalized = await stripe.invoices.finalizeInvoice(draft.id)
  return invoiceSummaryFromStripe(finalized)
}

export function assertBillingAddressComplete(address: BillingAddressInput | null | undefined): void {
  if (!address?.line1 || !address.city || !address.postalCode || !address.country) {
    throw createError({
      statusCode: 400,
      message: 'Add a complete billing address before generating an invoice'
    })
  }
}
