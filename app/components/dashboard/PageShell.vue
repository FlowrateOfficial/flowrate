<script setup lang="ts">
// ANCHOR: Dashboard page wrapper — max-width, optional viewport fill
defineProps<{
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '6xl' | '7xl' | 'full'
  showGuide?: boolean
  // NOTE - Fill viewport height for data-heavy pages
  fill?: boolean
}>()

const maxWidthClass: Record<string, string> = {
  'md': 'max-w-3xl',
  'lg': 'max-w-4xl',
  'xl': 'max-w-5xl',
  '2xl': 'max-w-6xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  'full': 'max-w-360'
}
</script>

<template>
  <div
    class="mx-auto w-full px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6"
    :class="[
      maxWidthClass[maxWidth ?? '7xl'],
      fill && 'flex h-[calc(100dvh-7.5rem)] max-h-[calc(100dvh-7.5rem)] flex-col overflow-hidden lg:h-[calc(100dvh-4.5rem)] lg:max-h-[calc(100dvh-4.5rem)]'
    ]"
  >
    <div
      class="flex flex-col gap-4 sm:gap-5"
      :class="fill && 'min-h-0 flex-1 overflow-hidden'"
    >
      <DashboardRoleGuide v-if="showGuide" />
      <slot />
    </div>
  </div>
</template>
