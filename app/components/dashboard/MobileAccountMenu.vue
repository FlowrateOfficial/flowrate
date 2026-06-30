<script setup lang="ts">
const { t } = useAppI18n()
const userStore = useUserStore()
const { user, navItems } = storeToRefs(userStore)
const { open, closeMenu } = useMobileAccountMenu()
const { openCustomizer } = useMobileNavCustomizer()
const { footerPaths } = useMobileNavLayout()
const { prefetchRoute } = useNavPrefetch()

const accountLinks = computed(() =>
  userStore.getAccountMenuLinks().filter(item => !footerPaths.value.has(item.to))
)

const menuNavItems = computed(() =>
  navItems.value.filter(item => !footerPaths.value.has(item.to))
)

async function goTo(to: string) {
  prefetchRoute(to)
  closeMenu()
  await navigateTo(to)
}

async function signOut() {
  closeMenu()
  await userStore.logout()
}
</script>

<template>
  <USlideover
    v-model:open="open"
    side="bottom"
    :title="t('common.account')"
    :ui="{ content: 'max-h-[90dvh] rounded-t-2xl' }"
  >
    <template #body>
      <div class="space-y-5 pb-4">
        <div class="flex items-center gap-3 rounded-xl bg-elevated p-4">
          <UAvatar :alt="user?.name ?? user?.email ?? 'U'" size="lg" />
          <div class="min-w-0">
            <p class="truncate text-base font-semibold">
              {{ user?.name ?? t('common.account') }}
            </p>
            <p v-if="user?.email" class="truncate text-sm text-muted">
              {{ user.email }}
            </p>
          </div>
        </div>

        <div v-if="menuNavItems.length" class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">
            {{ t('dashboard.layout.allPages') }}
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="item in menuNavItems"
              :key="item.to"
              type="button"
              class="flex min-h-12 items-center gap-2 rounded-xl border border-default bg-elevated/20 px-3 py-2 text-left transition-colors hover:bg-elevated/50"
              @pointerenter="prefetchRoute(item.to)"
              @click="goTo(item.to)"
            >
              <UIcon :name="item.icon" class="size-4 shrink-0 text-primary" />
              <span class="block min-w-0 flex-1 text-sm leading-snug line-clamp-2">{{ item.label }}</span>
            </button>
          </div>
        </div>

        <USeparator v-if="menuNavItems.length" />

        <div class="flex flex-col gap-1">
          <UButton
            color="neutral"
            variant="ghost"
            block
            size="lg"
            class="min-h-12 justify-start gap-3"
            icon="i-lucide-columns-3"
            :label="t('dashboard.layout.customizeFooter')"
            @click="openCustomizer(); closeMenu()"
          />
          <UButton
            v-for="item in accountLinks"
            :key="item.to"
            color="neutral"
            variant="ghost"
            block
            size="lg"
            class="min-h-12 justify-start gap-3"
            :icon="item.icon"
            :label="item.label"
            @click="goTo(item.to)"
          />
          <UButton
            color="neutral"
            variant="ghost"
            block
            size="lg"
            class="min-h-12 justify-start gap-3"
            icon="i-lucide-log-out"
            :label="t('common.signOut')"
            @click="signOut"
          />
        </div>
      </div>
    </template>
  </USlideover>
</template>
