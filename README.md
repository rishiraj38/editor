# Legal Document Pagination Editor

A Tiptap-based rich text editor with real-time A4 pagination for legal document drafting. Built for OpenSphere/LegalBridge to ensure accurate print output for USCIS submissions.

## 🚀 Features

- **Real-time Pagination**: Visual page breaks update dynamically as you type (using ProseMirror Decorations).
- **A4 Page Format**: Standard 210mm × 297mm with 1-inch margins (96px).
- **Professional Design**: Gray "Desk" background with shadowed A4 sheets.
- **Advanced Toolbar**:
    - **Segmented Typography Control**: "Normal", "Heading 1", "Heading 2" with iOS-style sliding active state.
    - **Quick Actions**: "Clear Formatting" and standard rich text tools.
    - **Instant Feedback**: Optimized CSS (75ms transitions) for zero-lag UI.
- **Export Options**: 
    - **PDF**: High-fidelity export using native browser rendering (`html-to-image`), supporting modern CSS features like `lab()` colors.
    - **DOCX**: Instant conversion to editable Word documents.
- **Print Accuracy**: What you see matches PDF/DOCX export.
- **Non-Destructive**: Page breaks are purely visual—document structure remains intact (one continuous editor).

## 📦 Getting Started

### Prerequisites

- Node.js 18+  
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone <repository_url>

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Building for Production

```bash
npm run build
npm start
```

## 🧠 Engineering Decisions

### The Challenge: "True" Web Pagination

Web browsers are designed for continuous scrolling (infinite canvas), while legal documents require strict A4 pagination (210mm x 297mm) for printing and distinct page references (e.g., "See Page 3"). 

The core technical challenge was: **How do we enforce A4 page breaks in a web editor without breaking the rich-text editing experience?**

### Our Approach: "View-Layer" Pagination

Instead of splitting the actual document model into separate nodes (which breaks text selection across pages and complicates data storage), we use a **Single-Document, Visual-Splitting** approach.

1.  **Single ProseMirror Doc**: The underlying data is one continuous document. This ensures that features like search, copy-paste, and state history work seamlessly.
2.  **Decoration-Based Spacers**: We utilize ProseMirror's `Decoration.widget` API to inject "Page Drag/Gap" elements into the editor view.
3.  **Dynamic Measurement Loop**:
    *   We listen for standard editing events (typing, pasting).
    *   Using a debounced `requestAnimationFrame` loop, we query the `getBoundingClientRect` of every block-level element.
    *   We maintain a running total of `usedHeight`. When a block would overflow the A4 content area (931px), we calculate the exact remaining space and inject a "Spacer Widget" before that block.
    *   **The Spacer**: This widget visually consumes the rest of the current page + the top margin of the next page, effectively "pushing" the content to Start of Page N+1.

### Trade-offs & Limitations

1.  **Block-Level Granularity**: 
    *   *Limitation*: Currently, the system measures *blocks* (paragraphs, headers). If a single paragraph is longer than an entire page, it will not be split visually; the start of the paragraph effectively determines the page break.
    *   *Result*: A 50-line paragraph might be pushed entirely to the next page, leaving a large gap on the previous one.

2.  **DOM-Dependent Performance**:
    *   *Limitation*: We rely on `window.getComputedStyle` and `getBoundingClientRect`. Reading these values forces the browser to calculate layout (Reflow).
    *   *Mitigation*: We batch these reads in a dedicated measure cycle and use `requestAnimationFrame` to avoid "Layout Thrashing" (Read-Write loops). It performs well for documents up to ~20-30 pages but may stutter on 100+ page docs.

3.  **Strict Visuals vs. Semantic Pages**:
    *   Since pages are visual illusions, "Page 2" doesn't exist in the data model. We cannot easily attach metadata *to* a page (e.g., "Page 2 has a specific comment") without calculating its position effectively at runtime.

### Future Improvements (With More Time)

1.  **Node Splitting**: Implement a logic to visually split long text nodes. This would involve finding the exact character index where the break occurs and inserting a widget *inside* the text node (or virtually splitting it).
2.  **Virtualization**: For long documents (50+ pages), we would implement windowing—only measuring and rendering the pages currently in the viewport to maintain 60FPS.
3.  **Web Worker Off-loading**: Move the heavy calculation logic to a Web Worker to keep the UI thread unblocked, although this requires syncing the DOM state which is non-trivial.

## 🏗️ Architecture

```
src/
├── app/
│   ├── globals.css          # A4 page styles, print media queries
│   └── page.tsx             # Entry point
├── components/editor/
│   ├── Editor.tsx           # Tiptap configuration
│   └── Toolbar.tsx          # Formatting controls (Segmented Control)
└── extensions/
    └── pagination.ts        # Core pagination logic
```

## 🧪 Testing

The pagination logic was verified through:
- **Browser Automation**: Automated scripts verifying page break positions and label text.
- **Stress Testing**: Typing 60+ paragraphs to ensure stability across multiple pages.
- **Print Preview**: Verified that `Cmd+P` generates clean A4 pages without the gray UI artifacts.

## 📄 License

Built as a hiring assignment for OpenSphere/LegalBridge.
