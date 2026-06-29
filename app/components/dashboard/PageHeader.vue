<script setup lang="ts">
const { t } = useAppI18n()

defineProps<{
  title: string
  description?: string
  eyebrow?: string
  backTo?: string
}>()
</script>

<template>
  <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0 space-y-1">
      <UButton
        v-if="backTo"
        :to="backTo"
        icon="i-lucide-arrow-left"
        :label="t('common.back')"
        variant="ghost"
        color="neutral"
        size="xs"
        class="-ml-1 mb-1"
      />
      <p v-if="eyebrow" class="text-xs font-medium uppercase tracking-wide text-muted">
        {{ eyebrow }}
      </p>
      <h1 class="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
        {{ title }}
      </h1>
      <p v-if="description" class="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        {{ description }}
      </p>
    </div>
    <div
      v-if="$slots.actions"
      class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end"
    >
      <slot name="actions" />
    </div>
  </header>
</template>
