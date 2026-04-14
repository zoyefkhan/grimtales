/* ============================================
   loading.js — Fast Page Loader
   Optimized: shorter delay, no back-button block
============================================ */
(function () {
  // ─── Skip loader on back/forward navigation ─
  if (performance.getEntriesByType('navigation')[0]?.type === 'back_forward') return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/css/loading.css';
  document.head.appendChild(link);

  const loader = document.createElement('div');
  loader.id = 'gt-loader';
  loader.innerHTML = `
    <div class="loader-logo">
      <div class="loader-hex"><span class="loader-hex-inner">✦</span></div>
      <div class="loader-title">Grim<span>Tales</span></div>
    </div>
    <div class="loader-bars">
      <div class="loader-bar"></div><div class="loader-bar"></div>
      <div class="loader-bar"></div><div class="loader-bar"></div>
      <div class="loader-bar"></div>
    </div>
    <div class="loader-text">Entering the darkness<span class="loader-dots"></span></div>`;

  document.documentElement.style.overflow = 'hidden';
  if (document.body) document.body.prepend(loader);
  else document.addEventListener('DOMContentLoaded', () => document.body.prepend(loader));

  function hideLoader() {
    document.documentElement.style.overflow = '';
    loader.classList.add('hidden');
    setTimeout(() => loader?.remove(), 500);
  }

  // Hide quickly — max 800ms wait
  const maxWait = setTimeout(hideLoader, 800);

  if (document.readyState === 'complete') {
    clearTimeout(maxWait);
    setTimeout(hideLoader, 300);
  } else {
    window.addEventListener('load', () => {
      clearTimeout(maxWait);
      setTimeout(hideLoader, 300);
    }, { once: true });
  }

  // ─── Page transition (skip same-page anchors) ─
  function setupTransition() {
    const overlay = document.createElement('div');
    overlay.className = 'gt-page-transition';
    document.body.appendChild(overlay);

    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto') || href.startsWith('tel') ||
          href.startsWith('javascript') || a.target === '_blank') return;

      e.preventDefault();
      overlay.classList.add('active');
      // Navigate after very short delay
      setTimeout(() => { window.location.href = href; }, 180);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupTransition);
  else setupTransition();
})();