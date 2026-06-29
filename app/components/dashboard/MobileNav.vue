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
  <nav
    class="fixed inset-x-0 bottom-0 z-50 border-t border-default bg-default/95 backdrop-blur-md lg:hidden"
    :aria-label="t('dashboard.layout.mobileNav')"
  >
    <div class="grid grid-cols-5 gap-1 px-2 py-2 safe-area-pb">
      <UButton
        v-for="item in mobileNavItems"
        :key="item.to"
        :to="item.to"
        color="neutral"
        variant="ghost"
        size="sm"
        class="min-h-14 flex-col gap-1 px-1"
        :class="userStore.isActive(item.to) ? 'text-default' : 'text-muted'"
      >
        <UIcon :name="item.icon" class="size-6" />
        <span class="w-full truncate text-center text-[11px] leading-tight">{{ item.label }}</span>
      </UButton>

      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        class="min-h-14 flex-col gap-1 px-1"
        :class="isAccountActive ? 'text-default' : 'text-muted'"
        :aria-label="t('common.account')"
        @click="openMenu"
      >
        <UAvatar :alt="user?.name ?? user?.email ?? 'U'" size="xs" class="size-6" />
        <span class="w-full truncate text-center text-[11px] leading-tight">{{ t('common.account') }}</span>
      </UButton>
    </div>
  </nav>
</template>

<style scoped>
.safe-area-pb {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom, 0));
}
</style>
