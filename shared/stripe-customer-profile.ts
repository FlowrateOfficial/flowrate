import { z } from 'zod'
import { billingAddressSchema, type BillingAddress } from './billing-address'

export const stripeCustomerProfileSchema = z.object({
  timezone: z
    .string()
    .trim()
    .max(64)
    .optional()
    .nullable()
    .refine(
      tz => !tz || /^[A-Za-z0-9_+-]+(?:\/[A-Za-z0-9_+-]+)+$/.test(tz),
      { message: 'Timezone must be a valid IANA identifier (e.g. Europe/Paris)' }
    ),
  address: billingAddressSchema.optional()
}).refine(
  data => data.timezone !== undefined || data.address !== undefined,
  { message: 'At least one field is required' }
)

export type StripeCustomerProfileInput = z.infer<typeof stripeCustomerProfileSchema>

export interface StripeCustomerProfile {
  customerId: string | null
  name: string | null
  email: string | null
  phone: string | null
  phoneVerified: boolean
  timezone: string | null
  address: BillingAddress | null
  invoiceTemplateConfigured: boolean
}

export interface StripeCustomerInvoiceSummary {
  id: string
  number: string | null
  status: string
  amountDue: number
  currency: string
  created: string
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
}
