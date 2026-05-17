/* ============================================
   loading.js — GrimTales Gothic Loader v2
   Fixed: back button black screen on mobile
   Style: Sigil + runes + blood drip bar
============================================ */
(function () {

  // ─── Fix 1: Always reset on page show (back/forward) ──────
  window.addEventListener('pageshow', function (e) {
    const overlay = document.querySelector('.gt-page-transition');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }
    const loader = document.getElementById('gt-loader');
    if (loader) loader.remove();
    document.documentElement.style.overflow = '';
    if (e.persisted) return;
  });

  // ─── Fix 2: Skip loader on back/forward navigation ────────
  const navType = performance.getEntriesByType('navigation')[0]?.type;
  if (navType === 'back_forward') return;

  // Extra mobile safety — some browsers don't report back_forward correctly
  if (sessionStorage.getItem('gt-navigating') === 'true') {
    sessionStorage.removeItem('gt-navigating');
    return;
  }

  // ─── Inject CSS ───────────────────────────────────────────
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  const scriptSrc = document.currentScript?.src || document.querySelector('script[src$="/js/loading.js"], script[src$="js/loading.js"]')?.src;
  link.href = scriptSrc ? new URL('../css/loading.css', scriptSrc).href : 'css/loading.css';
  document.head.appendChild(link);
  const loaderImageSrc = scriptSrc ? new URL('../assets/loader.svg', scriptSrc).href : 'assets/loader.svg';

  // ─── Build Loader ─────────────────────────────────────────
  const loader = document.createElement('div');
  loader.id = 'gt-loader';
  loader.innerHTML = `

    <div class="loader-sigil">
      <img src="${loaderImageSrc}" alt="GrimTales loading" />
    </div>

    <div class="loader-brand">
      <div class="loader-title">Grim<span>Tales</span></div>
      <div class="loader-subtitle">Where darkness tells its story</div>
    </div>

    <div class="loader-runes">
      <span class="loader-rune">᛭</span>
      <span class="loader-rune">ᚱ</span>
      <span class="loader-rune">᛭</span>
      <span class="loader-rune">ᚷ</span>
      <span class="loader-rune">᛭</span>
      <span class="loader-rune">ᚦ</span>
      <span class="loader-rune">᛭</span>
    </div>

    <div class="loader-drip-track">
      <div class="loader-drip-fill">
        <div class="loader-drip-glow"></div>
        <div class="loader-drip-drop"></div>
      </div>
    </div>

    <div class="loader-text">Entering the darkness<span class="loader-dots"></span></div>
  `;

  document.documentElement.style.overflow = 'hidden';
  if (document.body) document.body.prepend(loader);
  else document.addEventListener('DOMContentLoaded', () => document.body.prepend(loader));

  function hideLoader() {
    document.documentElement.style.overflow = '';
    loader.classList.add('hidden');
    setTimeout(() => loader?.remove(), 500);
  }

  const minDisplayMs = 1800;
  const maxDisplayMs = 3200;
  const startTime = Date.now();
  let hideTimeout;

  function scheduleHide() {
    if (hideTimeout) return;
    const elapsed = Date.now() - startTime;
    const delay = Math.max(0, minDisplayMs - elapsed);
    hideTimeout = setTimeout(hideLoader, delay);
  }

  const maxWait = setTimeout(() => {
    scheduleHide();
  }, maxDisplayMs);

  if (document.readyState === 'complete') {
    clearTimeout(maxWait);
    scheduleHide();
  } else {
    window.addEventListener('load', () => {
      clearTimeout(maxWait);
      scheduleHide();
    }, { once: true });
  }

  // ─── Page transition overlay ──────────────────────────────
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
      sessionStorage.setItem('gt-navigating', 'true');
      overlay.classList.add('active');
      setTimeout(() => {
        sessionStorage.removeItem('gt-navigating');
        window.location.href = href;
      }, 180);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupTransition);
  else setupTransition();

})();
