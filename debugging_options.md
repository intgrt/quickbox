# QuickBox Debugging Options

## Debug Mode Implementation

### Debug Flag
```javascript
const DEBUG = true; // Set to false for production
```

### Debug Helper Function
```javascript
function debugLog(category, message, data = null) {
  if (DEBUG) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${category}] ${message}`, data || '');
  }
}
```

## Key Areas to Log

### Drag & Drop Operations
```javascript
// Drag start
debugLog('DRAG', 'Started dragging box', {
  boxId: box.id,
  sourceRegion: region,
  startX: e.clientX,
  startY: e.clientY
});

// During drag
debugLog('DRAG', 'Box position updated', {
  boxId: box.id,
  x: box.x,
  y: box.y,
  currentRegion: detectedRegion
});

// On drop
debugLog('DRAG', 'Drag ended', {
  boxId: box.id,
  finalRegion: targetRegion,
  transferred: sourceRegion !== targetRegion
});
```

### Region Detection
```javascript
debugLog('REGION', 'Region boundaries calculated', {
  header: { top: 0, bottom: headerHeight },
  main: { top: headerHeight, bottom: mainBottom },
  footer: { top: footerTop, bottom: canvasHeight }
});

debugLog('REGION', 'Box entered region', {
  boxId: box.id,
  region: detectedRegion,
  boxY: box.y,
  boundaryTop: regionTop,
  boundaryBottom: regionBottom
});
```

### Box Transfer
```javascript
debugLog('TRANSFER', 'Box transfer initiated', {
  boxId: box.id,
  from: sourceRegion,
  to: targetRegion,
  oldY: oldY,
  newY: newY
});

debugLog('TRANSFER', 'Box transfer completed', {
  boxId: box.id,
  sourceArrayLength: sourceArray.length,
  targetArrayLength: targetArray.length
});
```

### Page 1 Restrictions
```javascript
debugLog('RESTRICTION', 'Page 1 check', {
  currentPage: state.currentPageId,
  isPage1: isPage1,
  boxRegion: region,
  actionAllowed: canEdit
});

debugLog('RESTRICTION', 'Action blocked - not on Page 1', {
  boxId: box.id,
  region: region,
  action: 'drag'
});
```

### Snap-back Operations
```javascript
debugLog('SNAPBACK', 'Box snapped back to original position', {
  boxId: box.id,
  reason: 'Not on Page 1',
  originalPosition: { x: startX, y: startY }
});
```

## Visual Debugging (Optional)

### Region Boundary Overlay
```javascript
function showRegionBoundaries() {
  if (!DEBUG) return;

  const boundaries = getRegionBoundaries();

  // Create visual overlay showing region boundaries
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 10000;
  `;

  // Draw lines at region boundaries
  // ... implementation
}
```

### Current Region Indicator
```javascript
function showCurrentRegion(regionName) {
  if (!DEBUG) return;

  const indicator = document.getElementById('debug-region-indicator') || createIndicator();
  indicator.textContent = `Current Region: ${regionName}`;
  indicator.style.display = 'block';
}
```

### Highlight Active Region
```css
.header-region.debug-active {
  border-color: #ff0000;
  border-width: 3px;
  background: rgba(255, 0, 0, 0.1);
}

.main-region.debug-active {
  border: 3px solid #00ff00;
  background: rgba(0, 255, 0, 0.1);
}

.footer-region.debug-active {
  border-color: #0000ff;
  border-width: 3px;
  background: rgba(0, 0, 255, 0.1);
}
```

## Usage Instructions

1. Set `DEBUG = true` at the top of app.js
2. Add `debugLog()` calls at key decision points
3. Open browser console (F12) while testing
4. Perform drag operations and observe console output
5. When satisfied, set `DEBUG = false` and remove/comment out debug calls

## Chrome DevTools Tips

- Use Console Filters to show only specific categories (e.g., filter by "[DRAG]")
- Use `console.table()` for structured data
- Set breakpoints in drag handlers for step-through debugging
- Use Performance tab to profile drag performance

## Note on Chrome MCP

The Chrome MCP server feature (https://developer.chrome.com/blog/new-in-devtools-143/) is for debugging Chrome DevTools extensions and MCP servers, not applicable to QuickBox application debugging.
