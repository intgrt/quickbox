// QuickBox - Wireframe Mockup Tool
// Version
const APP_VERSION = "0.11";

// @agent:AppConfig:authority
// Configurable Constants
// Button element defaults
const BUTTON_DEFAULT_WIDTH = 130;
const BUTTON_DEFAULT_HEIGHT = 30;
const BUTTON_BORDER_RADIUS = 8;

// @agent:StateManagement:authority
// State management
const state = {
  header: { boxes: [], height: 80 },
  footer: { boxes: [], height: 80 },
  pages: [],
  currentPageId: null,
  selectedBox: null,
  boxCounter: 0,
  pageCounter: 0,
  zIndexCounter: 1,
  currentMode: 'design', // 'design' or 'navigate'
  tempGroup: [], // Temporary group for dragging multiple boxes
  groupSelectMode: false // Flag for rectangle selection active
};

// @agent:UndoSystem:authority
// Undo/Redo System Configuration
const UNDO_HISTORY_SIZE = 10; // Change to 5 for fewer undo states - no code difference
const COALESCE_TIMEOUT_MS = 500; // Debounce timeout for continuous operations (ms)

// Undo history state
const undoHistory = {
  past: [],              // Array of previous state snapshots
  future: [],            // Array for redo functionality
  continuousOp: null,    // Flag: 'drag', 'resize', 'region-resize', or null
  coalesceTimer: null    // Timer for debouncing continuous operations
};

// @agent:UndoSystem:extension
// Capture current state as a JSON snapshot
function captureSnapshot() {
  return JSON.parse(JSON.stringify({
    header: state.header,
    footer: state.footer,
    pages: state.pages,
    currentPageId: state.currentPageId
  }));
}

// @agent:UndoSystem:extension
// Add snapshot to undo history (coalesces continuous operations)
function pushHistory(operationType = 'discrete') {
  // Skip snapshots during continuous operations (except on completion)
  if (undoHistory.continuousOp && operationType !== 'continuous-end') {
    return;
  }

  const snapshot = captureSnapshot();

  // Coalesce continuous operations with debounce
  if (operationType === 'continuous-end') {
    clearTimeout(undoHistory.coalesceTimer);
    undoHistory.coalesceTimer = setTimeout(() => {
      undoHistory.past.push(snapshot);
      if (undoHistory.past.length > UNDO_HISTORY_SIZE) {
        undoHistory.past.shift(); // Remove oldest
      }
      undoHistory.future = []; // Clear redo stack
      undoHistory.continuousOp = null;
    }, COALESCE_TIMEOUT_MS);
  } else {
    // Discrete operations - immediate push
    undoHistory.past.push(snapshot);
    if (undoHistory.past.length > UNDO_HISTORY_SIZE) {
      undoHistory.past.shift();
    }
    undoHistory.future = []; // Invalidate redo on new action
  }
}

// @agent:UndoSystem:extension
// Restore state from snapshot and re-render UI
function restoreSnapshot(snapshot) {
  // Restore serialized state
  state.header = snapshot.header;
  state.footer = snapshot.footer;
  state.pages = snapshot.pages;
  state.currentPageId = snapshot.currentPageId;

  // Recalculate counters from max IDs (same pattern as openFile)
  const allBoxes = state.pages.flatMap(p => p.boxes);
  const headerFooterBoxes = [...state.header.boxes, ...state.footer.boxes];
  const combinedBoxes = [...allBoxes, ...headerFooterBoxes];

  if (combinedBoxes.length > 0) {
    state.boxCounter = Math.max(...combinedBoxes.map(b => parseInt(b.id.split('-')[1])), 0);
    state.zIndexCounter = Math.max(...combinedBoxes.map(b => b.zIndex), 0) + 1;
  }

  if (state.pages.length > 0) {
    state.pageCounter = Math.max(...state.pages.map(p => parseInt(p.id.split('-')[1])), 0);
  }

  // Clear transient UI state
  state.selectedBox = null;
  clearTempGroup();
  closeMenuEditor(); // Close stale editor if open

  // Re-render everything
  renderCurrentPage();
  updateNavigator();
  updatePageIdentifier();
}

// @agent:UndoSystem:extension
// Perform undo - restore previous state
function performUndo() {
  if (undoHistory.past.length === 0) {
    console.log('Nothing to undo');
    return;
  }

  // Save current state to redo stack
  const currentSnapshot = captureSnapshot();
  undoHistory.future.push(currentSnapshot);

  // Restore previous state
  const previousSnapshot = undoHistory.past.pop();
  restoreSnapshot(previousSnapshot);

  console.log('Undo performed. Undo stack size:', undoHistory.past.length);
}

// @agent:UndoSystem:extension
// Perform redo - restore next state
function performRedo() {
  if (undoHistory.future.length === 0) {
    console.log('Nothing to redo');
    return;
  }

  // Save current state to undo stack
  const currentSnapshot = captureSnapshot();
  undoHistory.past.push(currentSnapshot);

  // Restore future state
  const futureSnapshot = undoHistory.future.pop();
  restoreSnapshot(futureSnapshot);

  console.log('Redo performed. Undo stack size:', undoHistory.past.length);
}

// @agent:StateManagement:entry
// Initialize with default page
function initializeState() {
  if (state.pages.length === 0) {
    state.pageCounter = 1;
    const defaultPage = {
      id: 'page-1',
      name: 'Page 1',
      canvasSize: 'desktop',
      boxes: []
    };
    state.pages.push(defaultPage);
    state.currentPageId = 'page-1';
  }
}

// Get current page
function getCurrentPage() {
  return state.pages.find(p => p.id === state.currentPageId);
}

// DOM Elements
const canvas = document.getElementById('canvas');
const elementsList = document.getElementById('elementsList');
const pagesList = document.getElementById('pagesList');
const imageInput = document.getElementById('imageInput');
const fileInput = document.getElementById('fileInput');
const menuEditorPanel = document.getElementById('menuEditorPanel');
const menuItemsList = document.getElementById('menuItemsList');
const addMenuItemBtn = document.getElementById('addMenuItemBtn');
const addChildMenuItemBtn = document.getElementById('addChildMenuItemBtn');
const saveMenuBtn = document.getElementById('saveMenuBtn');
const closeMenuEditorBtn = document.getElementById('closeMenuEditorBtn');

// @agent:AccordionManagement:authority
// Accordion editor elements
const accordionEditorPanel = document.getElementById('accordionEditorPanel');
const accordionItemsList = document.getElementById('accordionItemsList');
const addAccordionItemBtn = document.getElementById('addAccordionItemBtn');
const saveAccordionBtn = document.getElementById('saveAccordionBtn');
const closeAccordionEditorBtn = document.getElementById('closeAccordionEditorBtn');

// Toolbar buttons
const newBtn = document.getElementById('newBtn');
const openBtn = document.getElementById('openBtn');
const saveBtn = document.getElementById('saveBtn');
const addTextBtn = document.getElementById('addTextBtn');
const addImageBtn = document.getElementById('addImageBtn');
const addMenuBtn = document.getElementById('addMenuBtn');
const addButtonBtn = document.getElementById('addButtonBtn');
const addAccordionBtn = document.getElementById('addAccordionBtn');
const deleteBtn = document.getElementById('deleteBtn');
const fontSelect = document.getElementById('fontSelect');
const fontSizeSelect = document.getElementById('fontSizeSelect');
const desktopBtn = document.getElementById('desktopBtn');
const tabletBtn = document.getElementById('tabletBtn');
const mobileBtn = document.getElementById('mobileBtn');
const addPageBtn = document.getElementById('addPageBtn');
const designModeBtn = document.getElementById('designModeBtn');
const navigateModeBtn = document.getElementById('navigateModeBtn');

// Context menu
let contextMenu = null;

// Event Listeners
newBtn.addEventListener('click', newFile);
openBtn.addEventListener('click', () => fileInput.click());
saveBtn.addEventListener('click', saveFile);
addTextBtn.addEventListener('click', () => addBox('text'));
addImageBtn.addEventListener('click', () => addBox('image'));
addMenuBtn.addEventListener('click', () => addBox('menu'));
addButtonBtn.addEventListener('click', () => addBox('button'));
addAccordionBtn.addEventListener('click', () => addBox('accordion'));
deleteBtn.addEventListener('click', deleteSelectedBox);
fontSelect.addEventListener('change', updateFont);
fontSizeSelect.addEventListener('change', updateFontSize);
desktopBtn.addEventListener('click', () => setCanvasSize('desktop'));
tabletBtn.addEventListener('click', () => setCanvasSize('tablet'));
mobileBtn.addEventListener('click', () => setCanvasSize('mobile'));
addPageBtn.addEventListener('click', addPage);
designModeBtn.addEventListener('click', () => setMode('design'));
navigateModeBtn.addEventListener('click', () => setMode('navigate'));
fileInput.addEventListener('change', openFile);
imageInput.addEventListener('change', handleImageUpload);

// Menu Editor Event Listeners
addMenuItemBtn.addEventListener('click', addMenuItem);
addChildMenuItemBtn.addEventListener('click', addChildMenuItem);
saveMenuBtn.addEventListener('click', saveMenu);
closeMenuEditorBtn.addEventListener('click', closeMenuEditor);

// @agent:AccordionManagement:extension
// Accordion editor event listeners
addAccordionItemBtn.addEventListener('click', addAccordionItem);
saveAccordionBtn.addEventListener('click', saveAccordion);
closeAccordionEditorBtn.addEventListener('click', closeAccordionEditor);

// Create Group button
document.getElementById('createGroupBtn').addEventListener('click', () => {
  console.log('Create Group button clicked. Current groupSelectMode:', state.groupSelectMode);

  state.groupSelectMode = !state.groupSelectMode;

  console.log('groupSelectMode is now:', state.groupSelectMode);

  const btn = document.getElementById('createGroupBtn');
  if (state.groupSelectMode) {
    console.log('Entering group selection mode - cursor set to crosshair');
    btn.style.background = '#333';
    btn.style.color = '#fff';
    canvas.style.cursor = 'crosshair';
  } else {
    console.log('Exiting group selection mode');
    btn.style.background = '#fff';
    btn.style.color = '#000';
    canvas.style.cursor = 'default';
    clearTempGroup();
  }
});

// Canvas click to deselect
canvas.addEventListener('click', (e) => {
  const targetBox = e.target.closest('.box');
  const targetMenuContent = e.target.closest('.menu-content');
  const targetMenuItem = e.target.closest('.menu-item');

  // Enhanced logging to see element details
  let elementPath = e.target.tagName;
  if (e.target.className) elementPath += '.' + e.target.className.split(' ').join('.');
  if (e.target.id) elementPath += '#' + e.target.id;
  let parent = e.target.parentElement;
  let parentPath = parent ? (parent.tagName + (parent.className ? '.' + parent.className.split(' ').join('.') : '')) : 'none';

  console.log('[CANVAS-CLICK] Canvas click detected:', {
    target: elementPath,
    parent: parentPath,
    closestBox: targetBox?.id,
    closestMenuContent: !!targetMenuContent,
    closestMenuItem: !!targetMenuItem,
    currentMode: state.currentMode,
    targetTextContent: e.target.textContent?.substring(0, 20)
  });
  if (e.target === canvas || !e.target.closest('.box')) {
    if (!state.groupSelectMode) {
      selectBox(null);
    }
  }
});

