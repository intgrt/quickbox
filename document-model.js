// @agent:DocumentValidation:authority
// Shared document boundary: validate before replacing state or exporting markup.
const QuickBoxDocument = (() => {
  const fonts = ["'Architects Daughter', cursive", "'Roboto', sans-serif", "'Comic Sans MS', cursive", 'Arial, sans-serif', "'Courier New', monospace", 'Georgia, serif'];
  const types = ['text', 'image', 'menu', 'button', 'accordion'];
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  function color(value) {
    if (value == null || value === '') return null;
    if (typeof value !== 'string' || !/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value)) throw new Error('Invalid color');
    return value;
  }
  function richHTML(value) {
    const template = document.createElement('template');
    template.innerHTML = String(value ?? '');
    const allowed = new Set(['DIV', 'P', 'BR', 'SPAN', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'SUB', 'SUP']);
    const discard = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'LINK', 'META', 'BASE', 'TEMPLATE']);
    function clean(parent) {
      for (const node of [...parent.childNodes]) {
        if (node.nodeType === 3) continue;
        if (node.nodeType !== 1 || discard.has(node.tagName)) { node.remove(); continue; }
        clean(node);
        if (!allowed.has(node.tagName)) { node.replaceWith(...node.childNodes); continue; }
        const style = node.style;
        const safeStyle = {};
        for (const prop of ['color', 'background-color', 'font-size', 'font-weight', 'font-style', 'text-decoration', 'text-align']) {
          const val = style.getPropertyValue(prop);
          if (val && !/[<>\\]|url\s*\(|expression\s*\(/i.test(val) && CSS.supports(prop, val)) safeStyle[prop] = val;
        }
        for (const attr of [...node.attributes]) node.removeAttribute(attr.name);
        for (const [prop, val] of Object.entries(safeStyle)) node.style.setProperty(prop, val);
      }
    }
    clean(template.content);
    return template.innerHTML;
  }
  function number(value, fallback, min = 0, max = 1000000) {
    if (value == null) return fallback;
    if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') throw new Error('Invalid numeric value');
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max) throw new Error('Dimension or position is out of range');
    return n;
  }
  function image(value) {
    const path = String(value ?? '').replace(/\\/g, '/');
    if (!path) return '';
    // Images are relative media references, never active URLs or data markup.
    if (path.startsWith('/') || /[:<>"'?#\x00-\x1f]/.test(path) || path.split('/').some(p => p === '..' || p === '.')) throw new Error('Invalid image reference');
    return path;
  }
  function normalize(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected a QuickBox document');
    if (input.version && (!/^\d+\.\d+(?:\.\d+)?$/.test(input.version) || Number(input.version.split('.')[0]) > 1)) throw new Error('Unsupported document version');
    const sourcePages = input.pages ?? (Array.isArray(input.boxes) ? [{id:'page-1', name:'Page 1', canvasSize:input.canvasSize, boxes:input.boxes}] : null);
    if (!Array.isArray(sourcePages) || sourcePages.length === 0 || sourcePages.length > 200) throw new Error('Document must contain 1–200 pages');
    const ids = new Set();
    const links = [];
    const pageIds = new Set();
    const boxIds = new Set();
    let count = 0;
    function id(value, pattern) {
      if (typeof value !== 'string' || !pattern.test(value) || ids.has(value)) throw new Error('Invalid or duplicate ID: ' + value);
      ids.add(value); return value;
    }
    function link(value) {
      if (!value) return null;
      const target = value.target ?? value.pageId;
      if (!['page', 'anchor', 'modal'].includes(value.type) || typeof target !== 'string') throw new Error('Invalid link');
      const result = {type:value.type, target}; links.push(result); return result;
    }
    function list(value, label) {
      if (!Array.isArray(value)) throw new Error(label + ' must be an array');
      return value;
    }
    function itemId(value, seen) {
      if (typeof value !== 'string' || !/^[\w-]+$/.test(value) || seen.has(value)) throw new Error('Invalid or duplicate item ID');
      seen.add(value); return value;
    }
    function menu(items, depth = 0, seen = new Set()) {
      if (depth > 10) throw new Error('Menu nesting is too deep');
      return list(items, 'Menu items').map(item => {
        if (++count > 10000) throw new Error('Too many elements');
        return {id:itemId(item.id, seen), text:String(item.text ?? ''), linkTo:link(item.linkTo), children:menu(item.children ?? [], depth + 1, seen)};
      });
    }
    function boxes(items) {
      return list(items, 'Boxes').map(box => {
        if (++count > 10000 || !box || !types.includes(box.type)) throw new Error('Invalid element type or too many elements');
        const boxId = id(box.id, /^box-\d+$/); boxIds.add(boxId);
        const result = {id:boxId, name:String(box.name ?? boxId), type:box.type,
          x:number(box.x, 0), y:number(box.y, 0), width:number(box.width, 200, 1), height:number(box.height, 120, 1),
          zIndex:number(box.zIndex, 1, -1000000), fontSize:number(box.fontSize, 16, 1, 512),
          fontFamily:fonts.includes(box.fontFamily) ? box.fontFamily : fonts[0],
          content:box.type === 'image' ? image(box.content) : richHTML(box.content ?? box.text), linkTo:link(box.linkTo ?? box.link)};
        if (box.styleOverrides) {
          result.styleOverrides = {};
          for (const prop of ['fill', 'border', 'textColor']) {
            const c = color(box.styleOverrides[prop]); if (c) result.styleOverrides[prop] = c;
          }
        }
        if (box.type === 'menu') { result.orientation = box.orientation === 'vertical' ? 'vertical' : 'horizontal'; result.menuItems = menu(box.menuItems ?? []); }
        if (box.type === 'accordion') {
          let expanded = false;
          const seen = new Set();
          result.accordionItems = list(box.accordionItems ?? [], 'Accordion items').map(item => {
            if (++count > 10000) throw new Error('Too many elements');
            const isExpanded = !!item.isExpanded && !expanded; expanded ||= isExpanded;
            return {id:itemId(item.id, seen), title:String(item.title ?? ''), body:String(item.body ?? item.content ?? ''), isExpanded};
          });
        }
        return result;
      });
    }
    const pages = sourcePages.map(page => {
      const pageId = id(page.id, /^page-\d+$/); pageIds.add(pageId);
      const canvasSize = page.canvasSize ?? 'desktop';
      if (!['desktop', 'tablet', 'mobile', 'custom'].includes(canvasSize)) throw new Error('Invalid canvas size');
      const result = {id:pageId, name:String(page.name ?? pageId), canvasSize, boxes:boxes(page.boxes), customWidth:number(page.customWidth, null, 300), customHeight:number(page.customHeight, null, 300)};
      if (page.isModal === true) result.isModal = true;
      if (canvasSize === 'custom' && (!result.customWidth || !result.customHeight)) throw new Error('Custom canvas requires width and height');
      return result;
    });
    function region(value) { return {boxes:boxes(value?.boxes ?? []), height:number(value?.height, 80, 60), colorOverride:color(value?.colorOverride)}; }
    const header = region(input.header), footer = region(input.footer);
    for (const l of links) {
      const targets = l.type === 'modal' ? new Set(pages.filter(p => p.isModal).map(p => p.id)) : l.type === 'page' ? new Set(pages.filter(p => !p.isModal).map(p => p.id)) : boxIds;
      if (!targets.has(l.target)) throw new Error('Link target does not exist: ' + l.target);
    }
    if (!pages.some(p => !p.isModal)) throw new Error('Document requires at least one regular page');
    const active = input.themes?.active ?? 'sketch';
    if (!/^[a-z0-9-]+$/.test(active)) throw new Error('Invalid palette ID');
    const themes = {active, palettes:{}};
    if (input.themes?.variables) {
      themes.variables = {};
      for (const [key, value] of Object.entries(input.themes.variables)) {
        if (/^--(?:canvas-bg|header-bg|footer-bg|(?:text|image|menu|button|accordion)-(?:fill|border|color))$/.test(key)) themes.variables[key] = color(value);
      }
    }
    const projectMediaPath = input.projectMediaPath == null ? null : String(input.projectMediaPath).replace(/\\/g, '/');
    if (projectMediaPath && !/^(?:[A-Za-z]:\/|\/)[^<>"'?#\x00-\x1f]*$/.test(projectMediaPath)) throw new Error('Invalid media folder');
    return {header, footer, pages, currentPageId:pageIds.has(input.currentPageId) ? input.currentPageId : pages[0].id,
      themes, globalFont:fonts.includes(input.globalFont) ? input.globalFont : fonts[0], projectMediaPath};
  }
  return {normalize, richHTML, escapeHTML, color, image, fonts};
})();
