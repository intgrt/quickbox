# QuickBox v0.12.2 - Right-Click Context Menu Preservation Fix

## Version Information
- **Version**: 0.12.2
- **Release Type**: Bug Fix
- **Date**: 2025-12-31
- **Supersedes**: v0.12.1

## Summary of Changes

### 🐛 Bug Fix: Preserve Group Selection on Right-Click

**Issue**: When right-clicking on grouped boxes to open the context menu, the group was being cleared before the context menu could detect the group and perform group-level delete or duplicate operations. This caused the context menu operations to affect only a single element instead of the entire group.

**Root Cause**: The simplified drag hit detection code introduced in v0.12 (to allow dragging from anywhere on a box) was triggering on both left-click and right-click events. The mousedown handler called `startDrag()` without checking the mouse button, which modified the selection and cleared grouped boxes before the context menu could process them.

**Solution**: Added a mouse button check in the drag handler to differentiate between left-click (button 0) and right-click (button 2). The drag logic now only executes on left-click, allowing right-click to preserve the group state for context menu operations.

**Code Changes**:
- app.js lines 848-852: Added `if (e.button === 0)` check before calling `startDrag()` to skip drag initiation on right-click (button 2)

**Result**:
- Right-clicking on grouped boxes now preserves the group selection
- Context menu delete/duplicate operations correctly detect and process groups
- Left-click drag functionality unchanged and works as expected

---

## Bug Fix Details

### The Problem
```javascript
// OLD CODE - triggered on all mouse buttons
const clickedBox = e.target.closest('.box');
if (clickedBox) {
  selectBox(box);
  startDrag(e, box);  // This ran on right-click too!
}
```

### The Solution
```javascript
// NEW CODE - only triggers on left-click
const clickedBox = e.target.closest('.box');
if (clickedBox) {
  selectBox(box);
  // Only initiate drag on left-click (button 0), not on right-click (button 2)
  if (e.button === 0) {
    startDrag(e, box);
  }
}
```

### Mouse Button Values
- `e.button === 0`: Left-click (primary button)
- `e.button === 2`: Right-click (context menu button)

---

## Testing Verification

### ✅ Right-Click Group Operations
- Create group via Ctrl+Click
- Right-click on grouped box → context menu appears
- Group selection is preserved (blue dashed outline still visible)
- Click "Delete" → entire group is deleted
- Undo to restore, try "Duplicate" → entire group is duplicated
- New duplicated group maintains selection and can be moved together

### ✅ Create Group Button Operations
- Use "Create Group" button to draw bounding box around multiple boxes
- Right-click on any grouped box → context menu appears
- Group selection is preserved
- "Delete" removes entire group, not single element
- "Duplicate" creates copy of entire group

### ✅ Left-Click Drag Still Works
- Left-click and drag grouped boxes → all boxes move together
- Left-click and drag single box → single box moves
- Drag from any point on the box (due to v0.12 hit detection improvement)

### ✅ No Regression
- Single box operations unaffected
- Page navigation unaffected
- Canvas resizing unaffected
- All other context menu operations work correctly

---

## Backward Compatibility
✅ Fully compatible with v0.12.1 and earlier
- No breaking changes
- No data structure modifications
- Only affects event handling behavior
- Existing files load and work normally

---

## File Modifications

### app.js
- Lines 3 and 848-852: Version updated to 0.12.2, mouse button check added to drag handler

### README.md
- Version updated to 0.12.2

---

## Known Issues
None identified in this release.

---

## Development Notes

This fix demonstrates the importance of proper event differentiation when handling mouse interactions. The simplified drag hit detection code introduced in v0.12 was correct in using `closest()` to allow dragging from anywhere on a box, but it needed to account for different mouse button contexts (left-click for drag vs. right-click for context menu).

The fix is minimal and surgical: a single conditional check that prevents drag logic from running on right-click, allowing the browser's native context menu behavior and our custom context menu handlers to function correctly.

---

## Version History
- v0.12.2: Right-click context menu preservation fix (current)
- v0.12.1: Canvas resize constraint fix
- v0.12: Canvas drag resize feature
- v0.11.2: Group deletion feature
- v0.11.1: Group duplication event propagation fix
- v0.11: Ctrl+Click multi-select & group duplication
- v0.10: Menu navigation bug fix & header/footer editing
- v0.9: Accordion box styling
- v0.8.3: Drag handle styling
- v0.8.2: Menu navigation improvements
- v0.8.1: Single box duplication
- v0.8: Group selection & dragging
