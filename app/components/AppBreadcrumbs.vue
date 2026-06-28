<script setup lang="ts">
import type { BreadcrumbItem } from '~/composables/useBreadcrumbs'

const props = defineProps<{
  items?: BreadcrumbItem[]
}>()

const { t } = useAppI18n()
const { items: routeItems } = useBreadcrumbs()

const crumbs = computed(() => props.items ?? routeItems.value)
</script>

<template>
  <nav
    v-if="crumbs.length"
    :aria-label="t('breadcrumbs.label')"
    class="min-w-0"
  >
    <ol class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
      <li
        v-for="(crumb, index) in crumbs"
        :key="`${crumb.label}-${index}`"
        class="flex items-center gap-1.5 min-w-0"
      >
        <UIcon
          v-if="index > 0"
          name="i-lucide-chevron-right"
          class="w-3.5 h-3.5 shrink-0 text-flow-muted dark:text-flow-muted-dark"
          aria-hidden="true"
        />
        <NuxtLink
          v-if="crumb.to && index < crumbs.length - 1"
          :to="crumb.to"
          class="truncate text-flow-muted dark:text-flow-muted-dark hover:text-flow-ink dark:hover:text-flow-ink-dark transition-colors"
        >
          {{ crumb.label }}
        </NuxtLink>
        <span
          v-else
          class="truncate font-medium text-flow-ink dark:text-flow-ink-dark"
          :aria-current="index === crumbs.length - 1 ? 'page' : undefined"
        >
          {{ crumb.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
