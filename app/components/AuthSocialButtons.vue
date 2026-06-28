<script setup lang="ts">
const { t } = useAppI18n()
const config = useRuntimeConfig()
const route = useRoute()

const isOAuthConfigured = computed(() => Boolean(config.public.neonAuthConfigured))

// NOTE - ?redirect= on login/register sets post-OAuth landing path
const postAuthRedirect = computed(() => {
  const fromQuery = route.query.redirect
  if (typeof fromQuery === 'string' && fromQuery.startsWith('/')) {
    return fromQuery
  }
  if (route.path === '/auth/register') {
    return '/dashboard/onboarding'
  }
  return '/dashboard'
})
</script>

<template>
  <div v-if="isOAuthConfigured" class="space-y-2">
    <!-- NOTE - Native form GET for full-page navigation to server OAuth route -->
    <form action="/auth/google" method="get" class="w-full">
      <input type="hidden" name="redirect" :value="postAuthRedirect">
      <button
        type="submit"
        class="flex w-full items-center justify-center gap-2 rounded-flow border border-flow-border/60 bg-flow-secondary/30 px-4 py-2.5 text-sm font-medium text-flow-ink transition-colors hover:bg-flow-secondary/60 dark:border-flow-border-dark/60 dark:bg-flow-secondary-dark/30 dark:text-flow-ink-dark dark:hover:bg-flow-secondary-dark/60"
      >
        <UIcon name="i-simple-icons-google" class="h-4 w-4" />
        {{ t('auth.social.google') }}
      </button>
    </form>

    <form action="/auth/github" method="get" class="w-full">
      <input type="hidden" name="redirect" :value="postAuthRedirect">
      <button
        type="submit"
        class="flex w-full items-center justify-center gap-2 rounded-flow border border-flow-border/60 bg-flow-secondary/30 px-4 py-2.5 text-sm font-medium text-flow-ink transition-colors hover:bg-flow-secondary/60 dark:border-flow-border-dark/60 dark:bg-flow-secondary-dark/30 dark:text-flow-ink-dark dark:hover:bg-flow-secondary-dark/60"
      >
        <UIcon name="i-simple-icons-github" class="h-4 w-4" />
        {{ t('auth.social.github') }}
      </button>
    </form>
  </div>
</template>
