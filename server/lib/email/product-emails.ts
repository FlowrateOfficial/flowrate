// ANCHOR: Product notification emails — price hikes, weekly digest
import type { H3Event } from 'h3'
import { sendResendEmail } from './resend'

export async function sendSubscriptionPriceAlertEmail(
  event: H3Event | null,
  input: {
    to: string
    name: string
    subscriptionName: string
    periodImpact: number
    annualImpact: number | null
    currency: string
    appUrl: string
  }
): Promise<boolean> {
  const annualLine = input.annualImpact != null
    ? `<p>Estimated annual impact: <strong>+${formatMoney(input.annualImpact, input.currency)}/yr</strong></p>`
    : ''

  return sendResendEmail(event, {
    to: input.to,
    subject: `Price increase detected: ${input.subscriptionName}`,
    html: `
      <p>Hi ${escapeHtml(input.name || 'there')},</p>
      <p>FlowRate detected a price increase on <strong>${escapeHtml(input.subscriptionName)}</strong>.</p>
      <p>Increase: <strong>+${formatMoney(input.periodImpact, input.currency)}</strong> per billing period.</p>
      ${annualLine}
      <p><a href="${input.appUrl}/dashboard/subscriptions">Review subscriptions</a></p>
    `.trim()
  })
}

export async function sendWeeklyDigestEmail(
  event: H3Event | null,
  input: {
    to: string
    name: string
    spending: number
    income: number
    netSavings: number
    alertCount: number
    currency: string
    appUrl: string
  }
): Promise<boolean> {
  return sendResendEmail(event, {
    to: input.to,
    subject: 'Your weekly FlowRate digest',
    html: `
      <p>Hi ${escapeHtml(input.name || 'there')},</p>
      <p>Here is your week at a glance:</p>
      <ul>
        <li>Spent: <strong>${formatMoney(input.spending, input.currency)}</strong></li>
        <li>Income: <strong>${formatMoney(input.income, input.currency)}</strong></li>
        <li>Net: <strong>${formatMoney(input.netSavings, input.currency)}</strong></li>
        <li>Subscription alerts: <strong>${input.alertCount}</strong></li>
      </ul>
      <p><a href="${input.appUrl}/dashboard">Open dashboard</a></p>
    `.trim()
  })
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
