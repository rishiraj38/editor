import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

export const KeepOneParagraph = Extension.create({
  name: 'keepOneParagraph',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction(transactions, oldState, newState) {
          const docIsEmpty =
            newState.doc.childCount === 1 &&
            newState.doc.firstChild?.type.name === 'paragraph' &&
            newState.doc.firstChild.content.size === 0


          if (docIsEmpty) return null


          if (newState.doc.content.size === 0 || newState.doc.childCount === 0) {
            const tr = newState.tr.insert(0, newState.schema.nodes.paragraph.create())
            return tr
          }

          return null
        },
      }),
    ]
  },
})
