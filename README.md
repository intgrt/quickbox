# QuickBox

**Version:** 1.4.1
**License:** Apache License 2.0
**Copyright:** 2025 Intelliscape Interactive Corp.

A lightweight, browser-based wireframe mockup tool for rapid web page prototyping.

## Table of Contents

- [Quick Start](#quick-start)
- [Key Features](#key-features)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Technical Stack](#technical-stack)
- [Development](#development)
- [Documentation](#documentation)

## Who This Is For

- **Designers & Product Managers:** Use QuickBox to create clickable wireframe prototypes without coding
- **Developers:** See [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) for architecture, data model, and implementation details

## Quick Start

1. Install Node.js 18 or newer and run `npm run dev` in this folder
2. Open `http://127.0.0.1:5174` in Chrome or another modern browser
3. Use toolbar buttons to add elements (Text, Image, Menu, Button, Accordion, Table)
4. Drag to move, hover edges to resize
5. Switch between Design mode (✏️ edit) and Navigate mode (🧭 preview)
6. Use Save/Open buttons to persist mockups as JSON files

## Key Features

- **Collapsible navigation panel:** Use the arrow above Pages to hide or restore the left panel and give the canvas more space.
- **Multi-page support** with shared header/footer regions ([details](SYSTEM_DESIGN.md#three-region-canvas-model))
- **Element types:** Text, Image, Menu, Button, Accordion, Table ([details](SYSTEM_DESIGN.md#box-types))
- **Group selection** (Ctrl+Click or rectangle drag) ([details](SYSTEM_DESIGN.md#group-selection))
- **Copy/Paste** boxes and groups across pages (Ctrl+C / Ctrl+V)
- **Drag-and-drop** positioning and 8-direction resizing ([details](SYSTEM_DESIGN.md#drag-and-resize))
- **Three canvas sizes:** Desktop (1200px), Tablet (768px), Mobile (375px)
- **Custom canvas dimensions** via drag handles
- **Design & Navigate modes** for editing and previewing ([details](SYSTEM_DESIGN.md#mode-system))
- **Undo/Redo** (Ctrl+Z / Ctrl+Y) ([details](SYSTEM_DESIGN.md#undoredo-system))
- **Page linking** and anchor navigation ([details](SYSTEM_DESIGN.md#page-linking-system))
- **Color theming** via palette system with edit/save/delete capabilities ([details](SYSTEM_DESIGN.md#palette-system))
- **Per-element style overrides** for custom colors on individual boxes ([details](SYSTEM_DESIGN.md#per-element-style-overrides))
- **Header/footer background color overrides** independent of boxes ([details](SYSTEM_DESIGN.md#region-background-color-overrides))
- **Global font control** across all elements ([details](SYSTEM_DESIGN.md#global-font-control))
- **Hand-drawn aesthetic** using Architects Daughter font
- **JSON file format** with backward compatibility (v0.7+) ([details](SYSTEM_DESIGN.md#file-format--persistence))
- **HTML export** generates a self-contained file with all pages and images embedded for sharing ([details](SYSTEM_DESIGN.md#html-export-v13))

## Technical Stack

- HTML5
- CSS3 (Balsamiq-style hand-drawn appearance)
- Vanilla JavaScript (no frameworks)
- Google Fonts (Architects Daughter)

## File Structure

- `index.html` - Application markup
- `app.js` - Core application logic
- `styles.css` - Styling and layout
- `document-model.js` - Validation and rich text sanitization
- `export-runtime.js` - Client preview interactions
- `dev-server.cjs` - Local preview server
- `SYSTEM_DESIGN.md` - Complete architecture and implementation guide
- `palettes/` - Color palette definitions (JSON)
- `media/` - Images (logo, etc.)

## Documentation

**For developers and technical details:**
- [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) - Complete architecture, data model, rendering pipeline, and implementation guide
- See specific sections: [Architecture](SYSTEM_DESIGN.md#architecture) | [Data Model](SYSTEM_DESIGN.md#data-model) | [Event Flow](SYSTEM_DESIGN.md#event-flow--interaction-model) | [Algorithms](SYSTEM_DESIGN.md#key-algorithms)

## Modal mockups

1. In Design mode, select the main-content boxes that belong in the popup (Ctrl+Click for several), then click **Create Modal**. With no selection, it creates an empty modal.
2. Name the modal. It appears as **Modal:** in the Pages navigator; select it to edit its boxes using the usual tools. Shared headers and footers are omitted.
3. Return to the original page, right-click the trigger button, choose **Open Modal…**, and enter the modal's listed ID.
4. Switch to Navigate mode and click the button. Close the popup with **×**, Escape, or its backdrop. Export HTML preserves these interactions.

Modal definitions are saved in JSON. Creating a modal moves selected boxes into it and can be undone. Registration fields remain visual mockups; this does not submit form data.

To remove a modal, use **Delete modal** beside its name in the Pages panel in Design mode, then confirm. This removes the modal, its contents, and links targeting it or its elements. Undo restores them. Deleting the modal you are editing returns you to a regular page.

## Tables

Click **+ Table** to create a 3 × 3 table. Click a cell and start typing to edit plain text. Tab and Shift+Tab move between editable cells; click outside or press Escape to finish. While editing, Enter adds a line break.

Select a cell to show **Add Row Above/Below**, **Add Column Left/Right**, **Delete Row**, and **Delete Column** beneath the table. The blue outline and row/column label identify the target. Tables always retain at least one row and column; limits are 100 rows and 50 columns.

Move the table with its arrow handle and resize its width with the side handles. In Design mode, drag an internal column border to widen one column and narrow its neighbor. The overall table width stays fixed; resizing the whole table preserves the column proportions. Height adjusts to fit the text. Adding a column splits the selected column's width; deleting a column gives its width to a neighbor. Tables use the current text palette and global font; the Size control changes table text size. Cell edits, row/column changes, and column resizing support Undo/Redo. Save/Open, duplication, copy/paste, and HTML export preserve cells and column widths. Navigate mode and exported previews display read-only tables.

## Keyboard Shortcuts

- **Ctrl+C** - Copy selected box or group
- **Ctrl+V** - Paste box or group (works across pages)
- **Ctrl+D** - Delete selected box or group
- **Ctrl+Z** - Undo
- **Ctrl+Y** - Redo
- **Ctrl+Shift+Z** - Redo (alternate)
- **Ctrl+Click** - Multi-select boxes for grouping
- **Escape** - Clear group selection

## Development

### Running QuickBox

Run `npm run dev`, then open `http://127.0.0.1:5174`. The local server uses Node's built-in modules; no dependency installation or build step is required to use the editor. It binds to localhost and serves application assets only.

Opening `index.html` directly is unsupported for the full editor because browsers restrict palette and image fetches under `file://`. Exported HTML can be opened directly; online Google Fonts fall back to local fonts when offline.

Put images in `media/`. To use an external media folder, launch the server with that exact folder enabled:

```powershell
$env:QUICKBOX_MEDIA_ROOT = 'D:/path/to/project/Media'
npm run dev
```

Then use **Set Media Folder** in the editor with the same path. The server grants access only within that folder. Vite is optional and is not installed or launched by the npm scripts.

### Verification

Install development check dependencies with `npm ci`, then run `npm run check`. These DOM regression checks cover import validation, sanitization, undo, drafts, save/open, and exported navigation. They do not measure browser layout.

Manually verify dragging, resizing, menus, accordions, and downloaded exports in Chrome. For automated file-picker checks, enable **Allow access to file URLs** in the ChatGPT Chrome extension's Details page; automation cannot change this permission for you. See `checks/README.md` for the checklist.

### Client delivery and Firebase

Use **Export HTML** to generate the client preview. It embeds available images and preserves page, menu, and anchor links. Missing images are listed before exporting with placeholders. The export still references Google Fonts online.

`firebase.json` serves the existing `public/` directory of client previews, including its test landing page. It does not deploy the root QuickBox editor. Keep client exports and their assets in `public/` when intentionally preparing a preview deployment. No deployment is performed by `npm run dev`.

### Documents and palettes

In Chrome, Open remembers the selected JSON file. Save asks whether to overwrite that file or choose another name/location; Save As starts in the original folder. New clears the remembered file. Browsers without the File System Access API download JSON using the opened filename and their browser download settings.
Open validates the whole document before replacement. Invalid files leave the current document intact. New resets the header, footer, pages, font, theme, and media path. Successful Open and New clear undo/redo and the clipboard; unsaved document changes trigger a replacement warning.

Rich text supports paragraphs, lists, bold, italic, underline, and basic inline formatting. Active HTML and unsupported attributes are stripped on import and paste. Menu labels and accordion answers are plain text.

Custom palettes are saved in this browser and downloaded as JSON for distribution. Saved mockups include their applied palette colors, so they do not need the custom palette file to render after reopening. Deleting a palette removes it from this browser's list; distributed palette files remain user-managed.

### Code Organization

QuickBox uses the **Agent Navigation Marker (ANM v0.4)** standard for code organization:
- Markers like `@agent:ComponentName:authority` identify key functions
- Use markers to quickly locate functionality without scanning files
- See [SYSTEM_DESIGN.md - Code Organization](SYSTEM_DESIGN.md#code-organization--file-locations) for complete marker reference

### Common Development Tasks

See [SYSTEM_DESIGN.md - Common Development Tasks](SYSTEM_DESIGN.md#common-development-tasks) for:
- Adding new box types
- Modifying toolbar controls
- Extending the file format
- Adding new features

## Notes

- Static HTML/CSS/JavaScript application served locally; no build process required
- Saves mockups as JSON files for portability
- No browser runtime libraries; Google Fonts are optional. jsdom is used only by development checks.
- Works in all modern browsers supporting HTML5

---

*For development and architecture details, see SYSTEM_DESIGN.md*
