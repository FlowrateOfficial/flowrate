<script setup lang="ts">
/* eslint-disable vue/no-v-html -- HTML is sanitized in feedbackMarkdownToHtml */
import { feedbackMarkdownToHtml, repairFeedbackMarkdown } from '~/lib/feedback/markdown'

const props = defineProps<{
  content: string
}>()

const html = computed(() => feedbackMarkdownToHtml(repairFeedbackMarkdown(props.content)))
</script>

<template>
  <div
    class="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed wrap-break-word [&_img]:my-2 [&_img]:max-h-80 [&_img]:w-auto [&_img]:rounded-lg [&_img]:border [&_img]:border-default"
    v-html="html"
  />
</template>
