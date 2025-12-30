# QuickBox

**Version 0.10**

A lightweight wireframe mockup tool for rapid web page prototyping.

## Features

- Multi-page support with navigation
- Text, image, menu, and button boxes
- Drag-and-drop positioning
- 8-direction resizing
- Resizable header and footer regions
- Page and anchor linking
- Responsive canvas (desktop, tablet, mobile)
- Save/load JSON files with folder selection
- Design and Navigate modes
- Hand-drawn Balsamiq-style aesthetic
- Group selection and drag (v0.8)
- Duplicate element via context menu (v0.8.1)
- **NEW:** Fixed menu navigation across all pages (v0.10)
- **IMPROVED:** Header/footer editing available from any page (v0.10)

## Usage

Open `index.html` in a web browser to start using QuickBox.

### Basic Operations

- **Add boxes**: Use toolbar buttons (+ Text, + Image, + Menu)
- **Move boxes**: Click and drag
- **Resize boxes**: Hover over box edges to show resize handles
- **Delete boxes**: Select box and click Delete button
- **Link boxes**: Right-click box for context menu

### Pages

- **Add page**: Click + button in Pages section
- **Switch page**: Click page name in navigator
- **Rename page**: Double-click page name

### Elements

- **Select element**: Click element name in navigator or click box on canvas
- **Rename element**: Double-click element name
- **Link element**: Right-click box → Link to Page or Link to Anchor

### File Operations

- **New**: Create new mockup (warns if unsaved changes)
- **Save**: Select folder and filename using file picker (modern browsers)
- **Open**: Load existing JSON file

### Regions

- **Header/Footer**: Shared across all pages
- **Resize regions**: Drag the dashed border lines to adjust header/footer height (Design mode only)
- **Minimum height**: 60px enforced for header and footer

## Technical Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts (Architects Daughter)

## File Format

QuickBox v0.10 saves files in JSON format with the following structure:

```json
{
  "version": "0.10",
  "header": {
    "boxes": [...],
    "height": 80
  },
  "footer": {
    "boxes": [...],
    "height": 80
  },
  "pages": [
    {
      "id": "page-1",
      "name": "Page 1",
      "canvasSize": "desktop",
      "boxes": [...]
    }
  ],
  "currentPageId": "page-1"
}
```

**Note**: v0.10 files are fully backward compatible with v0.7+ format. Files from v0.6 and earlier are not compatible due to header/footer structure changes. v0.10 maintains the same file format as previous versions with no breaking changes.

## License

Licensed under the Apache License, Version 2.0. See LICENSE file for details.

Copyright 2025 Intelliscape Interactive Corp.
