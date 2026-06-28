<script setup lang="ts">
const { t } = useAppI18n()
const config = useRuntimeConfig()
const route = useRoute()

const isOAuthConfigured = computed(() => Boolean(config.public.neonAuthConfigured))

const postAuthRedirect = computed(() => {
  const fromQuery = route.query.redirect
  if (typeof fromQuery === 'string' && fromQuery.startsWith('/')) {
    return fromQuery
  }
  if (route.path === '/auth/register') {
    const plan = route.query.plan
    if (plan === 'pro' || plan === 'enterprise') {
      return `/dashboard/onboarding?plan=${plan}`
    }
    return '/dashboard/onboarding'
  }
  return '/dashboard'
})

function oauthHref(provider: 'google' | 'github') {
  const redirect = encodeURIComponent(postAuthRedirect.value)
  return `/auth/${provider}?redirect=${redirect}`
}
</script>

<template>
  <div v-if="isOAuthConfigured" class="space-y-2">
    <a
      :href="oauthHref('google')"
      class="flex w-full items-center justify-center gap-2 rounded-flow border border-flow-border/60 bg-flow-secondary/30 px-4 py-2.5 text-sm font-medium text-flow-ink transition-colors hover:bg-flow-secondary/60 dark:border-flow-border-dark/60 dark:bg-flow-secondary-dark/30 dark:text-flow-ink-dark dark:hover:bg-flow-secondary-dark/60"
    >
      <UIcon name="i-simple-icons-google" class="h-4 w-4" />
      {{ t('auth.social.google') }}
    </a>

    <a
      :href="oauthHref('github')"
      class="flex w-full items-center justify-center gap-2 rounded-flow border border-flow-border/60 bg-flow-secondary/30 px-4 py-2.5 text-sm font-medium text-flow-ink transition-colors hover:bg-flow-secondary/60 dark:border-flow-border-dark/60 dark:bg-flow-secondary-dark/30 dark:text-flow-ink-dark dark:hover:bg-flow-secondary-dark/60"
    >
      <UIcon name="i-simple-icons-github" class="h-4 w-4" />
      {{ t('auth.social.github') }}
    </a>
  </div>
</template>
