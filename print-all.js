(function(){
  if(document.getElementById('aionPrintAllBtn')) return;
  const b=document.createElement('button');
  b.id='aionPrintAllBtn'; b.type='button'; b.textContent='🖨️ طباعة';
  b.setAttribute('aria-label','طباعة الصفحة');
  b.style.cssText='position:fixed;right:16px;bottom:16px;z-index:99999;border:0;border-radius:999px;padding:12px 18px;background:#38bdf8;color:#020817;font-weight:800;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.22);cursor:pointer';
  b.onclick=function(){window.print()};
  document.body.appendChild(b);
  const s=document.createElement('style');
  s.textContent='@media print{#aionPrintAllBtn{display:none!important}}';
  document.head.appendChild(s);
})();
