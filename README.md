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
- **Print Accuracy**: What you see matches PDF/DOCX export.
- **Non-Destructive**: Page breaks are purely visual—document structure remains intact (one continuous editor).

## 📦 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 🎯 How It Works

### Approach

The pagination system uses a **custom ProseMirror plugin** that transforms the single-canvas editor into a realistic **"Page View"**:

1. **Desk Simulation**: The editor container acts as a "Gray Desk".
2. **Page Simulation**: The content canvas is styled white. We inject "Visual Gap" widgets that mask the continuous white background at specific intervals, creating the illusion of distinct separate pages.
3. **Calculation**: On every transaction, we measure the pixel height of every block. If `Height > 931px` (A4 Content Area), we inject a spacer.
4. **Smart Labeling**: The spacer displays the correct page number (Page 1, Page 2...) dynamically.

### Key Implementation Details

**PaginationExtension** (`src/extensions/pagination.ts`):
- Uses `Decoration.widget` to render the complex "Page Gap" structure.
- Implements `requestAnimationFrame` loop to debounce rapid typing measurements.
- Uses `ResizeObserver` to handle window resizing reflows.

**A4 Constants** (at 96 DPI):
- Page Height: 1123px (297mm)
- Margins: 96px top/bottom (1 inch)
- Content Area: 931px

### Recent Improvements (v1.1)
- **Fixed Page Numbering**: Logic corrected to accurately label the footer of the current page.
- **Performance**: Removed layout transitions to prevent thrashing; Toolbar is now instant.
- **UX**: Added tooltips to all buttons and cursor-pointer indicators.

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
