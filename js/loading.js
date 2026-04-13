/* ============================================
   loading.js — Metallic Page Loader
   Auto-injects on every page that includes it
============================================ */

(function () {
  // ─── Inject CSS ────────────────────────────
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/loading.css';
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

  // Inject at top of body before content renders
  document.documentElement.style.overflow = 'hidden';
  if (document.body) {
    document.body.prepend(loader);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.body.prepend(loader));
  }

  // ─── Hide loader when page is ready ────────
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

  // ─── Page transition on link clicks ────────
  const transition = document.createElement('div');
  transition.className = 'gt-page-transition';
  document.body?.appendChild(transition) || document.addEventListener('DOMContentLoaded', () => document.body.appendChild(transition));

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    // Only internal page links
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('javascript')) return;
    if (link.target === '_blank') return;

    e.preventDefault();
    transition.classList.add('active');
    setTimeout(() => { window.location.href = href; }, 250);
  });
})();