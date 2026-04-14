/* ============================================
   home.js — Homepage with real Supabase data
============================================ */

// ─── Particles ────────────────────────────────
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*8+6}s;animation-delay:${Math.random()*6}s`;
    container.appendChild(p);
  }
}

// ─── Load real novels from Supabase ──────────
async function initNewReleases() {
  const grid = document.getElementById('newReleasesGrid');
  if (!grid) return;

  grid.innerHTML = renderSkeletons(8);

  try {
    const novels = await window.GT_Data.fetchNovels({ sort: 'new', limit: 8 });
    if (novels.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--ash)">
        <div style="font-size:2.5rem;margin-bottom:1rem;opacity:0.3">📚</div>
        <p>No novels published yet.<br>
        <a href="dashboard.html" style="color:var(--crimson-glow)">Be the first to publish! →</a></p>
      </div>`;
      return;
    }
    grid.innerHTML = novels.map(n => window.renderNovelCard(n)).join('');
  } catch(e) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--ash)">Failed to load novels. Check your internet connection.</div>`;
  }
}

// ─── Load trending novels ─────────────────────
async function initTrending() {
  const list = document.getElementById('trendingList');
  if (!list) return;

  list.innerHTML = Array(5).fill(`<div style="height:80px;background:var(--metal-card);border:var(--border-subtle);border-radius:var(--radius-lg);margin-bottom:0.75rem;animation:pulse 1.5s ease infinite"></div>`).join('');

  try {
    const novels = await window.GT_Data.fetchNovels({ sort: 'total_views', limit: 5 });
    if (novels.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--ash)">No novels yet. <a href="dashboard.html" style="color:var(--crimson-glow)">Publish one!</a></div>`;
      return;
    }
    list.innerHTML = novels.map((novel, i) => `
      <div class="trending-item" onclick="window.location='novel-detail.html?id=${novel.id}'">
        <div class="trending-rank ${i < 3 ? 'top' : ''}">${i + 1}</div>
        <div class="trending-cover">
          ${novel.cover_url
            ? `<img src="${novel.cover_url}" alt="${novel.title}" style="width:100%;height:100%;object-fit:cover">`
            : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a0000,#2d0505);display:flex;align-items:center;justify-content:center;padding:0.3rem"><span style="font-family:var(--font-heading);font-size:0.5rem;color:var(--white);text-align:center;line-height:1.2">${novel.title}</span></div>`
          }
        </div>
        <div class="trending-info">
          <div class="trending-title">${novel.title}</div>
          <div class="trending-author">${novel.author?.username || 'Unknown'}</div>
          <div class="trending-tags"><span class="tag">${(novel.genres||[])[0]||'Fiction'}</span></div>
        </div>
        <div class="trending-meta">
          <span class="trending-rating">★ ${novel.avg_rating || '—'}</span>
          <span class="trending-views">${novel.total_views?.toLocaleString()||0} views</span>
        </div>
      </div>`).join('');
  } catch(e) {
    list.innerHTML = `<div style="color:var(--ash);padding:1rem">Could not load trending novels.</div>`;
  }
}

// ─── Load featured novel ──────────────────────
async function initFeatured() {
  const container = document.getElementById('featuredNovelContainer');
  if (!container) return;

  try {
    const sb = await window.GT_Supabase?.getSupabase();
    if (!sb) return;

    const { data: novels } = await sb.from('novels')
      .select('*, author:profiles(username)')
      .eq('is_featured', true)
      .eq('is_visible', true)
      .limit(1);

    if (!novels || novels.length === 0) {
      // Show latest novel as featured if none marked featured
      const latest = await window.GT_Data.fetchNovels({ sort: 'new', limit: 1 });
      if (latest.length > 0) renderFeatured(container, latest[0]);
      else container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--ash)">No novels published yet.</div>`;
      return;
    }
    renderFeatured(container, novels[0]);
  } catch(e) { /* silent */ }
}

