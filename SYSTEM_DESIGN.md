# QuickBox System Design & Architecture
**Version:** 1.2
**Last Updated:** 2026-01-08
**Purpose:** Comprehensive system design document for implementing features and understanding codebase structure

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

---

## Overview

**QuickBox** is a lightweight, browser-based wireframe mockup tool for rapid web page prototyping. It uses a single HTML file with vanilla JavaScript and CSS, allowing users to create multi-page mockups with reusable header/footer regions, drag-and-drop elements, and two interaction modes (Design and Navigate).

**Key Characteristics:**
- Single-file application (index.html + app.js + styles.css)
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
  text: 'Enter text here',  // For text boxes
  fontSize: 16,             // Font size in pixels
  fontFamily: "'Architects Daughter', cursive",

  content: 'media/logo.png', // For image boxes - relative path to /media folder

  link: null,               // Link target: { type: 'page', pageId: '...' } or { type: 'anchor', text: '...' }

  // Menu-specific
  menuItems: [              // For menu boxes
    { id: 'm1', text: 'Item 1', children: [] }
  ],

  // Accordion-specific
  accordionItems: [         // For accordion boxes
    { id: 'a1', title: 'Section 1', content: 'Text here' }
  ]
}
```

### Undo/Redo System

```javascript
const undoHistory = {
  past: [],                 // Array of state snapshots (max 20)
  future: [],               // Array for redo
  continuousOp: null,       // Current continuous operation type or null
  coalesceTimer: null       // Timer for debouncing
};
```

**Continuous Operations:** `drag`, `resize`, `region-resize` are coalesced into single undo steps with 500ms debounce.

---

## Application State

### State Initialization

1. **App starts** → `initializeState()` called
2. If no pages exist, creates default "Page 1" (desktop size)
3. Sets `currentPageId` to 'page-1'
4. Initial state snapshot captured to undo history

### State Mutations

State changes follow this pattern:

```javascript
// 1. Modify state object
state.selectedBox = boxId;

// 2. Re-render affected UI
renderCurrentPage();      // Re-render canvas
updateNavigator();        // Update pages/elements list
updatePageIdentifier();   // Update current page display

