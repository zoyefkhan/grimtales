/* ============================================
   loading.js — Metallic Page Loader
============================================ */

(function () {
  // ─── Inject CSS using absolute path ────────
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  // Use absolute path so it works on all pages at any depth
  link.href = '/css/loading.css';
  document.head.appendChild(link);

  // ─── Build loader HTML ─────────────────────
  const loader = document.createElement('div');
  loader.id = 'gt-loader';
  loader.innerHTML = `
    <div class="loader-logo">
      <div class="loader-hex">
        <span class="loader-hex-inner">✦</span>
      </div>
      <div class="loader-title">Grim<span>Tales</span></div>
    </div>
    <div class="loader-bars">
      <div class="loader-bar"></div>
      <div class="loader-bar"></div>
      <div class="loader-bar"></div>
      <div class="loader-bar"></div>
      <div class="loader-bar"></div>
    </div>
    <div class="loader-text">
      Entering the darkness<span class="loader-dots"></span>
    </div>
  `;

  document.documentElement.style.overflow = 'hidden';
  if (document.body) {
    document.body.prepend(loader);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.body.prepend(loader));
  }

  // ─── Hide loader when page ready ───────────
  function hideLoader() {
    document.documentElement.style.overflow = '';
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 550);
  }

  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 600);
  } else {
    window.addEventListener('load', () => setTimeout(hideLoader, 600));
  }

  // ─── Page transition ────────────────────────
  function setupTransition() {
    const transition = document.createElement('div');
    transition.className = 'gt-page-transition';
    document.body.appendChild(transition);

    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');

      // Skip: external, hash, mailto, javascript, blank target
      if (!href) return;
      if (href.startsWith('http') || href.startsWith('//')) return;
      if (href.startsWith('#')) return;
      if (href.startsWith('mailto') || href.startsWith('tel')) return;
      if (anchor.target === '_blank') return;

      e.preventDefault();
      transition.classList.add('active');
      setTimeout(() => { window.location.href = href; }, 220);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTransition);
  } else {
    setupTransition();
  }
})();