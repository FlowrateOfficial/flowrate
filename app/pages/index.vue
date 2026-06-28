<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ middleware: 'guest' })

const landing = useLandingStore()
const billingStore = useBillingStore()
const {
  howItWorks,
  audiences,
  features,
  pricingPlans,
  testimonials
} = storeToRefs(landing)
const { t } = useAppI18n()

onMounted(() => billingStore.fetchPlans())

useSeoMeta({
  title: () => `${t('common.appName')} — ${t('landing.heroTitle')}`,
  description: () => t('landing.heroDescription')
})
</script>

<template>
  <div>
    <LandingHero />
    <LandingHowItWorks :items="howItWorks" />
    <LandingSpaces :items="audiences" />
    <LandingFeatures :items="features" />
    <LandingPricing :plans="pricingPlans" />
    <LandingTestimonials :items="testimonials" />
    <LandingCta />
  </div>
</template>
