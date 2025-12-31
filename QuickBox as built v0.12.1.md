# QuickBox v0.12.1 - Canvas Resize Constraint Fix

## Version Information
- **Version**: 0.12.1
- **Release Type**: Bug Fix
- **Date**: 2025-12-31
- **Supersedes**: v0.12

## Summary of Changes

### 🐛 Bug Fix: Remove Maximum Canvas Size Constraints

**Issue**: Canvas resize was limited to a maximum of 2000px in both width and height dimensions, preventing users from creating larger mockups.

**Root Cause**: Arbitrary maximum constraints (`CANVAS_MAX_WIDTH = 2000`, `CANVAS_MAX_HEIGHT = 2000`) were hardcoded without consultation.

**Solution**: Removed maximum constraints entirely, keeping only minimum constraints (300px minimum for both dimensions).

**Code Changes**:
- app.js lines 12-15: Removed `CANVAS_MAX_WIDTH` and `CANVAS_MAX_HEIGHT` constants
- app.js line 3130-3131: Updated clamping logic to only apply minimum constraint: `Math.max(CANVAS_MIN_WIDTH, newWidth)`
- app.js line 3196-3197: Updated `setCustomCanvasSize()` clamping to only apply minimum constraint

**Result**: Users can now resize canvas to any height or width larger than 300px with no upper limit.

---

## Canvas Resize Behavior (Updated)

**Minimum Constraints**:
- Width: 300px minimum
- Height: 300px minimum

**No Maximum Constraints**:
- Width: unlimited
- Height: unlimited
- Users can create canvas sizes for any mockup scenario

---

## Testing Verification

### ✅ Resize Beyond 2000px
- Can drag bottom edge to extend height beyond 2000px
- Can drag right edge to extend width beyond 2000px
- Resize continues smoothly without hitting artificial limits

### ✅ Minimum Constraints Still Enforced
- Cannot shrink below 300px in either dimension
- Minimum constraint properly prevents degenerate canvas sizes

### ✅ Custom Sizes Persist
- Large custom sizes save and restore correctly
- No truncation of dimensions in saved files

---

## Backward Compatibility
✅ Fully compatible with v0.12 and earlier
- No breaking changes
- Existing files load normally
- Only affects resize behavior (loosens constraints)

---

## File Modifications

### app.js
- Lines 12-15: Removed max constraint constants
- Lines 3130-3131: Updated resize handler clamping logic
- Lines 3196-3197: Updated setCustomCanvasSize clamping logic

### README.md
- Version updated to 0.12.1
- File format version references updated

---

## Known Issues
None identified in this release.

---

## Development Notes

This fix addresses a user experience limitation where arbitrary maximum constraints prevented users from creating larger mockups. The constraints were removed based on user feedback during testing.

Key lesson: All limitations should be discussed with the user before implementation, not assumed as reasonable defaults.

---

## Version History
- v0.12.1: Canvas resize constraint fix (current)
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
