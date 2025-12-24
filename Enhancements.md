# QuickBox Enhancements

## Multi Select Drag Edit Delete

### Overview
Add multi-object selection, copy, paste, delete, and drag-and-drop functionality to allow users to work with multiple boxes simultaneously.

### Current State
- Single selection only: `state.selectedBox` stores one box
- `selectBox()` manages single selection
- Delete, drag, and edit operations work on single box only

### Required Changes

#### 1. State Management
- Change `selectedBox: null` to `selectedBoxes: []`
- Add `clipboard: []` for copy/paste operations

#### 2. Selection Logic
- **Ctrl+Click**: Add/remove box from selection array
- **Shift+Click**: Range selection (optional)
- **Click alone**: Clear selection, select single box
- Update CSS `.selected` class for all boxes in array

#### 3. Copy/Paste (NEW)
- **Ctrl+C**: Copy `selectedBoxes[]` to `clipboard[]` (deep clone)
- **Ctrl+V**: Paste from clipboard with new IDs
- Preserve relative positioning between boxes

#### 4. Delete
- Modify delete function to iterate through `selectedBoxes[]`
- Delete all selected boxes
- Respect header/footer region restrictions

#### 5. Drag and Drop
- Move all boxes in `selectedBoxes[]` together
- Maintain relative positions during drag
- Apply region transfer logic to all boxes
- Block drag if any box violates header/footer rules

#### 6. Visual Feedback
- Keep existing `.box.selected` style
- Optional: Show selection count indicator

#### 7. Context Menu
- Add "Copy", "Paste", "Delete Selected" menu items
- Display count of selected items

### Edge Cases to Handle
- Mixed region selections (header/footer + main)
- Menu boxes with special drag behavior
- Read-only header/footer on non-Page-1
- Pasting across different regions
- Selection persistence across page switches

### Implementation Priority
1. Basic multi-select with Ctrl+Click (Medium)
2. Multi-delete (Medium)
3. Multi-drag with relative positioning (High)
4. Copy/Paste with relative positioning (High)
5. Enhanced context menu (Low)
