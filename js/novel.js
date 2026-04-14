/* ============================================
   novel.js — Novel Detail Page
   Loads real data from Supabase
   No demo data
============================================ */

// ─── Get novel ID from URL ────────────────────
function getNovelId() {
  return new URLSearchParams(window.location.search).get('id');
}

// ─── Render novel page ────────────────────────
async function loadNovelPage() {
  const id = getNovelId();
  if (!id) {
    // No ID — show empty state
    document.querySelector('.novel-hero-title')?.closest('.page-novel') && showNoNovel();
    return;
  }

  const novel = await window.GT_Data?.fetchNovel(id);
  if (!novel) { showNoNovel(); return; }

  // Update page title
  document.title = `${novel.title} — GrimTales`;

  // Update all elements
  setEl('.novel-hero-title', novel.title);
  setEl('.featured-title', novel.title);
  setEl('.novel-hero-author a', novel.author?.username || 'Unknown');

  // Update cover
  const coverEls = document.querySelectorAll('.novel-hero-cover > div, .featured-cover > div');
  if (novel.cover_url) {
    coverEls.forEach(el => {
      const img = document.createElement('img');
      img.src = novel.cover_url;
      img.alt = novel.title;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0';
      el.style.position = 'relative';
      el.appendChild(img);
    });
  }

  // Stats
  setEl('.hero-stat-val:nth-child(1)', novel.total_chapters || 0);
  const statVals = document.querySelectorAll('.hero-stat-val');
  if (statVals[0]) statVals[0].textContent = novel.total_chapters || 0;
  if (statVals[1]) statVals[1].textContent = formatNum(novel.total_views || 0);
  if (statVals[2]) statVals[2].textContent = formatNum(novel.followers?.length || 0);
  if (statVals[3]) statVals[3].textContent = '—';

  // Rating
  const ratingScore = document.querySelector('.rating-score');
  const ratingCount = document.querySelector('.rating-count');
  if (ratingScore) ratingScore.textContent = novel.avg_rating || '—';
  if (ratingCount) ratingCount.textContent = `(${novel.total_ratings || 0} ratings)`;

  // Synopsis
  const synopsisText = document.getElementById('synopsisText');
  if (synopsisText) synopsisText.innerHTML = `<p>${(novel.synopsis || 'No synopsis available.').replace(/\n\n/g, '</p><p>')}</p>`;

  // Tags
  const tagsContainers = document.querySelectorAll('.novel-hero-tags, .featured-tags');
  tagsContainers.forEach(c => {
    c.innerHTML = (novel.genres || []).map(g => `<span class="tag">${g}</span>`).join('') +
                  (novel.tags || []).slice(0,4).map(t => `<span class="tag">${t}</span>`).join('');
  });

  // Status
  const statusMap = { ongoing:'status-ongoing', completed:'status-completed', hiatus:'status-hiatus', draft:'status-draft' };
  document.querySelectorAll('.novel-status').forEach(el => {
    el.className = `novel-status ${statusMap[novel.status]||'status-draft'}`;
    el.textContent = novel.status || 'Draft';
  });

  // Info sidebar
  setEl('.info-val', novel.status);
  const infoRows = document.querySelectorAll('.info-row');
  infoRows.forEach(row => {
    const key = row.querySelector('.info-key')?.textContent?.trim().toLowerCase();
    const val = row.querySelector('.info-val');
    if (!val) return;
    if (key === 'status') val.innerHTML = `<span class="novel-status ${statusMap[novel.status]||'status-draft'}">${novel.status||'draft'}</span>`;
    if (key === 'updated') val.textContent = novel.last_chapter_at ? timeAgo(novel.last_chapter_at) : '—';
    if (key === 'words') val.textContent = formatNum(novel.total_words || 0);
    if (key === 'language') val.textContent = novel.language || 'English';
    if (key === 'started') val.textContent = novel.created_at ? new Date(novel.created_at).toLocaleDateString('en',{month:'long',year:'numeric'}) : '—';
    if (key === 'rating') { val.textContent = `★ ${novel.avg_rating||'—'} / 5.0`; val.style.color = 'var(--gold)'; }
  });

  // Author card
  const authorCard = document.querySelector('.author-card-name');
  if (authorCard) authorCard.textContent = novel.author?.username || 'Unknown';
  const authorBio = document.querySelector('.author-card-bio');
  if (authorBio) authorBio.textContent = novel.author?.bio || 'This author has not added a bio yet.';
  const authorNovels = document.querySelector('.author-card-novels');
  if (authorNovels) authorNovels.textContent = 'Author';

  // Read Now button
  const readBtn = document.querySelector('.btn-crimson[href="chapter-read.html"]');
  if (readBtn) readBtn.href = `chapter-read.html?novel=${novel.id}`;

  // Load chapters
  loadChapters(novel.id);

  // Load similar novels
  loadSimilar(novel.genres?.[0]);

  // Increment views
  const sb = await window.GT_Supabase?.getSupabase();
  if (sb) sb.from('novels').update({ total_views: (novel.total_views||0)+1 }).eq('id', novel.id).then(()=>{});
}

