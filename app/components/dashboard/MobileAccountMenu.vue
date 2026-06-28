<script setup lang="ts">
const { t } = useAppI18n()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const { open, closeMenu } = useMobileAccountMenu()

const menuLinks = computed(() => userStore.getAccountMenuLinks())

async function goTo(to: string) {
  closeMenu()
  await navigateTo(to)
}

async function signOut() {
  closeMenu()
  await userStore.logout()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="lg:hidden fixed inset-0 z-60"
      role="dialog"
      :aria-label="t('common.account')"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/40"
        :aria-label="t('common.cancel')"
        @click="closeMenu"
      />

      <div
        class="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-flow-border/60 dark:border-flow-border-dark/60 bg-flow-card dark:bg-flow-card-dark shadow-2xl safe-area-pb"
      >
        <div class="px-5 pt-5 pb-3 border-b border-flow-border/40 dark:border-flow-border-dark/40">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-medium text-flow-ink dark:text-flow-ink-dark truncate">
                {{ user?.name ?? t('common.account') }}
              </p>
              <p v-if="user?.email" class="text-sm text-flow-muted dark:text-flow-muted-dark truncate mt-0.5">
                {{ user.email }}
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 p-2 -mr-2 -mt-1 rounded-flow text-flow-muted hover:text-flow-ink dark:hover:text-flow-ink-dark"
              :aria-label="t('common.cancel')"
              @click="closeMenu"
            >
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="p-2">
          <button
            v-for="item in menuLinks"
            :key="item.to"
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3.5 rounded-flow text-sm text-left text-flow-ink dark:text-flow-ink-dark hover:bg-flow-secondary/60 dark:hover:bg-flow-secondary-dark/60 transition-colors"
            @click="goTo(item.to)"
          >
            <UIcon :name="item.icon" class="w-4 h-4 shrink-0 stroke-[1.25]" />
            {{ item.label }}
          </button>

          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3.5 rounded-flow text-sm text-left text-flow-ink dark:text-flow-ink-dark hover:bg-flow-secondary/60 dark:hover:bg-flow-secondary-dark/60 transition-colors"
            @click="signOut"
          >
            <UIcon name="i-lucide-log-out" class="w-4 h-4 shrink-0 stroke-[1.25]" />
            {{ t('common.signOut') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.safe-area-pb {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom, 0));
}
</style>
