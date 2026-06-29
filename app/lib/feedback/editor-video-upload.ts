// ANCHOR: TipTap videoUpload node for feedback editor

import { Node, mergeAttributes } from '@tiptap/core'
import type { CommandProps, NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import EditorVideoUploadNode from '~/components/dashboard/feedback/EditorVideoUploadNode.vue'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    videoUpload: {
      insertVideoUpload: () => ReturnType
    }
  }
}

export const FeedbackVideoUpload = Node.create({
  name: 'videoUpload',
  group: 'block',
  atom: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="video-upload"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'video-upload' })]
  },

  addNodeView(): NodeViewRenderer {
    return VueNodeViewRenderer(EditorVideoUploadNode)
  },

  addCommands() {
    return {
      insertVideoUpload: () => ({ commands }: CommandProps) => {
        return commands.insertContent({ type: this.name })
      }
    }
  }
})
