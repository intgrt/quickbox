// QuickBox - Wireframe Mockup Tool
// State management
const state = {
  pages: [],
  currentPageId: null,
  selectedBox: null,
  boxCounter: 0,
  pageCounter: 0,
  zIndexCounter: 1
};

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

// Toolbar buttons
const newBtn = document.getElementById('newBtn');
const openBtn = document.getElementById('openBtn');
const saveBtn = document.getElementById('saveBtn');
const addTextBtn = document.getElementById('addTextBtn');
const addImageBtn = document.getElementById('addImageBtn');
const addMenuBtn = document.getElementById('addMenuBtn');
const deleteBtn = document.getElementById('deleteBtn');
const fontSelect = document.getElementById('fontSelect');
const fontSizeSelect = document.getElementById('fontSizeSelect');
const desktopBtn = document.getElementById('desktopBtn');
const tabletBtn = document.getElementById('tabletBtn');
const mobileBtn = document.getElementById('mobileBtn');
const addPageBtn = document.getElementById('addPageBtn');

// Context menu
let contextMenu = null;

// Event Listeners
newBtn.addEventListener('click', newFile);
openBtn.addEventListener('click', () => fileInput.click());
saveBtn.addEventListener('click', saveFile);
addTextBtn.addEventListener('click', () => addBox('text'));
addImageBtn.addEventListener('click', () => addBox('image'));
addMenuBtn.addEventListener('click', () => addBox('menu'));
deleteBtn.addEventListener('click', deleteSelectedBox);
fontSelect.addEventListener('change', updateFont);
fontSizeSelect.addEventListener('change', updateFontSize);
desktopBtn.addEventListener('click', () => setCanvasSize('desktop'));
tabletBtn.addEventListener('click', () => setCanvasSize('tablet'));
mobileBtn.addEventListener('click', () => setCanvasSize('mobile'));
addPageBtn.addEventListener('click', addPage);
fileInput.addEventListener('change', openFile);
imageInput.addEventListener('change', handleImageUpload);

// Menu Editor Event Listeners
addMenuItemBtn.addEventListener('click', addMenuItem);
addChildMenuItemBtn.addEventListener('click', addChildMenuItem);
saveMenuBtn.addEventListener('click', saveMenu);
closeMenuEditorBtn.addEventListener('click', closeMenuEditor);

// Canvas click to deselect
canvas.addEventListener('click', (e) => {
  if (e.target === canvas) {
    selectBox(null);
  }
});

// Prevent default context menu on boxes
canvas.addEventListener('contextmenu', (e) => {
  const box = e.target.closest('.box');
  if (box) {
    e.preventDefault();
    showContextMenu(e, box.id);
  }
});

// Initialize
initializeState();
updateNavigator();
renderCurrentPage();

