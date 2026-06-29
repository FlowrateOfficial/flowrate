<script setup lang="ts">
const { t } = useAppI18n()

const VERCEL_SPEED_INSIGHTS_URL = 'https://vercel.com/docs/speed-insights'
const BRAVE_BROWSER_URL = 'https://brave.com/'
</script>

<template>
  <aside
    class="rounded-lg border border-default/60 bg-elevated/30 p-4 sm:p-5 space-y-3 text-sm text-muted leading-relaxed"
    :aria-label="t('legal.speedInsights.title')"
  >
    <h3 class="font-semibold text-default">
      {{ t('legal.speedInsights.title') }}
    </h3>
    <p>{{ t('legal.speedInsights.p1') }}</p>
    <p>
      {{ t('legal.speedInsights.p2Before') }}
      <a
        :href="VERCEL_SPEED_INSIGHTS_URL"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary hover:underline"
      >{{ t('legal.speedInsights.vercelLink') }}</a>{{ t('legal.speedInsights.p2After') }}
    </p>
    <p>
      {{ t('legal.speedInsights.p3Before') }}
      <a
        :href="BRAVE_BROWSER_URL"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary hover:underline"
      >{{ t('legal.speedInsights.braveLink') }}</a>{{ t('legal.speedInsights.p3After') }}
    </p>
  </aside>
</template>