// @agent:GroupSelection:authority
// Rectangle selection for group selection
canvas.addEventListener('mousedown', (e) => {
  if (!state.groupSelectMode) return;

  // Only start rectangle selection if clicking on empty canvas, not on a box
  if (e.target !== canvas && e.target.closest('.box')) {
    console.log('Clicked on a box, not starting rectangle selection');
    return;
  }

  console.log('Group selection started at:', e.clientX, e.clientY);

  const canvasRect = canvas.getBoundingClientRect();
  const startX = e.clientX - canvasRect.left;
  const startY = e.clientY - canvasRect.top;

  // Debug: Check canvas structure
  const headerRegion = document.getElementById('headerRegion');
  const mainRegion = document.getElementById('mainRegion');
  const footerRegion = document.getElementById('footerRegion');

  console.log('Canvas rect:', { left: canvasRect.left, top: canvasRect.top, width: canvasRect.width, height: canvasRect.height });
  console.log('Start position relative to canvas:', { startX, startY });
  console.log('Header height:', headerRegion ? headerRegion.offsetHeight : 'N/A');
  console.log('Main region offset:', mainRegion ? mainRegion.offsetTop : 'N/A');
  console.log('Selection starting inside:', {
    insideCanvas: startX >= 0 && startY >= 0,
    startX, startY
  });

  let selectionRect = document.getElementById('selectionRectangle');
  if (!selectionRect) {
    selectionRect = document.createElement('div');
    selectionRect.id = 'selectionRectangle';
    selectionRect.className = 'selection-rectangle';
    canvas.appendChild(selectionRect);
    console.log('Created selection rectangle element');
  }

  function onMouseMove(e) {
    const currentX = e.clientX - canvasRect.left;
    const currentY = e.clientY - canvasRect.top;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionRect.style.left = left + 'px';
    selectionRect.style.top = top + 'px';
    selectionRect.style.width = width + 'px';
    selectionRect.style.height = height + 'px';
    selectionRect.style.display = 'block';

    // Detailed logging during drag
    console.log('Selection rectangle updating:', {
      left, top, width, height,
      startX, startY,
      currentX, currentY,
      canvasRect: { left: canvasRect.left, top: canvasRect.top }
    });
  }

  function onMouseUp(e) {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    // Get the actual rendered position and size of the selection rectangle
    const rect = selectionRect.getBoundingClientRect();
    const left = parseInt(selectionRect.style.left) || 0;
    const top = parseInt(selectionRect.style.top) || 0;
    const right = left + parseInt(selectionRect.style.width) || 0;
    const bottom = top + parseInt(selectionRect.style.height) || 0;

    console.log('Group selection ended. Visual rect bounds:', {
      left, top, right, bottom,
      width: parseInt(selectionRect.style.width),
      height: parseInt(selectionRect.style.height),
      rendered: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
    });

    // Hide selection rectangle
    selectionRect.style.display = 'none';

    // Find all boxes within selection rectangle
    const selectedBoxes = [];
    const headerRegion = document.getElementById('headerRegion');
    const mainRegion = document.getElementById('mainRegion');
    const footerRegion = document.getElementById('footerRegion');

    const checkBoxes = (boxArray, region, regionElement) => {
      boxArray.forEach(box => {
        // Adjust box coordinates based on region offset
        // This accounts for header/footer size changes since offsetTop is dynamic
        const regionOffset = regionElement ? regionElement.offsetTop : 0;
        const adjustedBoxY = box.y + regionOffset;
        const adjustedBoxX = box.x; // X doesn't need adjustment, regions don't offset horizontally

        // Use <= and >= to include boxes that touch the edge of the selection
        const boxInBounds = adjustedBoxX <= right && adjustedBoxX + box.width >= left &&
            adjustedBoxY <= bottom && adjustedBoxY + box.height >= top;

        console.log(`Checking Box ${box.id} in ${region}. Original: x=${box.x}, y=${box.y}. Adjusted: x=${adjustedBoxX}, y=${adjustedBoxY}. In selection? ${boxInBounds} (selection: left=${left}, top=${top}, right=${right}, bottom=${bottom})`);

        if (boxInBounds) {
          selectedBoxes.push(box);
        }
      });
    };

    // Check header, main, and footer boxes
    checkBoxes(state.header.boxes, 'header', headerRegion);
    checkBoxes(state.footer.boxes, 'footer', footerRegion);
    const currentPage = getCurrentPage();
    if (currentPage) checkBoxes(currentPage.boxes, 'page', mainRegion);

    console.log(`Total boxes selected: ${selectedBoxes.length}`);

    // Update temp group
    state.tempGroup = selectedBoxes;

    // Apply visual indicators
    updateGroupVisualsOnCanvas();

    console.log('Group selection complete. Temp group size:', state.tempGroup.length);

    // Exit selection mode
    state.groupSelectMode = false;
    const btn = document.getElementById('createGroupBtn');
    btn.style.background = '#fff';
    btn.style.color = '#000';
    canvas.style.cursor = 'default';
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
});

// Prevent default context menu on boxes (only in Design mode)
canvas.addEventListener('contextmenu', (e) => {
  const box = e.target.closest('.box');
  if (box && state.currentMode === 'design') {
    e.preventDefault();
    showContextMenu(e, box.id);
  }
});

// @agent:App:entry
// Initialize
initializeState();
updateNavigator();
renderCurrentPage();
updatePageIdentifier();
updateModeUI();

// @agent:UndoSystem:extension
// Capture initial state after DOM is ready
setTimeout(() => {
  pushHistory();
}, 100);

// Update UI with version number
document.title = `QuickBox v${APP_VERSION} - Wireframe Mockup Tool`;
document.getElementById('appTitle').textContent = `QuickBox v${APP_VERSION}`;

// @agent:GroupSelection:extension
// @agent:UndoSystem:extension
// Cleanup handlers for temporary groups and undo/redo
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.tempGroup.length > 0) {
    clearTempGroup();
  }

  // Ctrl+Z or Cmd+Z (Mac) - UNDO
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    performUndo();
  }

  // Ctrl+Y or Ctrl+Shift+Z - REDO
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault();
    performRedo();
  }
});

// Clear temp group when clicking outside canvas (but not on UI elements)
document.addEventListener('click', (e) => {
  if (state.tempGroup.length > 0 && !canvas.contains(e.target)) {
    // Don't clear if clicking on toolbar, navigator, or menu editor
    const toolbar = document.getElementById('toolbar');
    const navigator = document.getElementById('navigatorPanel');
    const menuEditor = document.getElementById('menuEditorPanel');

    if ((toolbar && toolbar.contains(e.target)) ||
        (navigator && navigator.contains(e.target)) ||
        (menuEditor && menuEditor.contains(e.target))) {
      console.log('Click on UI element, not clearing temp group');
      return;
    }

    clearTempGroup();
  }
});

// @agent:ModeToggle:authority
// Mode Management
function setMode(mode) {
  const previousMode = state.currentMode;
  state.currentMode = mode;

  // DEBUG - can be removed later
  console.log(`Mode switched from ${previousMode} to ${mode}`);

  // Deselect any selected box when switching to Navigate mode
  if (mode === 'navigate' && state.selectedBox) {
    // DEBUG - can be removed later
    console.log('Box deselected due to mode switch to Navigate');
    selectBox(null);
  }

  updateModeUI();

  // Re-render current page to update contentEditable state
  renderCurrentPage();
}

function updateModeUI() {
  // Update button states
  if (state.currentMode === 'design') {
    designModeBtn.classList.add('active');
    navigateModeBtn.classList.remove('active');
    document.body.classList.remove('navigate-mode');
  } else {
    designModeBtn.classList.remove('active');
    navigateModeBtn.classList.add('active');
    document.body.classList.add('navigate-mode');
  }
}

// @agent:BoxManagement:authority
// @agent:UndoSystem:extension
// Add Box
function addBox(type) {
  const currentPage = getCurrentPage();
  if (!currentPage) return;

  pushHistory(); // Capture state before box creation

  state.boxCounter++;
  const boxId = `box-${state.boxCounter}`;
  let boxName = '';

  if (type === 'text') boxName = `Text ${state.boxCounter}`;
  else if (type === 'image') boxName = `Image ${state.boxCounter}`;
  else if (type === 'menu') boxName = `Menu ${state.boxCounter}`;
  else if (type === 'button') boxName = `Button ${state.boxCounter}`;
  else if (type === 'accordion') boxName = `Accordion ${state.boxCounter}`;

  // Calculate position based on number of boxes on current page (not boxCounter)
  // This keeps new boxes visible on the canvas
  const currentBoxCount = currentPage.boxes.length;
  const offsetMultiplier = currentBoxCount % 20; // Wrap around after 20 to stay within canvas
  const positionX = 50 + (offsetMultiplier * 30);
  const positionY = 50 + (offsetMultiplier * 30);

  const box = {
    id: boxId,
    name: boxName,
    type: type,
    x: positionX,
    y: positionY,
    width: type === 'menu' ? 400 : type === 'button' ? BUTTON_DEFAULT_WIDTH : type === 'accordion' ? 350 : 200,
    height: type === 'menu' ? 50 : type === 'button' ? BUTTON_DEFAULT_HEIGHT : type === 'accordion' ? 120 : type === 'text' ? 30 : 150,
    zIndex: state.zIndexCounter++,
    content: '',
    fontSize: '16',
    fontFamily: "'Architects Daughter', cursive",
    linkTo: null
  };

  // Menu-specific properties
  if (type === 'menu') {
    box.orientation = 'horizontal';
    box.menuItems = [
      {
        id: `menu-item-${Date.now()}-0`,
        text: 'Home',
        linkTo: null,
        children: []
      },
      {
        id: `menu-item-${Date.now()}-1`,
        text: 'About',
        linkTo: null,
        children: []
      },
      {
        id: `menu-item-${Date.now()}-2`,
        text: 'Contact',
        linkTo: null,
        children: []
      }
    ];
  }

  // Accordion-specific properties (multi-item array structure)
  if (type === 'accordion') {
    box.accordionItems = [
      {
        id: `accordion-item-${Date.now()}-0`,
        title: 'Question 1',
        body: 'Answer to question 1',
        isExpanded: false
      },
      {
        id: `accordion-item-${Date.now()}-1`,
        title: 'Question 2',
        body: 'Answer to question 2',
        isExpanded: false
      },
      {
        id: `accordion-item-${Date.now()}-2`,
        title: 'Question 3',
        body: 'Answer to question 3',
        isExpanded: false
      }
    ];
  }

  currentPage.boxes.push(box);

  // DEBUG - can be removed later
  console.log('Element added:', type, boxId, boxName);

  renderBox(box);
  updateNavigator();
  selectBox(box);
}

// @agent:BoxRendering:extension
// Ensure regions exist before rendering
function ensureRegionsExist() {
  if (!document.getElementById('headerRegion') ||
      !document.getElementById('mainRegion') ||
      !document.getElementById('footerRegion')) {
    renderCurrentPage();
  }
}

