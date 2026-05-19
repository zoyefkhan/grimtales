/* ============================================
   home.js — Homepage with real Supabase data
   Fixed: Start Writing button, counters,
   no demo data
============================================ */

// ─── Particles ────────────────────────────────
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*8+6}s;animation-delay:${Math.random()*6}s`;
    container.appendChild(p);
  }
}

// ─── Start Writing button ─────────────────────
// Goes to dashboard if author, register if reader, login if not logged in
function initStartWriting() {
  const btn = document.getElementById('startWritingBtn');
  if (!btn) return;
  btn.addEventListener('click', e => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('gt-user') || 'null');
    if (!user) {
      window.location.href = 'register.html';
    } else if (user.role === 'author' || user.role === 'admin') {
      window.location.href = 'dashboard.html';
    } else {
      // Reader — show upgrade prompt
      window.location.href = 'dashboard.html'; // auth-guard handles upgrade
    }
  });
}

// ─── Load real novels from Supabase ──────────
async function initNewReleases() {
  const grid = document.getElementById('newReleasesGrid');
  if (!grid) return;

  // Show skeletons
  grid.innerHTML = Array(8).fill(`
    <div style="background:var(--metal-card);border:var(--border-subtle);border-radius:var(--radius-lg);overflow:hidden">
      <div style="aspect-ratio:2/3;background:linear-gradient(135deg,#110000,#1a0505);animation:pulse 1.5s ease infinite"></div>
      <div style="padding:1rem">
        <div style="height:12px;background:rgba(139,26,26,0.1);border-radius:3px;margin-bottom:0.5rem"></div>
        <div style="height:10px;background:rgba(139,26,26,0.07);border-radius:3px;width:70%"></div>
      </div>
    </div>`).join('');

  try {
    const novels = await window.GT_Data?.fetchNovels({ sort: 'new', limit: 8 });

    if (!novels?.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem">
          <div style="font-size:3rem;margin-bottom:1.5rem;opacity:0.25">📚</div>
          <h3 style="font-family:var(--font-display);color:var(--white);margin-bottom:0.75rem;font-size:1.2rem">No novels published yet</h3>
          <p style="color:var(--ash);margin-bottom:2rem;font-size:0.9rem">Be the first author to publish on GrimTales!</p>
          <a href="dashboard.html" class="btn btn-crimson">Start Writing →</a>
        </div>`;
      return;
    }
    grid.innerHTML = novels.map(n => window.renderNovelCard(n)).join('');
  } catch(e) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--ash)">Could not load novels. Check your connection.</div>`;
  }
}

