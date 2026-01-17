import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet, EditorView } from '@tiptap/pm/view'

const paginationKey = new PluginKey<DecorationSet>('pagination')


const PAGE_HEIGHT = 1123
const MARGIN_TOP = 96
const MARGIN_BOTTOM = 96
const GAP = 30

const CONTENT_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM

export const PaginationExtension = Extension.create({
  name: 'pagination',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: paginationKey,

        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, old) {
            const meta = tr.getMeta(paginationKey)
            if (meta) return meta
            return old.map(tr.mapping, tr.doc)
          },
        },

        props: {
          decorations(state) {
            return paginationKey.getState(state)
          },
        },

        view(editorView: EditorView) {
          let raf1: number | null = null
          let raf2: number | null = null
          let scheduled = false

          const scheduleMeasure = () => {
            if (scheduled) return
            scheduled = true


            raf1 = requestAnimationFrame(() => {
              raf2 = requestAnimationFrame(() => {
                scheduled = false
                measure()
              })
            })
          }

          const measure = () => {
            const { state } = editorView
            const decorations: Decoration[] = []

            const blocks = Array.from(
              editorView.dom.querySelectorAll('.ProseMirror > *')
            ).filter((el) => {
              const e = el as HTMLElement
              return !e.classList.contains('page-spacer-widget')
            }) as HTMLElement[]

            let page = 1
            let used = 0

            for (const el of blocks) {
              const style = window.getComputedStyle(el)
              const marginTop = parseFloat(style.marginTop || '0')
              const marginBottom = parseFloat(style.marginBottom || '0')

              const height = el.getBoundingClientRect().height
              const blockHeight = height + marginTop + marginBottom


              if (used > 0 && used + blockHeight > CONTENT_HEIGHT) {
                const pos = editorView.posAtDOM(el, 0) ?? state.doc.content.size

                const spaceLeft = CONTENT_HEIGHT - used
                const spacerHeight = spaceLeft + MARGIN_BOTTOM + GAP + MARGIN_TOP

                decorations.push(
                  Decoration.widget(
                    pos,
                    () => createSpacer(spacerHeight, page + 1),
                    { side: -1, key: `spacer-${page}-${pos}` }
                  )
                )

                page++
                used = 0
              }

              used += blockHeight
            }


            const remaining = CONTENT_HEIGHT - used
            const fillerHeight =
              used === 0
                ? CONTENT_HEIGHT + MARGIN_BOTTOM
                : remaining > 0
                ? remaining + MARGIN_BOTTOM
                : 0

            if (fillerHeight > 0) {
              decorations.push(
                Decoration.widget(
                  state.doc.content.size,
                  () => createLastFiller(fillerHeight),
                  { side: 1, key: 'page-filler' }
                )
              )
            }

            const next = DecorationSet.create(state.doc, decorations)
            const prev = paginationKey.getState(state)

            editorView.dispatch(state.tr.setMeta(paginationKey, next))
          }

          scheduleMeasure()

          return {
            update(view, prevState) {
              if (!view.state.doc.eq(prevState.doc)) scheduleMeasure()
            },
            destroy() {
              if (raf1) cancelAnimationFrame(raf1)
              if (raf2) cancelAnimationFrame(raf2)
            },
          }
        },
      }),
    ]
  },
})

function createSpacer(height: number, nextPage: number) {
  const spacer = document.createElement('div')
  spacer.className = 'page-spacer-widget'
  spacer.style.height = `${height}px`
  spacer.style.width = '210mm'
  spacer.style.marginLeft = '-25.4mm'
  spacer.style.pointerEvents = 'none'
  spacer.style.userSelect = 'none'
  spacer.style.position = 'relative'
  spacer.style.background = 'white'
  spacer.style.display = 'flex'
  spacer.style.flexDirection = 'column'

  const fill = document.createElement('div')
  fill.style.flex = '1'
  fill.style.background = 'white'
  spacer.appendChild(fill)

  const gap = document.createElement('div')
  gap.style.height = `${GAP}px`
  gap.style.background = '#f3f4f6'
  gap.style.borderTop = '1px solid #e5e7eb'
  gap.style.borderBottom = '1px solid #e5e7eb'
  gap.style.display = 'flex'
  gap.style.alignItems = 'center'
  gap.style.justifyContent = 'flex-end'
  gap.style.paddingRight = '40px'
  gap.style.fontSize = '12px'
  gap.style.color = '#6b7280'
  spacer.appendChild(gap)

  const top = document.createElement('div')
  top.style.height = `${MARGIN_TOP}px`
  top.style.background = 'white'
  spacer.appendChild(top)

  return spacer
}

function createLastFiller(height: number) {
  const filler = document.createElement('div')
  filler.style.height = `${height}px`
  filler.style.width = '210mm'
  filler.style.marginLeft = '-25.4mm'
  filler.style.background = 'white'
  filler.style.pointerEvents = 'none'
  filler.style.userSelect = 'none'
  return filler
}
