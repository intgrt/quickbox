# QuickBox v0.7 - Build Documentation

**Version:** 0.7
**Build Date:** 2025-12-29
**Status:** Development Build

## What's New in v0.7

### User Experience Improvements

#### 1. Optimized Text Box Sizing (Issue #6)
- **Reduced default height**: Text boxes now default to 30px (was 150px) - perfect for single-line text
- **Smaller minimum height**: Boxes can now resize down to 30px (was 50px minimum)
- **Tighter padding**: Removed internal padding (0px instead of 3px) for precise text fitting
- **Better resizing**: All resize constraints updated to 30px minimum
- Locations: `app.js:197`, `styles.css:328, 345`, `app.js:1179-1196`

#### 2. Menu Box Drag Handle (Issue #8)
- **Drag icon added**: Menu boxes now display a hamburger icon (☰) in the top-left corner
- **Clear interaction**: Users can click and drag the icon to move menu boxes
- **Design mode only**: Drag icon only appears in Design mode
- **Consistent with workflow**: Separates drag from menu item interaction
- Location: `app.js:305-316`

#### 3. Context Menu Delete Option (Issue #9)
- **Delete restored**: Right-click context menu now includes "Delete" option
- **Two deletion methods**: Users can delete via toolbar button OR context menu
- **Proper workflow**: Selecting and deleting boxes is now intuitive again
- Location: `app.js:1679-1688`

### Technical Changes

**Box Sizing Updates:**
```javascript
// Default heights
text: 30px (was 150px)
image: 150px (unchanged)
menu: 50px (unchanged)
button: 50px (unchanged)

// Minimum constraints
CSS min-height: 30px (was 50px)
Resize minimums: 30px (was 50px)
Box-content padding: 0px (was 3px)
```

**Menu Box Enhancements:**
```javascript
// New drag icon
dragIcon.className = 'menu-drag-icon'
dragIcon.textContent = '☰'
// Positioned top-left, triggers startDrag()
```

**Context Menu:**
```javascript
// Added delete option
deleteOption.textContent = 'Delete'
deleteOption.click → selectBox() → deleteSelectedBox()
```

### Files Modified

- `app.js` - Text box defaults, menu drag icon, context menu delete, resize constraints
- `styles.css` - Minimum height, box-content padding
- `QuickBox as built v0.7.md` - Created (this file)

### ANM Compliance

All changes made with proper ANM marker usage:
- Modified existing `@agent:BoxManagement:authority` for text box sizing
- Modified existing `@agent:BoxRendering:authority` for menu drag icon
- Modified existing `@agent:ContextMenu:authority` for delete option
- Modified existing `@agent:Box:authority` for CSS min-height
- Modified existing `@agent:BoxResize:authority` for resize constraints

### Bug Fixes Summary

**Issue #6 - Text Box Height:**
- ✅ Text boxes too tall for single-line content
- ✅ Couldn't resize boxes below 50px
- ✅ Excessive padding after text when resized

**Issue #8 - Menu Box Dragging:**
- ✅ Menu boxes lacked clear drag affordance
- ✅ Added ☰ drag icon for intuitive interaction

**Issue #9 - Delete Functionality:**
- ✅ Context menu missing delete option
- ✅ Users had to use toolbar button only

### User-Facing Changes

**New Defaults:**
- Creating text boxes now produces compact 30px height boxes
- Text fits tighter with no internal padding
- Menu boxes show clear drag handle

**Improved Interactions:**
- Right-click any box → "Delete" option available
- Menu boxes drag via ☰ icon (top-left)
- Text boxes resize down to 30px for compact single-line text

### Testing Notes

- Text box creation tested with various font sizes
- Resize down to 30px verified for all box types
- Menu drag icon tested in Design mode
- Context menu delete tested for text, image, menu, and button boxes
- Padding removal verified - text aligns to edges properly

### Backward Compatibility

**File Format:** v0.7 uses same format as v0.6
- Existing v0.6 files load correctly
- Boxes with heights > 30px remain unchanged
- New text boxes default to 30px

**No Breaking Changes:**
- All v0.6 features work identically
- Region resizing unchanged
- File save/load unchanged

### Performance

- No performance impact from changes
- Minimal DOM additions (drag icon for menu boxes only)
- CSS changes have negligible rendering impact

## Known Issues

None identified in v0.7.

## Next Steps

Potential future enhancements:
- Auto-fit text box height to content
- Configurable default box sizes
- Keyboard shortcuts for delete
- Bulk delete operations

## Technical Specification

- ANM Standard: v0.2 compliant
- Browser Requirements: Modern browsers (ES2017+)
- File Format: JSON with version field "0.7"

---

**Previous Version:** v0.6 - Resizable regions and file save improvements
**Next Version:** TBD
