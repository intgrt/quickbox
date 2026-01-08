# QuickBox

**Version:** 1.2
**License:** Apache License 2.0
**Copyright:** 2025 Intelliscape Interactive Corp.

A lightweight, browser-based wireframe mockup tool for rapid web page prototyping.

## Quick Start

1. Open `index.html` in a web browser
2. Use toolbar buttons to add elements (Text, Image, Menu, Button, Accordion)
3. Drag to move, hover edges to resize
4. Switch between Design mode (✏️ edit) and Navigate mode (🧭 preview)
5. Use Save/Open buttons to persist mockups as JSON files

## Key Features

- **Multi-page support** with shared header/footer regions
- **Element types:** Text, Image, Menu, Button, Accordion
- **Group selection** (Ctrl+Click or rectangle drag)
- **Drag-and-drop** positioning and 8-direction resizing
- **Three canvas sizes:** Desktop (1200px), Tablet (768px), Mobile (375px)
- **Custom canvas dimensions** via drag handles
- **Design & Navigate modes** for editing and previewing
- **Undo/Redo** (Ctrl+Z / Ctrl+Y)
- **Page linking** and anchor navigation
- **Color theming** via palette system with edit/save/delete capabilities
- **Per-element style overrides** for custom colors on individual boxes
- **Header/footer background color overrides** independent of boxes
- **Global font control** across all elements
- **Hand-drawn aesthetic** using Architects Daughter font
- **JSON file format** with backward compatibility (v0.7+)

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

For comprehensive system architecture and implementation details, see **SYSTEM_DESIGN.md**.

## Development

QuickBox uses the **Agent Navigation Marker (ANM v0.4)** standard for code organization. Markers in source code help locate functionality quickly without scanning entire files.

## Notes

- Single-file application (opens directly in browser, no build process required)
- Saves mockups as JSON files for portability
- No external dependencies
- Works in all modern browsers supporting HTML5

---

*For development and architecture details, see SYSTEM_DESIGN.md*