// @agent:BoxRendering:authority
// Render Box
function renderBox(box, region = 'main') {
  // Ensure regions exist before rendering
  ensureRegionsExist();

  const boxEl = document.createElement('div');
  boxEl.className = 'box';
  if (box.type === 'menu') boxEl.classList.add('menu-box');
  if (box.type === 'button') boxEl.classList.add('button-box');
  if (box.type === 'accordion') boxEl.classList.add('accordion-box');
  boxEl.id = box.id;
  boxEl.style.left = box.x + 'px';
  boxEl.style.top = box.y + 'px';
  boxEl.style.width = box.width + 'px';
  boxEl.style.height = box.height + 'px';
  boxEl.style.zIndex = box.zIndex;

  // Mark box with region for reference
  boxEl.dataset.region = region;

  // Add link indicator if box has a link
  if (box.linkTo) {
    boxEl.classList.add('has-link');
  }

  // Content
  const content = document.createElement('div');
  content.className = 'box-content';

  if (box.type === 'text') {
    content.contentEditable = state.currentMode === 'design' ? 'true' : 'false';
    content.textContent = box.content;
    content.style.fontSize = box.fontSize + 'px';
    content.style.fontFamily = box.fontFamily;

    // Capture state when text editing finishes (blur event)
    content.addEventListener('blur', () => {
      box.content = content.textContent;
      pushHistory();
    });
  } else if (box.type === 'button') {
    content.contentEditable = state.currentMode === 'design' ? 'true' : 'false';
    content.textContent = box.content;
    content.style.fontSize = box.fontSize + 'px';
    content.style.fontFamily = box.fontFamily;
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.justifyContent = 'center';

    // Capture state when button text editing finishes (blur event)
    content.addEventListener('blur', () => {
      box.content = content.textContent;
      pushHistory();
    });
  } else if (box.type === 'image') {
    content.contentEditable = false;
    if (box.content) {
      const img = document.createElement('img');
      img.src = box.content;
      content.appendChild(img);
    }

    // Change Image icon in Design mode
    if (state.currentMode === 'design') {
      const changeImageIcon = document.createElement('div');
      changeImageIcon.className = 'image-change-icon';
      changeImageIcon.textContent = '📷';
      changeImageIcon.title = 'Change Image';
      changeImageIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent box selection
        selectBox(box); // Ensure box is selected for upload handler
        imageInput.click(); // Trigger file dialog
      });
      boxEl.appendChild(changeImageIcon);
    }
  } else if (box.type === 'menu') {
    content.contentEditable = false;
    renderMenuContent(content, box);

    // Only show drag and edit icons in Design mode for menu boxes
    if (state.currentMode === 'design') {
      // Drag icon in top left
      const dragIcon = document.createElement('div');
      dragIcon.className = 'menu-drag-icon';
      // Reviewed encoding risk; keep Unicode symbol for aesthetics.
      dragIcon.textContent = '☰';
      dragIcon.title = 'Drag Menu';
      dragIcon.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        selectBox(box);
        startDrag(e, box);
      });
      boxEl.appendChild(dragIcon);

      // Edit icon in top right
      const editIcon = document.createElement('div');
      editIcon.className = 'menu-edit-icon';
      // Reviewed encoding risk; keep Unicode symbol for aesthetics.
      editIcon.textContent = '✏️';
      editIcon.title = 'Edit Menu';
      editIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent box selection
        openMenuEditor(box);
      });
      boxEl.appendChild(editIcon);
    }
  } else if (box.type === 'accordion') {
    content.contentEditable = false;
    renderAccordionContent(content, box);

    // Design mode: Add drag and edit icons (like menu boxes)
    if (state.currentMode === 'design') {
      // Drag icon in top left
      const dragIcon = document.createElement('div');
      dragIcon.className = 'accordion-drag-icon';
      dragIcon.textContent = '☰';
      dragIcon.title = 'Drag Accordion';
      dragIcon.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        selectBox(box);
        startDrag(e, box);
      });
      boxEl.appendChild(dragIcon);

      // Edit icon in top right
      const editIcon = document.createElement('div');
      editIcon.className = 'accordion-edit-icon';
      editIcon.textContent = '✏️';
      editIcon.title = 'Edit Accordion';
      editIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        openAccordionEditor(box);
      });
      boxEl.appendChild(editIcon);
    }
  }

  // Resize handles
  const handles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
  handles.forEach(dir => {
    const handle = document.createElement('div');
    handle.className = `resize-handle ${dir}`;
    handle.dataset.direction = dir;
    boxEl.appendChild(handle);
  });

  boxEl.appendChild(content);

  // Append to appropriate region
  const regionContainer = region === 'header' ? document.getElementById('headerRegion') :
                         region === 'footer' ? document.getElementById('footerRegion') :
                         document.getElementById('mainRegion');
  if (regionContainer) {
    regionContainer.appendChild(boxEl);
  } else {
    canvas.appendChild(boxEl); // Fallback for backward compatibility
  }

  // Header and footer are shared across all pages, so they can be edited from any page
  // Changes to header/footer automatically apply to all pages

  // Event listeners
  boxEl.addEventListener('mousedown', (e) => {
    // In Navigate mode, prevent selection and dragging
    if (state.currentMode === 'navigate') {
      return;
    }

    // Design mode behavior
    // For menu boxes, allow normal dragging and selection
    if (box.type === 'menu') {
      // Ignore clicks on menu items, edit icon, and handles
      const isMenuItemClick = e.target.closest('.menu-item') || e.target.closest('.menu-item-container');
      const isIconClick = e.target.closest('.menu-edit-icon');
      const isHandleClick = e.target.classList.contains('resize-handle');

      if (isMenuItemClick || isIconClick || isHandleClick) {
        return; // Let these elements handle their own events
      }

      // Normal dragging behavior for menu boxes in Design mode
      if (e.target.classList.contains('box')) {
        selectBox(box);
        startDrag(e, box);

        // DEBUG - can be removed later
        console.log('Box selected in design mode:', box.id, box.type);
      } else {
        selectBox(box);

        // DEBUG - can be removed later
        console.log('Box selected in design mode:', box.id, box.type);
      }
    } else {
      // Normal box behavior for non-menu boxes
      if (!e.target.classList.contains('resize-handle') && e.target.classList.contains('box')) {
        selectBox(box);
        startDrag(e, box);

        // DEBUG - can be removed later
        console.log('Box selected in design mode:', box.id, box.type);
      } else if (!e.target.classList.contains('resize-handle')) {
        selectBox(box);

        // DEBUG - can be removed later
        console.log('Box selected in design mode:', box.id, box.type);
      }
    }
  });

  // Click handler for links and buttons
  boxEl.addEventListener('click', (e) => {
    // In Navigate mode, handle button clicks and links
    if (state.currentMode === 'navigate') {
      if (box.type === 'button' || (box.linkTo && !e.target.classList.contains('resize-handle'))) {
        e.stopPropagation();

        if (box.linkTo) {
          // DEBUG - can be removed later
          console.log('Navigation triggered in navigate mode:', box.id, box.linkTo);
          handleLinkClick(box.linkTo);
        } else if (box.type === 'button') {
          // DEBUG - can be removed later
          console.log('Button clicked in navigate mode (no link):', box.id);
        }
      }
      return;
    }

    // @agent:CtrlClickMultiSelect:authority
    // Handle Ctrl+Click multi-select for group creation
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      console.log('[CTRL-CLICK] Ctrl+Click detected on box:', box.id);

      const isInGroup = state.tempGroup.some(b => b.id === box.id);
      console.log('[CTRL-CLICK] Box is currently in group:', isInGroup);

      if (isInGroup) {
        // Remove from group
        state.tempGroup = state.tempGroup.filter(b => b.id !== box.id);
        console.log('[CTRL-CLICK] Removed box from group. New group size:', state.tempGroup.length);
      } else {
        // Add to group
        state.tempGroup.push(box);
        console.log('[CTRL-CLICK] Added box to group. New group size:', state.tempGroup.length);
      }

      // Update visual indicators
      updateGroupVisualsOnCanvas();
      console.log('[CTRL-CLICK] Visual indicators updated');
      return;
    }

    // Single click without Ctrl - dispand group and select only this box
    if (state.tempGroup.length > 0) {
      console.log('[SINGLE-CLICK] Single click detected with active group. Clearing group and selecting box:', box.id);
      clearTempGroup();
    }

    // Design mode - old link behavior (kept for backward compatibility with non-button elements)
    if (box.linkTo && !e.target.classList.contains('resize-handle') && box.type !== 'button') {
      e.stopPropagation();
      handleLinkClick(box.linkTo);
    }
  });

  if (box.type === 'text' || box.type === 'button') {
    content.addEventListener('input', () => {
      box.content = content.textContent;
    });

    content.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    });
  }

  // Resize handles
  boxEl.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      // Only allow resizing in Design mode
      if (state.currentMode !== 'design') {
        return;
      }
      e.stopPropagation();
      startResize(e, box, handle.dataset.direction);
    });
  });

  updateCanvasHeight();
}

// @agent:MenuRendering:authority
// Render menu content
function renderMenuContent(content, box) {
  console.log('[RENDER-MENU-START] renderMenuContent called for box:', box.id, 'on page:', state.currentPageId);
  console.log('renderMenuContent DEBUG:', {
    boxId: box.id,
    currentPageId: state.currentPageId,
    menuItemsCount: box.menuItems.length,
    menuItems: box.menuItems.map(item => ({ text: item.text, linkTo: item.linkTo }))
  });

  content.innerHTML = '';
  content.className = 'box-content menu-content';
  content.style.display = 'flex';
  content.style.flexDirection = box.orientation === 'horizontal' ? 'row' : 'column';
  content.style.gap = '8px';
  content.style.alignItems = 'center';
  content.style.justifyContent = 'space-around';

  box.menuItems.forEach((item, itemIndex) => {
    console.log(`[renderMenuContent] Processing item #${itemIndex}: "${item.text}", hasLinkTo: ${!!item.linkTo}`);
    const menuItemContainer = document.createElement('div');
    menuItemContainer.className = 'menu-item-container';
    menuItemContainer.style.position = 'relative';
    menuItemContainer.style.zIndex = '5';

    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.textContent = item.text;
    
    if (item.linkTo) {
      menuItem.classList.add('menu-item-linked');
    }
    
    if (item.children.length > 0) {
      menuItem.classList.add('has-children');
      // Reviewed encoding risk; keep Unicode symbol for aesthetics.
      menuItem.textContent += ' ▼';
      
      // Create dropdown container
      const dropdown = document.createElement('div');
      dropdown.className = 'menu-dropdown';
      dropdown.style.position = 'absolute';
      dropdown.style.top = '100%';
      dropdown.style.left = '0';
      dropdown.style.background = '#fff';
      dropdown.style.border = '2px solid #333';
      dropdown.style.padding = '4px';
      dropdown.style.zIndex = '100';
      dropdown.style.display = 'none';
      dropdown.style.minWidth = '150px';
      
      // Add child items to dropdown
      item.children.forEach(child => {
        const childItem = document.createElement('div');
        childItem.className = 'menu-item child-menu-item';
        childItem.textContent = child.text;
        if (child.linkTo) {
          childItem.classList.add('menu-item-linked');
        }
        
        // Add click handler for child item navigation (only in Navigate mode)
        if (child.linkTo) {
          childItem.style.cursor = 'pointer';
          childItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.currentMode === 'navigate') {
              // DEBUG - can be removed later
              console.log('Menu item clicked in navigate mode:', child.text, child.linkTo);
              handleLinkClick(child.linkTo);
            }
          });
        } else {
          // Even non-linked child items should prevent box selection in Design mode
          childItem.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        }

        // Prevent box dragging on mousedown in Design mode
        childItem.addEventListener('mousedown', (e) => {
          if (state.currentMode === 'design') {
            e.stopPropagation();
          }
        });
        
        dropdown.appendChild(childItem);
      });
      
      menuItemContainer.appendChild(dropdown);
      
      // Show dropdown on hover
      menuItem.addEventListener('mouseenter', () => {
        dropdown.style.display = 'block';
      });
      
      menuItem.addEventListener('mouseleave', (e) => {
        // Use setTimeout to allow moving to dropdown
        setTimeout(() => {
          if (!dropdown.matches(':hover')) {
            dropdown.style.display = 'none';
          }
        }, 200);
      });
      
      dropdown.addEventListener('mouseleave', () => {
        dropdown.style.display = 'none';
      });
    }
    
    menuItemContainer.appendChild(menuItem);
    content.appendChild(menuItemContainer);

    // Log CSS properties for debugging
    const pointerEvents = window.getComputedStyle(menuItem).pointerEvents;
    const display = window.getComputedStyle(menuItem).display;
    const visibility = window.getComputedStyle(menuItem).visibility;
    console.log(`[MENU-ITEM-CSS] Item: "${item.text}", pointerEvents: ${pointerEvents}, display: ${display}, visibility: ${visibility}`);

    // Add mousedown and click handlers for navigation (only in Navigate mode)
    if (item.linkTo) {
      console.log(`[renderMenuContent] Attaching click listener to: "${item.text}"`);
      menuItem.style.cursor = 'pointer';

      // Mousedown handler
      menuItem.addEventListener('mousedown', (e) => {
        if (state.currentMode === 'design') {
          e.stopPropagation(); // Prevent box selection/dragging in Design mode
        }
      });

      // Click handler with logging
      const clickHandler = (e) => {
        console.log(`[menuItem.click] BEFORE stopPropagation - item: "${item.text}", target: ${e.target.className}`);
        e.stopPropagation();
        console.log(`[menuItem.click] Handler fired! item: "${item.text}", currentMode: ${state.currentMode}`);
        if (state.currentMode === 'navigate') {
          // DEBUG - can be removed later
          console.log('Menu item clicked in navigate mode:', item.text, item.linkTo);
          handleLinkClick(item.linkTo);
        }
      };
      console.log(`[LISTENER-ATTACH] About to attach click listener to menuItem: "${item.text}"`);
      menuItem.addEventListener('click', clickHandler);
      console.log(`[LISTENER-ATTACH] Click listener attached to menuItem: "${item.text}"`);
    } else {
      // For non-linked items, still prevent box selection in Design mode
      menuItem.addEventListener('mousedown', (e) => {
        if (state.currentMode === 'design') {
          e.stopPropagation(); // Prevent box selection/dragging
        }
      });
      menuItem.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Also add mousedown and click handlers to the container for better click area
    menuItemContainer.addEventListener('mousedown', (e) => {
      if (state.currentMode === 'design') {
        e.stopPropagation(); // Prevent box selection/dragging in Design mode
      }
    });

    menuItemContainer.addEventListener('click', (e) => {
      console.log('menuItemContainer clicked DEBUG:', {
        itemText: item.text,
        itemLinkTo: item.linkTo,
        currentMode: state.currentMode,
        currentPageId: state.currentPageId
      });
      if (item.linkTo) {
        e.stopPropagation();
        if (state.currentMode === 'navigate') {
          console.log('Calling handleLinkClick for:', item.text);
          handleLinkClick(item.linkTo);
        }
      } else {
        e.stopPropagation();
      }
    });
  });
  console.log(`[renderMenuContent] Finished rendering menu. Total items: ${box.menuItems.length}`);
}

