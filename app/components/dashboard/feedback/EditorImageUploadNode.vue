<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'
import {
  FEEDBACK_ATTACHMENT_REGISTRY_KEY,
  FEEDBACK_MEDIA_ERROR_KEY,
  type FeedbackAttachmentRegistry
} from '~/lib/feedback/attachments'

const props = defineProps<NodeViewProps>()
const registry = inject<FeedbackAttachmentRegistry>(FEEDBACK_ATTACHMENT_REGISTRY_KEY)
const onMediaError = inject<(code: string) => void>(FEEDBACK_MEDIA_ERROR_KEY)
const { t } = useAppI18n()

const file = ref<File | null>(null)

watch(file, (nextFile) => {
  if (!nextFile || !registry) return

  const result = registry.register(nextFile)
  if ('error' in result) {
    onMediaError?.(result.error)
    file.value = null
    return
  }

  const pos = props.getPos()
  if (typeof pos !== 'number') return

  props.editor
    .chain()
    .focus()
    .deleteRange({ from: pos, to: pos + 1 })
    .setImage({
      src: result.previewUrl,
      alt: nextFile.name
    })
    .run()
})
</script>

<template>
  <NodeViewWrapper>
    <UFileUpload
      v-model="file"
      accept="image/*"
      :label="t('dashboard.feedback.uploadImage')"
      :description="t('dashboard.feedback.uploadImageHelp')"
      :preview="false"
      class="min-h-36"
    >
      <template #leading>
        <UAvatar
          icon="i-lucide-image"
          size="lg"
        />
      </template>
    </UFileUpload>
  </NodeViewWrapper>
</template>
