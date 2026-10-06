// @agent:HTMLExportRuntime:authority
// Serialized into the exported document; no editor dependencies.
function initializeQuickBoxExport() {
  function resizePage(page) {
    if (!page || !page.classList.contains('visible')) return;
    const canvas = page.querySelector('.export-canvas');
    let height = 0;
    for (const region of canvas.children) {
      let required = Number(region.dataset.minHeight) || 60;
      for (const box of region.children) {
        if (box.classList.contains('accordion-box')) {
          const content = box.querySelector('.accordion-content');
          box.style.height = Math.max(120, content.scrollHeight + 14) + 'px';
        }
        required = Math.max(required, box.offsetTop + box.offsetHeight + 20);
      }
      region.style.height = required + 'px';
      height += region.offsetHeight;
    }
    canvas.style.height = height + 'px';
  }
  function showPage(pageId) {
    document.querySelectorAll('dialog.qb-modal[open]').forEach(dialog => dialog.close());
    const pages = [...document.querySelectorAll('.page-wrapper')];
    const page = pages.find(p => p.dataset.pageId === pageId);
    if (!page) return;
    pages.forEach(p => p.classList.toggle('visible', p === page));
    document.querySelectorAll('.export-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === pageId));
    resizePage(page);
  }
  function follow(link) {
    if (link.type === 'modal') {
      const dialog = [...document.querySelectorAll('dialog[data-modal-id]')].find(d => d.dataset.modalId === link.target);
      if (dialog) {
        document.querySelectorAll('dialog.qb-modal[open]').forEach(d => d.close());
        dialog.showModal();
      }
      return;
    }
    if (link.type === 'page') { showPage(link.target); return; }
    if (link.type !== 'anchor') return;
    const modal = [...document.querySelectorAll('dialog[data-modal-id]')].find(d => [...d.querySelectorAll('[data-box-id]')].some(b => b.dataset.boxId === link.target));
    if (modal) {
      follow({type:'modal',target:modal.dataset.modalId});
      const target = [...modal.querySelectorAll('[data-box-id]')].find(b => b.dataset.boxId === link.target);
      target.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    let page = document.querySelector('.page-wrapper.visible');
    const find = p => [...p.querySelectorAll('[data-box-id]')].find(b => b.dataset.boxId === link.target);
    let target = page && find(page);
    if (!target) {
      page = [...document.querySelectorAll('.page-wrapper')].find(p => find(p));
      if (!page) return;
      showPage(page.dataset.pageId);
      target = find(page);
    }
    target.scrollIntoView({behavior:'smooth', block:'center'});
    target.classList.remove('anchor-highlight');
    void target.offsetWidth;
    target.classList.add('anchor-highlight');
  }
  document.addEventListener('click', event => {
    const dialog = event.target.closest('dialog.qb-modal');
    if (dialog && (event.target === dialog || event.target.closest('[data-modal-close]'))) { dialog.close(); return; }
    const nav = event.target.closest('.export-nav-btn');
    if (nav) { showPage(nav.dataset.page); return; }
    const header = event.target.closest('.accordion-header');
    if (header) {
      const body = header.nextElementSibling;
      const open = body.style.display === 'block';
      const accordion = header.closest('.accordion-content');
      accordion.querySelectorAll('.accordion-body').forEach(b => { b.style.display = 'none'; });
      accordion.querySelectorAll('.accordion-indicator').forEach(i => { i.textContent = '+'; });
      if (!open) { body.style.display = 'block'; header.querySelector('.accordion-indicator').textContent = '−'; }
      if (dialog) header.closest('.box').style.height = accordion.scrollHeight + 14 + 'px';
      resizePage(header.closest('.page-wrapper'));
      return;
    }
    const el = event.target.closest('[data-link]');
    if (el) {
      try { follow(JSON.parse(el.dataset.link)); } catch (error) { console.error('Invalid exported link', error); }
    }
  });
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.accordion-header,[data-link]')) {
      event.preventDefault(); event.target.click();
    }
  });
  const resizeVisible = () => resizePage(document.querySelector('.page-wrapper.visible'));
  window.addEventListener('resize', resizeVisible);
  document.querySelectorAll('img').forEach(img => img.addEventListener('load', resizeVisible));
  if (document.fonts) document.fonts.ready.then(resizeVisible);
  resizeVisible();
}