// Add Box
function addBox(type) {
  const currentPage = getCurrentPage();
  if (!currentPage) return;

  state.boxCounter++;
  const boxId = `box-${state.boxCounter}`;
  let boxName = '';

  if (type === 'text') boxName = `Text ${state.boxCounter}`;
  else if (type === 'image') boxName = `Image ${state.boxCounter}`;
  else if (type === 'menu') boxName = `Menu ${state.boxCounter}`;

  const box = {
    id: boxId,
    name: boxName,
    type: type,
    x: 50 + (state.boxCounter * 20),
    y: 50 + (state.boxCounter * 20),
    width: type === 'menu' ? 400 : 200,
    height: type === 'menu' ? 50 : 150,
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

  currentPage.boxes.push(box);
  renderBox(box);
  updateNavigator();
  selectBox(box);
}

// Render Box
function renderBox(box) {
  const boxEl = document.createElement('div');
  boxEl.className = 'box' + (box.type === 'menu' ? ' menu-box' : '');
  boxEl.id = box.id;
  boxEl.style.left = box.x + 'px';
  boxEl.style.top = box.y + 'px';
  boxEl.style.width = box.width + 'px';
  boxEl.style.height = box.height + 'px';
  boxEl.style.zIndex = box.zIndex;

  // Add link indicator if box has a link
  if (box.linkTo) {
    boxEl.classList.add('has-link');
  }

  // Content
  const content = document.createElement('div');
  content.className = 'box-content';

  if (box.type === 'text') {
    content.contentEditable = true;
    content.textContent = box.content;
    content.style.fontSize = box.fontSize + 'px';
    content.style.fontFamily = box.fontFamily;
  } else if (box.type === 'image') {
    content.contentEditable = false;
    if (box.content) {
      const img = document.createElement('img');
      img.src = box.content;
      content.appendChild(img);
    }
  } else if (box.type === 'menu') {
    content.contentEditable = false;
    renderMenuContent(content, box);

    // Add drag icon for menu boxes
    const dragIcon = document.createElement('div');
    dragIcon.className = 'menu-drag-icon';
    dragIcon.textContent = '☰';
    dragIcon.title = 'Drag Menu';
    dragIcon.addEventListener('mousedown', (e) => {
      e.stopPropagation(); // Prevent other handlers
      selectBox(box);
      startDrag(e, box);
    });

    // Add edit icon for menu boxes
    const editIcon = document.createElement('div');
    editIcon.className = 'menu-edit-icon';
    editIcon.textContent = '✏️';
    editIcon.title = 'Edit Menu';
    editIcon.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent box selection
      openMenuEditor(box);
    });

    boxEl.appendChild(dragIcon);
    boxEl.appendChild(editIcon);
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
  canvas.appendChild(boxEl);

  // Event listeners
  boxEl.addEventListener('mousedown', (e) => {
    // For menu boxes, only allow selection (no dragging from box area)
    if (box.type === 'menu') {
      // Ignore clicks on menu items, icons, and handles
      const isMenuItemClick = e.target.closest('.menu-item') || e.target.closest('.menu-item-container');
      const isIconClick = e.target.closest('.menu-edit-icon') || e.target.closest('.menu-drag-icon');
      const isHandleClick = e.target.classList.contains('resize-handle');

      if (isMenuItemClick || isIconClick || isHandleClick) {
        return; // Let these elements handle their own events
      }

      // Only select the box when clicking on the background area
      selectBox(box);
    } else {
      // Normal box behavior for non-menu boxes
      if (!e.target.classList.contains('resize-handle') && e.target.classList.contains('box')) {
        selectBox(box);
        startDrag(e, box);
      } else if (!e.target.classList.contains('resize-handle')) {
        selectBox(box);
      }
    }
  });

  // Click handler for links
  boxEl.addEventListener('click', (e) => {
    if (box.linkTo && !e.target.classList.contains('resize-handle')) {
      e.stopPropagation();
      handleLinkClick(box.linkTo);
    }
  });

  if (box.type === 'text') {
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
      e.stopPropagation();
      startResize(e, box, handle.dataset.direction);
    });
  });

  updateCanvasHeight();
}

// Render menu content
function renderMenuContent(content, box) {
  content.innerHTML = '';
  content.className = 'box-content menu-content';
  content.style.display = 'flex';
  content.style.flexDirection = box.orientation === 'horizontal' ? 'row' : 'column';
  content.style.gap = '8px';
  content.style.alignItems = 'center';
  content.style.justifyContent = 'space-around';

  box.menuItems.forEach(item => {
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
      menuItem.textContent += ' ▼';
      
      // Create dropdown container
      const dropdown = document.createElement('div');
      dropdown.className = 'menu-dropdown';
      dropdown.style.position = 'absolute';
      dropdown.style.top = '100%';
      dropdown.style.left = '0';
      dropdown.style.background = '#fff';
      dropdown.style.border = '2px solid #333';
      dropdown.style.padding = '8px';
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
        
        // Add click handler for child item navigation
        if (child.linkTo) {
          childItem.style.cursor = 'pointer';
          childItem.addEventListener('click', (e) => {
            e.stopPropagation();
            handleLinkClick(child.linkTo);
          });
        } else {
          // Even non-linked child items should prevent box selection
          childItem.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        }

        // Prevent box dragging on mousedown
        childItem.addEventListener('mousedown', (e) => {
          e.stopPropagation();
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
    
    // Add mousedown and click handlers for navigation
    if (item.linkTo) {
      menuItem.style.cursor = 'pointer';
      menuItem.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Prevent box selection/dragging
      });
      menuItem.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent box selection
        handleLinkClick(item.linkTo);
      });
    } else {
      // For non-linked items, still prevent box selection to allow future linking
      menuItem.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Prevent box selection/dragging
      });
      menuItem.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent box selection
      });
    }

    // Also add mousedown and click handlers to the container for better click area
    menuItemContainer.addEventListener('mousedown', (e) => {
      e.stopPropagation(); // Prevent box selection/dragging
    });

    menuItemContainer.addEventListener('click', (e) => {
      if (item.linkTo) {
        e.stopPropagation();
        handleLinkClick(item.linkTo);
      } else {
        e.stopPropagation(); // Prevent box selection
      }
    });
  });
}

