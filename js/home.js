/* ============================================
   home.js — Homepage Logic
============================================ */

// ─── Hero Particles ──────────────────────────
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;

  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      animation-duration: ${Math.random() * 8 + 6}s;
      animation-delay: ${Math.random() * 6}s;
      opacity: ${Math.random() * 0.4 + 0.1};
    `;
    container.appendChild(p);
  }
}

// ─── New Releases Grid ───────────────────────
function initNewReleases() {
  const grid = document.getElementById('newReleasesGrid');
  if (!grid) return;

  const novels = window.MOCK_NOVELS || [];
  grid.innerHTML = novels.slice(0, 8).map(n => window.renderNovelCard(n)).join('');
}

// ─── Trending List ───────────────────────────
const TRENDING_DATA = [
  { rank: 1, title: 'Court of Bleeding Stars', author: 'Lyra Mourne', genre: 'Gothic Romance', rating: 4.7, views: '5.1M', color: ['#1a0808','#200808'], top: true },
  { rank: 2, title: 'Pale Kings Rising', author: 'Marcus Vale', genre: 'Dark Fantasy', rating: 4.9, views: '3.8M', color: ['#1a1508','#2a2010'], top: true },
  { rank: 3, title: 'The Last Gravedigger', author: 'Tor Halverson', genre: 'Horror', rating: 4.7, views: '2.1M', color: ['#0a1a0a','#0d240d'], top: false },
  { rank: 4, title: 'The Obsidian Court', author: 'Marcus Vale', genre: 'Dark Fantasy', rating: 4.8, views: '1.2M', color: ['#1a0808','#2d1010'], top: false },
  { rank: 5, title: 'Daughters of Ash', author: 'Seraphina Lowe', genre: 'Gothic Horror', rating: 4.6, views: '840K', color: ['#0d0d1a','#1a0d2d'], top: false },
];

function initTrending() {
  const list = document.getElementById('trendingList');
  if (!list) return;

  list.innerHTML = TRENDING_DATA.map(item => `
    <div class="trending-item" onclick="window.location='novel-detail.html'" style="animation-delay:${item.rank * 0.08}s">
      <div class="trending-rank ${item.top ? 'top' : ''}">${item.rank}</div>
      <div class="trending-cover">
        <div style="width:100%;height:100%;background:linear-gradient(135deg,${item.color[0]},${item.color[1]});display:flex;align-items:center;justify-content:center;padding:0.3rem">
          <span style="font-family:var(--font-heading);font-size:0.55rem;color:var(--white);text-align:center;line-height:1.3">${item.title}</span>
        </div>
      </div>
      <div class="trending-info">
        <div class="trending-title">${item.title}</div>
        <div class="trending-author">${item.author}</div>
        <div class="trending-tags"><span class="tag">${item.genre}</span></div>
      </div>
      <div class="trending-meta">
        <span class="trending-rating">★ ${item.rating}</span>
        <span class="trending-views">${item.views} views</span>
      </div>
    </div>
  `).join('');
}

// ─── Responsive trending layout ──────────────
function fixTrendingLayout() {
  const layout = document.querySelector('.trending-layout');
  if (!layout) return;
  if (window.innerWidth <= 768) {
    layout.style.gridTemplateColumns = '1fr';
  } else {
    layout.style.gridTemplateColumns = '1fr 380px';
  }
}

window.addEventListener('resize', fixTrendingLayout);

// ─── Newsletter form ─────────────────────────
function initNewsletter() {
  const form = document.querySelector('.newsletter-form');
  if (!form) return;

  form.querySelector('button').addEventListener('click', () => {
    const input = form.querySelector('input');
    if (input.value && input.value.includes('@')) {
      window.showToast('Welcome to the darkness! 🌑 Check your inbox.');
      input.value = '';
    } else {
      window.showToast('Please enter a valid email address.', 'error');
    }
  });
}

// ─── Animate hero stats counter ──────────────
function animateCounter(el, target, suffix = '') {
  const num = parseFloat(target);
  const hasDecimal = target.includes('.');
  const isM = target.includes('M');
  const isK = target.includes('K');
  const base = isM ? num * 1000000 : isK ? num * 1000 : num;

  let start = 0;
  const duration = 1800;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * base);

    let display;
    if (isM) display = (current / 1000000).toFixed(1) + 'M';
    else if (isK) display = Math.floor(current / 1000) + 'K';
    else display = current.toLocaleString();

    el.textContent = display + suffix;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target + suffix;
  }

  requestAnimationFrame(update);
}

function initCounters() {
  const stats = document.querySelectorAll('.hero-stat-num');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const raw = entry.target.textContent.replace('+', '');
        const suffix = entry.target.textContent.includes('+') ? '+' : '';
        animateCounter(entry.target, raw, suffix);
        observer.unobserve(entry.target);
      }
    });
  });
  stats.forEach(s => observer.observe(s));
}

// ─── Init ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNewReleases();
  initTrending();
  fixTrendingLayout();
  initNewsletter();
  initCounters();
});