// 3. Record to undo history
pushHistory('discrete');  // or 'continuous-end' for continuous ops
```

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

**Toolbar** (index.html lines 14-76):
- File operations: New, Open, Save
- Box creation buttons: Text, Image, Menu, Button, Accordion
- Group operations: Create Group, Delete
- Font selector & size dropdown
- Canvas size buttons (Desktop, Tablet, Mobile)
- Mode buttons (Design 🖊️, Navigate 🧭)

**Navigator Panel** (index.html lines 82-96):
- **Pages Section:** Lists all pages, + button to add new page
- **Elements Section:** Lists boxes on current page

**Canvas** (index.html lines 101-109):
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
- Each item has: id, title, content
- Right-click → Accordion Editor Panel
- Rendered with click handlers to toggle visibility

### 6. Linking System

**Link Types:**
1. **Page Link:** Navigate to different page (in Navigate mode)
2. **Anchor Link:** Jump to element on same page

**Link Storage:**
- Stored in `box.link` property: `{ type: 'page', pageId: '...' }` or `{ type: 'anchor', text: '...' }`
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
2. Creates new palette JSON file in `/palettes/` folder
3. Updates `palettes/index.json` manifest
4. User refreshes palette list or restarts app
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
- Save As creates new palette files in `/palettes/` folder

**UI Location:**
- Toolbar: Palette dropdown, ✏️ Edit button, 🗑️ Delete button
- Panel: Opens on right side when editing palette

**Workflow:**
1. User selects palette from dropdown
2. Clicks ✏️ Edit button → Palette Editor Panel opens
3. Adjusts colors using color pickers with live preview
4. Click "Apply" → Changes visible immediately (temporary)
5. Click "Undo" → Reverts to original palette
6. Click "Save As New Palette" → Prompts for name, creates new JSON file
7. Click "Cancel" → Reverts and closes panel

**Data Flow:**
- Editor reads current palette from CSS variables
- Apply button updates CSS variables temporarily (no file write)
- Save As button:
  - Prompts for palette name
  - Creates new JSON file in `/palettes/` folder
  - Updates `palettes/index.json` manifest
  - Applies new palette as active

**Delete Palette:**
- Available for custom palettes only (not built-in "Sketch")
- Deletes palette JSON file
- Removes entry from `palettes/index.json` manifest
- Reverts to "Sketch" palette if deleted palette was active

**Key Functions:**
- `editCurrentPalette()` - Opens editor with current palette colors
- `applyPalettePreview()` - Updates CSS variables for live preview
- `undoPalettePreview()` - Reverts to original palette
- `savePaletteAs()` - Creates new palette file and updates manifest
- `deleteCurrentPalette()` - Removes custom palette

**File Locations:**
- HTML: index.html lines 156-302 (Palette Editor Panel)
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
- HTML: index.html lines 304-369 (Style Override Panel)
- CSS: styles.css lines 1251-1466 (panel styles, 🎨 indicator)
- JavaScript: app.js lines 2349-2616 (override panel management)
- Rendering: app.js lines 1306-1341, 1357-1361 (apply overrides to box elements)

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
- HTML: index.html lines 371-397 (Region Color Panel)
- CSS: styles.css lines 1468-1548 (region panel styles)
- JavaScript: app.js lines 2618-2723 (region color override functions)
- Context Menu: app.js lines 1036-1069, 3901-3947 (region detection and menu)
- Rendering: app.js lines 3597-3600, 3614-3617 (apply background color)

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
  "version": "1.2",
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
        "link": null,
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
- **v0.6 and earlier:** Not compatible (due to header/footer structure changes)
- **Version checks:** File version compared on load to warn about incompatibility

**Breaking Changes:**
- **v1.0:** Image storage changed from base64 to relative file paths
- **v1.1:** Font family now controlled globally via CSS variable, `box.fontFamily` property ignored during rendering (but preserved in data for backward compatibility)
- **v1.2:** No breaking changes - all new properties are optional and backward compatible

### Save/Load Process

**Save:**
- User clicks Save button
- File picker opens (folder selection)
- State object converted to JSON
- Downloaded as `.json` file

**Open:**
- User clicks Open button
- File picker filters for `.json` files
- File parsed and validated
- Counters recalculated from max IDs
- State restored and UI re-rendered
- Undo history cleared

---

## Mode System

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

### Undo/Redo with Coalescing

**Discrete operations** (add box, delete box):
- Immediately push to undo history

**Continuous operations** (drag, resize):
1. Set `undoHistory.continuousOp = 'drag'`
2. Skip intermediate snapshots
3. On mouse up, record single snapshot after 500ms debounce
4. Clear `continuousOp` flag

**Result:** Entire drag operation becomes one undo step.

### Z-Index Management

- `state.zIndexCounter` tracks highest z-index
- When box created: assign current counter, increment counter
- When box moved to front: assign current counter, increment
- **Result:** Later boxes appear on top automatically

---

## Code Organization & File Locations

### index.html
- **Lines 1-13:** Document header, stylesheet links
- **Lines 14-76:** Toolbar layout with all controls
- **Lines 82-96:** Navigator panel (pages & elements)
- **Lines 101-109:** Canvas and resize handles
- **Lines 115-128:** Menu editor panel (hidden)
- **Lines 132-144:** Accordion editor panel (hidden)
- **Lines 147-150:** Hidden file inputs

### app.js (Key Sections)
- **Lines 1-3:** App version constant
- **Lines 5-20:** Configuration constants (canvas sizes, button defaults)
- **Lines 22-36:** Global state object
- **Lines 38-163:** Undo/redo system functions
- **Lines 165-179:** State initialization
- **Lines 186-225:** DOM element references
- **Lines 229-283:** Toolbar event listeners
- **Lines 314-451:** Group selection logic (rectangle mode)
- **Lines 453-460:** Context menu event handling
- **Lines 462-479:** App entry point and initialization
- **Lines 481-499:** Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- **Lines 500+:** Box creation, rendering, editing, navigation functions
- **Lines 3032-3054:** Image selection handler (stores media/ relative paths)

### styles.css (Key Sections)
- **Lines 1-4:** Global box-sizing
- **Lines 6-10:** Body styles (font, background)
- **Lines 12-16:** App flex layout
- **Lines 18-78:** Toolbar styles (buttons, selects, branding)
- **Lines 111-150:** Navigator panel and page/element listing
- **Lines 150+:** Canvas and box styles, resize handles, selection indicators

---

## Design Philosophy & Constraints

### Minimalism
- Single-file HTML application
- Vanilla JavaScript (no frameworks)
- No build process required
- Hand-drawn Balsamiq aesthetic

### Backward Compatibility
- **v1.0 breaking change:** Image storage moved from base64 to file paths
- Version checks prevent incompatible file loads
- Counters recalculated on load for robustness

### Non-Destructive Editing
- All changes undoable (up to 20 steps)
- Continuous operations coalesced for better UX
- No accidental data loss

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

---

## Extension Points for New Features

When adding new features, consider:

1. **State Addition:** Add properties to `state` object
2. **Rendering:** Extend `renderRegion()` or create new render function
3. **Event Handling:** Add listener to canvas or toolbar
4. **File Format:** Update version and add fields to save/load
5. **Undo/Redo:** Call `pushHistory()` after state mutations
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
