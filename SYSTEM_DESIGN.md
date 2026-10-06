# QuickBox System Design & Architecture
**Version:** 1.3.1
**Last Updated:** 2026-10-05
**Code References Last Verified:** 2026-10-05 (markers; use search rather than historical line numbers)
**Purpose:** Comprehensive system design document for implementing features and understanding codebase structure

---

## Who This Document Is For

**Target Audience:** Developers implementing features, maintaining code, or extending QuickBox

**Not a user?** See [README.md](README.md) for quick start guide, features overview, and keyboard shortcuts.

---

## Developer Quick Start

### Running QuickBox

**Supported local editor workflow (Node.js 18+):**
```bash
npm run dev
# http://127.0.0.1:5174
```
No dependency installation is needed for this built-in Node server. `npm ci` installs jsdom for `npm run check`; those checks supplement manual Chrome layout and interaction checks. Direct-file editor use is unsupported because palettes use fetch. Exported previews can open directly.

### Finding Code with ANM Markers

QuickBox uses **Agent Navigation Marker (ANM v0.4)** standard:
```javascript
// @agent:ComponentName:authority  ← Primary implementation
// @agent:ComponentName:extension  ← Related/supporting code
```

Search for markers to locate functionality:
- `@agent:UndoSystem:authority` → Undo/redo implementation
- `@agent:BoxDuplication:authority` → Duplicate box logic
- `@agent:CopyPaste:authority` → Copy/paste functionality

