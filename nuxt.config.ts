// ANCHOR: Nuxt config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vercel/speed-insights',
    ['nuxt-i18n-micro', {
      locales: [
        { code: 'en', iso: 'en-US', name: 'English (US)', displayName: 'English (US)' },
        { code: 'en-GB', iso: 'en-GB', name: 'English (UK)', displayName: 'English (UK)', fallbackLocale: 'en' },
        { code: 'fr', iso: 'fr-FR', name: 'French', displayName: 'Français' }
      ],
      defaultLocale: 'en',
      localeCookie: 'user-locale',
      translationDir: 'locales',
      strategy: 'no_prefix',
      // NOTE - All copy in locales/en.json, en-GB.json (UK overrides), fr.json — per-page files broke merges
      disablePageLocales: true
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
    '/dashboard': { ssr: false },
    '/dashboard/**': { ssr: false },
    '/api/stripe/webhook': { cors: false },
    '/api/plaid/webhook': { cors: false },
    '/api/webhooks/neon-auth': { cors: false }
  },

  runtimeConfig: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripePricePro: process.env.STRIPE_PRICE_PRO ?? '',
    plaidClientId: process.env.PLAID_CLIENT_ID ?? '',
    plaidSecret: process.env.PLAID_SECRET ?? '',
    plaidEnv: process.env.PLAID_ENV ?? 'sandbox',
    // Must match a URI registered at https://dashboard.plaid.com/team/api
    plaidRedirectUri: process.env.PLAID_REDIRECT_URI ?? '',
    plaidWebhookUrl: process.env.PLAID_WEBHOOK_URL ?? '',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? '',
    twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID ?? '',
    neonApiKey: process.env.NEON_API_KEY,
    stackProjectId: process.env.STACK_PROJECT_ID,
    neonBranchId: process.env.NEON_BRANCH_ID ?? '',
    neonAuthCookieSecret: process.env.NUXT_SESSION_PASSWORD ?? process.env.NEON_AUTH_COOKIE_SECRET ?? '',
    adminEmails: process.env.ADMIN_EMAILS ?? '',
    githubToken: process.env.GITHUB_TOKEN ?? '',
    githubFeedbackRepo: process.env.GITHUB_FEEDBACK_REPO ?? '',
    stripeInvoiceTemplateId: process.env.STRIPE_INVOICE_TEMPLATE_ID ?? '',
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    authFromEmail: process.env.AUTH_FROM_EMAIL ?? '',
    public: {
      neonAuthUrl: process.env.NUXT_NEON_AUTH_URL ?? '',
      neonAuthConfigured: Boolean(
        process.env.NUXT_NEON_AUTH_URL
        && (process.env.NUXT_SESSION_PASSWORD ?? process.env.NEON_AUTH_COOKIE_SECRET)
      ),
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      stripeConfigured: Boolean(process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY),
      stripeLiveMode: (process.env.STRIPE_PUBLISHABLE_KEY ?? '').startsWith('pk_live_'),
      plaidConfigured: Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET),
      plaidEnv: process.env.PLAID_ENV ?? 'sandbox',
      plaidSandboxMode: (process.env.PLAID_ENV ?? 'sandbox') !== 'production',
      appUrl: process.env.APP_URL
        ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
      twilioConfigured: Boolean(
        process.env.TWILIO_ACCOUNT_SID
        && process.env.TWILIO_AUTH_TOKEN
        && process.env.TWILIO_VERIFY_SERVICE_SID
      ),
      feedbackConfigured: Boolean(
        process.env.GITHUB_TOKEN && process.env.GITHUB_FEEDBACK_REPO
      ),
      mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN ?? ''
    }
  },

  hooks: {
    'pages:extend'(pages) {
      for (const page of pages) {
        if (page.path?.startsWith('/dashboard')) {
          page.meta ||= {}
          page.meta.ssr = false
        }
      }
    }
  },

  compatibilityDate: '2025-01-15',

  icon: {
    serverBundle: {
      collections: ['lucide']
    }
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        paths: {
          '~~/generated/prisma': ['../generated/prisma/client.ts']
        }
      }
    }
  },

  nitro: {
    externals: {
      inline: ['@prisma/client', '@prisma/adapter-neon', '~~/generated/prisma']
    }
  },

  vite: {
    optimizeDeps: {
      include: [
    '@neondatabase/auth',
        '@neondatabase/auth/vanilla/adapters',
        '@nuxt/ui > prosemirror-gapcursor',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-view',
        '@tiptap/core',
        '@tiptap/vue-3',
        '@vueuse/core',
        'chart.js',
        'vue-chartjs',
        'zod',
        'zod/v4/locales/en.js',
        'zod/v4/locales/fr.js',
      ]
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
