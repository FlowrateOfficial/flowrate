<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { t } = useAppI18n()
const landing = useLandingStore()
const { demoScenes, demoActiveIndex } = storeToRefs(landing)

const active = demoActiveIndex
const scene = computed(() => demoScenes.value[active.value]!)

const shapes: Array<'circle' | 'triangle' | 'semicircle' | 'square'> = [
  'circle',
  'triangle',
  'semicircle',
  'square'
]

const navIcons = [
  'i-lucide-layout-dashboard',
  'i-lucide-arrow-left-right',
  'i-lucide-pie-chart',
  'i-lucide-wallet',
  'i-lucide-settings'
]

let cycleTimer: ReturnType<typeof setInterval> | null = null

function selectScene(index: number) {
  active.value = index
  restartCycle()
}

function restartCycle() {
  if (cycleTimer) clearInterval(cycleTimer)
  if (import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  cycleTimer = setInterval(() => {
    active.value = (active.value + 1) % demoScenes.value.length
  }, 5200)
}

onMounted(restartCycle)
onUnmounted(() => {
  if (cycleTimer) clearInterval(cycleTimer)
})
</script>

<template>
  <LandingSection id="demo" index="02" tinted>
    <template #default>
      <div class="py-16 sm:py-24 md:py-32 overflow-x-clip min-w-0">
        <div class="grid lg:grid-cols-12 gap-8 sm:gap-14 lg:gap-16 items-center min-w-0 max-w-full">
          <div class="lg:col-span-5 space-y-8 landing-section-intro">
            <p class="flow-section-label text-terracotta">{{ t('landing.demo.eyebrow') }}</p>
            <h2 class="text-display-section text-flow-ink dark:text-flow-ink-dark">
              {{ t('landing.demo.title') }}
            </h2>
            <p class="text-lg text-flow-muted dark:text-flow-muted-dark leading-relaxed max-w-md">
              {{ t('landing.demo.description') }}
            </p>

            <div class="flex flex-col gap-2">
              <button
                v-for="(item, i) in demoScenes"
                :key="item.type"
                type="button"
                class="landing-scene-tab group text-left"
                :class="active === i ? 'is-active' : ''"
                @click="selectScene(i)"
              >
                <div class="flex items-center gap-4">
                  <BrandSpaceShape :shape="shapes[i]!" :size="22" class="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div class="min-w-0">
                    <p class="font-display text-lg text-flow-ink dark:text-flow-ink-dark">
                      {{ item.title }}
                    </p>
                    <p class="text-sm text-flow-muted dark:text-flow-muted-dark line-clamp-2 leading-snug">
                      {{ item.hint }}
                    </p>
                  </div>
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="ml-auto size-4 text-flow-muted opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                    :class="active === i ? 'opacity-100! translate-x-0! text-terracotta' : ''"
                  />
                </div>
              </button>
            </div>
          </div>

          <div class="lg:col-span-7 landing-section-panel w-full min-w-0 max-w-full">
            <div class="landing-demo-viewport">
              <div class="landing-demo-frame">
                <div class="landing-demo-chrome">
                  <div class="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                    <span class="landing-demo-dot bg-terracotta/70" />
                    <span class="landing-demo-dot bg-sand" />
                    <span class="landing-demo-dot bg-sage/60" />
                  </div>
                  <span class="landing-demo-chrome-title">
                    {{ t('common.appName') }}
                  </span>
                  <span class="landing-demo-space-badge hidden sm:inline-flex shrink-0">
                    <BrandSpaceShape :shape="scene.shape" :size="11" />
                    <span>{{ scene.title }}</span>
                  </span>
                </div>

                <div class="landing-demo-shell">
                  <aside class="landing-demo-sidebar" aria-hidden="true">
                    <BrandFlowRateMark :size="20" class="mb-4 opacity-80" />
                    <span
                      v-for="icon in navIcons"
                      :key="icon"
                      class="landing-demo-sidebar-item"
                      :class="icon === 'i-lucide-layout-dashboard' && 'is-active'"
                    >
                      <UIcon :name="icon" class="size-4" />
                    </span>
                  </aside>

                  <Transition name="landing-scene" mode="out-in">
                    <div :key="scene.type" class="landing-demo-body landing-demo-body-app w-full min-w-0">
                      <LandingDemoPreview :scene="scene" />
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

            <p class="mt-3 sm:mt-4 px-1 text-center text-[0.6875rem] sm:text-xs text-flow-muted dark:text-flow-muted-dark text-balance leading-relaxed">
              {{ t('landing.demo.caption') }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </LandingSection>
</template>
