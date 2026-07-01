import type Stripe from 'stripe'

export function isProrationLine(line: Stripe.InvoiceLineItem): boolean {
  const parent = line.parent
  return parent?.subscription_item_details?.proration === true
    || parent?.invoice_item_details?.proration === true
}

// ANCHOR: Net proration in cents
export function prorationNetCents(invoice: Stripe.Invoice): {
  amountCents: number
  hasProrationLines: boolean
} {
  let amountCents = 0
  let hasProrationLines = false

  for (const line of invoice.lines?.data ?? []) {
    if (!isProrationLine(line)) continue
    hasProrationLines = true
    amountCents += line.amount
  }

  return { amountCents, hasProrationLines }
}

export function currentBillingInterval(
  price: Stripe.Price | string | null | undefined
): 'month' | 'year' {
  if (!price || typeof price === 'string') return 'month'
  return price.recurring?.interval === 'year' ? 'year' : 'month'
}
