<script setup lang="ts">
import { storeToRefs } from 'pinia'

const route = useRoute()
const { t } = useAppI18n()

const spacesStore = useSpacesStore()
const userStore = useUserStore()
const { user, plan, navItems, bottomItems, userMenuItems } = storeToRefs(userStore)

onMounted(async () => {
  await spacesStore.fetchSpaces()
  await userStore.fetchUser()
})
</script>

<template>
  <div class="flex h-screen overflow-hidden surface-page">
    <aside class="hidden lg:flex flex-col w-64 shrink-0 border-r border-flow-border/60 dark:border-flow-border-dark/60 bg-flow-warm/50 dark:bg-flow-warm-dark/50">
      <div class="px-8 py-8 border-b border-flow-border/40 dark:border-flow-border-dark/40">
        <NuxtLink to="/" class="font-display text-xl tracking-tight text-flow-ink dark:text-flow-ink-dark">
          FlowRate
        </NuxtLink>
      </div>

      <div class="px-5 py-5 border-b border-flow-border/40 dark:border-flow-border-dark/40">
        <DashboardSpaceSwitcher />
      </div>

      <nav class="flex-1 px-4 py-6 space-y-0.5 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3 rounded-flow text-sm transition-all duration-300"
          :class="userStore.isActive(item.to)
            ? 'bg-flow-secondary dark:bg-flow-secondary-dark text-flow-ink dark:text-flow-ink-dark'
            : 'text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark hover:bg-flow-secondary/50 dark:hover:bg-flow-secondary-dark/50'"
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

        <UDropdownMenu :items="userMenuItems">
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
        <NuxtLink to="/" class="font-display text-lg text-flow-ink dark:text-flow-ink-dark">
          FlowRate
        </NuxtLink>
        <div class="flex items-center gap-1">
          <LanguageSwitcher />
          <UColorModeButton size="sm" color="neutral" variant="ghost" />
        </div>
      </header>

      <header class="hidden lg:flex items-center justify-between px-10 py-5 border-b border-flow-border/40 dark:border-flow-border-dark/40">
        <p class="text-sm text-flow-muted dark:text-flow-muted-dark font-display">
          {{ route.meta.title ?? t('nav.overview') }}
        </p>
        <div class="flex items-center gap-3">
          <LanguageSwitcher />
          <UColorModeButton size="sm" color="neutral" variant="ghost" />
          <UBadge
            v-if="plan === 'FREE'"
            :label="t('common.freePlan')"
            color="neutral"
            variant="subtle"
            size="sm"
            class="font-normal"
          />
          <UBadge
            v-else-if="plan === 'PRO'"
            :label="t('common.pro')"
            color="neutral"
            variant="outline"
            size="sm"
            class="font-normal"
          />
        </div>
      </header>

      <main class="flex-1 overflow-y-auto bg-flow-bg dark:bg-flow-bg-dark">
        <slot />
      </main>
    </div>
  </div>
</template>