// ─── Load trending ────────────────────────────
async function initTrending() {
  const list = document.getElementById('trendingList');
  if (!list) return;

  list.innerHTML = Array(5).fill(`<div style="height:88px;background:var(--metal-card);border:var(--border-subtle);border-radius:var(--radius-lg);margin-bottom:0.75rem;animation:pulse 1.5s ease infinite"></div>`).join('');

  try {
    const novels = await window.GT_Data?.fetchNovels({ sort: 'total_views', limit: 5 });

    if (!novels?.length) {
      list.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--ash);font-size:0.88rem">No novels yet. <a href="dashboard.html" style="color:var(--crimson-glow)">Publish one!</a></div>`;
      return;
    }

    list.innerHTML = novels.map((novel, i) => {
      const cover = novel.cover_url
        ? `<img src="${novel.cover_url}" alt="${novel.title}" style="width:100%;height:100%;object-fit:cover">`
        : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a0000,#2d0505);display:flex;align-items:center;justify-content:center;padding:0.25rem"><span style="font-family:var(--font-heading);font-size:0.48rem;color:var(--white);text-align:center;line-height:1.2">${novel.title}</span></div>`;
      return `
        <div class="trending-item" onclick="window.location='novel-detail.html?id=${novel.id}'">
          <div class="trending-rank ${i < 3 ? 'top' : ''}">${i + 1}</div>
          <div class="trending-cover">${cover}</div>
          <div class="trending-info">
            <div class="trending-title">${novel.title}</div>
            <div class="trending-author">${novel.author?.username || 'Unknown'}</div>
            <div class="trending-tags"><span class="tag">${(novel.genres || [])[0] || 'Fiction'}</span></div>
          </div>
          <div class="trending-meta">
            <span class="trending-rating">★ ${novel.avg_rating || '—'}</span>
            <span class="trending-views">${(novel.total_views || 0).toLocaleString()} views</span>
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    list.innerHTML = `<div style="color:var(--ash);padding:1rem;font-size:0.85rem">Could not load trending novels.</div>`;
  }
}

// ─── Load featured novel ──────────────────────
async function initFeatured() {
  const container = document.getElementById('featuredNovelContainer');
  if (!container) return;

  try {
    const sb = await window.GT_Supabase?.getSupabase();
    if (!sb) {
      container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--ash)">Connect Supabase to show featured novels.</div>`;
      return;
    }

    // Try featured first, then latest
    let novels = null;
    const { data: featured } = await sb.from('novels')
      .select('*, author:profiles!novels_author_id_fkey(username)')
      .eq('is_featured', true).eq('is_visible', true).limit(1);

    if (featured?.length) {
      novels = featured;
    } else {
      const { data: latest } = await sb.from('novels')
        .select('*, author:profiles!novels_author_id_fkey(username)')
        .eq('is_visible', true)
        .order('created_at', { ascending: false }).limit(1);
      novels = latest;
    }

    if (!novels?.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:4rem 2rem">
          <div style="font-size:2.5rem;margin-bottom:1rem;opacity:0.25">✦</div>
          <h3 style="font-family:var(--font-display);color:var(--white);margin-bottom:0.75rem">No novels yet</h3>
          <p style="color:var(--ash);margin-bottom:1.5rem">Be the first to publish on GrimTales!</p>
          <a href="dashboard.html" class="btn btn-crimson">Start Writing →</a>
        </div>`;
      return;
    }

    const novel = novels[0];
    const cover = novel.cover_url
      ? `<img src="${novel.cover_url}" alt="${novel.title}" style="width:100%;height:100%;object-fit:cover">`
      : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a0000,#2d0505,#1a0000);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;text-align:center">
          <div style="font-family:var(--font-heading);font-size:0.6rem;letter-spacing:0.2em;color:var(--crimson-glow);border:1px solid rgba(192,57,43,0.3);padding:0.2em 0.6em;margin-bottom:1.5rem;text-transform:uppercase">${(novel.genres||['Fiction'])[0]}</div>
          <div style="font-family:var(--font-display);font-size:1.1rem;color:var(--white);line-height:1.3">${novel.title}</div>
          <div style="width:40px;height:1px;background:var(--crimson);margin:1rem auto"></div>
          <div style="font-family:var(--font-heading);font-size:0.6rem;letter-spacing:0.2em;color:var(--ash);text-transform:uppercase">${novel.author?.username||'Unknown'}</div>
        </div>`;

    container.innerHTML = `
      <div class="featured-novel" onclick="window.location='novel-detail.html?id=${novel.id}'" style="cursor:pointer">
        <div class="featured-novel-bg"></div>
        <div class="featured-cover">${cover}</div>
        <div class="featured-content">
          <div class="featured-label">Featured Novel</div>
          <h2 class="featured-title">${novel.title}</h2>
          <div class="featured-author">by ${novel.author?.username || 'Unknown'}</div>
          <div class="featured-tags">
            ${(novel.genres || []).slice(0, 3).map(g => `<span class="tag">${g}</span>`).join('')}
          </div>
          <p class="featured-desc">${novel.synopsis || ''}</p>
          <div class="featured-stats">
            <div><div class="featured-stat-val">★ ${novel.avg_rating || '—'}</div><div class="featured-stat-key">Rating</div></div>
            <div><div class="featured-stat-val">${novel.total_chapters || 0}</div><div class="featured-stat-key">Chapters</div></div>
            <div><div class="featured-stat-val">${(novel.total_views || 0).toLocaleString()}</div><div class="featured-stat-key">Views</div></div>
            <div><div class="featured-stat-val">${novel.status || '—'}</div><div class="featured-stat-key">Status</div></div>
          </div>
          <div class="featured-actions">
            <a href="novel-detail.html?id=${novel.id}" class="btn btn-crimson" onclick="event.stopPropagation()">Read Now ›</a>
          </div>
        </div>
      </div>`;
  } catch(e) {
    console.error('Featured novel error:', e);
    container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--ash)">Could not load featured novel.</div>`;
  }
}

// ─── Real counters from Supabase ─────────────
async function initCounters() {
  try {
    const sb = await window.GT_Supabase?.getSupabase();
    if (!sb) return;

    const [novelsRes, profilesRes, chaptersRes] = await Promise.all([
      sb.from('novels').select('*', { count: 'exact', head: true }).eq('is_visible', true),
      sb.from('profiles').select('*', { count: 'exact', head: true }),
      sb.from('chapters').select('*', { count: 'exact', head: true }).eq('is_published', true),
    ]);

    const stats = document.querySelectorAll('.hero-stat-num');
    const labels = document.querySelectorAll('.hero-stat-label');
    
    if (stats[0]) stats[0].textContent = (novelsRes.count || 0).toLocaleString();
    if (stats[1]) stats[1].textContent = (profilesRes.count || 0).toLocaleString();
    if (stats[2]) stats[2].textContent = (chaptersRes.count || 0).toLocaleString();

    // Update labels to match
    if (labels[0]) labels[0].textContent = 'Novels';
    if (labels[1]) labels[1].textContent = 'Readers';
    if (labels[2]) labels[2].textContent = 'Chapters';

  } catch(e) { /* silent */ }
}

// ─── Newsletter ───────────────────────────────
function initNewsletter() {
  const btn = document.querySelector('.newsletter-form button');
  const inp = document.querySelector('.newsletter-form input');
  btn?.addEventListener('click', () => {
    if (inp?.value?.includes('@')) {
      window.showToast('Welcome to the darkness! 🌑 Check your inbox.');
      inp.value = '';
    } else {
      window.showToast('Please enter a valid email.', 'error');
    }
  });
}

// ─── Responsive trending layout ───────────────
function fixLayout() {
  const layout = document.querySelector('.trending-layout');
  if (!layout) return;
  layout.style.gridTemplateColumns = window.innerWidth <= 768 ? '1fr' : '1fr 380px';
 }
// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initStartWriting();
  initFeatured();
  initNewReleases();
  initTrending();
   initNewsletter();
  initCounters();
  fixLayout();
  window.addEventListener('resize', fixLayout);
});