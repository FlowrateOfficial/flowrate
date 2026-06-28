<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { t } = useAppI18n()
const { show: showBreadcrumbs } = useBreadcrumbs()

const spacesStore = useSpacesStore()
const userStore = useUserStore()
const { user, plan, navItems, bottomItems } = storeToRefs(userStore)
const { isMinor, activeSpace } = storeToRefs(spacesStore)
</script>

<template>
  <div class="flex h-screen overflow-hidden surface-page">
    <aside class="hidden lg:flex flex-col w-[17rem] shrink-0 border-r border-flow-border/50 dark:border-flow-border-dark/50 bg-flow-warm/60 dark:bg-flow-warm-dark/40">
      <div class="px-8 py-10 border-b border-flow-border/30 dark:border-flow-border-dark/30">
        <NuxtLink to="/dashboard" class="font-display text-2xl tracking-tight text-flow-ink dark:text-flow-ink-dark">
          FlowRate
        </NuxtLink>
      </div>

      <div v-if="!isMinor" class="px-5 py-6 border-b border-flow-border/30 dark:border-flow-border-dark/30">
        <DashboardSpaceSwitcher />
      </div>
      <div v-else-if="activeSpace" class="px-5 py-6 border-b border-flow-border/30 dark:border-flow-border-dark/30">
        <div class="px-4 py-3 rounded-flow bg-flow-secondary/60 dark:bg-flow-secondary-dark/60">
          <p class="truncate font-medium text-flow-ink dark:text-flow-ink-dark text-sm">{{ activeSpace.name }}</p>
          <p class="text-xs text-flow-muted dark:text-flow-muted-dark truncate mt-0.5">
            {{ spacesStore.spaceType(activeSpace.type) }}
          </p>
        </div>
      </div>

      <nav class="flex-1 px-3 py-8 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3.5 rounded-flow text-[15px] transition-all duration-300"
          :class="userStore.isActive(item.to)
            ? 'bg-flow-secondary/80 dark:bg-flow-secondary-dark text-flow-ink dark:text-flow-ink-dark'
            : 'text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark hover:bg-flow-secondary/40 dark:hover:bg-flow-secondary-dark/40'"
        >
          <UIcon :name="item.icon" class="w-4 h-4 shrink-0 stroke-[1.25]" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="px-4 pb-6 space-y-0.5 border-t border-flow-border/40 dark:border-flow-border-dark/40 pt-6">
        <NuxtLink
          v-for="item in bottomItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3 rounded-flow text-sm transition-all duration-300"
          :class="userStore.isActive(item.to)
            ? 'bg-flow-secondary dark:bg-flow-secondary-dark text-flow-ink dark:text-flow-ink-dark'
            : 'text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark'"
        >
          <UIcon :name="item.icon" class="w-4 h-4 shrink-0 stroke-[1.25]" />
          {{ item.label }}
        </NuxtLink>

        <UDropdownMenu :items="userStore.userMenuItems">
          <button class="w-full flex items-center gap-3 px-4 py-3 rounded-flow text-sm hover:bg-flow-secondary/50 dark:hover:bg-flow-secondary-dark/50 transition-all duration-300 mt-2">
            <UAvatar :alt="user?.name ?? user?.email ?? 'U'" size="xs" />
            <div class="flex-1 min-w-0 text-left">
              <p class="font-medium text-flow-ink dark:text-flow-ink-dark truncate">{{ user?.name ?? t('common.account') }}</p>
              <p class="text-xs text-flow-muted dark:text-flow-muted-dark truncate">{{ user?.email }}</p>
            </div>
            <UIcon name="i-lucide-chevrons-up-down" class="w-3.5 h-3.5 text-flow-muted shrink-0 stroke-[1.25]" />
          </button>
        </UDropdownMenu>
      </div>
    </aside>

    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <header class="lg:hidden flex items-center justify-between px-5 py-4 border-b border-flow-border/60 dark:border-flow-border-dark/60">
        <NuxtLink to="/dashboard" class="font-display text-lg text-flow-ink dark:text-flow-ink-dark">
          FlowRate
        </NuxtLink>
        <div class="flex items-center gap-1">
          <LanguageSwitcher />
          <UColorModeButton size="sm" color="neutral" variant="ghost" />
        </div>
      </header>

      <div
        v-if="showBreadcrumbs"
        class="lg:hidden px-5 py-3 border-b border-flow-border/40 dark:border-flow-border-dark/40 bg-flow-bg/50 dark:bg-flow-bg-dark/50"
      >
        <AppBreadcrumbs />
      </div>

      <header class="hidden lg:flex items-center justify-between px-10 lg:px-14 py-6 border-b border-flow-border/30 dark:border-flow-border-dark/30 gap-6">
        <AppBreadcrumbs v-if="showBreadcrumbs" class="min-w-0 flex-1" />
        <p v-else class="text-sm text-flow-muted dark:text-flow-muted-dark font-display tracking-wide">
          {{ t('nav.overview') }}
        </p>
        <div class="flex items-center gap-3">
          <LanguageSwitcher />
          <UColorModeButton size="sm" color="neutral" variant="ghost" />
          <UBadge
            v-if="!isMinor && plan === 'FREE'"
            :label="t('common.freePlan')"
            color="neutral"
            variant="subtle"
            size="sm"
            class="font-normal"
          />
          <UBadge
            v-else-if="!isMinor && plan === 'PRO'"
            :label="t('common.pro')"
            color="neutral"
            variant="outline"
            size="sm"
            class="font-normal"
          />
        </div>
      </header>

      <main class="flex-1 overflow-y-auto bg-flow-bg dark:bg-flow-bg-dark pb-20 lg:pb-0">
        <slot />
      </main>
    </div>

    <DashboardMobileNav />
    <ClientOnly>
      <DashboardMobileAccountMenu />
    </ClientOnly>
  </div>
</template>
