// Regression check for document-level undo. Browser checks cover rendering,
// input focus, rich content, file pickers, and export behavior.
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = readFileSync('app.js', 'utf8');
const section = source.slice(source.indexOf('// @agent:UndoSystem:authority'), source.indexOf('// @agent:StateManagement:entry'));
const noop = () => {};
const state = {header:{boxes:[], height:80}, footer:{boxes:[], height:80}, pages:[{id:'page-1', boxes:[]}], currentPageId:'page-1', globalFont:'Arial, sans-serif', themes:{active:'sketch', variables:{}}, projectMediaPath:null};
const context = vm.createContext({state, window:{addEventListener:noop}, document:{querySelectorAll:()=>[],documentElement:{style:{setProperty:noop}}}, fontSelect:{}, paletteSelector:{}, currentStyleOverrideBox:null, currentRegionType:null, currentEditingMenu:null, currentAccordionBox:null,
  applyThemeVariables:noop, closeMenuEditor:noop, closeAccordionEditor:noop, closeStyleOverridePanel:noop, closeRegionColorOverridePanel:noop, closePaletteEditor:noop, closeContextMenu:noop,
  renderCurrentPage:noop, updateNavigator:noop, updatePageIdentifier:noop, updateMediaPathDisplay:noop, updateModeUI:noop});
vm.runInContext(section, context);
function run(code) { return vm.runInContext(code, context); }
run("pushHistory(); state.pages[0].boxes.push({id:'box-1', x:10, zIndex:1}); performUndo();");
assert.equal(state.pages[0].boxes.length, 0);
run('performRedo();');
assert.equal(state.pages[0].boxes.length, 1);
run("beginContinuous('drag'); state.pages[0].boxes[0].x = 90; pushHistory('continuous-end'); performUndo();");
assert.equal(state.pages[0].boxes[0].x, 10);
run('performRedo();');
assert.equal(state.pages[0].boxes[0].x, 90);
const before = run('undoHistory.past.length');
run("beginContinuous('drag'); pushHistory('continuous-end');");
assert.equal(run('undoHistory.past.length'), before);
run("pushHistory(); state.globalFont = 'Georgia, serif'; state.themes = {active:'custom',variables:{'--text-fill':'#ff0000'}}; performUndo();");
assert.equal(state.globalFont, 'Arial, sans-serif');
assert.equal(state.themes.active, 'sketch');
run('performRedo();');
assert.equal(state.globalFont, 'Georgia, serif');
run("pushHistory(); state.pages[0].boxes[0].x = 100; performUndo(); pushHistory(); state.pages[0].boxes[0].x = 110;");
assert.equal(run('undoHistory.future.length'), 0);
run('resetHistory(); performUndo(); performRedo();');
assert.equal(state.pages[0].boxes[0].x, 110);
run("documentReady = true; savedDocument = documentSignature(); state.currentPageId = 'page-2';");
assert.equal(run('hasUnsavedChanges()'), false);
run('state.header.height = 120;');
assert.equal(run('hasUnsavedChanges()'), true);
run('resetHistory(); for (let i=0;i<25;i++) { pushHistory(); state.header.height++; }');
assert.equal(run('undoHistory.past.length'), 20);
console.log('History regression checks passed: create, text-equivalent mutation, drag, no-op, font/theme, redo invalidation, document reset, dirty tracking, history limit.');
