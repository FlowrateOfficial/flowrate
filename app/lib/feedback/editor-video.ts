// ANCHOR: TipTap video block for feedback previews

import { Node, mergeAttributes } from '@tiptap/core'

export const FeedbackVideo = Node.create({
  name: 'feedbackVideo',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      attachId: { default: null },
      title: { default: null }
    }
  },

  parseHTML() {
    return [{ tag: 'video[src]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, {
        controls: true,
        playsinline: true,
        class: 'max-w-full rounded-lg border border-default'
      })
    ]
  }
})