**Common Tasks:** See [Common Development Tasks](#common-development-tasks) section below.

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Application State](#application-state)
5. [UI Structure](#ui-structure)
6. [Event Flow & Interaction Model](#event-flow--interaction-model)
7. [Feature Systems](#feature-systems)
8. [Rendering Pipeline](#rendering-pipeline)
9. [File Format & Persistence](#file-format--persistence)
10. [Mode System](#mode-system)
11. [Key Algorithms](#key-algorithms)
12. [Code Organization & File Locations](#code-organization--file-locations)
13. [Keyboard Shortcuts Reference](#keyboard-shortcuts-reference)
14. [HTML Export](#html-export-v13)

---

## Overview

**QuickBox** is a lightweight, browser-based wireframe mockup tool for rapid web page prototyping. It uses a single HTML file with vanilla JavaScript and CSS, allowing users to create multi-page mockups with reusable header/footer regions, drag-and-drop elements, and two interaction modes (Design and Navigate).

**For user-facing features and quick start guide, see [README.md](README.md)**

**Key Characteristics:**
- Static application (HTML, CSS, and editor/validation/export scripts)
- Vanilla JavaScript (no frameworks)
- HTML5 Canvas-like rendering with DOM elements
- JSON-based file format with version compatibility
- Two operational modes: Design (editing) and Navigate (preview)
- Multi-page support with header/footer regions shared across all pages
- Palette system for global color theming via CSS custom properties
- Global font control independent of color palettes

---

## Architecture

### High-Level Structure

```
┌─────────────────────────────────────────┐
│          QuickBox Application           │
├─────────────────────────────────────────┤
│           Toolbar (Controls)             │
├─────────────────────────────────────────┤
│  Navigator │         Canvas              │
│  (Pages &  │    (Rendering Area)        │
│  Elements) │                            │
└─────────────────────────────────────────┘
```

### Three-Region Canvas Model

The canvas is divided into **three persistent regions** shared across all pages:

```
┌──────────────────────────┐
│    Header Region         │  (state.header)
│  (shared, resizable)     │
├──────────────────────────┤
│    Main Region           │  (currentPage.boxes)
│  (page-specific content) │
├──────────────────────────┤
│    Footer Region         │  (state.footer)
│  (shared, resizable)     │
└──────────────────────────┘
```

**Key Properties:**
- Header and footer heights are **resizable** (min 60px) in Design mode
- Header and footer contents **persist** across all page switches
- Main region grows/shrinks as header/footer are resized
- Each region can contain boxes with independent positioning

---

## Data Model

### Core State Structure

```javascript
const state = {
  // Persistent regions
  header: {
    boxes: [],      // Array of box objects in header
    height: 80      // Pixel height (resizable, min 60px)
  },

  footer: {
    boxes: [],      // Array of box objects in footer
    height: 80      // Pixel height (resizable, min 60px)
  },

  // Multi-page support
  pages: [          // Array of page objects
    {
      id: 'page-1',
      name: 'Page 1',
      canvasSize: 'desktop',  // 'desktop' (1200px) | 'tablet' (768px) | 'mobile' (375px)
      customWidth: null,      // Optional: custom canvas width (set via drag-resize)
      customHeight: null,     // Optional: custom canvas height (set via drag-resize)
      boxes: []               // Array of box objects on this page
    }
  ],
  currentPageId: 'page-1',

  // Selection & interaction
  selectedBox: null,          // Currently selected box ID (null if none)
  tempGroup: [],              // Array of boxes selected as a group
  groupSelectMode: false,     // Flag: rectangle selection active

  // Mode
  currentMode: 'design',      // 'design' or 'navigate'

  // Theming (v1.1)
  themes: {
    active: 'sketch',         // Currently active palette ID
    palettes: {}              // Reserved for future use
  },

  // Counters (auto-increment)
  boxCounter: 0,
  pageCounter: 0,
  zIndexCounter: 1
};
```

### Box Object Structure

Every box (regardless of type) has this structure:

```javascript
{
  id: 'box-1',              // Unique identifier
  type: 'text'|'image'|'menu'|'button'|'accordion',
  name: 'Element 1',        // User-facing label in navigator
  x: 50,                    // Pixel offset from region left
  y: 20,                    // Pixel offset from region top
  width: 150,               // Pixel width
  height: 100,              // Pixel height
  zIndex: 1,                // Stacking order (higher = on top)

  // Type-specific properties
  content: 'Enter text here', // Sanitized rich HTML for text/button boxes
  fontSize: 16,             // Font size in pixels
  fontFamily: "'Architects Daughter', cursive",

  content: 'media/logo.png', // For image boxes - relative path to /media folder

  linkTo: null,             // { type: 'page'|'anchor', target: 'page-2'|'box-3' }

  // Menu-specific
  menuItems: [              // For menu boxes
    { id: 'm1', text: 'Item 1', linkTo: null, children: [] }
  ],

  // Accordion-specific
  accordionItems: [         // For accordion boxes
    { id: 'a1', title: 'Section 1', body: 'Text here', isExpanded: false }
  ]
}
```

### Undo/Redo System

```javascript
const undoHistory = {
  past: [],                 // Array of state snapshots (max 20)
  future: [],               // Array for redo
  continuousOp: null,       // Current continuous operation type or null
  continuousSnapshot: null // State captured when a gesture starts
};
```

**Continuous Operations:** drag, resize, region resize, and canvas resize capture a start snapshot and commit once on mouseup when changed. No debounce timer reorders history.

---

## Application State

### State Initialization

1. **App starts** → `initializeState()` called
2. If no pages exist, creates default "Page 1" (desktop size)
3. Sets `currentPageId` to 'page-1'
4. Undo history starts empty; the initial document becomes the saved baseline

### State Mutations

Discrete changes call `pushHistory()` immediately before mutating document state, then update the UI. Text captures state on focus, updates sanitized content on input, and records one edit on blur. Continuous gestures call `beginContinuous()` before movement and `pushHistory('continuous-end')` on completion. Menu and accordion editors edit clones; Save commits one action and Close discards the draft. Color previews capture their original snapshot; Apply commits once and Cancel restores it.

Snapshots include pages, regions, active page, font, theme variables, and media path. Selection, counters, modes, and clipboard are transient. Restoration recalculates counters and reapplies CSS variables synchronously.

### Page Switching

When user clicks a page in Navigator:

```
1. getCurrentPage() returns current page object
2. renderCurrentPage() is called
3. Only that page's boxes are rendered
4. Header/footer boxes always rendered on top
5. elementsList updates to show that page's boxes
```

---

## UI Structure

### Layout Components

**Toolbar** (index.html):
- File operations: New, Open, Save
- Box creation buttons: Text, Image, Menu, Button, Accordion
- Group operations: Create Group, Delete
- Font selector & size dropdown
- Canvas size buttons (Desktop, Tablet, Mobile)
- Mode buttons (Design 🖊️, Navigate 🧭)

**Navigator Panel** (index.html):
- The arrow button collapses the panel to a narrow rail and restores it. A CSS class controls width and content visibility; the button updates its accessible label and expanded state. This is transient UI state, separate from the saved mockup and undo history.
- **Pages Section:** Lists all pages, + button to add new page
- **Elements Section:** Lists boxes on current page

**Canvas** (index.html):
- Main rendering area where boxes are displayed
- Resize handles for canvas dimensions
- Regions: header, main, footer (dynamically positioned)

**Editor Panels** (hidden by default):
- Menu Editor Panel: Edit menu items hierarchically
- Accordion Editor Panel: Edit accordion items

### DOM Structure for Boxes

When a box is rendered on canvas:

```html
<div class="box box-text" id="box-1"
     style="left: 50px; top: 20px; width: 150px; height: 100px; z-index: 1;">
  <!-- Resize handles (8 corners + 4 edges) -->
  <div class="resize-handle tl"></div>
  <div class="resize-handle tr"></div>
  <!-- ... etc for all 8 directions -->

  <!-- Box content (varies by type) -->
  <div class="box-content">
    <span>Text content</span>
  </div>
</div>
```

---

## Event Flow & Interaction Model

### User Interaction → State → Render Cycle

```
User Action (click, drag, etc.)
        ↓
Event Listener Fired
        ↓
State Updated
        ↓
Render Functions Called
        ↓
UI Updated
        ↓
Undo History Recorded
```

### Key Events

#### Box Selection
- **Left-click on box:** Selects single box (or toggles group if Ctrl held)
- **Click on canvas:** Deselects all boxes
- **Single-click on grouped box (no Ctrl):** Disbands group

#### Dragging Boxes
- **Left-click + drag:** Initiates drag
- **Drag continues:** Updates box.x and box.y in real-time
- **Mouse up:** Finalizes drag, records undo checkpoint
- Right-click: Skipped (reserved for context menu)

#### Rectangle Group Selection
- **Click "Create Group" button:** Enables `groupSelectMode` (crosshair cursor)
- **Drag rectangle on empty canvas:** Selection rectangle drawn visually
- **Release mouse:** All boxes within rectangle added to `tempGroup`
- **Group-aware operations:** Drag/delete/duplicate affect entire group

#### Context Menu
- **Right-click on box (Design mode only):** Shows custom context menu with:
  - Delete
  - Duplicate
  - Link to Page
  - Link to Anchor
  - (Group operations if box in group)
- **Selection preserved:** Right-click does NOT clear selection/group

#### Mode Switching
- **Design Mode:** All editing controls active, boxes show resize handles
- **Navigate Mode:** No editing, boxes are static, links are clickable

### Focus-Related Events

**Menu Boxes:**
- Right-click → Opens Menu Editor Panel
- Menu Editor is modal (other controls disabled until closed)

**Accordion Boxes:**
- Right-click → Opens Accordion Editor Panel
- Accordion Editor is modal

---

## Feature Systems

### 1. Group Selection & Management

**Creating Groups:**
- **Method 1 (Ctrl+Click):** Click while holding Ctrl to add/remove box from group
- **Method 2 (Rectangle):** Use Create Group button, drag rectangle

**Group Features:**
- **Drag:** All grouped boxes move together
- **Visual Feedback:** Blue dashed border around selected boxes
- **Context Menu:** Right-click shows group-level operations
- **Delete:** Deletes all boxes in group at once
- **Duplicate:** Creates copy of entire group with all boxes

**Group Mechanics:**
- `state.tempGroup` array stores box references
- `updateGroupVisualsOnCanvas()` draws blue dashed borders
- Single-click (no Ctrl) on grouped box disbands group
- Escape key clears group

### 2. Multi-Page System

**Page Operations:**
- **Add Page:** Click + button in Pages section → creates new page
- **Switch Page:** Click page name → renders different page
- **Rename Page:** Double-click page name to edit

**Page Properties:**
- Each page has independent `boxes` array
- Pages share same header/footer
- Pages have independent `canvasSize` or `customWidth/Height`
- Pages have unique `id` and `name`

**Page Counter:** Auto-increments for new pages (page-1, page-2, etc.)

### 3. Header/Footer Regions

**Resizable Boundaries:**
- User can drag border between header/main or main/footer
- Minimum height enforced: 60px
- Only resizable in Design mode

**Persistence:**
- Header boxes persist across all page switches
- Footer boxes persist across all page switches
- Heights persist in state

**Rendering:**
- Always rendered on top of page content
- `renderRegion()` function handles region-specific rendering
- Regions can contain any box type

### 4. Canvas Size & Custom Dimensions

**Preset Sizes:**
- Desktop: 1200px width
- Tablet: 768px width
- Mobile: 375px width

**Custom Dimensions:**
- Canvas can be manually resized via drag handles
- Sets `customWidth` and `customHeight` on current page
- Persists in saved files

**Resize Handles:**
- Right edge: Change width only
- Bottom edge: Change height only
- Bottom-right corner: Change both

### 5. Box Types

#### Text Box
- Rendered as editable text
- Properties: text, fontSize, fontFamily
- Can be linked to pages/anchors

#### Image Box
- Displays images from `/media` folder
- User workflow:
  1. User manually copies image files to `/media` folder (prerequisite)
  2. Click 📷 icon in Design mode → file picker opens
  3. User navigates to `/media` folder and selects image
  4. App stores relative path (e.g., `"media/logo.png"`) in `box.content`
- No base64 encoding - stores filename path only (reduces file size and token usage)
- Renders as `<img src="media/filename.png">`

#### Menu Box
- Hierarchical menu structure
- `menuItems` array contains tree of menu items
- Child items create nested structure
- Right-click → Menu Editor Panel for hierarchical editing
- Rendered as HTML list structure

#### Button Box
- Rendered as clickable button element
- Default size: 130x30px
- Border radius: 8px
- Can contain text and be linked

#### Accordion Box
- Collapsible sections
- `accordionItems` array stores sections
- Each item has: id, title, body, isExpanded
- Right-click → Accordion Editor Panel
- Rendered with click handlers to toggle visibility

**Auto-Height Behavior (v1.3):**
- Accordion boxes dynamically adjust height based on content
- Single-expansion mode: clicking one item collapses all others (mobile-friendly)
- Height calculation: (number of items × 41px header height) + expanded body scrollHeight + 14px padding
- Minimum height: 120px
- Only horizontal resize handles (width adjustable, height auto-calculated)
- Works in both Design and Navigate modes
- Bottom padding: 8px for visual spacing when all items collapsed

### 6. Linking System

**Link Types:**
1. **Page Link:** Navigate to different page (in Navigate mode)
2. **Anchor Link:** Jump to element on same page

**Link Storage:**
- Stored in `box.linkTo`: `{ type: 'page', target: 'page-2' }` or `{ type: 'anchor', target: 'box-3' }`
- Context menu → "Link to Page" or "Link to Anchor"

**Navigate Mode Behavior:**
- Clicking linked box navigates to target
- Page links switch to target page
- Anchor links highlight target element

### 7. Palette System (v1.1)

**Overview:**
- Global color theming system using CSS custom properties
- Palettes stored as JSON files in `/palettes/` folder
- Independent from font settings
- LLM-friendly: easy to create new palettes programmatically

**Palette Structure:**

Each palette is a JSON file (e.g., `sketch.json`):
```json
{
  "name": "Sketch",
  "notes": "Default QuickBox hand-drawn wireframe style",
  "canvas": "#f5f5f5",
  "header": "#ffffff",
  "footer": "#ffffff",
  "elements": {
    "text": {
      "fill": "#ffffff",
      "border": "#333333",
      "textColor": "#000000"
    },
    "image": { "fill": "#fff", "border": "#333", "textColor": "#666" },
    "menu": { "fill": "#fff", "border": "#333", "textColor": "#000" },
    "button": { "fill": "#fff", "border": "#333", "textColor": "#000" },
    "accordion": { "fill": "#fff", "border": "#333", "textColor": "#000" }
  }
}
```

**Palette Manifest:**

`/palettes/index.json` lists all available palettes:
```json
{
  "palettes": [
    { "id": "sketch", "name": "Sketch", "file": "sketch.json" },
    { "id": "botanical-sanctuary", "name": "Botanical Sanctuary", "file": "botanical-sanctuary.json" }
  ]
}
```

**CSS Integration:**

Colors applied via CSS custom properties:
```css
.box-text {
  background: var(--text-fill, #fff);
  border-color: var(--text-border, #333);
  color: var(--text-color, #000);
}
```

**Application Flow:**
1. On app startup: Load `palettes/index.json` manifest
2. Populate palette selector dropdown
3. Apply default palette (`sketch`)
4. When user selects palette: `applyPalette(id)` loads JSON, sets CSS variables
5. All elements instantly update colors

**Key Functions:**
- `loadPaletteManifest()` - Loads palette list from manifest
- `applyPalette(paletteId)` - Loads palette JSON, sets CSS variables globally
- `handlePaletteChange(event)` - Event handler for palette dropdown

**LLM Workflow:**
1. LLM analyzes website/design
2. Stores the palette in browser localStorage and downloads JSON for distribution
3. Updates the browser palette manifest
4. Applies the palette; distributed files and palettes/index.json are maintained manually
5. New palette appears in dropdown

### 8. Global Font Control (v1.1)

**Overview:**
- Font selection applies globally to all elements
- Independent from palette system
- Uses CSS custom property `--global-font`

**Implementation:**

CSS variable in `.box-content`:
```css
.box-content {
  font-family: var(--global-font, 'Architects Daughter', cursive);
}
```

**Font Change Flow:**
1. User selects font from dropdown
2. `updateFont()` sets `--global-font` CSS variable
3. All text boxes, buttons, menus, accordions instantly update
4. No selection required - affects all elements globally

**Key Function:**
- `updateFont()` - Sets global `--global-font` CSS variable

**Note:** Font size (`fontSize`) remains per-box property, only font family is global.

### 9. Palette Editor (v1.1)

**Overview:**
- Users can edit existing palettes, create new palettes, and delete custom palettes
- Provides visual color pickers for all element types and backgrounds
- Live preview with Apply/Undo functionality
- Save As stores a browser palette and downloads JSON for distribution

**UI Location:**
- Toolbar: Palette dropdown, ✏️ Edit button, 🗑️ Delete button
- Panel: Opens on right side when editing palette

**Workflow:**
1. User selects palette from dropdown
2. Clicks ✏️ Edit button → Palette Editor Panel opens
3. Adjusts colors using color pickers with live preview
4. Click "Apply" → Commits the colors as one undoable document edit
5. Click "Undo" → Reverts to original palette
6. Click "Save As New Palette" → Prompts for name, creates new JSON file
7. Click "Cancel" → Closes the panel; committed Apply changes remain

**Data Flow:**
- Editor reads current palette from CSS variables
- Apply updates CSS variables and saved theme variables, recording history
- Save As button:
  - Prompts for palette name
  - Downloads JSON and stores the palette definition in localStorage
  - Updates the browser manifest
  - Applies new palette as active

**Delete Palette:**
- Available for custom palettes only (not built-in "Sketch")
- Removes the browser palette definition and manifest entry
- Distributed palette files remain user-managed
- Reverts to "Sketch" palette if deleted palette was active

**Key Functions:**
- `openPaletteEditor()` - Opens editor with current palette colors
- `applyPalettePreview()` - Updates CSS variables for live preview
- `undoPalettePreview()` - Reverts to original palette
- `savePaletteAs()` - Creates new palette file and updates manifest
- `deletePalette()` - Removes custom palette

**File Locations:**
- HTML: index.html (Palette Editor Panel)
- CSS: styles.css (palette editor styles)
- JavaScript: app.js (palette editor functions)

### 10. Per-Element Style Overrides (v1.2)

**Overview:**
- Allows individual boxes (text, image, button) to override global palette colors
- Each box can have custom fill, border, and text colors
- Visual indicator (🎨 emoji) shows which boxes have overrides
- Works with both single boxes and groups

**Data Model:**
```javascript
box.styleOverrides = {
  fill: "#ff5733",      // Optional: override fill color
  border: "#000000",    // Optional: override border color
  textColor: "#ffffff"  // Optional: override text color
};
```

**User Workflow:**
1. Right-click on text/image/button box → Context menu appears
2. Click "Style Override..." → Style Override Panel opens
3. Panel shows:
   - Current palette colors as reference swatches
   - Three color pickers (fill, border, text) with live preview
   - Hex input fields synced with color pickers
4. Adjust colors → Changes visible immediately (live preview)
5. Click "Apply" → Commits to undo history and closes panel
6. Click "Cancel" → Reverts to original colors and closes panel
7. Click "Reset to Palette" → Removes overrides, uses palette defaults

**Group Override Behavior:**
- If multiple boxes selected (group), panel shows first box's colors
- Changes apply to ALL boxes in group simultaneously
- "Applying to X boxes" message shows count

**Rendering:**
- Overrides applied as inline styles: `boxEl.style.backgroundColor = box.styleOverrides.fill`
- Inline styles take precedence over CSS variables from palette
- Visual indicator: `box.has-style-override::after { content: '🎨'; }`

**Persistence:**
- `styleOverrides` property saved in box object (optional, backward compatible)
- File format v1.2 supports this feature
- Older files without overrides load normally (property undefined/null)

**Key Functions:**
- `openStyleOverridePanel(box)` - Opens panel, populates with box colors
- `applyTemporaryStyleOverride(property, value)` - Live preview without undo
- `applyStyleOverride()` - Commits changes to undo history
- `cancelStyleOverride()` - Reverts to original state
- `resetToDefaultPalette()` - Removes all overrides

**File Locations:**
- HTML: index.html (Style Override Panel)
- CSS: styles.css (panel styles, 🎨 indicator)
- JavaScript: app.js (override panel management)
- Rendering: app.js (apply overrides to box elements)

### 11. Header/Footer Region Background Color Overrides (v1.2)

**Overview:**
- Header and footer regions can have background colors independent of palette
- Separate from boxes inside regions (boxes use their own palette/override colors)
- Simple dedicated panel with single color picker
- Live preview with Apply/Cancel/Reset

**Data Model:**
```javascript
state.header.colorOverride = "#f0f0f0";  // Optional: override header background
state.footer.colorOverride = "#e0e0e0";  // Optional: override footer background
```

**User Workflow:**
1. Right-click on empty header/footer space (not on a box) → Context menu appears
2. Click "Override Background Color..." → Region Color Panel opens
3. Panel shows:
   - Current palette background color as reference swatch
   - Single color picker with hex input
   - Live preview as user adjusts color
4. Click "Apply" → Commits to undo history and closes panel
5. Click "Cancel" → Reverts to original color and closes panel
6. Click "Reset to Palette" → Removes override, uses palette default

**Context Menu Detection:**
- Right-click on box inside region → Shows box context menu (existing behavior)
- Right-click on empty region space → Shows region context menu (new behavior)
- Detection logic: `if (!e.target.closest('.box'))` → region click

**Rendering:**
- Override applied as inline style on region element:
  ```javascript
  if (state.header.colorOverride) {
    headerRegion.style.backgroundColor = state.header.colorOverride;
  }
  ```
- Inline style takes precedence over CSS `--header-bg` variable

**Persistence:**
- `colorOverride` property saved in `state.header` and `state.footer` objects
- File format v1.2 supports this feature
- Backward compatible: older files load with `colorOverride: null` (uses palette)

**Key Functions:**
- `showRegionContextMenu(e, regionType)` - Shows context menu for region background
- `openRegionColorOverridePanel(regionType)` - Opens dedicated region color panel
- `applyRegionColorOverride()` - Commits to undo history
- `cancelRegionColorOverride()` - Reverts to original color
- `resetRegionToDefaultPalette()` - Removes override

**File Locations:**
- HTML: index.html (Region Color Panel)
- CSS: styles.css (region panel styles)
- JavaScript: app.js (region color override functions)
- Context Menu: app.js (region detection and menu)
- Rendering: app.js (apply background color)

### 12. HTML Export (v1.3)

**Overview:**
- Exports the current mockup as a self-contained HTML file
- All pages, boxes, and images are embedded — no external dependencies beyond Google Fonts
- Output renders in Navigate mode: page navigation, menu dropdowns, accordion toggle, and page links all function
- Images are base64-encoded from the configured media folder

**Export Flow:**
1. User clicks Export HTML button in toolbar
2. Button shows "Exporting..." while processing
3. Each unique image is fetched and converted to a base64 data URI
4. CSS variables are read from the live document to capture the active palette as concrete hex values
5. Saved geometry sets region minimum heights; the export runtime measures accordion contents on display and expansion
6. A single HTML file is generated and downloaded as `quickbox-export.html`

**Output Structure:**
- `<style>` block with palette colors baked in as hex values (no CSS variables in export)
- Sticky page navigation bar with one button per page
- Each page rendered as a `<div>` (only the first visible on load)
- Inline `<script>` handling page switching, menu hover dropdowns, accordion toggle, and page link navigation

**Image Handling:**
- Images are fetched via the configured `/@fs/` media path (requires the local server with QUICKBOX_MEDIA_ROOT enabled)
- Missing or inaccessible images show a placeholder div rather than breaking the layout
- Images are embedded as data URIs — the exported file has no dependency on the media folder

**Canvas Sizing:**
- Canvas width taken from `page.canvasSize` or `page.customWidth`
- Region heights use box extents and are updated after page changes, font loading, and accordion expansion

**Key Functions:**
- `@agent:HTMLExport:authority` — `startHtmlExport()`, `generateExportHTML()`, `generateBoxHTML_export()`
- `collectAllImageBoxes()` — scans all regions and pages for unique image filenames
- `imageToBase64()` — fetches image and returns data URI
- `getCurrentPaletteVars()` — reads live CSS variable values for palette baking
- `initializeQuickBoxExport()` — installs scoped navigation and measures accordion/region heights
- `regionContentHeight()` — calculates required region height from box extents

---

## Rendering Pipeline

### Main Render Function: `renderCurrentPage()`

```javascript
function renderCurrentPage() {
  // 1. Clear canvas
  canvas.innerHTML = '';

  // 2. Get current page
  const currentPage = getCurrentPage();

  // 3. Create region containers
  createRegionContainers();

  // 4. Render header region
  renderRegion(state.header.boxes, 'header', state.header.height);

  // 5. Render main region
  renderRegion(currentPage.boxes, 'main', headerHeight, footerHeight);

  // 6. Render footer region
  renderRegion(state.footer.boxes, 'footer', state.footer.height);

  // 7. Apply group visuals if groups selected
  if (state.tempGroup.length > 0) {
    updateGroupVisualsOnCanvas();
  }
}
```

### Region Rendering: `renderRegion(boxArray, regionType, height)`

For each box in region:
1. Create container `<div class="box">` with absolute positioning
2. Apply positioning: `left: box.x, top: box.y`
3. Apply dimensions: `width: box.width, height: box.height`
4. Apply z-index: `z-index: box.zIndex`
5. Render box type-specific content (text, image, menu, etc.)
6. Add resize handles (8 handles in 8 directions)
7. Apply selection styling if `box.id === state.selectedBox`

### Resize Handle Positioning

Each box has 8 resize handles in corners and edges:
```
TL  T  TR
L   ·  R
BL  B  BR
```

Handles are positioned absolutely within the box, styled to appear at edges.

### Canvas Resize Handle System

Separate from box resize handles:
- Right edge handle: resize-right
- Bottom edge handle: resize-bottom
- Corner handle: resize-corner

These modify canvas dimensions via drag, not box dimensions.

---

## File Format & Persistence

### Save Format (JSON)

```json
{
  "version": "1.3.1",
  "header": {
    "boxes": [
      {
        "id": "box-1",
        "type": "text",
        "name": "Header Title",
        "x": 10,
        "y": 10,
        "width": 200,
        "height": 40,
        "zIndex": 1,
        "text": "Logo",
        "fontSize": 20,
        "fontFamily": "'Architects Daughter', cursive",
        "linkTo": null,
        "styleOverrides": {
          "fill": "#ff5733",
          "border": "#000000",
          "textColor": "#ffffff"
        }
      }
    ],
    "height": 80,
    "colorOverride": "#f0f0f0"
  },
  "footer": {
    "boxes": [...],
    "height": 80,
    "colorOverride": "#e0e0e0"
  },
  "pages": [
    {
      "id": "page-1",
      "name": "Page 1",
      "canvasSize": "desktop",
      "customWidth": null,
      "customHeight": null,
      "boxes": [...]
    }
  ],
  "currentPageId": "page-1",
  "themes": {
    "active": "sketch",
    "palettes": {}
  }
}
```

### Backward Compatibility

- **v1.2 files:** Adds `styleOverrides` (optional box property) and `colorOverride` (optional header/footer property)
- **v1.1 files:** Fully compatible - missing properties default to null/undefined
- **v1.0 files:** Fully compatible - `themes` object added on load with default value
- **v0.12.x files with base64 images:** Will load but images stored as base64 strings may not render correctly
- **v0.7+ files (non-image boxes):** Fully compatible
- **Legacy documents:** Older page/region documents and the original single `boxes` array are accepted when their structure validates
- **Version checks:** Malformed version identifiers and future major versions are rejected; supported legacy shapes are normalized

**Breaking Changes:**
- **v1.0:** Image storage changed from base64 to relative file paths
- **v1.1:** Font family now controlled globally via CSS variable, `box.fontFamily` property ignored during rendering (but preserved in data for backward compatibility)
- **v1.2:** No breaking changes - all new properties are optional and backward compatible

### Save/Load Process

**Save:**
- File System Access handles are kept as transient session state after successful Open/Save. Save offers replacement at the remembered location or a picker for another name/location, with `startIn` set to the remembered handle. Write permission is requested directly from the Save click before asynchronous file operations; the chosen file is created if missing. New clears it; invalid/cancelled Open preserves it. The fallback download cannot access the source directory.
- User clicks Save button
- File picker opens (folder selection)
- State object converted to JSON
- Downloaded as `.json` file

**Open:**
- User clicks Open button
- File picker filters for `.json` files
- `QuickBoxDocument.normalize()` validates and sanitizes a candidate document before replacement. Palette loading also finishes before replacement.
- Counters recalculated from max IDs
- State restored and UI re-rendered
- Saved `themes.variables` are reapplied directly. Legacy documents resolve their named palette, falling back to Sketch when unavailable.
- Global font reapplied via `--global-font` CSS variable
- Undo/redo, gestures, editor drafts, selections, and clipboard are cleared

---

## Mode System

### Modals

Modal containers reuse page geometry and box editing with `pages[].isModal: true`. They appear in the editor navigator, omit shared regions, and are excluded from exported page navigation. At least one regular page is required. `linkTo: {type: 'modal', target: 'page-N'}` opens the referenced modal. Normalization validates modal targets independently from page and anchor targets, while snapshots preserve modal definitions for save and undo.

Create Modal transfers selected main-content boxes into a new modal, preserving IDs and relative placement with padding. With no selection it creates an empty container. `showModal()` generates a native dialog for editor preview; HTML export renders the same modal content into native dialogs handled by `initializeQuickBoxExport`. Dialogs provide background isolation, keyboard focus containment, and Escape; explicit Close/backdrop actions dismiss them. Modal opening is transient and is not saved. New/Open/Undo and mode changes remove preview dialogs.

### Design Mode
- **Visual Indicator:** Pencil emoji (✏️) button active
- **Controls Active:** All editing controls visible and functional
- **Box Behavior:** Boxes show resize handles on hover
- **Selection:** Boxes are selectable and draggable
- **Right-Click:** Shows context menu with edit options
- **Region Resizing:** Header/footer borders draggable
- **Navigate Behavior:** Links are NOT clickable

### Navigate Mode
- **Visual Indicator:** Compass emoji (🧭) button active
- **Controls Inactive:** Editing controls disabled/hidden
- **Box Behavior:** Boxes appear as static content
- **Selection:** Boxes not selectable (no resize handles)
- **Right-Click:** Shows browser context menu (no custom menu)
- **Region Resizing:** Borders not draggable
- **Navigation:** Links are clickable, enable page/anchor navigation

### Mode Switching

```javascript
function setMode(newMode) {
  state.currentMode = newMode;
  updateModeUI();           // Update button styles
  renderCurrentPage();      // Re-render with new mode rules
  selectBox(null);          // Clear selection
  clearTempGroup();         // Clear groups
}
```

---

## Key Algorithms

### Hit Detection (Drag Initiation)

When mouse down on box in Design mode:

```javascript
const clickedBox = e.target.closest('.box');
if (clickedBox && e.button === 0) {  // Left-click only
  selectBox(clickedBox.id);
  if (e.button === 0) {              // Only on left-click
    startDrag(e, clickedBox);
  }
}
```

**Key Point:** Right-click (button 2) is skipped, preserving context menu behavior.

### Drag Motion with Boundary Containment

During drag:

```javascript
function onMouseMove(e) {
  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;

  // Apply deltas to selected boxes
  state.tempGroup.forEach(box => {
    box.x = Math.max(0, box.x + deltaX);
    box.y = Math.max(0, box.y + deltaY);
  });

  renderCurrentPage();
}
```

**Containment:** Boxes clamped to `x >= 0, y >= 0` (can't move left of origin).

### Rectangle Group Selection

User drags rectangle:

```
1. Record startX, startY at mousedown
2. Track mouse position during mousemove
3. Calculate rectangle bounds: { left, top, width, height }
4. On mouseup, iterate all boxes:
   - Check if box bounds intersect with selection rectangle
   - Add matching boxes to state.tempGroup
5. Apply group visuals
```

Intersection test:
```javascript
const boxInBounds =
  boxX <= rectRight && boxX + boxWidth >= rectLeft &&
  boxY <= rectBottom && boxY + boxHeight >= rectTop;
```

### Undo/Redo with Gesture Grouping

The history stores document state before committed changes, with a maximum of 20 entries. Each completed gesture records its start state once if changed. Undo skips unchanged checkpoints, and a new committed action clears Redo. New/Open reset history so it cannot cross document boundaries. Fonts and applied palette variables are part of document state.

### Z-Index Management

- `state.zIndexCounter` tracks highest z-index
- When box created: assign current counter, increment counter
- When box moved to front: assign current counter, increment
- **Result:** Later boxes appear on top automatically

---

## Code Organization & File Locations

### index.html and supporting scripts
- `index.html`: toolbar, navigator, canvas, and editor panels.
- `document-model.js`: `@agent:DocumentValidation:authority` validates IDs, types, dimensions, colors, links, media references, and bounded array sizes; sanitizes rich HTML with a formatting allowlist.
- `export-runtime.js`: `@agent:HTMLExportRuntime:authority` handles scoped page/anchor navigation, nested menus, accordion toggles, and region resizing in client exports.
- `dev-server.cjs`: localhost-only static asset server; rejects repository files, traversal, and symlinks outside allowed asset roots. External media requires `QUICKBOX_MEDIA_ROOT`.

### app.js (Key Sections)

Use ANM markers to locate functionality. Search for `// @agent:ComponentName:authority` in app.js.

- `@agent:AppConfig:authority` — App version constant and configuration constants (canvas sizes, button defaults)
- `@agent:StateManagement:authority` — Global state object
- `@agent:UndoSystem:authority` — Undo/redo system functions
- `@agent:PaletteSystem:authority` — State initialization and palette setup
- `@agent:GroupSelection:authority` — Rectangle group selection logic
- `@agent:ModeToggle:authority` — Design/Navigate mode switching
- `@agent:BoxManagement:authority` — Box creation
- `@agent:BoxRendering:authority` — Box rendering and type-specific content
- `@agent:CtrlClickMultiSelect:authority` — Ctrl+Click multi-select
- `@agent:BoxSelection:authority` — Box selection logic
- `@agent:StyleOverrides:authority` — Per-element style override panel
- `@agent:RegionManagement:authority` — Header/footer region management
- `@agent:BoxResize:authority` — Box resize drag logic
- `@agent:Navigator:authority` — Navigator panel (pages & elements list)
- `@agent:GroupDelete:authority` — Group delete operations
- `@agent:BoxDuplication:authority` — Duplicate box logic
- `@agent:CopyPaste:authority` — Copy/paste functionality
- `@agent:DeleteKeyboard:authority` — Keyboard delete shortcut
- `@agent:ContextMenu:authority` — Context menu handling
- `@agent:ImageManagement:authority` — Image selection and media path construction
- `@agent:CanvasResize:authority` — Canvas resize handles and drag logic
- `@agent:FileOperations:authority` — Save and open file handling
- `@agent:PageManagement:authority` — Page add/rename/switch
- `@agent:PageRendering:authority` — Page rendering pipeline

### styles.css (Key Sections)

Search the CSS agent markers and selectors for global styles, toolbar, navigator, canvas, boxes, resize handles, selections, and editor panels. Historical line numbers are not maintained.

---

## Design Philosophy & Constraints

### Minimalism
- Static HTML application with separate JavaScript and CSS files
- Vanilla JavaScript (no frameworks)
- No build process required
- Hand-drawn Balsamiq aesthetic

### Backward Compatibility
- **v1.0 breaking change:** Image storage moved from base64 to file paths
- **v1.3:** Accordion auto-height behavior - fully backward compatible with v1.0-1.2 files
- Version checks prevent incompatible file loads
- Counters recalculated on load for robustness

### Non-Destructive Editing
- Committed document changes undoable (up to 20 steps)
- Continuous operations coalesced for better UX
- Unsaved changes warn before document replacement or closing; there is no autosave

### Separation of Concerns
- State management separate from rendering
- Editing logic separate from navigation logic
- Regions (header/footer/main) independently renderable

### Progressive Enhancement
- Works in any modern browser
- No dependencies on external libraries
- File picker API used for save/load and image selection

### Image Asset Management
- Images stored externally in `/media` folder (not embedded)
- File paths stored as relative references (e.g., `"media/logo.png"`)
- Minimizes JSON file size and token usage during development
- User responsible for maintaining `/media` folder alongside mockup files

**Development Mode Media Access:**
- Set `QUICKBOX_MEDIA_ROOT` to one exact external media directory before `npm run dev`, then enter the same path with Set Media Folder. `/@fs/` requests are permitted only inside that directory.
- The optional Vite configuration uses the same opt-in environment variable and binds to localhost.
- Firebase hosting uses `public/` for the existing client previews. It does not deploy the root editor. Never change the hosting root to the repository root, which contains private configuration and project documents.

---

## Extension Points for New Features

When adding new features, consider:

1. **State Addition:** Add properties to `state` object
2. **Rendering:** Extend `renderRegion()` or create new render function
3. **Event Handling:** Add listener to canvas or toolbar
4. **File Format:** Update version and add fields to save/load
5. **Undo/Redo:** Call `pushHistory()` immediately before committed state mutations
6. **UI:** Add buttons to toolbar or panels as needed

---

## Common Development Tasks

### Adding a New Box Type
1. Add box type case to `addBox()` function
2. Create type-specific rendering in `renderRegion()`
3. Add default properties to box initialization
4. Update context menu if special operations needed
5. Update file format documentation

### Adding a Toolbar Control
1. Add button/select to index.html toolbar
2. Get DOM reference in app.js
3. Add event listener to button
4. Update state when control used
5. Call `renderCurrentPage()` and `updateNavigator()` if needed

### Modifying Canvas Behavior
1. Update event listeners on canvas
2. Modify state in handler
3. Call `renderCurrentPage()`
4. Record undo checkpoint if state changed

### Changing File Format
1. Increment version number (e.g., 0.12.2 → 0.12.3)
2. Update `saveFile()` to output new format
3. Update `openFile()` to handle new fields
4. Consider backward compatibility for older files
5. Update README.md and file format documentation

---

## Keyboard Shortcuts Reference

**Design Mode Operations:**
- **Ctrl+C** (Cmd+C on Mac) - Copy selected box or group to clipboard
- **Ctrl+V** (Cmd+V on Mac) - Paste box or group from clipboard (works across pages)
- **Ctrl+D** (Cmd+D on Mac) - Delete selected box or group
- **Ctrl+Z** (Cmd+Z on Mac) - Undo last action
- **Ctrl+Y** (Cmd+Y on Mac) - Redo last undone action
- **Ctrl+Shift+Z** (Cmd+Shift+Z on Mac) - Redo (alternate shortcut)

**Selection Operations:**
- **Ctrl+Click** (Cmd+Click on Mac) - Multi-select boxes for grouping (toggle add/remove)
- **Escape** - Clear current group selection

**Implementation Details:**
- All shortcuts are disabled when typing in text inputs, textareas, or contenteditable elements
- Copy/paste preserves box properties, region membership, and z-order
- Group operations maintain relative z-order of boxes
- See `@agent:CopyPaste:authority` and `@agent:DeleteKeyboard:authority` in app.js

---

**For user-facing documentation, see [README.md](README.md)**

## Reliability and Content Boundary (v1.3.1)

Open parses and normalizes JSON before replacing state; malformed input preserves the current document. Limits are 20 MB per import, 200 pages, 10,000 boxes/items, and menu depth 10. Page and box IDs are unique; menu and accordion item IDs are unique within their box. Link targets must exist. Removing an element prunes dangling references in the same undo action.

Text/button content permits basic rich formatting, removes active tags and event/URL attributes, and validates the retained CSS declarations. Menu labels and accordion answers are plain text. Image references are relative paths under the media root, with traversal and active URL schemes rejected. Export escapes labels and attributes and carries validated rich content.

`themes.variables` stores applied color variables in the document, keeping custom palettes portable. Browser palette management uses localStorage for custom definitions and the manifest; JSON palette downloads support distribution. Applied palette edits commit undo actions.

The exported runtime uses `linkTo.target` for page and anchor links, scopes repeated shared elements to their page, measures expanded accordion contents, and grows containing regions. Images that cannot be embedded are listed before the user chooses whether to export placeholders. Fonts remain optional online resources.
