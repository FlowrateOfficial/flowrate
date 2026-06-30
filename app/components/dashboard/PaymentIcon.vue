<script setup lang="ts">
// ANCHOR: Payment row icon
import { brandLogoUrl } from '#shared/brand-logo'
import { paymentCategoryIcon } from '#shared/payment-icons'

const props = withDefaults(defineProps<{
  name?: string | null
  merchant?: string | null
  merchantDomain?: string | null
  category?: string | null
  fallbackIcon?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'md'
})

const cdnBase = useState('asset-cdn-base', () =>
  String(useRuntimeConfig().public.assetCdnBaseUrl ?? '')
)

const label = computed(() => props.merchant ?? props.name ?? '')
const iconName = computed(() => props.fallbackIcon ?? paymentCategoryIcon(props.category))
const src = computed(() => brandLogoUrl(label.value, props.merchantDomain, cdnBase.value))

const logoFailed = ref(false)

watch([label, () => props.merchantDomain], () => {
  logoFailed.value = false
})

const boxClass = computed(() => {
  switch (props.size) {
    case 'xs': return 'size-7 text-xs'
    case 'sm': return 'size-8 text-xs'
    case 'lg': return 'size-11 text-base'
    case 'xl': return 'size-12 text-base rounded-xl'
    default: return 'size-9 text-sm'
  }
})

const avatarLetter = computed(() => label.value.charAt(0).toUpperCase() || '?')
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted font-bold text-muted"
    :class="boxClass"
  >
    <img
      v-if="src && !logoFailed"
      :src="src"
      :alt="label"
      class="size-full object-contain p-1"
      loading="lazy"
      decoding="async"
      @error="logoFailed = true"
    >
    <UIcon v-else-if="iconName" :name="iconName" class="size-[55%] shrink-0 text-primary" />
    <span v-else>{{ avatarLetter }}</span>
  </div>
</template>
