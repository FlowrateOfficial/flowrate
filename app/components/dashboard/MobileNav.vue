<script setup lang="ts">
const userStore = useUserStore()
const { navItems } = storeToRefs(userStore)
</script>

<template>
  <nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-flow-border/60 dark:border-flow-border-dark/60 bg-flow-card/95 dark:bg-flow-card-dark/95 backdrop-blur-md">
    <div class="flex items-stretch justify-around px-2 py-2 safe-area-pb">
      <NuxtLink
        v-for="item in navItems.slice(0, 5)"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-1 px-3 py-2 rounded-flow text-[10px] min-w-0 flex-1 transition-colors"
        :class="userStore.isActive(item.to)
          ? 'text-flow-ink dark:text-flow-ink-dark'
          : 'text-flow-muted dark:text-flow-muted-dark'"
      >
        <UIcon :name="item.icon" class="w-5 h-5 stroke-[1.25]" />
        <span class="truncate w-full text-center">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
