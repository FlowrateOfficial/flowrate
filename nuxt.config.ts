// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    ['nuxt-i18n-micro', {
      locales: [
        { code: 'en', iso: 'en-US', name: 'English', displayName: 'English' },
        { code: 'fr', iso: 'fr-FR', name: 'French', displayName: 'Français' }
      ],
      defaultLocale: 'en',
      localeCookie: 'user-locale',
      translationDir: 'locales',
      strategy: 'no_prefix'
    }]
  ],

  devtools: {
    enabled: true
  },

  $production: {
    devtools: { enabled: false }
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true },
    '/api/stripe/webhook': { cors: false }
  },

  runtimeConfig: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripePricePro: process.env.STRIPE_PRICE_PRO ?? '',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? '',
    twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID ?? '',
    neonApiKey: process.env.NEON_API_KEY,
    stackProjectId: process.env.STACK_PROJECT_ID,
    neonAuthCookieSecret: process.env.NUXT_SESSION_PASSWORD ?? process.env.NEON_AUTH_COOKIE_SECRET ?? '',
    public: {
      neonAuthUrl: process.env.NUXT_NEON_AUTH_URL ?? '',
      neonAuthConfigured: Boolean(
        process.env.NUXT_NEON_AUTH_URL
        && (process.env.NUXT_SESSION_PASSWORD ?? process.env.NEON_AUTH_COOKIE_SECRET)
      ),
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      stripeConfigured: Boolean(process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY),
      stripeLiveMode: (process.env.STRIPE_PUBLISHABLE_KEY ?? '').startsWith('pk_live_'),
      appUrl: process.env.APP_URL
        ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
      twilioConfigured: Boolean(
        process.env.TWILIO_ACCOUNT_SID
        && process.env.TWILIO_AUTH_TOKEN
        && process.env.TWILIO_VERIFY_SERVICE_SID
      )
    }
  },

  compatibilityDate: '2025-01-15',

  vite: {
    optimizeDeps: {
      include: ['@neondatabase/auth', '@neondatabase/auth/vanilla/adapters', 'zod']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
