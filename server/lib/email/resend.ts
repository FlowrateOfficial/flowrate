// ANCHOR: Resend email delivery for product notifications
import type { H3Event } from 'h3'

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
  const apiKey = config.resendApiKey as string
  const from = config.authFromEmail as string

  if (!apiKey || !from) return false

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