function renderFeatured(container, novel) {
  container.innerHTML = `
    <div class="featured-novel" onclick="window.location='novel-detail.html?id=${novel.id}'" style="cursor:pointer">
      <div class="featured-novel-bg"></div>
      <div class="featured-cover">
        ${novel.cover_url
          ? `<img src="${novel.cover_url}" alt="${novel.title}">`
          : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a0000,#2d0505,#1a0000);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;text-align:center">
              <div style="font-family:var(--font-heading);font-size:0.6rem;letter-spacing:0.2em;color:var(--crimson-glow);border:1px solid rgba(192,57,43,0.3);padding:0.2em 0.6em;margin-bottom:1.5rem;text-transform:uppercase">${(novel.genres||['Fiction'])[0]}</div>
              <div style="font-family:var(--font-display);font-size:1.1rem;color:var(--white);line-height:1.3">${novel.title}</div>
              <div style="width:40px;height:1px;background:var(--crimson);margin:1rem auto"></div>
              <div style="font-family:var(--font-heading);font-size:0.6rem;letter-spacing:0.2em;color:var(--ash);text-transform:uppercase">${novel.author?.username||'Unknown'}</div>
            </div>`
        }
      </div>
      <div class="featured-content">
        <div class="featured-label">Featured Novel</div>
        <h2 class="featured-title">${novel.title}</h2>
        <div class="featured-author">by ${novel.author?.username||'Unknown'}</div>
        <div class="featured-tags">
          ${(novel.genres||[]).slice(0,3).map(g=>`<span class="tag">${g}</span>`).join('')}
        </div>
        <p class="featured-desc">${novel.synopsis||''}</p>
        <div class="featured-stats">
          <div><div class="featured-stat-val">★ ${novel.avg_rating||'—'}</div><div class="featured-stat-key">Rating</div></div>
          <div><div class="featured-stat-val">${novel.total_chapters}</div><div class="featured-stat-key">Chapters</div></div>
          <div><div class="featured-stat-val">${novel.total_views?.toLocaleString()||0}</div><div class="featured-stat-key">Views</div></div>
          <div><div class="featured-stat-val">${novel.status||'—'}</div><div class="featured-stat-key">Status</div></div>
        </div>
        <div class="featured-actions">
          <a href="novel-detail.html?id=${novel.id}" class="btn btn-crimson">Read Now ›</a>
        </div>
      </div>
    </div>`;
}

// ─── Skeleton loader ──────────────────────────
function renderSkeletons(count) {
  return Array(count).fill(`
    <div style="background:var(--metal-card);border:var(--border-subtle);border-radius:var(--radius-lg);overflow:hidden">
      <div style="aspect-ratio:2/3;background:linear-gradient(135deg,#110000,#1a0505);animation:pulse 1.5s ease infinite"></div>
      <div style="padding:1rem">
        <div style="height:12px;background:var(--charcoal-light);border-radius:3px;margin-bottom:0.5rem;animation:pulse 1.5s ease infinite"></div>
        <div style="height:10px;background:var(--charcoal-light);border-radius:3px;width:70%;animation:pulse 1.5s ease infinite"></div>
      </div>
    </div>`).join('');
}

// ─── Newsletter ───────────────────────────────
function initNewsletter() {
  const btn = document.querySelector('.newsletter-form button');
  const inp = document.querySelector('.newsletter-form input');
  btn?.addEventListener('click', () => {
    if (inp?.value && inp.value.includes('@')) {
      showToast('Welcome to the darkness! 🌑 Check your inbox.');
      inp.value = '';
    } else {
      showToast('Please enter a valid email.', 'error');
    }
  });
}

// ─── Responsive trending layout ───────────────
function fixLayout() {
  const layout = document.querySelector('.trending-layout');
  if (!layout) return;
  layout.style.gridTemplateColumns = window.innerWidth <= 768 ? '1fr' : '1fr 380px';
}

// ─── Counter animation ────────────────────────
async function initCounters() {
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return;

  try {
    const [novelsRes, profilesRes] = await Promise.all([
      sb.from('novels').select('id', { count: 'exact', head: true }).eq('is_visible', true),
      sb.from('profiles').select('id', { count: 'exact', head: true }),
    ]);

    const stats = document.querySelectorAll('.hero-stat-num');
    const values = [
      novelsRes.count ? `${novelsRes.count.toLocaleString()}` : '0',
      profilesRes.count ? `${profilesRes.count.toLocaleString()}` : '0',
      '0',
    ];
    stats.forEach((el, i) => { if (values[i]) el.textContent = values[i]; });
  } catch(e) { /* silent */ }
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initFeatured();
  initNewReleases();
  initTrending();
  initNewsletter();
  fixLayout();
  initCounters();
  window.addEventListener('resize', fixLayout);
});