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
  link.href = '/css/loading.css';
  document.head.appendChild(link);

  // ─── Build Loader ─────────────────────────────────────────
  const loader = document.createElement('div');
  loader.id = 'gt-loader';
  loader.innerHTML = `

    <div class="loader-sigil">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" fill="none" stroke="#2a0505" stroke-width="1" class="sigil-outer-ring"/>
        <g class="sigil-rune-ring">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#5a0a0a" stroke-width="0.8" stroke-dasharray="4 7"/>
          <circle cx="50" cy="12" r="2.5" fill="#8b1a1a"/>
          <circle cx="82" cy="31" r="2.5" fill="#8b1a1a"/>
          <circle cx="82" cy="69" r="2.5" fill="#8b1a1a"/>
          <circle cx="50" cy="88" r="2.5" fill="#8b1a1a"/>
          <circle cx="18" cy="69" r="2.5" fill="#8b1a1a"/>
          <circle cx="18" cy="31" r="2.5" fill="#8b1a1a"/>
        </g>
        <g class="sigil-inner-star">
          <polygon points="50,22 65,44 85,44 72,58 77,80 50,67 23,80 28,58 15,44 35,44"
            fill="none" stroke="#7a1010" stroke-width="0.8"/>
        </g>
        <polygon points="50,30 66,39 66,61 50,70 34,61 34,39"
          fill="#0f0003" stroke="#8b1a1a" stroke-width="1.2"/>
        <text x="50" y="57" text-anchor="middle" font-size="20"
          fill="#c0392b" class="sigil-core-text">✦</text>
        <circle cx="50" cy="50" r="11" fill="none" stroke="#c0392b"
          stroke-width="0.6" opacity="0.35" class="sigil-outer-ring"/>
      </svg>
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

  const maxWait = setTimeout(hideLoader, 1500);

  if (document.readyState === 'complete') {
    clearTimeout(maxWait);
    setTimeout(hideLoader, 1200);
  } else {
    window.addEventListener('load', () => {
      clearTimeout(maxWait);
      setTimeout(hideLoader, 1200);
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
