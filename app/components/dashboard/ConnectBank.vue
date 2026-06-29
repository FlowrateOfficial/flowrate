<script setup lang="ts">
import { storeToRefs } from 'pinia'

const props = withDefaults(defineProps<{
  label?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  block?: boolean
  showRefresh?: boolean
  color?: 'primary' | 'neutral'
  variant?: 'solid' | 'outline' | 'soft' | 'ghost'
}>(), {
  size: 'lg',
  color: 'primary',
  variant: 'solid'
})

const accountsStore = useAccountsStore()
const { connectItems, isConnecting } = storeToRefs(accountsStore)
const { t } = useAppI18n()

const hasOptions = computed(() => (connectItems.value[0]?.length ?? 0) > 0)

const buttonClass = computed(() => {
  const classes: string[] = []
  if (props.block) classes.push('w-full sm:w-auto')
  if (props.size === 'lg' || props.size === 'xl') classes.push('min-h-12')
  if (props.size === 'xl') classes.push('min-h-14')
  return classes.join(' ')
})
</script>

<template>
  <div
    class="inline-flex flex-wrap items-center gap-2"
    :class="block ? 'w-full flex-col sm:flex-row sm:justify-center' : ''"
  >
    <UDropdownMenu v-if="hasOptions" :items="connectItems">
      <UButton
        :label="label ?? t('dashboard.accounts.connectBank')"
        icon="i-lucide-plus"
        :size="size"
        :color="color"
        :variant="variant"
        :class="buttonClass"
        :loading="isConnecting"
        trailing-icon="i-lucide-chevron-down"
      />
    </UDropdownMenu>
    <UButton
      v-else
      :label="label ?? t('dashboard.accounts.connectBank')"
      icon="i-lucide-plus"
      :size="size"
      :color="color"
      :variant="variant"
      :class="buttonClass"
      disabled
    />
    <UButton
      v-if="showRefresh"
      :label="t('dashboard.accounts.resyncFromStripe')"
      icon="i-lucide-refresh-cw"
      color="neutral"
      variant="outline"
      :size="size"
      :class="buttonClass"
      :loading="isConnecting"
      @click="accountsStore.resyncFromStripe()"
    />
  </div>
</template>
