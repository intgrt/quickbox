QuickBox as built v0.3

## Status: COMPLETED

## Features

multi-page support
- pages stored in state array
- current page tracking
- page counter for unique IDs

page navigation
- hierarchical navigator panel (left side)
- Pages section (collapsible)
- Elements section (collapsible, shows current page boxes only)
- click page name to switch pages
- active page highlighted
- add page button in Pages header

element types
- text box (editable, font family, font size)
- image box (upload images)
- menu box (horizontal layout, default items: Home, About, Contact)

box operations
- add boxes via toolbar buttons
- delete selected box
- move boxes by dragging
- resize boxes with 8-direction handles (visible on hover for text/image boxes, visible when selected for menu boxes)
- boxes overlap
- selected box moves to top (z-index)
- click element name in list to select box

menu box specific operations
- drag icon (hamburger icon) in top-left corner for dragging menu boxes
- edit icon (pencil icon) in top-right corner for opening menu editor
- menu boxes only draggable via drag icon
- clicking menu box background selects the box without dragging
- menu items clickable without triggering box selection or drag
- resize handles only visible when menu box is selected

menu editor
- opened by clicking edit icon on menu box
- floating panel on right side of screen
- add top-level menu items
- add child menu items to create dropdowns
- delete menu items
- reorder menu items via drag handles
- edit menu item text
- add links to menu items (page links)
- save button to apply changes to menu box
- close button to dismiss editor

menu box rendering
- horizontal layout with evenly spaced items
- menu items with borders and hover states
- linked menu items display in bold
- menu items with children show dropdown arrow
- dropdown menus appear on hover
- child items in dropdown are clickable
- child items can have page links

naming system
- pages: `Page [editable suffix]`
- text boxes: `Text [editable suffix]`
- image boxes: `Image [editable suffix]`
- menu boxes: `Menu [editable suffix]`
- right-click page or element name to rename
- tooltip "Right-click to rename" on hover
- prefix fixed, suffix editable
- validation: empty/whitespace rejected, names trimmed

linking system
- right-click box for context menu
- link to page (navigate to another page)
- link to anchor (scroll to box on current page)
- remove link option
- link indicator (chain link icon) on linked boxes
- click linked box to navigate
- menu items can link to pages via menu editor

canvas
- desktop (1200px), tablet (768px), mobile (375px)
- toolbar buttons for canvas size switching
- canvas height grows dynamically based on box positions
- minimum height 600px
- wavy hand-drawn box borders
- light grey solid UI borders
- black and white color scheme

file operations
- new file (confirm if unsaved changes)
- save file (JSON format, downloads as quickbox-mockup.json)
- open file (JSON format)
- backward compatibility with v0.1 files

branding
- IIC logo (media/IIC Logo small.png)
- app title: QuickBox v0.3
- copyright: 2025 Intelliscape Interactive Corp.
- logo and text in toolbar

fonts
- 5 font options: Architects Daughter, Comic Sans, Arial, Courier, Georgia
- font size options: 12, 14, 16, 18, 20, 24, 28, 32
- no bold, italic, underline, color options

## Technical Stack

HTML5, CSS3, Vanilla JavaScript
Google Fonts - Architects Daughter
Browser File API
index.html - structure
styles.css - styling
app.js - logic

## File Structure

state object:
```
{
  pages: [...],
  currentPageId: 'page-1',
  selectedBox: null,
  boxCounter: 0,
  pageCounter: 0,
  zIndexCounter: 1
}
```

page object:
```
{
  id: 'page-1',
  name: 'Page 1',
  canvasSize: 'desktop',
  boxes: [...]
}
```

box object:
```
{
  id: 'box-1',
  name: 'Text 1',
  type: 'text',
  x: 50,
  y: 50,
  width: 200,
  height: 150,
  zIndex: 1,
  content: '',
  fontSize: '16',
  fontFamily: "'Architects Daughter', cursive",
  linkTo: null
}
```

link object:
```
{
  type: 'page',
  target: 'page-2'
}
```
or
```
{
  type: 'anchor',
  target: 'box-5'
}
```

menu box additional properties:
```
{
  orientation: 'horizontal',
  menuItems: [
    {
      id: 'menu-item-123-0',
      text: 'Home',
      linkTo: null,
      children: []
    },
    {
      id: 'menu-item-123-1',
      text: 'About',
      linkTo: {type: 'page', target: 'page-2'},
      children: [
        {
          id: 'menu-item-123-1-0',
          text: 'Team',
          linkTo: null,
          children: []
        }
      ]
    }
  ]
}
```

JSON save format:
```
{
  "pages": [...],
  "currentPageId": "page-1"
}
```

## Event Handling

menu box drag behavior
- drag icon handles mousedown event
- calls selectBox and startDrag functions
- prevents event propagation to parent box

menu box selection behavior
- clicking menu box background selects box
- does not initiate drag operation
- menu items and icons block event propagation

menu item click behavior
- mousedown on menu item stops propagation to prevent dragging
- click on linked menu item calls handleLinkClick function
- click on non-linked menu item stops propagation only

resize handle behavior
- text and image boxes show handles on hover
- menu boxes show handles only when selected
- handles have higher z-index than box content