// @agent:AccordionManagement:extension
// Render Accordion Content
function renderAccordionContent(content, box) {
  content.innerHTML = '';
  content.className = 'box-content accordion-content';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.gap = '0';

  if (!box.accordionItems || box.accordionItems.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.textContent = 'No accordion items. Click ✏️ to edit.';
    placeholder.style.padding = '20px';
    placeholder.style.textAlign = 'center';
    placeholder.style.color = '#999';
    content.appendChild(placeholder);
    return;
  }

  box.accordionItems.forEach((item, index) => {
    // Create item container
    const itemContainer = document.createElement('div');
    itemContainer.className = 'accordion-item-container';
    itemContainer.dataset.itemId = item.id;

    // Create header
    const header = document.createElement('div');
    header.className = 'accordion-header';

    // Indicator (LEFT side)
    const indicator = document.createElement('span');
    indicator.className = 'accordion-indicator';
    indicator.textContent = item.isExpanded ? '−' : '+';

    // Title
    const titleText = document.createElement('span');
    titleText.className = 'accordion-title-text';
    titleText.textContent = item.title;
    titleText.style.fontSize = box.fontSize + 'px';
    titleText.style.fontFamily = box.fontFamily;

    // Append: INDICATOR FIRST, then title
    header.appendChild(indicator);
    header.appendChild(titleText);

    // Create body
    const body = document.createElement('div');
    body.className = 'accordion-body';
    body.style.display = item.isExpanded ? 'block' : 'none';
    body.textContent = item.body;
    body.style.fontSize = box.fontSize + 'px';
    body.style.fontFamily = box.fontFamily;

    // Toggle logic (works in both design and navigate modes)
    header.addEventListener('click', (e) => {
      e.stopPropagation();

      // Toggle current item
      item.isExpanded = !item.isExpanded;
      indicator.textContent = item.isExpanded ? '−' : '+';
      body.style.display = item.isExpanded ? 'block' : 'none';

      pushHistory();
    });

    itemContainer.appendChild(header);
    itemContainer.appendChild(body);
    content.appendChild(itemContainer);
  });
}

// @agent:BoxSelection:authority
// Select Box
function selectBox(box) {
  state.selectedBox = box;

  // Update UI
  document.querySelectorAll('.box').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.element-item').forEach(el => el.classList.remove('selected'));

  if (box) {
    const boxEl = document.getElementById(box.id);
    boxEl.classList.add('selected');
    // NOTE: Removed auto-bring-to-front (was lines 824-825)
    // Users now have explicit "Bring to Front" / "Send to Back" controls via context menu
    // This prevents selection from disrupting intentional layer arrangements

    // Update font controls
    fontSelect.value = box.fontFamily;
    fontSizeSelect.value = box.fontSize;

    // Highlight in elements list
    const listItem = document.querySelector(`[data-box-id="${box.id}"]`);
    if (listItem) listItem.classList.add('selected');

    // Note: Menu editor is now opened via edit icon, not automatic selection
    closeMenuEditor();
  } else {
    closeMenuEditor();
  }
}

// @agent:GroupSelection:extension
// Helper functions for group selection
function updateGroupVisualsOnCanvas() {
  console.log('[GROUP-VISUAL] Updating group visuals for', state.tempGroup.length, 'boxes');
  console.log('[GROUP-VISUAL] Group members:', state.tempGroup.map(b => b.id).join(', '));

  // Remove all group indicators first
  document.querySelectorAll('.in-temp-group').forEach(el => el.classList.remove('in-temp-group'));

  // Add visual indicator to all boxes in temp group
  state.tempGroup.forEach(box => {
    const boxEl = document.getElementById(box.id);
    if (boxEl) {
      console.log('[GROUP-VISUAL] Adding visual indicator to box:', box.id);
      boxEl.classList.add('in-temp-group');
    } else {
      console.log('[GROUP-VISUAL] WARNING: Could not find element for box:', box.id);
    }
  });

  console.log('[GROUP-VISUAL] Group visuals updated. Total boxes highlighted:', state.tempGroup.length);
}

function clearTempGroup() {
  console.log('[CLEAR-GROUP] Clearing temp group. Was', state.tempGroup.length, 'boxes');
  console.log('[CLEAR-GROUP] Group members being cleared:', state.tempGroup.map(b => b.id).join(', '));

  state.tempGroup = [];
  state.groupSelectMode = false;
  document.querySelectorAll('.in-temp-group').forEach(el => el.classList.remove('in-temp-group'));

  const btn = document.getElementById('createGroupBtn');
  if (btn) {
    btn.style.background = '#fff';
    btn.style.color = '#000';
  }
  canvas.style.cursor = 'default';

  console.log('[CLEAR-GROUP] Temp group cleared. All visual indicators removed.');
}

// @agent:MenuEditor:authority
// Menu Editor Functions
let currentEditingMenu = null;

function openMenuEditor(box) {
  if (box.type !== 'menu') return;
  
  currentEditingMenu = box;
  menuEditorPanel.classList.remove('hidden');
  renderMenuEditor();
}

function closeMenuEditor() {
  menuEditorPanel.classList.add('hidden');
  currentEditingMenu = null;
}

function renderMenuEditor() {
  if (!currentEditingMenu) return;
  
  menuItemsList.innerHTML = '';
  renderMenuItems(currentEditingMenu.menuItems, menuItemsList, 0);
}

function renderMenuItems(items, container, depth = 0) {
  items.forEach((item, index) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'menu-item-editor' + (item.children.length > 0 ? ' has-children' : '');
    itemEl.dataset.itemId = item.id;
    itemEl.dataset.index = index;
    itemEl.dataset.depth = depth;
    
    const handle = document.createElement('span');
    handle.className = 'menu-item-handle';
    handle.textContent = '☰';
    handle.draggable = true;
    handle.addEventListener('dragstart', (e) => startMenuItemDrag(e, item.id));
    
    const input = document.createElement('input');
    input.className = 'menu-item-input';
    input.value = item.text;
    input.addEventListener('change', (e) => updateMenuItemText(item.id, e.target.value));
    
    const controls = document.createElement('div');
    controls.className = 'menu-item-controls';
    
    const addChildBtn = document.createElement('button');
    addChildBtn.textContent = 'Add Child';
    addChildBtn.addEventListener('click', () => addChildMenuItemTo(item.id));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteMenuItem(item.id));
    
    const linkBtn = document.createElement('button');
    linkBtn.textContent = item.linkTo ? 'Edit Link' : 'Add Link';
    linkBtn.addEventListener('click', () => showMenuItemLinkDialog(item));
    
    controls.appendChild(addChildBtn);
    controls.appendChild(deleteBtn);
    controls.appendChild(linkBtn);
    
    itemEl.appendChild(handle);
    itemEl.appendChild(input);
    itemEl.appendChild(controls);
    
    container.appendChild(itemEl);
    
    // Render child items
    if (item.children.length > 0) {
      const childContainer = document.createElement('div');
      childContainer.className = 'child-menu-items';
      renderMenuItems(item.children, childContainer, depth + 1);
      container.appendChild(childContainer);
    }
  });
}

function addMenuItem() {
  if (!currentEditingMenu) return;
  
  const newItem = {
    id: `menu-item-${Date.now()}-${currentEditingMenu.menuItems.length}`,
    text: 'New Item',
    linkTo: null,
    children: []
  };
  
  currentEditingMenu.menuItems.push(newItem);
  renderMenuEditor();
}

function addChildMenuItem() {
  // This will be handled by the "Add Child" button on specific items
  alert('Please select a specific menu item to add a child to.');
}

function addChildMenuItemTo(parentId) {
  if (!currentEditingMenu) return;
  
  const parentItem = findMenuItemById(currentEditingMenu.menuItems, parentId);
  if (!parentItem) return;
  
  const newChild = {
    id: `menu-item-${Date.now()}-child`,
    text: 'New Child',
    linkTo: null,
    children: []
  };
  
  parentItem.children.push(newChild);
  renderMenuEditor();
}

function findMenuItemById(items, itemId) {
  for (const item of items) {
    if (item.id === itemId) return item;
    const foundInChildren = findMenuItemById(item.children, itemId);
    if (foundInChildren) return foundInChildren;
  }
  return null;
}

function updateMenuItemText(itemId, newText) {
  if (!currentEditingMenu) return;
  
  const item = findMenuItemById(currentEditingMenu.menuItems, itemId);
  if (item) {
    item.text = newText;
  }
}

function deleteMenuItem(itemId) {
  if (!currentEditingMenu) return;
  
  if (!confirm('Delete this menu item?')) return;
  
  const result = removeMenuItemById(currentEditingMenu.menuItems, itemId);
  if (result) {
    currentEditingMenu.menuItems = result;
    renderMenuEditor();
  }
}

function removeMenuItemById(items, itemId) {
  return items.filter(item => {
    if (item.id === itemId) return false;
    if (item.children.length > 0) {
      item.children = removeMenuItemById(item.children, itemId);
    }
    return true;
  });
}

function showMenuItemLinkDialog(item) {
  if (!currentEditingMenu) return;
  
  const currentPage = getCurrentPage();
  if (!currentPage) return;
  
  const pageList = state.pages.map(p => `${p.name} (${p.id})`).join('\n');
  const targetPage = prompt(`Link to page:\n\n${pageList}\n\nEnter page ID or leave blank to remove link:`, 
    item.linkTo ? item.linkTo.target : '');
  
  if (targetPage === null) return;
  
  if (targetPage === '') {
    // DEBUG - can be removed later
    console.log('Menu item link removed:', item.id);
    item.linkTo = null;
  } else {
    const page = state.pages.find(p => p.id === targetPage);
    if (page) {
      item.linkTo = { type: 'page', target: targetPage };
      // DEBUG - can be removed later
      console.log('Menu item link created:', item.id, 'page', targetPage);
    } else {
      alert('Page not found');
    }
  }

  renderMenuEditor();
}

// @agent:UndoSystem:extension
function saveMenu() {
  if (!currentEditingMenu) return;

  pushHistory(); // Capture state before menu save

  // Update the menu box rendering
  const boxEl = document.getElementById(currentEditingMenu.id);
  if (boxEl) {
    const content = boxEl.querySelector('.box-content');
    renderMenuContent(content, currentEditingMenu);
  }

  alert('Menu saved successfully!');
}

// Drag and drop for menu items
function startMenuItemDrag(e, itemId) {
  e.dataTransfer.setData('text/plain', itemId);
  e.dataTransfer.effectAllowed = 'move';
}

// Add event listeners for drop
menuItemsList.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
});

menuItemsList.addEventListener('drop', (e) => {
  e.preventDefault();
  const itemId = e.dataTransfer.getData('text/plain');
  const targetEl = e.target.closest('.menu-item-editor');
  
  if (itemId && targetEl) {
    moveMenuItem(itemId, targetEl.dataset.itemId);
  }
});

