# QuickBox v0.6 - Build Documentation

**Version:** 0.6
**Build Date:** 2025-12-29
**Status:** Development Build

## What's New in v0.6

### Major Features

#### 1. File System Access API Integration
- **Enhanced Save Functionality**: Users can now select the folder and filename when saving files
- Uses modern File System Access API (`showSaveFilePicker`)
- Graceful fallback to traditional download for older browsers
- Location: `app.js:1808` - `@agent:FileOperations:authority`

#### 2. Resizable Header and Footer Regions
- **Draggable Region Dividers**: Click and drag the dashed border lines to resize header/footer heights
- Minimum height enforced: 60px for both regions
- Design mode only (disabled in Navigate mode)
- Heights persist when saving/loading files
- Independent resizing - header and footer resize separately
- Location: `app.js:977-1062` - `@agent:RegionManagement:extension`

### Bug Fixes

#### 1. Text Box Rendering Issue (Issue #2)
- **Problem**: Text boxes created correctly but didn't appear on canvas when loading existing files
- **Root Cause**: Box positioning calculation used `boxCounter` which could exceed canvas width (e.g., box 104 positioned at 2,130px on 1,200px canvas)
- **Solution**: Changed positioning to use `currentPage.boxes.length % 20` for visible coordinates
- Boxes now cascade within canvas bounds (50-620px range)
- Box ID numbering system preserved (1-99 for content, 100+ for footer)
- Location: `app.js:168-238` - `@agent:BoxManagement:authority`

#### 2. Canvas Height Calculation (Issue #3)
- **Problem**: Canvas not expanding properly with new content
- **Root Cause**: Only calculated height based on main region boxes, ignored header/footer
- **Solution**: Added comprehensive height calculation for all three regions (header, main, footer)
- Explicit height set on main-region for proper scrolling
- Location: `app.js:1216-1273` - `@agent:CanvasHeight:authority`

#### 3. Region Height Independence (Issue #5)
- **Problem**: Dragging header divider affected footer height and vice versa
- **Root Cause**: `updateCanvasHeight()` ignored `state.header.height` and `state.footer.height` values
- **Solution**: Changed to use maximum of state height and box-calculated minimums
- Header and footer now resize completely independently
- Smart behavior: regions auto-expand if boxes need more space
- Location: `app.js:1216-1273` - `@agent:CanvasHeight:authority`

### Technical Improvements

#### New State Properties
```javascript
state.header = { boxes: [], height: 80 }
state.footer = { boxes: [], height: 80 }
```

#### New Functions Added
- `ensureRegionsExist()` - Validates DOM regions exist before rendering - `@agent:BoxRendering:extension`
- `startRegionDividerDrag()` - Handles region resize dragging - `@agent:RegionManagement:extension`
- `setupRegionDividers()` - Creates draggable divider elements - `@agent:RegionManagement:extension`

#### New CSS Classes
```css
.region-divider - 10px tall drag handle positioned on borders
.header-divider - Positioned at bottom of header region
.footer-divider - Positioned at top of footer region
```
- Location: `styles.css:298-316` - `@agent:RegionLayout:extension`

### ANM Markers Added

**app.js** - 3 new markers:
- `@agent:BoxRendering:extension` - Region existence validation (line 240)
- `@agent:CanvasHeight:authority` - Canvas height calculation (line 1216)
- `@agent:PageRendering:authority` - Page rendering with region heights (line 1451)
- `@agent:RegionManagement:extension` - Region divider functionality (lines 977, 1022)

**styles.css** - 1 new marker:
- `@agent:RegionLayout:extension` - Region divider handle styles (line 298)

### Files Modified

- `app.js` - Added region resize functionality, fixed positioning and height calculations
- `styles.css` - Added region divider handle styles
- `QuickBox as built v0.6.md` - Created (this file)

### File Format Changes

**v0.6 File Format:**
```json
{
  "version": "0.6",
  "header": {
    "boxes": [...],
    "height": 80
  },
  "footer": {
    "boxes": [...],
    "height": 80
  },
  "pages": [...],
  "currentPageId": "page-1"
}
```

**New in v0.6**: `height` property added to header and footer objects

### Backward Compatibility

**Note**: v0.6 files include `height` properties in header/footer. Previous versions (v0.5 and earlier) will **not** load correctly as they expect different structure.

### Testing Notes

- File save/load tested with File System Access API
- Region resizing tested in Design mode
- Box positioning tested with large box IDs (100+)
- Canvas height calculation tested with content in all regions
- Independent header/footer resizing verified
- 60px minimum height enforcement verified

### Known Limitations

1. File System Access API not supported in older browsers (falls back to download)
2. Region dividers only functional in Design mode
3. No visual hover indicator on dividers (users must know functionality exists)

### User Interface

**New Interactions:**
- Click and drag dashed border lines to resize header/footer regions
- Save button now opens folder picker dialog (modern browsers)
- Cursor changes to `ns-resize` (↕) when hovering over divider handles

### Performance

- No performance impact from region dividers
- File System Access API is async, non-blocking
- Canvas height recalculation optimized to use stored state values

## Next Steps

Future enhancements may include:
- Visual indicators for draggable dividers
- Region resize in Navigate mode (if needed)
- Persistent region heights in browser localStorage
- Undo/redo for region resizing

## Technical Specification

- ANM Standard: v0.2 compliant
- Browser Requirements: ES2017+ for File System Access API
- File Format: JSON with version field

---

**Previous Version:** v0.5 - Agent Navigation Markers (ANM v0.3)
**Next Version:** TBD
