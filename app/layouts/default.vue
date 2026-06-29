<script setup lang="ts">
const { t } = useAppI18n()
const { isLoggedIn, homePath } = useSessionUser()
const { show: showBreadcrumbs } = useBreadcrumbs()
const route = useRoute()

const isLegalPage = computed(() =>
  ['/privacy', '/terms', '/glba'].includes(route.path)
)

const navLinks = computed(() => [
  { label: t('landing.nav.demo'), to: '/#demo' },
  { label: t('nav.features'), to: '/#features' },
  { label: t('nav.pricing'), to: '/#pricing' }
])
</script>

<template>
  <div class="min-h-screen flex flex-col surface-page">
    <header class="fixed inset-x-0 top-0 z-50 border-b border-flow-border/50 dark:border-flow-border-dark/60 bg-flow-bg/85 dark:bg-flow-bg-dark/80 backdrop-blur-md dark:backdrop-blur-lg">
      <UContainer class="flex items-center justify-between gap-2 sm:gap-4 h-14 sm:h-[4.5rem] min-w-0">
        <NuxtLink :to="homePath" class="inline-flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
          <BrandFlowRateLogo :mark-size="26" compact-on-mobile class="shrink-0" />
          <AppBetaBadge size="sm" :class="isLegalPage ? 'inline-flex shrink-0' : 'hidden sm:inline-flex shrink-0'" />
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-10">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="text-sm text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark transition-colors duration-300"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-0.5 sm:gap-2 shrink-0">
          <LanguageSwitcher compact />
          <UColorModeButton color="neutral" variant="ghost" size="sm" class="shrink-0" />
          <template v-if="!isLoggedIn">
            <NuxtLink
              to="/auth/login"
              class="hidden sm:inline text-sm text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark transition-colors px-3 py-2"
            >
              {{ t('common.signIn') }}
            </NuxtLink>
            <NuxtLink
              to="/auth/register"
              class="btn-primary-editorial !px-3 !py-2 sm:!px-5 sm:!py-2.5 text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              <span class="sm:hidden">{{ t('common.start') }}</span>
              <span class="hidden sm:inline">{{ t('common.getStarted') }}</span>
            </NuxtLink>
          </template>
          <NuxtLink
            v-else
            to="/dashboard"
            class="btn-primary-editorial !px-3 !py-2 sm:!px-5 sm:!py-2.5 text-xs sm:text-sm whitespace-nowrap shrink-0"
          >
            {{ t('nav.overview') }}
          </NuxtLink>
        </div>
      </UContainer>
    </header>

    <UMain class="flex-1 overflow-x-clip pt-14 sm:pt-[4.5rem]">
      <UContainer v-if="showBreadcrumbs" class="pt-8 pb-0">
        <AppBreadcrumbs />
      </UContainer>
      <slot />
    </UMain>

    <footer class="border-t border-flow-border/60 dark:border-flow-border-dark/60 bg-flow-secondary/30 dark:bg-flow-secondary-dark/20">
      <UContainer class="py-20 sm:py-28">
        <div class="grid lg:grid-cols-12 gap-12">
          <div class="lg:col-span-6 space-y-6">
            <BrandFlowRateLogo :mark-size="28" class="text-display-footer" />
            <p class="text-flow-muted dark:text-flow-muted-dark max-w-sm leading-relaxed">
              {{ t('landing.heroSubtitle') }}
            </p>
          </div>

          <div class="lg:col-span-3 lg:col-start-8 space-y-4">
            <NuxtLink to="/privacy" class="block text-sm text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark transition-colors">
              {{ t('common.privacy') }}
            </NuxtLink>
            <NuxtLink to="/terms" class="block text-sm text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark transition-colors">
              {{ t('common.terms') }}
            </NuxtLink>
            <NuxtLink to="/glba" class="block text-sm text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark transition-colors">
              {{ t('common.glba') }}
            </NuxtLink>
            <a href="mailto:mathieu.lievre.pro@outlook.com" class="block text-sm text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark transition-colors">
              mathieu.lievre.pro@outlook.com
            </a>
            <NuxtLink
              v-if="!isLoggedIn"
              to="/auth/login"
              class="block text-sm text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark transition-colors"
            >
              {{ t('common.signIn') }}
            </NuxtLink>
            <NuxtLink
              v-else
              to="/dashboard"
              class="block text-sm text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark transition-colors"
            >
              {{ t('nav.overview') }}
            </NuxtLink>
          </div>
        </div>

        <div class="mt-20 pt-8 border-t border-flow-border/40 dark:border-flow-border-dark/40">
          <p class="text-xs text-flow-muted dark:text-flow-muted-dark">
            {{ t('common.copyright', { year: new Date().getFullYear() }) }}
          </p>
        </div>
      </UContainer>
    </footer>
  </div>
</template>
