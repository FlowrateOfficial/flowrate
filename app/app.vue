<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, minimum-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap'
    }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: 'FlowRate — Your Financial Operating System',
  description: 'Finance designed for thoughtful people. Manage Independent, Household, Family, and Company financial identities in one calm, intelligent platform.',
  ogTitle: 'FlowRate — Your Financial Operating System',
  ogDescription: 'Finance designed for thoughtful people.',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp :ui="{ root: 'surface-page min-h-screen' }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
