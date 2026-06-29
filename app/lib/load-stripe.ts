// NOTE - ANCHOR: Lazy Stripe.js loader
import type { StripeInstance } from '~/types/stripe'

let stripeLoader: Promise<StripeInstance | null> | null = null

function injectStripeScript(): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('Stripe.js is only available in the browser'))
  }

  const existing = document.querySelector<HTMLScriptElement>('script[src="https://js.stripe.com/v3/"]')
  if (existing) {
    return existing.dataset.loaded === 'true'
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener('load', () => resolve(), { once: true })
          existing.addEventListener('error', () => reject(new Error('Failed to load Stripe.js')), { once: true })
        })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true'
      resolve()
    }, { once: true })
    script.addEventListener('error', () => reject(new Error('Failed to load Stripe.js')), { once: true })
    document.head.appendChild(script)
  })
}

export async function loadStripe(): Promise<StripeInstance | null> {
  const key = useRuntimeConfig().public.stripePublishableKey
  if (!key) return null

  if (!stripeLoader) {
    stripeLoader = injectStripeScript().then(() => {
      if (!window.Stripe) {
        throw new Error('Stripe.js failed to initialize')
      }
      return window.Stripe(key)
    }).catch((error) => {
      stripeLoader = null
      throw error
    })
  }

  return stripeLoader
}
