# QuickBox

A lightweight wireframe mockup tool for rapid web page prototyping.

## Features

- Multi-page support with navigation
- Text, image, and menu boxes
- Drag-and-drop positioning
- 8-direction resizing
- Page and anchor linking
- Responsive canvas (desktop, tablet, mobile)
- Save/load JSON files
- Hand-drawn Balsamiq-style aesthetic

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
- **Save**: Download as JSON file
- **Open**: Load existing JSON file

## Technical Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts (Architects Daughter)

## File Format

QuickBox saves files in JSON format with the following structure:

```json
{
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

Backward compatible with v0.1 files.

## License

Licensed under the Apache License, Version 2.0. See LICENSE file for details.

Copyright 2025 Intelliscape Interactive Corp.