function moveMenuItem(itemId, targetItemId) {
  if (!currentEditingMenu || itemId === targetItemId) return;
  
  // Find the items
  let itemToMove = null;
  let itemToMoveParent = null;
  let targetItem = null;
  let targetItemParent = null;
  
  // This is a simplified approach - in a real implementation, you'd need to handle
  // finding the parent containers and managing the hierarchy properly
  
  const findItemAndParent = (items, itemId) => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === itemId) {
        return { item: items[i], parent: items, index: i };
      }
      const foundInChildren = findItemAndParent(items[i].children, itemId);
      if (foundInChildren) return foundInChildren;
    }
    return null;
  };
  
  const source = findItemAndParent(currentEditingMenu.menuItems, itemId);
  const target = findItemAndParent(currentEditingMenu.menuItems, targetItemId);
  
  if (source && target) {
    // Remove from source
    source.parent.splice(source.index, 1);
    
    // Add to target (after the target item)
    target.parent.splice(target.index + 1, 0, source.item);
    
    renderMenuEditor();
  }
}

// @agent:AccordionManagement:extension
// Accordion Editor Functions
let currentAccordionBox = null;

function openAccordionEditor(box) {
  if (box.type !== 'accordion') return;

  currentAccordionBox = box;
  accordionEditorPanel.classList.remove('hidden');
  renderAccordionEditor();

  console.log('Accordion editor opened for:', box.id);
}

function closeAccordionEditor() {
  currentAccordionBox = null;
  accordionEditorPanel.classList.add('hidden');
  accordionItemsList.innerHTML = '';

  console.log('Accordion editor closed');
}

function renderAccordionEditor() {
  if (!currentAccordionBox) return;

  accordionItemsList.innerHTML = '';

  if (!currentAccordionBox.accordionItems) {
    currentAccordionBox.accordionItems = [];
  }

  currentAccordionBox.accordionItems.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'accordion-editor-item';
    itemDiv.dataset.itemId = item.id;

    // Title input
    const titleLabel = document.createElement('label');
    titleLabel.textContent = 'Question:';
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = item.title;
    titleInput.className = 'accordion-item-title-input';
    titleInput.addEventListener('input', (e) => {
      item.title = e.target.value;
    });

    // Body textarea
    const bodyLabel = document.createElement('label');
    bodyLabel.textContent = 'Answer:';
    const bodyTextarea = document.createElement('textarea');
    bodyTextarea.value = item.body;
    bodyTextarea.className = 'accordion-item-body-textarea';
    bodyTextarea.rows = 3;
    bodyTextarea.addEventListener('input', (e) => {
      item.body = e.target.value;
    });

    // Move up/down buttons
    const moveUpBtn = document.createElement('button');
    moveUpBtn.textContent = '↑';
    moveUpBtn.disabled = index === 0;
    moveUpBtn.addEventListener('click', () => moveAccordionItem(index, index - 1));

    const moveDownBtn = document.createElement('button');
    moveDownBtn.textContent = '↓';
    moveDownBtn.disabled = index === currentAccordionBox.accordionItems.length - 1;
    moveDownBtn.addEventListener('click', () => moveAccordionItem(index, index + 1));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteAccordionItem(index));

    const controls = document.createElement('div');
    controls.className = 'accordion-item-controls';
    controls.appendChild(moveUpBtn);
    controls.appendChild(moveDownBtn);
    controls.appendChild(deleteBtn);

    itemDiv.appendChild(titleLabel);
    itemDiv.appendChild(titleInput);
    itemDiv.appendChild(bodyLabel);
    itemDiv.appendChild(bodyTextarea);
    itemDiv.appendChild(controls);

    accordionItemsList.appendChild(itemDiv);
  });
}

function addAccordionItem() {
  if (!currentAccordionBox) return;

  const newItem = {
    id: `accordion-item-${Date.now()}-${currentAccordionBox.accordionItems.length}`,
    title: `Question ${currentAccordionBox.accordionItems.length + 1}`,
    body: `Answer to question ${currentAccordionBox.accordionItems.length + 1}`,
    isExpanded: false
  };

  currentAccordionBox.accordionItems.push(newItem);
  renderAccordionEditor();

  console.log('Accordion item added:', newItem.id);
}

function deleteAccordionItem(index) {
  if (!currentAccordionBox) return;

  const item = currentAccordionBox.accordionItems[index];
  currentAccordionBox.accordionItems.splice(index, 1);
  renderAccordionEditor();

  console.log('Accordion item deleted:', item.id);
}

function moveAccordionItem(fromIndex, toIndex) {
  if (!currentAccordionBox) return;

  const items = currentAccordionBox.accordionItems;
  const [movedItem] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, movedItem);
  renderAccordionEditor();

  console.log('Accordion item moved:', fromIndex, '->', toIndex);
}

function saveAccordion() {
  if (!currentAccordionBox) return;

  pushHistory(); // Capture state before accordion save

  // Re-render the accordion box
  const boxEl = document.getElementById(currentAccordionBox.id);
  if (boxEl) {
    const content = boxEl.querySelector('.box-content');
    if (content) {
      renderAccordionContent(content, currentAccordionBox);
    }
  }

  updateNavigator();
  closeAccordionEditor();

  console.log('Accordion saved:', currentAccordionBox.id);
}

// @agent:RegionManagement:authority
// Get region boundaries for drag detection
function getRegionBoundaries() {
  const headerRegion = document.getElementById('headerRegion');
  const mainRegion = document.getElementById('mainRegion');
  const footerRegion = document.getElementById('footerRegion');

  if (!headerRegion || !mainRegion || !footerRegion) {
    return null;
  }

  const headerRect = headerRegion.getBoundingClientRect();
  const mainRect = mainRegion.getBoundingClientRect();
  const footerRect = footerRegion.getBoundingClientRect();

  return {
    header: { top: headerRect.top, bottom: headerRect.bottom },
    main: { top: mainRect.top, bottom: mainRect.bottom },
    footer: { top: footerRect.top, bottom: footerRect.bottom }
  };
}

// Detect which region a point is in
function detectRegion(clientY) {
  const boundaries = getRegionBoundaries();
  if (!boundaries) return 'main';

  if (clientY < boundaries.main.top) {
    return 'header';
  } else if (clientY > boundaries.main.bottom) {
    return 'footer';
  } else {
    return 'main';
  }
}

// Find box in any region
function findBoxInRegions(boxId) {
  const currentPage = getCurrentPage();

  // Check header
  let box = state.header.boxes.find(b => b.id === boxId);
  if (box) return { box, region: 'header', array: state.header.boxes };

  // Check footer
  box = state.footer.boxes.find(b => b.id === boxId);
  if (box) return { box, region: 'footer', array: state.footer.boxes };

  // Check current page main region
  box = currentPage.boxes.find(b => b.id === boxId);
  if (box) return { box, region: 'main', array: currentPage.boxes };

  return null;
}

// Transfer box between regions
function transferBoxToRegion(box, sourceRegion, sourceArray, targetRegion) {
  // Remove from source array
  const index = sourceArray.indexOf(box);
  if (index > -1) {
    sourceArray.splice(index, 1);
  }

  // Adjust y-coordinate relative to new region
  const boxEl = document.getElementById(box.id);
  const targetContainer = targetRegion === 'header' ? document.getElementById('headerRegion') :
                          targetRegion === 'footer' ? document.getElementById('footerRegion') :
                          document.getElementById('mainRegion');

  if (targetContainer) {
    const targetRect = targetContainer.getBoundingClientRect();
    const boxRect = boxEl.getBoundingClientRect();
    box.y = boxRect.top - targetRect.top;
  }

  // Add to target array
  const currentPage = getCurrentPage();
  if (targetRegion === 'header') {
    state.header.boxes.push(box);
  } else if (targetRegion === 'footer') {
    state.footer.boxes.push(box);
  } else {
    currentPage.boxes.push(box);
  }
}

