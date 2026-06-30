<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { SPACE_TYPE_ICONS } from '~/types/space'

const { t } = useAppI18n()
const { show: showBreadcrumbs } = useBreadcrumbs()
const { openMenu: openSpaceMenu } = useMobileSpaceMenu()

const spacesStore = useSpacesStore()
const userStore = useUserStore()
const { user, plan, isAdmin } = storeToRefs(userStore)
const { isMinor, space } = storeToRefs(spacesStore)
const { prefetchRoute } = useNavPrefetch()

onMounted(() => {
  prefetchRoute('/dashboard')
  for (const item of userStore.navItems) {
    prefetchRoute(item.to)
  }
})
</script>

<template>
  <ClientOnly>
    <div class="flex h-dvh overflow-hidden bg-default text-default">
    <aside
      class="dashboard-sidebar hidden w-72 shrink-0 flex-col border-r border-default bg-elevated/30 lg:flex"
      aria-label="Sidebar"
    >
      <div class="flex h-18 shrink-0 items-center gap-2 border-b border-default px-6">
        <NuxtLink to="/dashboard" class="inline-flex items-center gap-2">
          <BrandFlowRateLogo :mark-size="32" />
          <AppBetaBadge size="sm" />
        </NuxtLink>
      </div>

      <div v-if="!isMinor" class="border-b border-default px-4 py-4">
        <p class="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {{ t('dashboard.layout.currentSpace') }}
        </p>
        <DashboardSpaceSwitcher />
      </div>
      <div v-else-if="space" class="border-b border-default px-4 py-4">
        <UCard :ui="{ body: 'p-4' }">
          <p class="truncate text-base font-semibold">{{ space.name }}</p>
          <p class="mt-1 truncate text-sm text-muted">
            {{ spacesStore.spaceType(space.type) }}
          </p>
        </UCard>
      </div>

      <DashboardSidebarNav />

      <div class="mt-auto border-t border-default px-4 py-4">
        <UDropdownMenu :items="userStore.userMenuItems">
          <UButton
            color="neutral"
            variant="ghost"
            block
            class="min-h-12 justify-start gap-3 px-3"
          >
            <UAvatar :alt="user?.name ?? user?.email ?? 'U'" size="sm" />
            <span class="min-w-0 flex-1 text-left">
              <span class="block truncate text-sm font-semibold">{{ user?.name ?? t('common.account') }}</span>
              <span class="block truncate text-xs text-muted">{{ user?.email }}</span>
            </span>
            <UIcon name="i-lucide-chevrons-up-down" class="size-4 shrink-0 text-muted" />
          </UButton>
        </UDropdownMenu>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header class="flex items-center justify-between gap-2 border-b border-default px-3 py-2.5 sm:px-4 lg:hidden">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <NuxtLink to="/dashboard" class="inline-flex shrink-0">
            <BrandFlowRateLogo :mark-size="28" class="[&_span]:text-lg" />
          </NuxtLink>
          <ClientOnly>
            <UButton
              v-if="!isMinor && space"
              color="neutral"
              variant="outline"
              size="sm"
              class="min-h-9 min-w-0 max-w-[52%] justify-start gap-2 px-2.5"
              :loading="spacesStore.switching"
              :aria-label="t('dashboard.layout.switchSpace')"
              @click="openSpaceMenu"
            >
              <UIcon :name="SPACE_TYPE_ICONS[space.type]" class="size-4 shrink-0 text-primary" />
              <span class="truncate text-sm font-medium">{{ space.name }}</span>
              <UIcon name="i-lucide-chevrons-up-down" class="size-3.5 shrink-0 text-muted" />
            </UButton>
            <template #fallback>
              <span class="h-9 min-w-24 flex-1 rounded-lg bg-elevated/40" aria-hidden="true" />
            </template>
          </ClientOnly>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <UButton
            v-if="isAdmin"
            to="/dashboard/admin/usage"
            color="neutral"
            variant="ghost"
            size="md"
            icon="i-lucide-shield-check"
            :aria-label="t('nav.admin')"
          />
          <LanguageSwitcher />
          <UColorModeButton color="neutral" variant="ghost" size="md" />
        </div>
      </header>

      <div
        v-if="showBreadcrumbs"
        class="border-b border-default bg-elevated/40 px-4 py-2 lg:hidden"
      >
        <AppBreadcrumbs />
      </div>

      <header class="dashboard-header-bar hidden h-18 shrink-0 items-center justify-between gap-4 border-b border-default px-6 lg:flex lg:px-8">
        <AppBreadcrumbs v-if="showBreadcrumbs" class="min-w-0 flex-1" />
        <p v-else class="text-sm text-muted">
          {{ t('nav.overview') }}
        </p>
        <div class="flex items-center gap-2">
          <UButton
            v-if="isAdmin"
            to="/dashboard/admin/usage"
            color="neutral"
            variant="ghost"
            size="md"
            icon="i-lucide-shield-check"
            :aria-label="t('nav.admin')"
          />
          <LanguageSwitcher />
          <UColorModeButton color="neutral" variant="ghost" size="md" />
          <ClientOnly>
            <UBadge
              v-if="!isMinor && plan === 'FREE'"
              :label="t('common.freePlan')"
              color="neutral"
              variant="subtle"
              size="md"
            />
            <UBadge
              v-else-if="!isMinor && plan === 'PRO'"
              :label="t('common.pro')"
              color="primary"
              variant="subtle"
              size="md"
            />
            <UBadge
              v-else-if="!isMinor && plan === 'ENTERPRISE'"
              :label="t('dashboard.settings.plans.ENTERPRISE')"
              color="success"
              variant="subtle"
              size="md"
            />
            <template #fallback>
              <span class="inline-block h-6 w-14 rounded-md bg-elevated/50" aria-hidden="true" />
            </template>
          </ClientOnly>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <slot />
      </main>
    </div>

    <DashboardMobileNav />
    <ClientOnly>
      <DashboardMobileAccountMenu />
      <DashboardMobileSpaceMenu />
      <DashboardMobileNavCustomizer />
    </ClientOnly>
    </div>
    <template #fallback>
      <div class="flex h-dvh overflow-hidden bg-default text-default" aria-busy="true">
        <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div class="flex-1 bg-elevated/10" />
        </div>
      </div>
    </template>
  </ClientOnly>
</template>