async function loadChapters(novelId) {
  const list = document.getElementById('chaptersList');
  if (!list) return;

  list.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--ash)">Loading chapters...</div>`;

  const chapters = await window.GT_Data?.fetchChapters(novelId);

  if (!chapters?.length) {
    list.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--ash)">No chapters published yet.</div>`;
    return;
  }

  list.innerHTML = chapters.map(ch => `
    <a href="chapter-read.html?id=${ch.id}" class="chapter-list-item unread">
      <div class="chapter-list-num">${String(ch.number).padStart(3,'0')}</div>
      <div class="chapter-read-indicator"></div>
      <div class="chapter-list-title">${ch.title}</div>
      <div class="chapter-list-date">${ch.published_at ? timeAgo(ch.published_at) : ''}</div>
    </a>`).join('');

  // Update chapter count display
  const chTitle = document.querySelector('.chapters-title');
  if (chTitle) chTitle.textContent = `${chapters.length} Chapter${chapters.length!==1?'s':''}`;

  // Sort buttons
  let reversed = false;
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reversed = btn.textContent.trim() === 'Newest';
      const sorted = reversed ? [...chapters].reverse() : chapters;
      list.innerHTML = sorted.map(ch => `
        <a href="chapter-read.html?id=${ch.id}" class="chapter-list-item unread">
          <div class="chapter-list-num">${String(ch.number).padStart(3,'0')}</div>
          <div class="chapter-read-indicator"></div>
          <div class="chapter-list-title">${ch.title}</div>
          <div class="chapter-list-date">${ch.published_at ? timeAgo(ch.published_at) : ''}</div>
        </a>`).join('');
    });
  });

  // Load more
  const loadMoreBtn = document.getElementById('loadMoreChapters');
  if (loadMoreBtn) {
    if (chapters.length <= 15) loadMoreBtn.style.display = 'none';
    else loadMoreBtn.style.display = 'block';
    loadMoreBtn.addEventListener('click', () => loadMoreBtn.style.display = 'none');
  }
}

async function loadSimilar(genre) {
  const container = document.getElementById('similarList');
  if (!container || !genre) return;
  const novels = await window.GT_Data?.fetchNovels({ genre, limit: 4 });
  if (!novels?.length) { container.innerHTML = `<div style="color:var(--ash);font-size:0.85rem">No similar novels yet.</div>`; return; }
  container.innerHTML = novels.map(n => `
    <div class="similar-item" onclick="window.location='novel-detail.html?id=${n.id}'">
      <div class="similar-cover">
        ${n.cover_url ? `<img src="${n.cover_url}" style="width:100%;height:100%;object-fit:cover">` : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a0000,#2d0505)"></div>`}
      </div>
      <div>
        <div class="similar-title">${n.title}</div>
        <div class="similar-author">${n.author?.username||'Unknown'}</div>
        <div class="similar-rating" style="color:var(--gold)">★ ${n.avg_rating||'—'}</div>
      </div>
    </div>`).join('');
}

function showNoNovel() {
  document.querySelector('.container')?.insertAdjacentHTML('afterbegin', `
    <div style="text-align:center;padding:5rem 2rem">
      <div style="font-size:3rem;margin-bottom:1.5rem;opacity:0.3">📚</div>
      <h2 style="font-family:var(--font-display);color:var(--white);margin-bottom:1rem">Novel not found</h2>
      <p style="color:var(--ash);margin-bottom:2rem">This novel may have been removed or doesn't exist.</p>
      <a href="browse.html" class="btn btn-crimson">Browse Novels</a>
    </div>`);
}

// ─── Actions ──────────────────────────────────
function initNovelActions() {
  const novelId = getNovelId();

  document.getElementById('followBtn')?.addEventListener('click', async () => {
    if (!novelId) return;
    const result = await window.GT_Data?.toggleBookmark(novelId);
    const btn = document.getElementById('followBtn');
    if (btn) {
      btn.textContent = result ? '♥ Following' : '♡ Follow';
      btn.classList.toggle('btn-crimson', !!result);
      btn.classList.toggle('btn-outline', !result);
    }
  });

  document.getElementById('bookmarkBtn')?.addEventListener('click', () => {
    window.showToast('Use the Follow button to save this novel.');
  });

  document.getElementById('rateBtn')?.addEventListener('click', async () => {
    const score = prompt('Rate this novel (1-5 stars):');
    if (score && !isNaN(score) && score >= 1 && score <= 5 && novelId) {
      const sb = await window.GT_Supabase?.getSupabase();
      const user = JSON.parse(localStorage.getItem('gt-user')||'{}');
      if (!sb || !user.id) { window.showToast('Sign in to rate.','error'); return; }
      await sb.from('ratings').upsert({ user_id:user.id, novel_id:novelId, score:+score }, { onConflict:'user_id,novel_id' });
      window.showToast(`Rated ${score} star${score>1?'s':''}! ✦`);
    }
  });
}

// ─── Synopsis toggle ──────────────────────────
function initSynopsisToggle() {
  const text   = document.getElementById('synopsisText');
  const toggle = document.getElementById('synopsisToggle');
  if (!text || !toggle) return;
  let collapsed = true;
  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    text.classList.toggle('collapsed', collapsed);
    toggle.textContent = collapsed ? '▾ Read More' : '▴ Show Less';
  });
}

// ─── Helpers ──────────────────────────────────
function setEl(selector, value) {
  const el = document.querySelector(selector);
  if (el && value !== undefined) el.textContent = value;
}
function formatNum(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
  if (n >= 1000) return (n/1000).toFixed(0)+'K';
  return n.toString();
}
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff/60000), h = Math.floor(m/60), d = Math.floor(h/24);
  if (d > 0) return `${d} day${d>1?'s':''} ago`;
  if (h > 0) return `${h} hour${h>1?'s':''} ago`;
  if (m > 0) return `${m} min ago`;
  return 'just now';
}
window.timeAgo = timeAgo;

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadNovelPage();
  initNovelActions();
  initSynopsisToggle();
});