// @agent:RegionManagement:extension
// @agent:UndoSystem:extension
// Region divider drag functionality
function startRegionDividerDrag(e, regionType) {
  // Mark continuous operation start
  undoHistory.continuousOp = 'region-resize';

  // Only allow in design mode
  if (state.currentMode !== 'design') return;

  e.preventDefault();
  e.stopPropagation();

  const startY = e.clientY;
  const startHeight = regionType === 'header' ? state.header.height : state.footer.height;
  const minHeight = 60;

  function onMouseMove(e) {
    const deltaY = e.clientY - startY;
    let newHeight;

    if (regionType === 'header') {
      newHeight = Math.max(minHeight, startHeight + deltaY);
      state.header.height = newHeight;
      const headerRegion = document.getElementById('headerRegion');
      if (headerRegion) {
        headerRegion.style.height = newHeight + 'px';
      }
    } else if (regionType === 'footer') {
      newHeight = Math.max(minHeight, startHeight - deltaY);
      state.footer.height = newHeight;
      const footerRegion = document.getElementById('footerRegion');
      if (footerRegion) {
        footerRegion.style.height = newHeight + 'px';
      }
    }

    updateCanvasHeight();
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    // Mark continuous operation end
    pushHistory('continuous-end');
    undoHistory.continuousOp = null;
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// @agent:RegionManagement:extension
// Setup region divider event listeners
function setupRegionDividers() {
  // Only show dividers in design mode
  if (state.currentMode !== 'design') return;

  const headerRegion = document.getElementById('headerRegion');
  const footerRegion = document.getElementById('footerRegion');

  // Create and attach header divider
  if (headerRegion) {
    // Remove existing divider if present
    const existingHeaderDivider = document.getElementById('headerDivider');
    if (existingHeaderDivider) existingHeaderDivider.remove();

    const headerDivider = document.createElement('div');
    headerDivider.id = 'headerDivider';
    headerDivider.className = 'region-divider header-divider';
    headerRegion.appendChild(headerDivider);

    headerDivider.addEventListener('mousedown', (e) => {
      startRegionDividerDrag(e, 'header');
    });
  }

  // Create and attach footer divider
  if (footerRegion) {
    // Remove existing divider if present
    const existingFooterDivider = document.getElementById('footerDivider');
    if (existingFooterDivider) existingFooterDivider.remove();

    const footerDivider = document.createElement('div');
    footerDivider.id = 'footerDivider';
    footerDivider.className = 'region-divider footer-divider';
    footerRegion.appendChild(footerDivider);

    footerDivider.addEventListener('mousedown', (e) => {
      startRegionDividerDrag(e, 'footer');
    });
  }
}

// @agent:DragDrop:extension
// Drag functionality with group support
function startDrag(e, box) {
  e.preventDefault();

  console.log('[DRAG] Drag started on box:', box.id);
  console.log('[DRAG] Current tempGroup size:', state.tempGroup.length);
  console.log('[DRAG] Boxes in group:', state.tempGroup.map(b => b.id).join(', '));

  // Check if this box is in a group
  const isInGroup = state.tempGroup.some(b => b.id === box.id);
  console.log('[DRAG] Box is in group:', isInGroup);

  if (isInGroup && state.tempGroup.length > 1) {
    // Group drag mode
    console.log('[DRAG] Starting GROUP drag with', state.tempGroup.length, 'boxes');
    console.log('[DRAG] Group members:', state.tempGroup.map(b => b.id).join(', '));
    startGroupDrag(e, box);
  } else {
    // Single box drag mode
    console.log('[DRAG] Starting SINGLE drag');
    startSingleDrag(e, box);
  }
}

function startSingleDrag(e, box) {
  // Mark continuous operation start
  undoHistory.continuousOp = 'drag';

  // Find box and its current region
  const boxInfo = findBoxInRegions(box.id);
  if (!boxInfo) return;

  const sourceRegion = boxInfo.region;
  const sourceArray = boxInfo.array;

  const boxEl = document.getElementById(box.id);
  const startX = e.clientX;
  const startY = e.clientY;
  const startLeft = box.x;
  const startTop = box.y;
  let currentRegion = sourceRegion;
  let lastHighlightedRegion = null;

  function onMouseMove(e) {
    box.x = startLeft + (e.clientX - startX);
    box.y = startTop + (e.clientY - startY);
    boxEl.style.left = box.x + 'px';
    boxEl.style.top = box.y + 'px';

    // Detect current region based on box top-left corner
    const boxRect = boxEl.getBoundingClientRect();
    const detectedRegion = detectRegion(boxRect.top);

    // Visual feedback - highlight region
    if (detectedRegion !== lastHighlightedRegion) {
      // Remove previous highlight
      if (lastHighlightedRegion) {
        const prevRegionEl = document.getElementById(
          lastHighlightedRegion === 'header' ? 'headerRegion' :
          lastHighlightedRegion === 'footer' ? 'footerRegion' :
          'mainRegion'
        );
        if (prevRegionEl) prevRegionEl.classList.remove('drag-over');
      }

      // Add new highlight
      const regionEl = document.getElementById(
        detectedRegion === 'header' ? 'headerRegion' :
        detectedRegion === 'footer' ? 'footerRegion' :
        'mainRegion'
      );
      if (regionEl) regionEl.classList.add('drag-over');

      lastHighlightedRegion = detectedRegion;
    }

    currentRegion = detectedRegion;
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    // Remove all drag-over highlights
    ['headerRegion', 'mainRegion', 'footerRegion'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('drag-over');
    });

    // Check if we're trying to edit header/footer and not on Page 1
    const isPage1 = state.currentPageId === 'page-1';
    const movingToHeaderFooter = currentRegion === 'header' || currentRegion === 'footer';
    const sourceIsHeaderFooter = sourceRegion === 'header' || sourceRegion === 'footer';

    if (!isPage1 && (movingToHeaderFooter || sourceIsHeaderFooter)) {
      // Snap back to original position
      box.x = startLeft;
      box.y = startTop;
      boxEl.style.left = box.x + 'px';
      boxEl.style.top = box.y + 'px';
      alert('Header and footer can only be edited on Page 1');
      return;
    }

    // Transfer box if region changed
    if (currentRegion !== sourceRegion) {
      transferBoxToRegion(box, sourceRegion, sourceArray, currentRegion);
      renderCurrentPage();
      updateNavigator();
      selectBox(box);
    } else {
      updateCanvasHeight();
    }

    // Mark continuous operation end
    pushHistory('continuous-end');
    undoHistory.continuousOp = null;
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// @agent:DragDrop:extension
// @agent:UndoSystem:extension
// Group drag mode - drag all boxes in temp group together
function startGroupDrag(e, draggedBox) {
  // Mark continuous operation start
  undoHistory.continuousOp = 'drag';

  console.log('Group drag started with', state.tempGroup.length, 'boxes');

  let startX = e.clientX;
  let startY = e.clientY;

  console.log('Initial mouse position:', { startX, startY });

  // Store initial positions for all boxes in group
  const initialPositions = state.tempGroup.map(box => ({
    id: box.id,
    x: box.x,
    y: box.y,
    region: findBoxInRegions(box.id).region
  }));

  console.log('Initial positions stored:', initialPositions);

  function onMouseMove(e) {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (deltaX !== 0 || deltaY !== 0) {
      console.log('Moving group by delta:', { deltaX, deltaY });
    }

    // Move all boxes in group by same delta
    state.tempGroup.forEach(box => {
      box.x += deltaX;
      box.y += deltaY;
      const boxEl = document.getElementById(box.id);
      if (boxEl) {
        boxEl.style.left = box.x + 'px';
        boxEl.style.top = box.y + 'px';
      }
    });

    // Update start position for next movement
    startX = e.clientX;
    startY = e.clientY;
    initialPositions.forEach((pos, idx) => {
      pos.x = state.tempGroup[idx].x;
      pos.y = state.tempGroup[idx].y;
    });
  }

  function onMouseUp() {
    console.log('Group drag ended');

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    // Detect region of dragged box and transfer entire group if needed
    const draggedInfo = findBoxInRegions(draggedBox.id);
    if (draggedInfo) {
      const draggedBoxEl = document.getElementById(draggedBox.id);
      const draggedRect = draggedBoxEl.getBoundingClientRect();
      const detectedRegion = detectRegion(draggedRect.top);

      console.log('Detected region for dragged box:', detectedRegion);

      // Check if we're trying to edit header/footer and not on Page 1
      const isPage1 = state.currentPageId === 'page-1';
      const movingToHeaderFooter = detectedRegion === 'header' || detectedRegion === 'footer';

      if (!isPage1 && movingToHeaderFooter) {
        console.log('ERROR: Trying to move group to header/footer on non-Page-1. Snapping back.');

        // Snap back all boxes to original position
        state.tempGroup.forEach((box, idx) => {
          box.x = initialPositions[idx].x;
          box.y = initialPositions[idx].y;
          const boxEl = document.getElementById(box.id);
          if (boxEl) {
            boxEl.style.left = box.x + 'px';
            boxEl.style.top = box.y + 'px';
          }
        });
        alert('Header and footer can only be edited on Page 1');
        return;
      }

      // Transfer all boxes in group if region changed
      let anyTransferred = false;
      state.tempGroup.forEach((box, idx) => {
        const boxInfo = findBoxInRegions(box.id);
        if (boxInfo && boxInfo.region !== detectedRegion) {
          console.log('Transferring box', box.id, 'from', boxInfo.region, 'to', detectedRegion);
          transferBoxToRegion(box, boxInfo.region, boxInfo.array, detectedRegion);
          anyTransferred = true;
        }
      });

      if (anyTransferred) {
        console.log('Boxes transferred, re-rendering');
        renderCurrentPage();
        updateNavigator();
      }

      updateCanvasHeight();
    }

    // Mark continuous operation end
    pushHistory('continuous-end');
    undoHistory.continuousOp = null;

    // Clear temp group after drag
    clearTempGroup();
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// @agent:BoxResize:authority
// @agent:UndoSystem:extension
// Resize functionality
function startResize(e, box, direction) {
  // Mark continuous operation start
  undoHistory.continuousOp = 'resize';

  e.preventDefault();
  const boxEl = document.getElementById(box.id);
  boxEl.classList.add('resizing');

  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = box.width;
  const startHeight = box.height;
  const startLeft = box.x;
  const startTop = box.y;

  function onMouseMove(e) {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (direction.includes('e')) {
      box.width = Math.max(30, startWidth + deltaX);
    }
    if (direction.includes('w')) {
      const newWidth = Math.max(30, startWidth - deltaX);
      if (newWidth > 30) {
        box.width = newWidth;
        box.x = startLeft + deltaX;
      }
    }
    if (direction.includes('s')) {
      box.height = Math.max(30, startHeight + deltaY);
    }
    if (direction.includes('n')) {
      const newHeight = Math.max(30, startHeight - deltaY);
      if (newHeight > 30) {
        box.height = newHeight;
        box.y = startTop + deltaY;
      }
    }

    boxEl.style.width = box.width + 'px';
    boxEl.style.height = box.height + 'px';
    boxEl.style.left = box.x + 'px';
    boxEl.style.top = box.y + 'px';
  }

  function onMouseUp() {
    boxEl.classList.remove('resizing');
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    updateCanvasHeight();

    // Mark continuous operation end
    pushHistory('continuous-end');
    undoHistory.continuousOp = null;
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// @agent:CanvasHeight:authority
// Update Canvas Height
function updateCanvasHeight() {
  const currentPage = getCurrentPage();

  // Use state heights for header/footer, calculate boxes position for minimum
  let headerBoxBottom = 60; // Default min based on box positions
  let mainMaxBottom = 400;  // Default min height for main
  let footerBoxBottom = 60; // Default min based on box positions

  // Check header boxes to see if they exceed the region height
  if (state.header.boxes.length > 0) {
    state.header.boxes.forEach(box => {
      const bottom = box.y + box.height;
      if (bottom > headerBoxBottom) {
        headerBoxBottom = bottom;
      }
    });
  }

  // Check main page boxes
  if (currentPage && currentPage.boxes.length > 0) {
    currentPage.boxes.forEach(box => {
      const bottom = box.y + box.height;
      if (bottom > mainMaxBottom) {
        mainMaxBottom = bottom;
      }
    });
  }

  // Check footer boxes to see if they exceed the region height
  if (state.footer.boxes.length > 0) {
    state.footer.boxes.forEach(box => {
      const bottom = box.y + box.height;
      if (bottom > footerBoxBottom) {
        footerBoxBottom = bottom;
      }
    });
  }

  // Use the maximum of state height and box-calculated height for header/footer
  const headerHeight = Math.max(state.header.height || 80, headerBoxBottom);
  const footerHeight = Math.max(state.footer.height || 80, footerBoxBottom);

  // Calculate total height needed
  const padding = 50;
  const totalHeight = headerHeight + mainMaxBottom + footerHeight + padding;
  const minHeight = 600;
  const newHeight = Math.max(minHeight, totalHeight);

  canvas.style.height = newHeight + 'px';

  // Update the main region height to ensure it can contain all boxes
  const mainRegion = document.getElementById('mainRegion');
  if (mainRegion) {
    mainRegion.style.height = (mainMaxBottom + padding) + 'px';
  }
}

// @agent:Navigator:authority
// Update Navigator (Pages and Elements)
function updateNavigator() {
  updatePagesList();
  updateElementsList();
}

// Update Pages List
function updatePagesList() {
  pagesList.innerHTML = '';
  state.pages.forEach(page => {
    const item = document.createElement('div');
    item.className = 'page-item';
    item.textContent = `${page.name} (${page.id})`;
    item.dataset.pageId = page.id;
    item.title = 'Right-click to rename';

    if (page.id === state.currentPageId) {
      item.classList.add('active');
    }

    item.addEventListener('click', () => {
      switchToPage(page.id);
    });

    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      editPageName(page);
    });

    pagesList.appendChild(item);
  });
}

// Edit page name
function editPageName(page) {
  const currentName = page.name;

  const newName = prompt(`Edit page name:`, currentName);
  if (newName === null || newName.trim() === '') return;

  page.name = newName.trim();
  updatePagesList();
  updatePageIdentifier();
}

// Update Elements List
function updateElementsList() {
  const currentPage = getCurrentPage();
  elementsList.innerHTML = '';

  if (!currentPage) return;

  const isPage1 = state.currentPageId === 'page-1';

  // Add header elements
  if (state.header.boxes.length > 0) {
    const headerLabel = document.createElement('div');
    headerLabel.className = 'element-section-label';
    headerLabel.textContent = '--- Header ---';
    elementsList.appendChild(headerLabel);

    state.header.boxes.forEach(box => {
      const item = document.createElement('div');
      item.className = 'element-item' + (!isPage1 ? ' read-only' : '');
      item.textContent = `${box.name} (${box.id})`;
      item.dataset.boxId = box.id;
      item.title = isPage1 ? 'Right-click to rename' : 'Header (editable on Page 1 only)';

      if (state.selectedBox && state.selectedBox.id === box.id) {
        item.classList.add('selected');
      }

      if (isPage1) {
        item.addEventListener('click', () => {
          const boxToSelect = state.header.boxes.find(b => b.id === box.id);
          selectBox(boxToSelect);
        });

        item.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          editElementName(box);
        });
      }

      elementsList.appendChild(item);
    });
  }

  // Add main page elements
  if (currentPage.boxes.length > 0) {
    const mainLabel = document.createElement('div');
    mainLabel.className = 'element-section-label';
    mainLabel.textContent = '--- Page Content ---';
    elementsList.appendChild(mainLabel);
  }

  currentPage.boxes.forEach(box => {
    const item = document.createElement('div');
    item.className = 'element-item';
    item.textContent = `${box.name} (${box.id})`;
    item.dataset.boxId = box.id;
    item.title = 'Right-click to rename';

    if (state.selectedBox && state.selectedBox.id === box.id) {
      item.classList.add('selected');
    }

    item.addEventListener('click', () => {
      const boxToSelect = currentPage.boxes.find(b => b.id === box.id);
      selectBox(boxToSelect);
    });

    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      editElementName(box);
    });

    elementsList.appendChild(item);
  });

  // Add footer elements
  if (state.footer.boxes.length > 0) {
    const footerLabel = document.createElement('div');
    footerLabel.className = 'element-section-label';
    footerLabel.textContent = '--- Footer ---';
    elementsList.appendChild(footerLabel);

    state.footer.boxes.forEach(box => {
      const item = document.createElement('div');
      item.className = 'element-item' + (!isPage1 ? ' read-only' : '');
      item.textContent = `${box.name} (${box.id})`;
      item.dataset.boxId = box.id;
      item.title = isPage1 ? 'Right-click to rename' : 'Footer (editable on Page 1 only)';

      if (state.selectedBox && state.selectedBox.id === box.id) {
        item.classList.add('selected');
      }

      if (isPage1) {
        item.addEventListener('click', () => {
          const boxToSelect = state.footer.boxes.find(b => b.id === box.id);
          selectBox(boxToSelect);
        });

        item.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          editElementName(box);
        });
      }

      elementsList.appendChild(item);
    });
  }
}

