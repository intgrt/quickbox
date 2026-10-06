const {JSDOM, VirtualConsole} = require('jsdom');
const {readFileSync, mkdirSync, writeFileSync} = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const virtualConsole = new VirtualConsole();
const errors = [];
virtualConsole.on('jsdomError', error => errors.push(error.message));
const dom = new JSDOM(readFileSync('index.html', 'utf8'), {url:'http://127.0.0.1:5174/', runScripts:'outside-only', pretendToBeVisual:true, virtualConsole});
const w = dom.window;
const alerts = [];
w.alert = message => alerts.push(message);
w.confirm = () => true;
w.fetch = async url => ({ok:true, json:async () => JSON.parse(readFileSync(String(url), 'utf8'))});
// jsdom does not expose CSS.supports. Validate declarations with its CSS parser.
w.CSS = {supports:(property, value) => {
  const style = w.document.createElement('span').style;
  style.setProperty(property, value); return !!style.getPropertyValue(property);
}};
for (const name of ['document-model.js','export-runtime.js','app.js']) vm.runInContext(readFileSync(name, 'utf8'), dom.getInternalVMContext(), {filename:name});
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
async function waitFor(predicate) {
  for (let i=0;i<100;i++) { if (predicate()) return; await tick(); }
  throw new Error('Timed out waiting for document');
}
const snapshot = () => JSON.parse(JSON.stringify(w.captureSnapshot()));
async function open(value) {
  const file = new w.File([typeof value === 'string' ? value : JSON.stringify(value)], 'mockup.json', {type:'application/json'});
  w.openFile({target:{files:[file]}});
  await tick(); await tick();
}
async function main() {
  await waitFor(() => w.eval('documentReady'));
  w.addBox('text');
  const field = w.document.querySelector('#box-1 .box-content');
  field.dispatchEvent(new w.FocusEvent('focus')); field.innerHTML = '<b>Edited</b>'; field.dispatchEvent(new w.Event('input')); field.dispatchEvent(new w.FocusEvent('blur'));
  w.performUndo(); assert.equal(snapshot().pages[0].boxes[0].content, '');
  w.performRedo(); assert.equal(snapshot().pages[0].boxes[0].content, '<b>Edited</b>');
  const before = snapshot();
  await open(readFileSync('checks/fixtures/invalid.json','utf8'));
  assert.deepEqual(snapshot(), before);
  assert.match(alerts.at(-1), /unchanged/);
  await open('{bad json'); assert.deepEqual(snapshot(), before);
  const fixture = JSON.parse(readFileSync('checks/fixtures/review.json','utf8'));
  await open(fixture);
  assert.equal(snapshot().pages.length, 2);
  assert.equal(w.eval('undoHistory.past.length'), 0);
  assert.equal(w.hasUnsavedChanges(), false);
  const rich = w.document.querySelector('#box-2 .box-content');
  assert.equal(rich.querySelector('strong').textContent, 'Safe bold');
  assert.equal(rich.querySelector('script,img,svg'), null);
  assert.equal(w.quickboxUnsafe, undefined);
  for (const mutation of [
    doc => doc.pages[0].boxes[0].width = '20; color:red',
    doc => doc.pages[0].boxes[0].id = 'bad-id',
    doc => doc.pages[0].boxes[0].styleOverrides = {fill:'red;display:none'},
    doc => doc.pages[0].boxes[1].linkTo.target = 'page-missing',
    doc => { doc.pages[0].boxes[0].type='image'; doc.pages[0].boxes[0].content='javascript:alert(1)'; }
  ]) {
    const invalid = structuredClone(fixture); mutation(invalid);
    const previous = snapshot(); await open(invalid); assert.deepEqual(snapshot(), previous);
  }
  // Existing legacy document still loads through the normalization boundary.
  await open(readFileSync('int_disect.json','utf8'));
  assert.equal(snapshot().header.boxes[0].content, 'Integrate counselling');
  await open(fixture);
  w.openMenuEditor(w.eval('state.header.boxes[0]'));
  w.updateMenuItemText('home', 'Draft title');
  assert.equal(snapshot().header.boxes[0].menuItems[0].text, 'Home & start');
  w.closeMenuEditor();
  w.openMenuEditor(w.eval('state.header.boxes[0]')); w.updateMenuItemText('home','Committed title'); w.saveMenu();
  assert.equal(snapshot().header.boxes[0].menuItems[0].text,'Committed title');
  w.performUndo(); assert.equal(snapshot().header.boxes[0].menuItems[0].text,'Home & start');
  w.openStyleOverridePanel(w.eval('state.pages[0].boxes[0]'));
  w.applyTemporaryStyleOverride('fill','#ff0000'); w.applyStyleOverride();
  assert.equal(snapshot().pages[0].boxes[0].styleOverrides.fill,'#ff0000');
  w.performUndo(); assert.equal(snapshot().pages[0].boxes[0].styleOverrides,undefined);
  w.openRegionColorOverridePanel('header');
  w.document.querySelector('#regionColorHex').value='#aabbcc'; w.document.querySelector('#regionColorHex').oninput();
  w.applyRegionColorOverride(); w.performUndo(); assert.equal(snapshot().header.colorOverride,null);
  const html = await w.generateExportHTML({});
  mkdirSync('checks/output', {recursive:true});
  writeFileSync('checks/output/review-export.html', html);
  const exported = new JSDOM(html, {runScripts:'outside-only'});
  const ew = exported.window;
  ew.HTMLElement.prototype.scrollIntoView = function() {};
  ew.eval(readFileSync('export-runtime.js','utf8')); ew.initializeQuickBoxExport();
  assert.equal(ew.document.querySelector('.export-nav-btn').textContent, "Home & 'review' <one>");
  assert.equal(ew.document.querySelector('.page-wrapper.visible').dataset.pageId,'page-1');
  ew.document.querySelector('[data-box-id="box-3"]').click();
  assert.equal(ew.document.querySelector('.page-wrapper.visible').dataset.pageId,'page-2');
  ew.document.querySelector('.page-wrapper.visible .accordion-header').click();
  assert.equal(ew.document.querySelector('.page-wrapper.visible .accordion-body').style.display,'block');
  ew.document.querySelector('.export-nav-btn').click();
  ew.document.querySelector('[data-box-id="box-4"]').click();
  assert.ok(ew.document.querySelector('[data-box-id="box-5"]').classList.contains('anchor-highlight'));
  ew.document.querySelector('.page-wrapper.visible [data-link]').parentElement.nextElementSibling.querySelector('[data-link]').click();
  assert.equal(ew.document.querySelector('.page-wrapper.visible').dataset.pageId,'page-2');
  assert.equal(ew.document.querySelector('.box-content script,.box-content svg,.box-content [onerror]'),null);
  // Image conversion embeds a real local asset; missing-image cancellation and
  // generation errors always release the Export control.
  w.fetch = async url => ({ok:true, blob:async () => new w.Blob([readFileSync(url)],{type:'image/png'})});
  const image = await w.imageToBase64('IIC Logo small.png',null);
  assert.ok(image.startsWith('data:image/png;base64,'));
  w.eval("state.pages[0].boxes.push({id:'box-99',type:'image',name:'Missing image',x:0,y:0,width:100,height:100,zIndex:1,content:'missing.png'})");
  w.confirm = () => false;
  await w.startHtmlExport(); assert.equal(w.document.querySelector('#exportHtmlBtn').disabled,false);
  assert.equal(w.document.querySelector('#exportHtmlBtn').textContent,'Export HTML');
  w.confirm = () => true;
  const originalGenerate = w.generateExportHTML;
  w.generateExportHTML = async () => {throw new Error('Simulated generation failure');};
  await w.startHtmlExport(); assert.equal(w.document.querySelector('#exportHtmlBtn').disabled,false);
  assert.match(alerts.at(-1),/Simulated generation failure/);
  w.generateExportHTML = originalGenerate;
  w.eval('state.pages[0].boxes.pop()');
  w.fetch = async url => ({ok:true, json:async () => JSON.parse(readFileSync(String(url),'utf8'))});
  // Save/Open restores document and clears old history.
  let saved;
  w.showSaveFilePicker = async () => ({createWritable:async () => ({write:async value => {saved=value;}, close:async()=>{}})});
  await w.saveFile(); assert.equal(w.hasUnsavedChanges(),false);
  w.addBox('button'); assert.equal(w.hasUnsavedChanges(),true);
  await open(saved); assert.equal(w.hasUnsavedChanges(),false); assert.equal(w.eval('undoHistory.past.length'),0);
  let pickerCalls = 0;
  let writeGranted = false;
  let permissionRequests = 0;
  let activation = false;
  const sourceFile = new w.File([saved], 'original.json', {type:'application/json'});
  const sourceHandle = {name:'original.json', getFile:async()=>sourceFile,
    requestPermission:async options=>{
      assert.equal(activation,true,'Request write permission before any asynchronous file operation');
      assert.equal(options.mode,'readwrite'); permissionRequests++; writeGranted=true; return 'granted';
    },
    createWritable:async()=>{assert.equal(writeGranted,true);return {write:async value=>{saved=value;},close:async()=>{}};}};
  w.showOpenFilePicker = async()=>[sourceHandle];
  await w.chooseDocumentFile(); await tick(); await tick();
  w.showSaveFilePicker = async options=>{pickerCalls++; assert.equal(options.startIn,sourceHandle); return {...sourceHandle,name:'renamed.json'};};
  w.confirm = ()=>{activation=true;queueMicrotask(()=>{activation=false;});return true;};
  await w.saveFile(); assert.equal(pickerCalls,0,'Overwrite should reuse the opened handle');
  assert.equal(permissionRequests,1);
  w.confirm = ()=>false;
  await w.saveFile(); assert.equal(pickerCalls,1,'Rename should start in the opened folder');
  assert.equal(w.eval('documentFileName'),'renamed.json');
  w.showSaveFilePicker = async()=>{throw Object.assign(new Error('Cancelled'),{name:'AbortError'});};
  await w.saveFile(); assert.equal(w.eval('saveInProgress'),false);
  assert.equal(w.eval('documentFileName'),'renamed.json');
  w.confirm = ()=>true;
  await w.newFile();
  assert.equal(w.eval('documentFileHandle'),null);
  assert.equal(snapshot().header.boxes.length,0); assert.equal(snapshot().footer.boxes.length,0);
  assert.equal(snapshot().pages.length,1); assert.equal(snapshot().globalFont,"'Architects Daughter', cursive");
  w.performUndo(); assert.equal(snapshot().pages[0].boxes.length,0);
  // Modal creation moves selected boxes, survives normalization, and is undoable.
  w.addBox('text');
  w.addBox('button');
  w.eval('state.tempGroup = [...state.pages[0].boxes]');
  w.prompt = ()=>'Registration';
  w.createModal();
  assert.equal(snapshot().pages.length,2);
  assert.equal(snapshot().pages[0].boxes.length,0);
  assert.equal(snapshot().pages[1].isModal,true);
  assert.equal(snapshot().pages[1].boxes.length,2);
  const modalId = snapshot().pages[1].id;
  w.performUndo(); assert.equal(snapshot().pages.length,1);
  w.performRedo(); assert.equal(snapshot().pages[1].isModal,true);
  w.switchToPage('page-1'); w.addBox('button');
  w.prompt = ()=>modalId;
  w.showModalLinkDialog(w.eval('state.selectedBox'));
  const modalDoc = snapshot();
  const model = w.eval('QuickBoxDocument');
  assert.equal(model.normalize(modalDoc).pages[1].isModal,true);
  const badModal = structuredClone(modalDoc); badModal.pages[0].boxes[0].linkTo.target = 'page-1';
  assert.throws(()=>model.normalize(badModal),/target does not exist/);
  w.HTMLDialogElement.prototype.showModal = function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close = function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  w.setMode('navigate'); w.document.querySelector('#' + modalDoc.pages[0].boxes[0].id).click();
  assert.ok(w.document.querySelector('dialog[open]'));
  w.document.querySelector('[data-modal-close]').click();
  assert.equal(w.document.querySelector('dialog'),null);
  const modalHTML = await w.generateExportHTML({});
  writeFileSync('checks/output/review-export.html',modalHTML);
  const md = new JSDOM(modalHTML,{runScripts:'outside-only',pretendToBeVisual:true});
  const mw = md.window;
  mw.HTMLDialogElement.prototype.showModal = function(){this.setAttribute('open','');};
  mw.HTMLDialogElement.prototype.close = function(){this.removeAttribute('open');};
  mw.eval('(' + w.initializeQuickBoxExport.toString() + ')()');
  assert.equal(mw.document.querySelectorAll('.export-nav-btn').length,1);
  mw.document.querySelector('[data-link]').click(); assert.ok(mw.document.querySelector('dialog[open]'));
  mw.document.querySelector('[data-modal-close]').click(); assert.equal(mw.document.querySelector('dialog[open]'),null);
  mw.document.querySelector('[data-link]').click(); mw.document.querySelector('dialog').click();
  assert.equal(mw.document.querySelector('dialog[open]'),null);
  md.window.close();
  assert.equal(errors.length,0,errors.join('\n'));
  ew.close(); w.close();
  console.log('Document checks passed: atomic imports, legacy compatibility, sanitizer, drafts, style/region undo, exported navigation, accordion toggling, image embedding, export failure recovery, save/open, clean New, modal group creation/undo/validation/editor and export interactions.');
}
main().catch(error => {console.error(error); w.close(); process.exitCode=1;});
