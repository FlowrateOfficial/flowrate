import { z } from 'zod'

export const billingAddressSchema = z.object({
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().max(120).optional().nullable(),
  postalCode: z.string().trim().min(1).max(32),
  country: z.string().trim().length(2).transform(v => v.toUpperCase())
})

export type BillingAddressInput = z.infer<typeof billingAddressSchema>

export interface BillingAddress {
  line1: string
  line2: string | null
  city: string
  state: string | null
  postalCode: string
  country: string
}