// Update Page Identifier
function updatePageIdentifier() {
  const currentPage = getCurrentPage();
  const pageIdentifier = document.getElementById('pageIdentifier');

  if (currentPage && pageIdentifier) {
    // Reviewed encoding risk; keep Unicode symbol for aesthetics.
    pageIdentifier.textContent = `${currentPage.name} • ${currentPage.id}`;
  }
}

// Edit element name
function editElementName(box) {
  const currentName = box.name;
  let prefix = '';

  if (box.type === 'text') prefix = 'Text ';
  else if (box.type === 'image') prefix = 'Image ';
  else if (box.type === 'menu') prefix = 'Menu ';
  else if (box.type === 'button') prefix = 'Button ';
  else if (box.type === 'accordion') prefix = 'Accordion ';

  const suffix = currentName.startsWith(prefix) ? currentName.substring(prefix.length) : currentName;

  const newSuffix = prompt(`Edit element name:\n\n${prefix}`, suffix);
  if (newSuffix === null || newSuffix.trim() === '') return;

  box.name = prefix + newSuffix.trim();
  updateElementsList();
}

// @agent:BoxManagement:extension
// @agent:UndoSystem:extension
// Delete Selected Box
function deleteSelectedBox() {
  if (!state.selectedBox) return;

  const currentPage = getCurrentPage();
  if (!currentPage) return;

  pushHistory(); // Capture state before deletion

  const boxEl = document.getElementById(state.selectedBox.id);
  if (boxEl) {
    const region = boxEl.dataset.region;

    // Check if deleting from header/footer and not on Page 1
    if ((region === 'header' || region === 'footer') && state.currentPageId !== 'page-1') {
      alert('Header and footer boxes can only be deleted on Page 1');
      return;
    }

    boxEl.remove();
  }

  // Remove from appropriate array
  const removedFromPage = currentPage.boxes.filter(b => b.id !== state.selectedBox.id);
  const removedFromHeader = state.header.boxes.filter(b => b.id !== state.selectedBox.id);
  const removedFromFooter = state.footer.boxes.filter(b => b.id !== state.selectedBox.id);

  let deletedRegion = '';
  if (removedFromPage.length < currentPage.boxes.length) {
    currentPage.boxes = removedFromPage;
    deletedRegion = 'main';
  } else if (removedFromHeader.length < state.header.boxes.length) {
    state.header.boxes = removedFromHeader;
    deletedRegion = 'header';
  } else if (removedFromFooter.length < state.footer.boxes.length) {
    state.footer.boxes = removedFromFooter;
    deletedRegion = 'footer';
  }

  // DEBUG - can be removed later
  console.log('Element deleted:', state.selectedBox.type, state.selectedBox.id, state.selectedBox.name, deletedRegion);

  state.selectedBox = null;
  updateNavigator();
  updateCanvasHeight();
}

// @agent:BoxDuplication:authority
function duplicateBox(sourceBox) {
  console.log('[DUPLICATE-BOX] Duplicating box:', sourceBox.id, sourceBox.name);

  pushHistory(); // Capture state before duplication

  // Find source region
  const boxInfo = findBoxInRegions(sourceBox.id);
  if (!boxInfo) {
    console.log('[DUPLICATE-BOX] ERROR: Could not find box in regions:', sourceBox.id);
    return;
  }

  console.log('[DUPLICATE-BOX] Found box in region:', boxInfo.region);

  // Check region edit restrictions (header/footer on non-Page-1)
  const isPage1 = state.currentPageId === 'page-1';
  const isHeaderFooter = boxInfo.region === 'header' || boxInfo.region === 'footer';
  if (!isPage1 && isHeaderFooter) {
    console.log('[DUPLICATE-BOX] ERROR: Cannot duplicate header/footer outside Page 1');
    alert('Header and footer boxes can only be duplicated on Page 1');
    return;
  }

  // Increment counter and create new ID
  state.boxCounter++;
  const newBoxId = `box-${state.boxCounter}`;

  // Deep clone box
  const newBox = JSON.parse(JSON.stringify(sourceBox));

  // Update properties
  newBox.id = newBoxId;
  newBox.name = sourceBox.name + ' Copy';
  newBox.x = sourceBox.x + 20;
  newBox.y = sourceBox.y + 20;
  newBox.zIndex = state.zIndexCounter++;
  newBox.linkTo = null; // Clear link

  console.log('[DUPLICATE-BOX] New box created:', newBoxId, 'at position', { x: newBox.x, y: newBox.y });

  // Handle menu boxes - regenerate menu item IDs
  if (newBox.type === 'menu' && newBox.menuItems) {
    console.log('[DUPLICATE-BOX] Regenerating menu item IDs for duplicated menu box');
    newBox.menuItems = regenerateMenuItemIds(newBox.menuItems);
  }

  // Add to appropriate region array
  boxInfo.array.push(newBox);
  console.log('[DUPLICATE-BOX] Added to', boxInfo.region, 'region. Total boxes in region:', boxInfo.array.length);

  // Render, update navigator, select
  renderBox(newBox, boxInfo.region);
  updateNavigator();
  selectBox(newBox);
  updateCanvasHeight();

  console.log('[DUPLICATE-BOX] Box duplicated successfully:', newBoxId, newBox.name);
}

