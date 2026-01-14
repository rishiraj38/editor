import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { EditorView } from '@tiptap/pm/view';

const paginationKey = new PluginKey('pagination');

export const PaginationExtension = Extension.create({
  name: 'pagination',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: paginationKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, old) {
            const meta = tr.getMeta(paginationKey);
            if (meta) {
              return meta;
            }
            return old.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return paginationKey.getState(state);
          },
        },
        view(editorView: EditorView) {
          let isScheduled = false;
          let rafId: number | null = null;
          let resizeObserver: ResizeObserver | null = null;

          const measure = () => {
             isScheduled = false;
             const { state, dispatch } = editorView;
             
             // A4 Constants (96 DPI)
             const A4_HEIGHT = 1123;
             const PAGE_MARGIN_TOP = 96;
             const PAGE_MARGIN_BOTTOM = 96;
             const CONTENT_HEIGHT = A4_HEIGHT - PAGE_MARGIN_TOP - PAGE_MARGIN_BOTTOM; // 931px
             
             // Get CURRENTLY RENDERED spacers to perform mathematical correction
             // We do NOT hide them (prevents flickering). We just subtract their heights.
             const spacerElements = Array.from(editorView.dom.querySelectorAll('.page-spacer-widget')).map(el => {
                 const rect = el.getBoundingClientRect();
                 return {
                     bottom: rect.bottom, // We use global visual sorting
                     height: rect.height
                 };
             }).sort((a, b) => a.bottom - b.bottom);
             
             const editorRect = editorView.dom.getBoundingClientRect();
             const decorations: Decoration[] = [];
             
             // Grid-Based Accumulation Logic
             let accumulatedSpacerHeight = 0;
             let nextPageTargetVisual = A4_HEIGHT; // First break at 1123px
             let currentPageContentStart = 0; 
             let pageIndex = 0;
             let maxVisualBottom = 0; // Track deep content for filler

             state.doc.descendants((node, pos) => {
                 if (!node.isBlock) return false;
                 
                 const isLeaf = node.isTextblock || node.isAtom;
                 if (!isLeaf) return true;
                 
                 const dom = editorView.nodeDOM(pos) as HTMLElement;
                 if (!dom || dom.nodeType !== 1 || !dom.isConnected) return false;
                 
                 const rect = dom.getBoundingClientRect();
                 
                 // Calculate "Clean" Top by subtracting specific spacers that are ABOVE this node
                 const topWithSpacers = rect.top;
                 
                 let existingSpacersAbove = 0;
                 for (const spacer of spacerElements) {
                     if (spacer.bottom <= topWithSpacers + 5) { 
                         existingSpacersAbove += spacer.height;
                     } else {
                         break;
                     }
                 }

                 const visualTopWithSpacers = rect.top - editorRect.top;
                 const cleanVisualTop = visualTopWithSpacers - existingSpacersAbove;
                 const cleanContentTop = cleanVisualTop - PAGE_MARGIN_TOP; 
                 const height = rect.height;
                 
                 const contentOnPage = cleanContentTop - currentPageContentStart;
                 const contentBottomOnPage = contentOnPage + height;
                 const isGiant = height > CONTENT_HEIGHT;
                 
                 if (contentBottomOnPage > CONTENT_HEIGHT && !isGiant) {
                     // Break
                     const currentVisualTop = cleanVisualTop + accumulatedSpacerHeight;
                     const targetVisualContentStart = nextPageTargetVisual + PAGE_MARGIN_TOP;
                     const spacerHeight = targetVisualContentStart - currentVisualTop;
                     
                     if (spacerHeight > 0) {
                        decorations.push(
                            Decoration.widget(pos, () => {
                                const spacer = document.createElement('div');
                                spacer.className = 'page-spacer-widget';
                                spacer.style.height = `${spacerHeight}px`;
                                spacer.style.marginLeft = '-25.4mm';
                                spacer.style.width = '210mm';
                                spacer.style.userSelect = 'none';
                                spacer.style.pointerEvents = 'none';
                                spacer.style.position = 'relative';
                                spacer.style.backgroundColor = 'white'; // Paper color
                                
                                // PRO VISUALS: The Gap between pages
                                const gapContainer = document.createElement('div');
                                gapContainer.style.position = 'absolute';
                                gapContainer.style.bottom = '96px';
                                gapContainer.style.left = '0';
                                gapContainer.style.right = '0';
                                gapContainer.style.height = '30px'; 
                                gapContainer.style.backgroundColor = '#f3f4f6'; // bg-gray-100
                                gapContainer.style.zIndex = '10';
                                gapContainer.style.transform = 'translateY(50%)'; 
                                gapContainer.style.boxShadow = 'inset 0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                
                                spacer.appendChild(gapContainer);
                                
                                const label = document.createElement('span');
                                label.innerText = `Page ${pageIndex + 1}`;
                                label.style.position = 'absolute';
                                label.style.right = '40px';
                                label.style.bottom = '20px';
                                label.style.fontSize = '12px';
                                label.style.color = '#9ca3af';
                                label.style.fontWeight = '500';
                                spacer.appendChild(label);
                                
                                return spacer;
                            }, { side: -1, key: `spacer-${pos}-${spacerHeight}`, isPageSpacer: true, height: spacerHeight })
                        );
                        
                        accumulatedSpacerHeight += spacerHeight;
                        nextPageTargetVisual += A4_HEIGHT;
                        currentPageContentStart = cleanContentTop;
                        pageIndex++;
                     }
                 }
                 
                 // Track deepest point using clean visual + height
                 if (cleanVisualTop + height > maxVisualBottom) {
                     maxVisualBottom = cleanVisualTop + height;
                 }
                 
                 return false;
             });
             
             // LAST PAGE FILLER
             const currentTotalVisualBottom = maxVisualBottom + accumulatedSpacerHeight;
             const fillerHeight = nextPageTargetVisual - currentTotalVisualBottom;
             
             // Only add filler if it makes sense (positive and less than a full page to avoid infinite loops)
             if (fillerHeight > 0 && fillerHeight < A4_HEIGHT) {
                 decorations.push(Decoration.widget(state.doc.content.size, () => {
                     const filler = document.createElement('div');
                     filler.style.height = `${fillerHeight}px`;
                     filler.style.backgroundColor = 'white';
                     filler.style.width = '210mm';
                     filler.style.marginLeft = '-25.4mm';
                     filler.style.position = 'relative';
                     filler.style.pointerEvents = 'none';
                     return filler;
                 }, { side: 1, key: 'last-page-filler' }));
             }
             
             // Stable comparison
             const currentSet = paginationKey.getState(state);
             const currentList = currentSet ? currentSet.find() : [];
             const currentSig = currentList.map((d: any) => `${d.from}-${d.spec.height || 0}`).join(',');
             const newSig = decorations.map(d => `${d.from}-${d.spec.height || 0}`).join(',');
             
             if (currentSig !== newSig) {
                 const tr = state.tr.setMeta(paginationKey, DecorationSet.create(state.doc, decorations));
                 dispatch(tr);
             }
          };

          const scheduleMeasure = () => {
              if (!isScheduled) {
                  isScheduled = true;
                  if (rafId) cancelAnimationFrame(rafId);
                  rafId = requestAnimationFrame(measure);
              }
          };

          setTimeout(() => {
              const editorElement = editorView.dom;
              if (editorElement) {
                  resizeObserver = new ResizeObserver(() => {
                      scheduleMeasure();
                  });
                  resizeObserver.observe(editorElement);
              }
              scheduleMeasure();
          }, 200);

          return {
            update(view, prevState) {
                if (!view.state.doc.eq(prevState.doc)) {
                    scheduleMeasure();
                }
            },
            destroy() {
                if (resizeObserver) resizeObserver.disconnect();
                if (rafId) cancelAnimationFrame(rafId);
            }
          };
        },
      }),
    ];
  },
});
