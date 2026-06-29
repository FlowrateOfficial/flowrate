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
  <USlideover
    v-model:open="open"
    side="bottom"
    :title="t('common.account')"
    :ui="{ content: 'max-h-[85dvh] rounded-t-2xl' }"
  >
    <template #body>
      <div class="space-y-4 pb-4">
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

        <div class="flex flex-col gap-1">
          <UButton
            v-for="item in menuLinks"
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
