QuickBox as built v0.4

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

page identifier
- badge in top-left corner of canvas
- displays page name and page ID
- format: "Page Name • page-id"
- visible on all pages

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

header and footer
- global header and footer (one per file)
- stored in state.header and state.footer
- header region at top of canvas with dashed border
- footer region at bottom of canvas with dashed border
- both regions have min-height 60px, expand based on content
- editable only on Page 1
- displayed read-only on all other pages
- boxes can be dragged to/from header/footer/main regions
- drag detection based on box top-left corner position
- visual feedback (region highlighting) during drag
- Page 1 restriction enforced: boxes snap back with alert if not on Page 1
- header/footer boxes listed in Elements panel with section labels
- header/footer boxes show as read-only in Elements panel when not on Page 1

drag-and-drop region transfer
- drag any box to header, main, or footer region
- region detection uses box top-left corner position
- visual feedback: regions highlight during drag (drag-over class)
- automatic box transfer between regions on drop
- y-coordinate adjusted relative to new region
- snap-back to original position if Page 1 restriction violated
- alert shown: "Header and footer can only be edited on Page 1"
- no confirmation required for transfers
- works with all box types (text, image, menu)

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
- three regions: header-region, main-region, footer-region
- flexbox layout with header/footer fixed, main region flexible

file operations
- new file (confirm if unsaved changes)
- save file (JSON format, downloads as quickbox-mockup.json)
- open file (JSON format)
- version tracking in JSON files (version field)
- backward compatibility with v0.1, v0.2, v0.3 files
- version detection on load with console logging

branding
- IIC logo (media/IIC Logo small.png)
- app title: QuickBox v0.4 (dynamically updated from APP_VERSION)
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
  header: { boxes: [] },
  footer: { boxes: [] },
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

JSON save format v0.4:
```
{
  "version": "0.4",
  "header": {
    "boxes": [...]
  },
  "footer": {
    "boxes": [...]
  },
  "pages": [...],
  "currentPageId": "page-1"
}
```

## Event Handling

drag-and-drop region detection
- startDrag() tracks source region and array
- onMouseMove() detects current region based on box top-left corner
- uses getBoundingClientRect() for region boundaries
- adds/removes 'drag-over' class for visual feedback
- onMouseUp() checks Page 1 restriction
- calls transferBoxToRegion() if region changed

region boundary calculation
- getRegionBoundaries() returns header, main, footer boundaries
- uses getBoundingClientRect() for accurate positioning
- handles window scrolling and canvas position

region detection
- detectRegion(clientY) determines region from Y coordinate
- compares against main region top/bottom boundaries
- returns 'header', 'main', or 'footer'

box location tracking
- findBoxInRegions(boxId) searches header, footer, and current page
- returns box object, region name, and source array
- used by startDrag() to track box movement

box transfer
- transferBoxToRegion() moves box between regions
- removes from source array
- adjusts y-coordinate relative to target region container
- adds to target array (header.boxes, footer.boxes, or page.boxes)
- triggers re-render and navigator update

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

Page 1 restriction enforcement
- checked in startDrag() on mouseUp
- checked in deleteSelectedBox()
- prevents drag/edit operations on header/footer when not on Page 1
- shows alert and snaps box back to original position

## Changes from v0.3

- Removed toolbar buttons for adding to header/footer
- Implemented drag-and-drop region transfer
- Added getRegionBoundaries() helper function
- Added detectRegion() helper function
- Added findBoxInRegions() helper function
- Added transferBoxToRegion() function
- Enhanced startDrag() with region detection and visual feedback
- Added CSS for drag-over visual feedback
- Updated version to 0.4 in APP_VERSION constant
- Updated JSON save format to include version field
- All v0.4 files save with "version": "0.4"