// @agent:MenuManagement:authority
// Regenerate Menu Item IDs (for duplicated menu boxes)
function regenerateMenuItemIds(menuItems) {
  return menuItems.map(item => {
    const newItem = { ...item };
    newItem.id = `menu-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (newItem.children && newItem.children.length > 0) {
      newItem.children = regenerateMenuItemIds(newItem.children);
    }
    return newItem;
  });
}

// @agent:BoxManagement:extension
// @agent:UndoSystem:extension
// Bring Box to Front
function bringToFront(box) {
  console.log('Bringing box to front:', box.id, box.name);

  pushHistory(); // Capture state before z-index change

  // Assign highest z-index
  box.zIndex = state.zIndexCounter++;

  // Update DOM
  const boxEl = document.getElementById(box.id);
  if (boxEl) {
    boxEl.style.zIndex = box.zIndex;
  }

  console.log('Box now at z-index:', box.zIndex);
}

// @agent:BoxManagement:extension
// @agent:UndoSystem:extension
// Send Box to Back
function sendToBack(box) {
  console.log('Sending box to back:', box.id, box.name);

  pushHistory(); // Capture state before z-index change

  // Set to z-index 0 (below all normal boxes which start at 1)
  box.zIndex = 0;

  // Update DOM
  const boxEl = document.getElementById(box.id);
  if (boxEl) {
    boxEl.style.zIndex = box.zIndex;
  }

  console.log('Box now at z-index:', box.zIndex);
}

// @agent:PageManagement:authority
// @agent:UndoSystem:extension
// Page Management
function addPage() {
  pushHistory(); // Capture state before page creation

  state.pageCounter++;
  const newPage = {
    id: `page-${state.pageCounter}`,
    name: `Page ${state.pageCounter}`,
    canvasSize: 'desktop',
    boxes: []
  };
  state.pages.push(newPage);

  // DEBUG - can be removed later
  console.log('Page added:', newPage.id, newPage.name);

  updatePagesList();
}

function switchToPage(pageId) {
  if (state.currentPageId === pageId) return;

  const fromPageId = state.currentPageId;
  state.currentPageId = pageId;
  state.selectedBox = null;

  // Clear temp group when switching pages
  clearTempGroup();

  // DEBUG - can be removed later
  console.log('Page switched:', fromPageId, 'to', pageId);

  renderCurrentPage();
  updateNavigator();
  updatePageIdentifier();
}

// @agent:PageRendering:authority
function renderCurrentPage() {
  const currentPage = getCurrentPage();
  if (!currentPage) return;

  // DEBUG: Log header menu box data before render
  const headerMenuBox = state.header.boxes.find(b => b.type === 'menu');
  console.log('renderCurrentPage DEBUG:', {
    currentPageId: state.currentPageId,
    headerMenuBoxId: headerMenuBox?.id,
    headerMenuBoxMenuItems: headerMenuBox?.menuItems?.map(item => ({ text: item.text, linkTo: item.linkTo }))
  });

  // Clear canvas
  canvas.innerHTML = '';

  // Re-add page identifier
  const pageIdentifier = document.createElement('div');
  pageIdentifier.id = 'pageIdentifier';
  pageIdentifier.className = 'page-identifier';
  canvas.appendChild(pageIdentifier);

  // Create header region
  const headerRegion = document.createElement('div');
  headerRegion.id = 'headerRegion';
  headerRegion.className = 'header-region';
  headerRegion.style.height = state.header.height + 'px';
  canvas.appendChild(headerRegion);

  // Create main content region
  const mainRegion = document.createElement('div');
  mainRegion.id = 'mainRegion';
  mainRegion.className = 'main-region';
  canvas.appendChild(mainRegion);

  // Create footer region
  const footerRegion = document.createElement('div');
  footerRegion.id = 'footerRegion';
  footerRegion.className = 'footer-region';
  footerRegion.style.height = state.footer.height + 'px';
  canvas.appendChild(footerRegion);

  // Set canvas size
  setCanvasSize(currentPage.canvasSize);

  // Render header boxes
  state.header.boxes.forEach(box => renderBox(box, 'header'));

  // Render page boxes in main region
  currentPage.boxes.forEach(box => renderBox(box, 'main'));

  // Render footer boxes
  state.footer.boxes.forEach(box => renderBox(box, 'footer'));

  // Setup region divider drag listeners
  setupRegionDividers();

  updateCanvasHeight();
}

// @agent:ContextMenu:authority
// Context Menu
function showContextMenu(e, boxId) {
  const currentPage = getCurrentPage();
  if (!currentPage) return;

  // Find box in any region
  const boxInfo = findBoxInRegions(boxId);
  if (!boxInfo) return;
  const box = boxInfo.box;

  // Remove existing context menu
  if (contextMenu) {
    contextMenu.remove();
  }

  // Create context menu
  contextMenu = document.createElement('div');
  contextMenu.className = 'context-menu';
  contextMenu.style.left = e.clientX + 'px';
  contextMenu.style.top = e.clientY + 'px';

  // Edit Menu option (for menu boxes only)
  if (box.type === 'menu') {
    const editMenuOption = document.createElement('div');
    editMenuOption.className = 'context-menu-item';
    editMenuOption.textContent = 'Edit Menu';
    editMenuOption.addEventListener('click', () => {
      openMenuEditor(box);
      contextMenu.remove();
    });
    contextMenu.appendChild(editMenuOption);
  }

  // @agent:GroupDuplicate:extension
  const duplicateOption = document.createElement('div');
  duplicateOption.className = 'context-menu-item';
  duplicateOption.textContent = 'Duplicate';
  duplicateOption.addEventListener('click', () => {
    if (state.tempGroup.length > 1) {
      // Duplicate all boxes in group
      console.log('[DUPLICATE-GROUP] Duplicating group with', state.tempGroup.length, 'boxes');
      console.log('[DUPLICATE-GROUP] Group members:', state.tempGroup.map(b => b.id).join(', '));

      state.tempGroup.forEach((groupBox, index) => {
        console.log('[DUPLICATE-GROUP] Duplicating box', index + 1, 'of', state.tempGroup.length, ':', groupBox.id);
        duplicateBox(groupBox);
      });

      console.log('[DUPLICATE-GROUP] Group duplication complete');
    } else {
      // Duplicate single box
      console.log('[DUPLICATE-SINGLE] Duplicating single box:', box.id);
      duplicateBox(box);
    }
    contextMenu.remove();
  });
  contextMenu.appendChild(duplicateOption);

  const bringToFrontOption = document.createElement('div');
  bringToFrontOption.className = 'context-menu-item';
  bringToFrontOption.textContent = 'Bring to Front';
  bringToFrontOption.addEventListener('click', () => {
    bringToFront(box);
    contextMenu.remove();
  });
  contextMenu.appendChild(bringToFrontOption);

  const sendToBackOption = document.createElement('div');
  sendToBackOption.className = 'context-menu-item';
  sendToBackOption.textContent = 'Send to Back';
  sendToBackOption.addEventListener('click', () => {
    sendToBack(box);
    contextMenu.remove();
  });
  contextMenu.appendChild(sendToBackOption);

  // Link to Page option
  const linkToPageOption = document.createElement('div');
  linkToPageOption.className = 'context-menu-item';
  linkToPageOption.textContent = 'Link to Page';
  linkToPageOption.addEventListener('click', () => {
    showPageLinkDialog(box);
    contextMenu.remove();
  });
  contextMenu.appendChild(linkToPageOption);

  // Link to Anchor option
  const linkToAnchorOption = document.createElement('div');
  linkToAnchorOption.className = 'context-menu-item';
  linkToAnchorOption.textContent = 'Link to Anchor';
  linkToAnchorOption.addEventListener('click', () => {
    showAnchorLinkDialog(box);
    contextMenu.remove();
  });
  contextMenu.appendChild(linkToAnchorOption);

  // Remove Link option (if box has a link)
  if (box.linkTo) {
    const removeLinkOption = document.createElement('div');
    removeLinkOption.className = 'context-menu-item';
    removeLinkOption.textContent = 'Remove Link';
    removeLinkOption.addEventListener('click', () => {
      // @agent:UndoSystem:extension
      pushHistory(); // Capture state before link removal

      // DEBUG - can be removed later
      console.log('Link removed:', box.id);

      box.linkTo = null;
      const boxEl = document.getElementById(box.id);
      if (boxEl) boxEl.classList.remove('has-link');
      contextMenu.remove();
    });
    contextMenu.appendChild(removeLinkOption);
  }

  // Delete option
  const deleteOption = document.createElement('div');
  deleteOption.className = 'context-menu-item';
  deleteOption.textContent = 'Delete';
  deleteOption.addEventListener('click', () => {
    selectBox(box);
    deleteSelectedBox();
    contextMenu.remove();
  });
  contextMenu.appendChild(deleteOption);

  document.body.appendChild(contextMenu);

  // Close menu on click outside
  setTimeout(() => {
    document.addEventListener('click', closeContextMenu);
  }, 0);
}

function closeContextMenu() {
  if (contextMenu) {
    contextMenu.remove();
    contextMenu = null;
  }
  document.removeEventListener('click', closeContextMenu);
}

// @agent:UndoSystem:extension
function showPageLinkDialog(box) {
  const pageList = state.pages.map(p => `${p.name} (${p.id})`).join('\n');
  const targetPage = prompt(`Link to page:\n\n${pageList}\n\nEnter page ID:`, box.linkTo?.target || '');
  if (!targetPage) return;

  // @agent:UndoSystem:extension
  pushHistory(); // Capture state before link creation

  const pageId = targetPage;
  const page = state.pages.find(p => p.id === pageId);

  if (page) {
    box.linkTo = { type: 'page', target: pageId };
    const boxEl = document.getElementById(box.id);
    if (boxEl) boxEl.classList.add('has-link');

    // DEBUG - can be removed later
    console.log('Link created:', box.id, 'page', pageId);
  } else {
    alert('Page not found');
  }
}

// @agent:UndoSystem:extension
function showAnchorLinkDialog(box) {
  const currentPage = getCurrentPage();
  if (!currentPage) return;

  const boxList = currentPage.boxes.map(b => `${b.name} (${b.id})`).join('\n');
  const targetBox = prompt(`Select a box to link to:\n\n${boxList}\n\nEnter box ID:`);

  if (!targetBox) return;

  // @agent:UndoSystem:extension
  pushHistory(); // Capture state before link creation

  const anchorBox = currentPage.boxes.find(b => b.id === targetBox);

  if (anchorBox) {
    box.linkTo = { type: 'anchor', target: targetBox };
    const boxEl = document.getElementById(box.id);
    if (boxEl) boxEl.classList.add('has-link');

    // DEBUG - can be removed later
    console.log('Link created:', box.id, 'anchor', targetBox);
  } else {
    alert('Box not found');
  }
}

// @agent:LinkNavigation:authority
// Link Navigation
function handleLinkClick(linkTo) {
  if (!linkTo) return;

  if (linkTo.type === 'page') {
    switchToPage(linkTo.target);
  } else if (linkTo.type === 'anchor') {
    const targetBox = document.getElementById(linkTo.target);
    if (targetBox) {
      targetBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const box = getCurrentPage().boxes.find(b => b.id === linkTo.target);
      if (box) selectBox(box);
    }
  }
}

// @agent:UndoSystem:extension
// Update Font
function updateFont() {
  if (!state.selectedBox || (state.selectedBox.type !== 'text' && state.selectedBox.type !== 'button')) return;

  // @agent:UndoSystem:extension
  pushHistory(); // Capture state before font change

  state.selectedBox.fontFamily = fontSelect.value;
  const boxEl = document.getElementById(state.selectedBox.id);
  const content = boxEl.querySelector('.box-content');
  content.style.fontFamily = fontSelect.value;
}

// @agent:UndoSystem:extension
// Update Font Size
function updateFontSize() {
  if (!state.selectedBox || (state.selectedBox.type !== 'text' && state.selectedBox.type !== 'button')) return;

  // @agent:UndoSystem:extension
  pushHistory(); // Capture state before font size change

  state.selectedBox.fontSize = fontSizeSelect.value;
  const boxEl = document.getElementById(state.selectedBox.id);
  const content = boxEl.querySelector('.box-content');
  content.style.fontSize = fontSizeSelect.value + 'px';
}

// @agent:UndoSystem:extension
// Handle Image Upload
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    if (state.selectedBox && state.selectedBox.type === 'image') {
      // @agent:UndoSystem:extension
      pushHistory(); // Capture state before image upload

      state.selectedBox.content = event.target.result;
      const boxEl = document.getElementById(state.selectedBox.id);
      const content = boxEl.querySelector('.box-content');
      content.innerHTML = '';
      const img = document.createElement('img');
      img.src = event.target.result;
      content.appendChild(img);
    }
  };
  reader.readAsDataURL(file);
  imageInput.value = '';
}

// @agent:CanvasSize:authority
// Canvas Size
function setCanvasSize(size) {
  const currentPage = getCurrentPage();
  if (currentPage) {
    currentPage.canvasSize = size;
  }

  canvas.className = size === 'desktop' ? '' : size;

  // Update active button
  document.querySelectorAll('.canvas-size-btn').forEach(btn => btn.classList.remove('active'));
  if (size === 'desktop') desktopBtn.classList.add('active');
  if (size === 'tablet') tabletBtn.classList.add('active');
  if (size === 'mobile') mobileBtn.classList.add('active');
}

// @agent:FileOperations:authority
// File Operations
function newFile() {
  const totalBoxes = state.pages.reduce((sum, page) => sum + page.boxes.length, 0);
  if (totalBoxes > 0) {
    if (!confirm('Create new file? Unsaved changes will be lost.')) return;
  }

  // Reset state
  canvas.innerHTML = '';
  state.pages = [];
  state.selectedBox = null;
  state.boxCounter = 0;
  state.pageCounter = 0;
  state.zIndexCounter = 1;

  // Initialize with default page
  initializeState();
  updateNavigator();
  renderCurrentPage();
}

// @agent:FileOperations:extension
async function saveFile() {
  const data = {
    version: APP_VERSION,
    header: state.header,
    footer: state.footer,
    pages: state.pages,
    currentPageId: state.currentPageId
  };

  const json = JSON.stringify(data, null, 2);

  // Check if File System Access API is supported
  if ('showSaveFilePicker' in window) {
    try {
      // Show save file picker to let user choose location and filename
      const handle = await window.showSaveFilePicker({
        suggestedName: 'quickbox-mockup.json',
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] }
        }]
      });

      // Create a writable stream and write the JSON data
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();

      console.log('File saved successfully');
    } catch (err) {
      // User cancelled the picker or an error occurred
      if (err.name !== 'AbortError') {
        console.error('Error saving file:', err);
        alert('Error saving file: ' + err.message);
      }
    }
  } else {
    // Fallback for browsers that don't support File System Access API
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'quickbox-mockup.json';
    a.click();

    URL.revokeObjectURL(url);
  }
}

function openFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);

      // Detect and log file version
      const fileVersion = data.version || detectLegacyVersion(data);
      console.log(`Loading QuickBox file version: ${fileVersion}`);

      // Clear current state
      canvas.innerHTML = '';
      state.pages = [];
      state.header = { boxes: [], height: 80 };
      state.footer = { boxes: [], height: 80 };
      state.selectedBox = null;

      // Check if v0.1 format (backward compatibility)
      if (data.boxes && Array.isArray(data.boxes)) {
        // Convert v0.1 to v0.2+ format
        state.pageCounter = 1;
        const page = {
          id: 'page-1',
          name: 'Page 1',
          canvasSize: data.canvasSize || 'desktop',
          boxes: data.boxes
        };
        state.pages.push(page);
        state.currentPageId = 'page-1';

        // Update counters
        state.boxCounter = Math.max(...data.boxes.map(b => parseInt(b.id.split('-')[1])), 0);
        state.zIndexCounter = Math.max(...data.boxes.map(b => b.zIndex), 0) + 1;
      }
      // v0.2+ format (includes v0.3+ with version field)
      else if (data.pages && Array.isArray(data.pages)) {
        state.pages = data.pages;
        state.currentPageId = data.currentPageId || (data.pages.length > 0 ? data.pages[0].id : null);

        // Load header/footer if present (v0.4+)
        if (data.header) {
          state.header = data.header;
        }
        if (data.footer) {
          state.footer = data.footer;
        }

        // Update counters
        const allBoxes = state.pages.flatMap(p => p.boxes);
        const headerFooterBoxes = [...(state.header.boxes || []), ...(state.footer.boxes || [])];
        const combinedBoxes = [...allBoxes, ...headerFooterBoxes];

        if (combinedBoxes.length > 0) {
          state.boxCounter = Math.max(...combinedBoxes.map(b => parseInt(b.id.split('-')[1])), 0);
          state.zIndexCounter = Math.max(...combinedBoxes.map(b => b.zIndex), 0) + 1;
        }

        if (state.pages.length > 0) {
          state.pageCounter = Math.max(...state.pages.map(p => parseInt(p.id.split('-')[1])), 0);
        }
      }

      // Render
      if (!getCurrentPage() && state.pages.length > 0) {
        state.currentPageId = state.pages[0].id;
      }

      updateNavigator();
      renderCurrentPage();
      updatePageIdentifier();
    } catch (err) {
      alert('Error opening file: ' + err.message);
    }
  };
  reader.readAsText(file);
  fileInput.value = '';
}

// Detect legacy file version for backward compatibility
function detectLegacyVersion(data) {
  if (data.boxes && Array.isArray(data.boxes)) return "0.1";
  if (data.pages && Array.isArray(data.pages) && !data.version) return "0.2";
  return "unknown";
}

// Image box click to upload
canvas.addEventListener('click', (e) => {
  const box = e.target.closest('.box');
  if (box) {
    const boxId = box.id;
    const currentPage = getCurrentPage();
    if (currentPage) {
      const boxData = currentPage.boxes.find(b => b.id === boxId);
      if (boxData && boxData.type === 'image') {
        const content = e.target.closest('.box-content');
        if (content && !content.querySelector('img')) {
          imageInput.click();
        }
      }
    }
  }
});