// Select Box
function selectBox(box) {
  state.selectedBox = box;

  // Update UI
  document.querySelectorAll('.box').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.element-item').forEach(el => el.classList.remove('selected'));

  if (box) {
    const boxEl = document.getElementById(box.id);
    boxEl.classList.add('selected');
    box.zIndex = state.zIndexCounter++;
    boxEl.style.zIndex = box.zIndex;

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
    item.linkTo = null;
  } else {
    const page = state.pages.find(p => p.id === targetPage);
    if (page) {
      item.linkTo = { type: 'page', target: targetPage };
    } else {
      alert('Page not found');
    }
  }
  
  renderMenuEditor();
}

function saveMenu() {
  if (!currentEditingMenu) return;

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

// Drag functionality
function startDrag(e, box) {
  e.preventDefault();
  const boxEl = document.getElementById(box.id);
  const startX = e.clientX;
  const startY = e.clientY;
  const startLeft = box.x;
  const startTop = box.y;

  function onMouseMove(e) {
    box.x = startLeft + (e.clientX - startX);
    box.y = startTop + (e.clientY - startY);
    boxEl.style.left = box.x + 'px';
    boxEl.style.top = box.y + 'px';
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    updateCanvasHeight();
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// Resize functionality
function startResize(e, box, direction) {
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
      box.width = Math.max(50, startWidth + deltaX);
    }
    if (direction.includes('w')) {
      const newWidth = Math.max(50, startWidth - deltaX);
      if (newWidth > 50) {
        box.width = newWidth;
        box.x = startLeft + deltaX;
      }
    }
    if (direction.includes('s')) {
      box.height = Math.max(50, startHeight + deltaY);
    }
    if (direction.includes('n')) {
      const newHeight = Math.max(50, startHeight - deltaY);
      if (newHeight > 50) {
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
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// Update Canvas Height
function updateCanvasHeight() {
  const currentPage = getCurrentPage();
  if (!currentPage || currentPage.boxes.length === 0) {
    canvas.style.height = '600px';
    return;
  }

  let maxBottom = 0;
  currentPage.boxes.forEach(box => {
    const bottom = box.y + box.height;
    if (bottom > maxBottom) {
      maxBottom = bottom;
    }
  });

  const minHeight = 600;
  const padding = 100;
  const newHeight = Math.max(minHeight, maxBottom + padding);
  canvas.style.height = newHeight + 'px';
}

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
    item.textContent = page.name;
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
  const prefix = 'Page ';
  const suffix = currentName.startsWith(prefix) ? currentName.substring(prefix.length) : currentName;

  const newSuffix = prompt(`Edit page name:\n\nPage `, suffix);
  if (newSuffix === null || newSuffix.trim() === '') return;

  page.name = prefix + newSuffix.trim();
  updatePagesList();
}

// Update Elements List
function updateElementsList() {
  const currentPage = getCurrentPage();
  elementsList.innerHTML = '';

  if (!currentPage) return;

  currentPage.boxes.forEach(box => {
    const item = document.createElement('div');
    item.className = 'element-item';
    item.textContent = box.name;
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
}

// Edit element name
function editElementName(box) {
  const currentName = box.name;
  let prefix = '';

  if (box.type === 'text') prefix = 'Text ';
  else if (box.type === 'image') prefix = 'Image ';
  else if (box.type === 'menu') prefix = 'Menu ';

  const suffix = currentName.startsWith(prefix) ? currentName.substring(prefix.length) : currentName;

  const newSuffix = prompt(`Edit element name:\n\n${prefix}`, suffix);
  if (newSuffix === null || newSuffix.trim() === '') return;

  box.name = prefix + newSuffix.trim();
  updateElementsList();
}

// Delete Selected Box
function deleteSelectedBox() {
  if (!state.selectedBox) return;

  const currentPage = getCurrentPage();
  if (!currentPage) return;

  const boxEl = document.getElementById(state.selectedBox.id);
  if (boxEl) boxEl.remove();

  currentPage.boxes = currentPage.boxes.filter(b => b.id !== state.selectedBox.id);
  state.selectedBox = null;
  updateNavigator();
  updateCanvasHeight();
}

// Page Management
function addPage() {
  state.pageCounter++;
  const newPage = {
    id: `page-${state.pageCounter}`,
    name: `Page ${state.pageCounter}`,
    canvasSize: 'desktop',
    boxes: []
  };
  state.pages.push(newPage);
  updatePagesList();
}

function switchToPage(pageId) {
  if (state.currentPageId === pageId) return;

  state.currentPageId = pageId;
  state.selectedBox = null;
  renderCurrentPage();
  updateNavigator();
}

function renderCurrentPage() {
  const currentPage = getCurrentPage();
  if (!currentPage) return;

  // Clear canvas
  canvas.innerHTML = '';

  // Set canvas size
  setCanvasSize(currentPage.canvasSize);

  // Render all boxes
  currentPage.boxes.forEach(box => renderBox(box));

  updateCanvasHeight();
}

// Context Menu
function showContextMenu(e, boxId) {
  const currentPage = getCurrentPage();
  if (!currentPage) return;

  const box = currentPage.boxes.find(b => b.id === boxId);
  if (!box) return;

  // Remove existing context menu
  if (contextMenu) {
    contextMenu.remove();
  }

  // Create context menu
  contextMenu = document.createElement('div');
  contextMenu.className = 'context-menu';
  contextMenu.style.left = e.clientX + 'px';
  contextMenu.style.top = e.clientY + 'px';

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
      box.linkTo = null;
      const boxEl = document.getElementById(box.id);
      if (boxEl) boxEl.classList.remove('has-link');
      contextMenu.remove();
    });
    contextMenu.appendChild(removeLinkOption);
  }

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

function showPageLinkDialog(box) {
  const targetPage = prompt('Enter target page number (1, 2, 3...):');
  if (!targetPage) return;

  const pageId = `page-${targetPage}`;
  const page = state.pages.find(p => p.id === pageId);

  if (page) {
    box.linkTo = { type: 'page', target: pageId };
    const boxEl = document.getElementById(box.id);
    if (boxEl) boxEl.classList.add('has-link');
  } else {
    alert('Page not found');
  }
}

function showAnchorLinkDialog(box) {
  const currentPage = getCurrentPage();
  if (!currentPage) return;

  const boxList = currentPage.boxes.map(b => `${b.name} (${b.id})`).join('\n');
  const targetBox = prompt(`Select a box to link to:\n\n${boxList}\n\nEnter box ID:`);

  if (!targetBox) return;

  const anchorBox = currentPage.boxes.find(b => b.id === targetBox);

  if (anchorBox) {
    box.linkTo = { type: 'anchor', target: targetBox };
    const boxEl = document.getElementById(box.id);
    if (boxEl) boxEl.classList.add('has-link');
  } else {
    alert('Box not found');
  }
}

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

// Update Font
function updateFont() {
  if (!state.selectedBox || state.selectedBox.type !== 'text') return;

  state.selectedBox.fontFamily = fontSelect.value;
  const boxEl = document.getElementById(state.selectedBox.id);
  const content = boxEl.querySelector('.box-content');
  content.style.fontFamily = fontSelect.value;
}

// Update Font Size
function updateFontSize() {
  if (!state.selectedBox || state.selectedBox.type !== 'text') return;

  state.selectedBox.fontSize = fontSizeSelect.value;
  const boxEl = document.getElementById(state.selectedBox.id);
  const content = boxEl.querySelector('.box-content');
  content.style.fontSize = fontSizeSelect.value + 'px';
}

// Handle Image Upload
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    if (state.selectedBox && state.selectedBox.type === 'image') {
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

function saveFile() {
  const data = {
    pages: state.pages,
    currentPageId: state.currentPageId
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'quickbox-mockup.json';
  a.click();

  URL.revokeObjectURL(url);
}

function openFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);

      // Clear current state
      canvas.innerHTML = '';
      state.pages = [];
      state.selectedBox = null;

      // Check if v0.1 format (backward compatibility)
      if (data.boxes && Array.isArray(data.boxes)) {
        // Convert v0.1 to v0.2 format
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
      // v0.2 format
      else if (data.pages && Array.isArray(data.pages)) {
        state.pages = data.pages;
        state.currentPageId = data.currentPageId || (data.pages.length > 0 ? data.pages[0].id : null);

        // Update counters
        const allBoxes = state.pages.flatMap(p => p.boxes);
        if (allBoxes.length > 0) {
          state.boxCounter = Math.max(...allBoxes.map(b => parseInt(b.id.split('-')[1])), 0);
          state.zIndexCounter = Math.max(...allBoxes.map(b => b.zIndex), 0) + 1;
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
    } catch (err) {
      alert('Error opening file: ' + err.message);
    }
  };
  reader.readAsText(file);
  fileInput.value = '';
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
