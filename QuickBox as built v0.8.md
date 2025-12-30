# QuickBox v0.8 - Build Documentation

**Version:** 0.8
**Build Date:** 2025-12-29
**Status:** Development Build

## What's New in v0.8

### Major Feature: Group Selection and Drag

#### 1. Rectangle Selection Tool
- **Create Group button**: New toolbar button to activate group selection mode
- **Visual feedback**: Cursor changes to crosshair when in selection mode
- **Rectangle drawing**: Click and drag on empty canvas to draw selection rectangle
- **Visual indicator**: Blue dashed rectangle shows selection bounds during drag
- **Box detection**: All boxes within rectangle bounds are automatically selected
- **Group visual**: Selected boxes get blue dashed outline to show group membership

#### 2. Multi-Box Dragging
- **Group drag**: Click any box in the group and drag to move all boxes together
- **Unified movement**: All boxes move by same delta (distance and direction)
- **Region awareness**: Group respects region boundaries (header/footer restrictions)
- **Smart region detection**: Uses dragged box's region to determine group destination
- **Automatic snap-back**: If move is invalid, entire group returns to original position

#### 3. Intelligent Coordinate System
- **Region offset calculation**: Boxes are positioned relative to their region (header/main/footer)
- **Dynamic offset handling**: Accounts for variable header/footer heights
- **Accurate intersection**: Selection rectangle bounds are adjusted by region offset when checking boxes
- **Cross-region compatibility**: Correctly handles boxes in header, main, and footer regions simultaneously

#### 4. Cleanup Handlers
- **ESC key**: Press ESC to clear active group
- **Outside click**: Clicking outside canvas clears group (but not on UI elements)
- **Page switch**: Changing pages automatically clears any active group
- **UI element protection**: Clicking toolbar, navigator, or menu editor doesn't clear group

### Technical Implementation

**New State Properties:**
```javascript
state.tempGroup = []           // Array of boxes in current selection
state.groupSelectMode = false  // Flag for rectangle selection active
```

**Key Functions:**
- `startDrag(e, box)` - Enhanced to detect group membership and route to appropriate handler
- `startSingleDrag(e, box)` - Original single-box drag logic
- `startGroupDrag(e, draggedBox)` - New group drag handler with unified movement
- `updateGroupVisualsOnCanvas()` - Applies/removes visual indicators
- `clearTempGroup()` - Resets group state and UI

**CSS Classes:**
- `.selection-rectangle` - Visual feedback during rectangle drawing
- `.in-temp-group` - Blue dashed outline for group member boxes

**Coordinate Adjustment Logic:**
```javascript
// Box coordinates are relative to their region
// Selection rectangle coordinates are relative to canvas
// When checking intersection:
const regionOffset = regionElement.offsetTop
const adjustedBoxY = box.y + regionOffset
// Compare adjusted box Y to selection rectangle bounds
```

### Files Modified

- `app.js` - Group selection logic, drag routing, cleanup handlers, coordinate adjustment
- `styles.css` - Selection rectangle and group indicator styling
- `README.md` - Version update and feature list
- `QuickBox as built v0.8.md` - Created (this file)

### ANM Compliance

All code changes use proper ANM markers:
- `@agent:GroupSelection:authority` - Rectangle selection and helper functions
- `@agent:DragDrop:extension` - Group drag modifications
- `@agent:Canvas:authority` - Canvas event listeners

### Bug Fixes and Improvements

**Issue: Box Selection in Groups**
- Fixed coordinate mismatch between selection rectangle (canvas coordinates) and boxes (region-relative coordinates)
- Added region offset calculation to accurately detect boxes in any region
- Ensures boxes in header, main, and footer are all correctly included based on visual position

**Issue: UI Element Interference**
- Fixed temp group being cleared when clicking UI elements
- Added checks to exclude clicks on toolbar, navigator, and menu editor from clearing groups
- Allows smooth interaction with UI while maintaining group state

**Issue: Selection Rectangle Visibility**
- Rectangle now uses actual DOM element measurements instead of calculated mouse positions
- Improved accuracy of selection bounds

### Console Debugging

Comprehensive console logging added for troubleshooting:
- Group selection start/end events
- Canvas and region offset information
- Box detection for each region
- Coordinate adjustments and intersection calculations
- Group membership detection during drag
- Movement delta tracking
- Region transfers

### Testing Checklist

- [x] Create rectangle selection with 2+ boxes
- [x] Move group across canvas
- [x] ESC key clears group
- [x] Click outside canvas clears group
- [x] Click on UI elements doesn't clear group
- [x] Switching pages clears group
- [x] Single box drag still works when not in group
- [x] Boxes in header region are correctly detected
- [x] Boxes in main region are correctly detected
- [x] Boxes in footer region are correctly detected
- [x] Header/footer size changes work with group selection
- [x] Group prevents moving to header/footer on non-Page-1

### User-Facing Changes

**New Workflow:**
1. Click "Create Group" button (turns black, cursor becomes crosshair)
2. Click and drag on canvas to draw selection rectangle
3. All boxes within rectangle get blue dashed outline
4. Click any outlined box and drag to move entire group
5. Press ESC or click outside to clear group

**Visual Indicators:**
- **Button state**: "Create Group" button highlights when active
- **Cursor**: Changes to crosshair during selection mode
- **Selection rectangle**: Blue dashed rectangle appears while drawing
- **Group members**: Blue dashed outline on all selected boxes

### Performance

- No noticeable performance impact
- Selection detection uses simple bounding box math
- Region offset calculation is O(n) where n = number of boxes
- Group drag uses delta-based movement (efficient)

### Backward Compatibility

**File Format:** v0.8 uses same format as v0.7
- Existing v0.7 files load and save correctly
- No schema changes
- Temporary group data not persisted (by design)

**Features:** All v0.7 features work identically
- Single box drag/resize unchanged
- Region resizing unchanged
- File save/load unchanged
- Menu editing unchanged
- Page navigation unchanged

### Known Limitations

- Groups are temporary (cleared on drag completion or ESC)
- No persistent group storage or naming
- Cannot create nested groups
- Cannot save/load group configurations

### Future Enhancements

Potential improvements for future versions:
- Persistent group storage and naming
- Group alignment tools (align top, bottom, center)
- Group size/position constraints
- Keyboard shortcuts for group operations
- Copy/duplicate groups
- Group templates

## Technical Specification

- **ANM Standard**: v0.2 compliant
- **Browser Requirements**: Modern browsers (ES2017+)
- **File Format**: JSON with version field "0.8"
- **Coordinate System**: Region-relative positioning with canvas-relative selection

---

**Previous Version:** v0.7 - Menu drag handles and context menu improvements
**Next Version:** TBD
