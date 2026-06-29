<script setup lang="ts">
// ANCHOR: TipTap feedback editor — toolbar, image and video uploads
import type { EditorCustomHandlers, EditorSuggestionMenuItem, EditorToolbarItem } from '@nuxt/ui'
import type { Editor } from '@tiptap/vue-3'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { FEEDBACK_ATTACH_PREFIX } from '#shared/feedback'
import {
  createFeedbackAttachmentRegistry,
  FEEDBACK_ATTACHMENT_REGISTRY_KEY,
  FEEDBACK_MEDIA_ERROR_KEY,
  type FeedbackAttachmentRegistry
} from '~/lib/feedback/attachments'
import { FeedbackImageUpload } from '~/lib/feedback/editor-image-upload'
import { FeedbackVideo } from '~/lib/feedback/editor-video'
import { FeedbackVideoUpload } from '~/lib/feedback/editor-video-upload'
import { cleanFeedbackAttachmentMarkdown } from '~/lib/feedback/markdown'

defineProps<{
  placeholder?: string
}>()

const emit = defineEmits<{
  mediaError: [code: string]
}>()

const { t } = useAppI18n()
const model = defineModel<string>({ default: '' })
const editorRef = useTemplateRef<{ editor?: Editor }>('editorRef')
const registry = createFeedbackAttachmentRegistry()

const customHandlers = {
  imageUpload: {
    canExecute: (editor: Editor) => editor.can().insertContent({ type: 'imageUpload' }),
    execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'imageUpload' }),
    isActive: (editor: Editor) => editor.isActive('imageUpload'),
    isDisabled: undefined
  },
  videoUpload: {
    canExecute: (editor: Editor) => editor.can().insertContent({ type: 'videoUpload' }),
    execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'videoUpload' }),
    isActive: (editor: Editor) => editor.isActive('videoUpload'),
    isDisabled: undefined
  }
} satisfies EditorCustomHandlers

