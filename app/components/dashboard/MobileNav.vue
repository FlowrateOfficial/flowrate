<script setup lang="ts">
const route = useRoute()
const { t } = useAppI18n()
const userStore = useUserStore()
const { navItems, user } = storeToRefs(userStore)
const { openMenu } = useMobileAccountMenu()

const mobileNavItems = computed(() => (navItems.value ?? []).slice(0, 4))

const isAccountActive = computed(() =>
  userStore.getAccountMenuLinks().some(item => item.to === route.path)
)
</script>

<template>
  <nav class="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-flow-border/60 dark:border-flow-border-dark/60 bg-flow-card/95 dark:bg-flow-card-dark/95 backdrop-blur-md">
    <div class="flex items-stretch justify-around px-2 py-2 safe-area-pb">
      <NuxtLink
        v-for="item in mobileNavItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-1 px-3 py-2 rounded-flow text-[10px] min-w-0 flex-1 transition-colors"
        :class="userStore.isActive(item.to)
          ? 'text-flow-ink dark:text-flow-ink-dark'
          : 'text-flow-muted dark:text-flow-muted-dark'"
      >
        <UIcon :name="item.icon" class="w-5 h-5 stroke-[1.25]" />
        <span class="truncate w-full text-center">{{ item.label }}</span>
      </NuxtLink>

      <button
        type="button"
        class="flex flex-col items-center gap-1 px-3 py-2 rounded-flow text-[10px] min-w-0 flex-1 transition-colors"
        :class="isAccountActive
          ? 'text-flow-ink dark:text-flow-ink-dark'
          : 'text-flow-muted dark:text-flow-muted-dark'"
        :aria-label="t('common.account')"
        @click="openMenu"
      >
        <UAvatar :alt="user?.name ?? user?.email ?? 'U'" size="xs" class="w-5 h-5" />
        <span class="truncate w-full text-center">{{ t('common.account') }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.safe-area-pb {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom, 0));
}
</style>
