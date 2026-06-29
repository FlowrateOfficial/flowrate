<script setup lang="ts">
import { storeToRefs } from 'pinia'

const route = useRoute()
const { t } = useAppI18n()
const userStore = useUserStore()
const spacesStore = useSpacesStore()
const { user } = storeToRefs(userStore)
const { space } = storeToRefs(spacesStore)
const { footerItems } = useMobileNavLayout()
const { openMenu: openAccountMenu } = useMobileAccountMenu()

const spaceNavKey = computed(() => space.value?.id ?? 'none')

const isAccountActive = computed(() =>
  userStore.getAccountMenuLinks().some(item => item.to === route.path)
)
</script>

<template>
  <ClientOnly>
    <nav
      :key="spaceNavKey"
      class="fixed inset-x-0 bottom-0 z-50 border-t border-default bg-default/95 backdrop-blur-md lg:hidden"
      :aria-label="t('dashboard.layout.mobileNav')"
    >
      <div class="flex gap-0.5 px-1.5 py-1.5 safe-area-pb sm:gap-1 sm:px-2 sm:py-2">
        <UButton
          v-for="item in footerItems"
          :key="`${spaceNavKey}-${item.to}`"
          :to="item.to"
          color="neutral"
          variant="ghost"
          size="sm"
          class="mobile-nav-tab min-h-[3.75rem] min-w-0 flex-1 flex-col gap-0.5 px-0.5 sm:min-h-14 sm:gap-1 sm:px-1"
          :class="userStore.isActive(item.to) ? 'text-default' : 'text-muted'"
          :aria-label="item.label"
          :title="item.label"
        >
          <UIcon :name="item.icon" class="size-5 shrink-0 sm:size-6" />
          <span class="mobile-nav-tab-label w-full text-center leading-tight">
            {{ item.label }}
          </span>
        </UButton>

        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          class="mobile-nav-tab min-h-[3.75rem] min-w-0 flex-1 flex-col gap-0.5 px-0.5 sm:min-h-14 sm:gap-1 sm:px-1"
          :class="isAccountActive ? 'text-default' : 'text-muted'"
          :aria-label="t('common.account')"
          :title="t('common.account')"
          @click="openAccountMenu"
        >
          <UAvatar :alt="user?.name ?? user?.email ?? 'U'" size="xs" class="size-5 shrink-0 sm:size-6" />
          <span class="mobile-nav-tab-label w-full text-center leading-tight">
            {{ t('common.account') }}
          </span>
        </UButton>
      </div>
    </nav>

    <template #fallback>
      <nav
        class="fixed inset-x-0 bottom-0 z-50 border-t border-default bg-default/95 backdrop-blur-md lg:hidden"
        aria-hidden="true"
      >
        <div class="flex gap-1 px-2 py-2 safe-area-pb">
          <div v-for="i in 5" :key="i" class="min-h-14 min-w-0 flex-1 rounded-lg bg-elevated/40" />
        </div>
      </nav>
    </template>
  </ClientOnly>
</template>

<style scoped>
.safe-area-pb {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom, 0));
}

.mobile-nav-tab-label {
  font-size: 0.625rem;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
}

@media (min-width: 390px) {
  .mobile-nav-tab-label {
    font-size: 0.6875rem;
  }
}
</style>
