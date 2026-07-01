// ANCHOR: Resend email delivery for product notifications (inactive until configured)
import type { H3Event } from 'h3'
import { isResendEmailConfigured } from '../../utils/email-delivery'

export interface SendEmailInput {
  to: string
  subject: string
  html: string
}

export async function sendResendEmail(
  event: H3Event | null,
  input: SendEmailInput
): Promise<boolean> {
  const config = event ? useRuntimeConfig(event) : useRuntimeConfig()
  if (!isResendEmailConfigured(config)) return false

  const apiKey = config.resendApiKey as string
  const from = config.authFromEmail as string

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html
    })
  })

  return response.ok
}
