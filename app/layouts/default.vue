<script setup lang="ts">
const { t } = useAppI18n()
const { isLoggedIn, homePath } = useSessionUser()
const { show: showBreadcrumbs } = useBreadcrumbs()

const navLinks = computed(() => [
  { label: t('nav.features'), to: '/#features' },
  { label: t('nav.pricing'), to: '/#pricing' }
])
</script>

<template>
  <div class="min-h-screen flex flex-col surface-page">
    <header class="sticky top-0 z-50 border-b border-flow-border/50 dark:border-flow-border-dark/50 bg-flow-bg/85 dark:bg-flow-bg-dark/85 backdrop-blur-md">
      <UContainer class="flex items-center justify-between h-16 sm:h-[4.5rem]">
        <NuxtLink :to="homePath" class="inline-flex">
          <BrandFlowRateLogo :mark-size="28" />
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

        <div class="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <UColorModeButton color="neutral" variant="ghost" size="sm" />
          <template v-if="!isLoggedIn">
            <NuxtLink
              to="/auth/login"
              class="hidden sm:inline text-sm text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark transition-colors px-3 py-2"
            >
              {{ t('common.signIn') }}
            </NuxtLink>
            <NuxtLink to="/auth/register" class="btn-primary-editorial !px-5 !py-2.5 text-sm">
              {{ t('common.getStarted') }}
            </NuxtLink>
          </template>
          <NuxtLink
            v-else
            to="/dashboard"
            class="btn-primary-editorial !px-5 !py-2.5 text-sm"
          >
            {{ t('nav.overview') }}
          </NuxtLink>
        </div>
      </UContainer>
    </header>

    <UMain class="flex-1">
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
