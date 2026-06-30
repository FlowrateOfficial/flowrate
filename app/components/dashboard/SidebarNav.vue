<script setup lang="ts">
const userStore = useUserStore()
const { navItems, bottomItems } = storeToRefs(userStore)
const { onNavHover } = useNavPrefetch()

function linkClass(active: boolean) {
  return active
    ? 'bg-elevated text-default font-medium ring-1 ring-default/60'
    : 'text-muted hover:bg-elevated/70 hover:text-default'
}
</script>

<template>
  <nav class="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4" aria-label="Main">
    <UButton
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      color="neutral"
      variant="ghost"
      block
      size="lg"
      class="min-h-12 justify-start gap-3 px-4 text-base"
      :class="linkClass(userStore.isActive(item.to))"
      :icon="item.icon"
      :label="item.label"
      @mouseenter="onNavHover(item.to)"
      @focus="onNavHover(item.to)"
    />
  </nav>

  <div class="space-y-1 border-t border-default px-2 py-4">
    <UButton
      v-for="item in bottomItems"
      :key="item.to"
      :to="item.to"
      color="neutral"
      variant="ghost"
      block
      size="lg"
      class="min-h-11 justify-start gap-3 px-4"
      :class="linkClass(userStore.isActive(item.to))"
      :icon="item.icon"
      :label="item.label"
      @mouseenter="onNavHover(item.to)"
      @focus="onNavHover(item.to)"
    />
  </div>
</template>