const fixedToolbarItems = [[
  { kind: 'undo', icon: 'i-lucide-undo', tooltip: { text: 'Undo' } },
  { kind: 'redo', icon: 'i-lucide-redo', tooltip: { text: 'Redo' } }
], [{
  icon: 'i-lucide-heading',
  tooltip: { text: 'Headings' },
  content: { align: 'start' },
  items: [
    { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', label: 'Heading 2' },
    { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', label: 'Heading 3' }
  ]
}, {
  icon: 'i-lucide-list',
  tooltip: { text: 'Lists' },
  content: { align: 'start' },
  items: [
    { kind: 'bulletList', icon: 'i-lucide-list', label: 'Bullet list' },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', label: 'Numbered list' }
  ]
}, {
  kind: 'blockquote',
  icon: 'i-lucide-text-quote',
  tooltip: { text: 'Quote' }
}, {
  kind: 'codeBlock',
  icon: 'i-lucide-square-code',
  tooltip: { text: 'Code block' }
}], [{
  kind: 'mark',
  mark: 'bold',
  icon: 'i-lucide-bold',
  tooltip: { text: 'Bold' }
}, {
  kind: 'mark',
  mark: 'italic',
  icon: 'i-lucide-italic',
  tooltip: { text: 'Italic' }
}, {
  kind: 'mark',
  mark: 'strike',
  icon: 'i-lucide-strikethrough',
  tooltip: { text: 'Strikethrough' }
}, {
  kind: 'mark',
  mark: 'code',
  icon: 'i-lucide-code',
  tooltip: { text: 'Code' }
}], [{
  kind: 'link',
  icon: 'i-lucide-link',
  tooltip: { text: 'Link' }
}, {
  kind: 'imageUpload',
  icon: 'i-lucide-image',
  tooltip: { text: 'Image' }
}, {
  kind: 'videoUpload',
  icon: 'i-lucide-video',
  tooltip: { text: 'Video' }
}], [{
  kind: 'horizontalRule',
  icon: 'i-lucide-minus',
  tooltip: { text: 'Divider' }
}]] satisfies EditorToolbarItem<typeof customHandlers>[][]

const suggestionItems = [[{
  type: 'label',
  label: 'Style'
}, {
  kind: 'paragraph',
  label: 'Paragraph',
  icon: 'i-lucide-type'
}, {
  kind: 'heading',
  level: 2,
  label: 'Heading 2',
  icon: 'i-lucide-heading-2'
}, {
  kind: 'heading',
  level: 3,
  label: 'Heading 3',
  icon: 'i-lucide-heading-3'
}, {
  kind: 'bulletList',
  label: 'Bullet list',
  icon: 'i-lucide-list'
}, {
  kind: 'orderedList',
  label: 'Numbered list',
  icon: 'i-lucide-list-ordered'
}, {
  kind: 'blockquote',
  label: 'Quote',
  icon: 'i-lucide-text-quote'
}, {
  kind: 'codeBlock',
  label: 'Code block',
  icon: 'i-lucide-square-code'
}], [{
  type: 'label',
  label: 'Insert'
}, {
  kind: 'imageUpload',
  label: 'Image',
  icon: 'i-lucide-image'
}, {
  kind: 'videoUpload',
  label: 'Video',
  icon: 'i-lucide-video'
}, {
  kind: 'horizontalRule',
  label: 'Divider',
  icon: 'i-lucide-separator-horizontal'
}]] satisfies EditorSuggestionMenuItem<typeof customHandlers>[][]

// NOTE - Append editor menus to body for z-index
const appendToBody = import.meta.client ? () => document.body : undefined

function onMediaError(code: string) {
  emit('mediaError', code)
}

provide(FEEDBACK_ATTACHMENT_REGISTRY_KEY, registry)
provide(FEEDBACK_MEDIA_ERROR_KEY, onMediaError)

function appendImageMarkdown(
  message: string,
  editor: Editor | undefined,
  registry: FeedbackAttachmentRegistry
): string {
  if (!editor) return message

  let result = message
  editor.state.doc.descendants((node: ProseMirrorNode) => {
    if (node.type.name !== 'image') return

    const src = typeof node.attrs.src === 'string' ? node.attrs.src : ''
    const alt = typeof node.attrs.alt === 'string' ? node.attrs.alt : 'image'

    for (const entry of registry.list()) {
      const token = `${FEEDBACK_ATTACH_PREFIX}${entry.id}`
      if (src !== entry.previewUrl) continue

      if (result.includes(src)) {
        result = result.replaceAll(src, token)
        const encoded = encodeURI(src)
        if (encoded !== src) {
          result = result.replaceAll(encoded, token)
        }
      } else if (!result.includes(token)) {
        result = `${result}\n\n![${alt}](${token})`.trim()
      }
    }
  })

  return result
}

function appendVideoMarkdown(message: string, editor: Editor | undefined): string {
  if (!editor) return message

  const blocks: string[] = []
  editor.state.doc.descendants((node: ProseMirrorNode) => {
    if (node.type.name !== 'feedbackVideo' || !node.attrs.attachId) return
    const token = `${FEEDBACK_ATTACH_PREFIX}${node.attrs.attachId}`
    if (!message.includes(token)) {
      blocks.push(`[${node.attrs.title || 'video'}](${token})`)
    }
  })

  if (!blocks.length) return message
  return `${message}\n\n${blocks.join('\n\n')}`.trim()
}

function buildMessage(): string {
  const editor = editorRef.value?.editor
  const markdown = typeof model.value === 'string' ? model.value : ''
  const withImages = appendImageMarkdown(markdown, editor, registry)
  const normalized = registry.normalizeMarkdown(withImages)
  const cleaned = cleanFeedbackAttachmentMarkdown(normalized)
  return appendVideoMarkdown(cleaned, editor).trim()
}

function getRegistry(): FeedbackAttachmentRegistry {
  return registry
}

function clearAttachments() {
  registry.clear()
}

const attachmentCount = computed(() => registry.list().length)

onBeforeUnmount(() => {
  registry.clear()
})

defineExpose({
  buildMessage,
  getRegistry,
  clearAttachments,
  attachmentCount
})
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-default bg-default">
    <UEditor
      ref="editorRef"
      v-slot="{ editor }"
      v-model="model"
      content-type="markdown"
      :placeholder="placeholder ?? t('dashboard.feedback.editorPlaceholder')"
      :extensions="[FeedbackImageUpload, FeedbackVideoUpload, FeedbackVideo]"
      :handlers="customHandlers"
      :mention="false"
      class="min-h-64 w-full"
      :ui="{
        base: 'px-4 py-3 text-sm leading-relaxed min-h-56',
        content: 'prose prose-sm dark:prose-invert max-w-none focus:outline-hidden'
      }"
    >
      <UEditorToolbar
        :editor="editor"
        :items="fixedToolbarItems"
        class="sticky top-0 z-10 border-b border-default bg-elevated/80 px-2 py-1.5 backdrop-blur-sm overflow-x-auto"
      />

      <UEditorToolbar
        :editor="editor"
        :items="[[
          { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold' },
          { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic' },
          { kind: 'link', icon: 'i-lucide-link' },
          { kind: 'imageUpload', icon: 'i-lucide-image' }
        ]]"
        layout="bubble"
        :should-show="({ editor: ed, view, state }) => {
          if (ed.isActive('imageUpload') || ed.isActive('videoUpload') || ed.isActive('image')) {
            return false
          }
          const { selection } = state
          return view.hasFocus() && !selection.empty
        }"
      />

      <UEditorSuggestionMenu
        :editor="editor"
        :items="suggestionItems"
        :append-to="appendToBody"
      />
    </UEditor>

    <div
      v-if="attachmentCount > 0"
      class="flex items-center gap-2 border-t border-default px-4 py-2 text-xs text-muted"
    >
      <UIcon
        name="i-lucide-paperclip"
        class="size-3.5"
      />
      <span>{{ t('dashboard.feedback.attachmentCount', { count: attachmentCount }) }}</span>
    </div>
  </div>
</template>
