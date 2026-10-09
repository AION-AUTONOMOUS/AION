(function(){
  // Keep the main landing interface clear; printing belongs inside individual sections.
  const page = (window.location.pathname || '/').replace(/\\/+$/, '') || '/';
  if (page === '/' || page === '/index.html') return;
  if (document.getElementById('aionPrintAllBtn')) return;

  const b = document.createElement('button');
  b.id = 'aionPrintAllBtn';
  b.type = 'button';
  b.textContent = '🖨️ طباعة';
  b.setAttribute('aria-label', 'طباعة القسم الحالي');
  b.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid rgba(56,189,248,.7);border-radius:999px;padding:8px 13px;margin:4px;background:#38bdf8;color:#020817;font-family:inherit;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap;position:relative;z-index:2;';

  b.addEventListener('click', function(){ window.print(); });

  // Put the control in the section navigation, never over a chat input or page content.
  const target = document.querySelector('.menu, .nav-links, .topnav, .top-nav, header nav, header');
  if (target) {
    target.appendChild(b);
  } else {
    const container = document.querySelector('.container, main, body');
    if (container) container.insertBefore(b, container.firstChild);
  }

  const s = document.createElement('style');
  s.textContent = '#aionPrintAllBtn:focus-visible{outline:3px solid #f5c542;outline-offset:3px}@media print{#aionPrintAllBtn{display:none!important}}@media(max-width:600px){#aionPrintAllBtn{padding:7px 10px;font-size:11px;margin:3px}}';
  document.head.appendChild(s);
})();
