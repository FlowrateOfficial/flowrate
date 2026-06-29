<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'sm' | 'md'
  showHint?: boolean
}>(), {
  size: 'sm',
  showHint: false
})

const { t } = useAppI18n()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full border font-medium tracking-wide uppercase"
    :class="[
      size === 'sm'
        ? 'px-2 py-0.5 text-[10px] gap-1'
        : 'px-2.5 py-1 text-[11px]',
      'border-terracotta/35 bg-terracotta/10 text-terracotta dark:border-terracotta/45 dark:bg-terracotta/15 dark:text-[#E8A882]'
    ]"
    :title="t('common.betaHint')"
  >
    <span class="size-1.5 rounded-full bg-terracotta animate-pulse" aria-hidden="true" />
    {{ t('common.beta') }}
    <span
      v-if="showHint"
      class="normal-case tracking-normal text-flow-muted dark:text-flow-muted-dark font-normal"
    >
      · {{ t('common.betaInProgress') }}
    </span>
  </span>
</template>
