# QuickBox

**Version:** 1.3
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

1. Open `index.html` in a web browser
2. Use toolbar buttons to add elements (Text, Image, Menu, Button, Accordion)
3. Drag to move, hover edges to resize
4. Switch between Design mode (✏️ edit) and Navigate mode (🧭 preview)
5. Use Save/Open buttons to persist mockups as JSON files

## Key Features

- **Multi-page support** with shared header/footer regions ([details](SYSTEM_DESIGN.md#three-region-canvas-model))
- **Element types:** Text, Image, Menu, Button, Accordion ([details](SYSTEM_DESIGN.md#box-types))
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

## Technical Stack

- HTML5
- CSS3 (Balsamiq-style hand-drawn appearance)
- Vanilla JavaScript (no frameworks)
- Google Fonts (Architects Daughter)

## File Structure

- `index.html` - Application markup
- `app.js` - Core application logic
- `styles.css` - Styling and layout
- `SYSTEM_DESIGN.md` - Complete architecture and implementation guide
- `palettes/` - Color palette definitions (JSON)
- `media/` - Images (logo, etc.)

## Documentation

**For developers and technical details:**
- [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) - Complete architecture, data model, rendering pipeline, and implementation guide
- See specific sections: [Architecture](SYSTEM_DESIGN.md#architecture) | [Data Model](SYSTEM_DESIGN.md#data-model) | [Event Flow](SYSTEM_DESIGN.md#event-flow--interaction-model) | [Algorithms](SYSTEM_DESIGN.md#key-algorithms)

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

**Option 1: Direct browser (recommended for users)**
1. Open `index.html` directly in your browser
2. No build process or server required

**Option 2: Development server (optional)**
1. Install dependencies: `npm install`
2. Run dev server: `npm run dev`
3. Access at `http://localhost:5173`
4. Vite config provides `/media` folder access during development

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

- Single-file application (opens directly in browser, no build process required)
- Saves mockups as JSON files for portability
- No external dependencies
- Works in all modern browsers supporting HTML5

---

*For development and architecture details, see SYSTEM_DESIGN.md*
