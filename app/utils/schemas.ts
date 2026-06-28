import { z } from 'zod'

/** Auth login form — messages come from Zod locale (zod/locales). */
export function createLoginSchema() {
  return z.object({
    email: z.email(),
    password: z.string().min(8)
  })
}

/** Auth register form */
export function createRegisterSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
    agreedToTerms: z.boolean().refine(val => val === true, {
      message: t('validation.agreeToTerms')
    })
  }).superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: t('validation.passwordMismatch'),
        path: ['confirmPassword']
      })
    }
  })
}

/** Forgot password form */
export function createForgotPasswordSchema() {
  return z.object({
    email: z.email()
  })
}

/** Create space form */
export function createSpaceSchema() {
  return z.object({
    name: z.string().min(2).max(80),
    type: z.enum(['HOUSEHOLD', 'FAMILY', 'COMPANY'])
  })
}
