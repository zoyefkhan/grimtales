/* ============================================
   dashboard.js — Author Dashboard
   Fixed: no demo data, sign-in bug, 
   all buttons working, real Supabase data
============================================ */

let currentPanel = 'overviewPanel';

function showPanel(id) {
  document.querySelectorAll('#dashMain > div[id]').forEach(p => p.style.display = 'none');
  const panel = document.getElementById(id);
  if (panel) panel.style.display = 'block';
  currentPanel = id;
  document.querySelectorAll('.dash-nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`.dash-nav-link[data-panel="${id}"]`)?.classList.add('active');
}

// ─── Load user into dashboard UI ─────────────
async function loadDashboardUser() {
  // Get FRESH user from Supabase — not just localStorage
  const sb = await window.GT_Supabase?.getSupabase();
  let user = JSON.parse(localStorage.getItem('gt-user') || '{}');

  if (sb && user.id) {
    try {
      // Refresh from Supabase auth
      const { data: { user: sbUser } } = await sb.auth.getUser();
      if (sbUser) {
        // Get profile from DB
        const { data: profile } = await sb.from('profiles').select('*').eq('id', sbUser.id).single();
        if (profile) {
          user = {
            id:       sbUser.id,
            username: profile.username || sbUser.email?.split('@')[0] || 'User',
            email:    sbUser.email,
            role:     profile.role || 'author',
            avatar:   profile.avatar_url || sbUser.user_metadata?.avatar_url || '',
          };
          localStorage.setItem('gt-user', JSON.stringify(user));
        }
      }
    } catch(e) { /* use localStorage fallback */ }
  }

  if (!user.username) return;

  // Update displays
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';

  document.querySelectorAll('.dash-greeting').forEach(el => el.textContent = greeting);
  document.querySelectorAll('.dash-title').forEach(el => el.textContent = user.username);
  document.querySelectorAll('.dash-username').forEach(el => el.textContent = user.username);
  document.querySelectorAll('.dash-role').forEach(el => el.textContent = '✦ Author');

  // Avatar — only update dash avatar, not navbar (navbar handled by app.js)
  document.querySelectorAll('.dash-avatar').forEach(el => {
    const inner = el.querySelector('div') || el;
    if (user.avatar) {
      inner.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      inner.innerHTML = '';
      inner.textContent = (user.username || '?').slice(0, 2).toUpperCase();
      inner.style.cssText += ';display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-size:1.2rem;color:var(--crimson-glow)';
    }
  });
}

// ─── Load real stats ──────────────────────────
async function loadStats() {
  const sb = await window.GT_Supabase?.getSupabase();
  const user = JSON.parse(localStorage.getItem('gt-user') || '{}');

  // Reset to zero while loading
  ['statViews','statFollowers','statComments','statRating'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });

  if (!sb || !user.id) return;

  try {
    const { data: novels } = await sb.from('novels')
      .select('id, total_views, avg_rating, total_chapters')
      .eq('author_id', user.id);

    const totalViews = novels?.reduce((s, n) => s + (n.total_views || 0), 0) || 0;
    const avgRating  = novels?.length
      ? (novels.reduce((s, n) => s + (n.avg_rating || 0), 0) / novels.length).toFixed(1)
      : '—';

    const { count: followers } = await sb.from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);

    const novelIds = novels?.map(n => n.id) || [];
    let commentCount = 0;
    if (novelIds.length) {
      const { count } = await sb.from('comments')
        .select('*', { count: 'exact', head: true })
        .in('novel_id', novelIds);
      commentCount = count || 0;
    }

    const fmt = n => n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(0)+'K' : String(n);

    const el = id => document.getElementById(id);
    if (el('statViews'))     el('statViews').textContent     = fmt(totalViews);
    if (el('statFollowers')) el('statFollowers').textContent = fmt(followers || 0);
    if (el('statComments'))  el('statComments').textContent  = fmt(commentCount);
    if (el('statRating'))    el('statRating').textContent    = avgRating;

  } catch(e) { console.error('loadStats:', e); }
}

// ─── Load novels ──────────────────────────────
async function loadMyNovels() {
  const container = document.getElementById('novelManageList');
  if (!container) return;

  container.innerHTML = `<div style="padding:2rem;text-align:center">
    <div style="height:70px;background:rgba(139,26,26,0.05);border-radius:var(--radius);margin-bottom:0.5rem;animation:pulse 1.5s ease infinite"></div>
    <div style="height:70px;background:rgba(139,26,26,0.05);border-radius:var(--radius);animation:pulse 1.5s ease infinite 0.2s"></div>
  </div>`;

  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) { container.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--ash)">Supabase not connected.</div>`; return; }

  // Get current user directly from Supabase auth
  const { data: { user: sbUser } } = await sb.auth.getUser();
  if (!sbUser) {
    container.innerHTML = `<div style="padding:2.5rem;text-align:center">
      <div style="font-size:2rem;margin-bottom:1rem;opacity:0.3">📚</div>
      <div style="color:var(--ash);margin-bottom:1.5rem">Please sign in to see your novels.</div>
      <a href="login.html" class="btn btn-crimson">Sign In →</a>
    </div>`;
    return;
  }

  const { data: novels, error } = await sb.from('novels')
    .select('*')
    .eq('author_id', sbUser.id)
    .order('updated_at', { ascending: false });

  if (error) { console.error('loadMyNovels:', error); }

  if (!novels?.length) {
    container.innerHTML = `<div style="padding:2.5rem;text-align:center">
      <div style="font-size:2rem;margin-bottom:1rem;opacity:0.3">📚</div>
      <div style="color:var(--ash);font-size:0.9rem;margin-bottom:1.5rem">No novels yet. Write your first one!</div>
      <button class="btn btn-crimson" onclick="showPanel('newNovelPanel')">+ Create Novel</button>
    </div>`;
    return;
  }

  const statusMap = { ongoing:'status-ongoing', completed:'status-completed', hiatus:'status-hiatus', draft:'status-draft' };
  container.innerHTML = novels.map(novel => `
    <div class="novel-manage-item">
      <div class="novel-manage-cover">
        ${novel.cover_url
          ? `<img src="${novel.cover_url}" style="width:100%;height:100%;object-fit:cover;border-radius:3px">`
          : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a0000,#2d0505);display:flex;align-items:center;justify-content:center;padding:0.25rem;text-align:center"><span style="font-family:var(--font-heading);font-size:0.45rem;color:var(--white-dim);line-height:1.2">${novel.title}</span></div>`
        }
      </div>
      <div>
        <div class="novel-manage-title">${novel.title}</div>
        <div class="novel-manage-meta">
          <span class="novel-status ${statusMap[novel.status]||'status-draft'}">${novel.status||'draft'}</span>
          <span>${novel.total_chapters||0} ch.</span>
          <span>${(novel.total_views||0).toLocaleString()} views</span>
          ${novel.avg_rating ? `<span style="color:var(--gold)">★${novel.avg_rating}</span>` : ''}
        </div>
      </div>
      <div class="novel-manage-actions">
        <button class="manage-btn" title="Write Chapter" onclick="openChapterEditor('${novel.id}','${novel.title.replace(/'/g,"\\'")}')">✍</button>
        <button class="manage-btn" title="View" onclick="window.open('novel-detail.html?id=${novel.id}','_blank')">👁</button>
        <button class="manage-btn delete" title="Delete" onclick="deleteNovel('${novel.id}','${novel.title.replace(/'/g,"\\'")}')">🗑</button>
      </div>
    </div>`).join('');
}

// ─── Load activity ────────────────────────────
async function loadActivity() {
  const container = document.getElementById('activityFeed');
  if (!container) return;

  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return;

  const { data: { user: sbUser } } = await sb.auth.getUser();
  if (!sbUser) return;

  const { data: novels } = await sb.from('novels').select('id').eq('author_id', sbUser.id);
  const novelIds = novels?.map(n => n.id) || [];

  if (!novelIds.length) {
    container.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--ash);font-size:0.85rem">Publish a novel to see activity here!</div>`;
    return;
  }

  const { data: comments } = await sb.from('comments')
    .select('*, author:profiles(username), novel:novels(title)')
    .in('novel_id', novelIds)
    .order('created_at', { ascending: false })
    .limit(8);

  if (!comments?.length) {
    container.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--ash);font-size:0.85rem">No comments yet on your novels.</div>`;
    return;
  }

  container.innerHTML = comments.map(c => `
    <div class="activity-item">
      <div class="activity-icon comment">💬</div>
      <div class="activity-text">
        <strong>${c.author?.username||'Someone'}</strong> commented on 
        <a href="novel-detail.html?id=${c.novel_id}" style="color:var(--crimson-glow)">${c.novel?.title||'your novel'}</a>:
        <em style="color:var(--ash)">"${(c.text||'').slice(0,60)}${c.text?.length>60?'...':''}"</em>
      </div>
      <div class="activity-time">${timeAgo(c.created_at)}</div>
    </div>`).join('');
}

// ─── Comments panel ───────────────────────────
async function loadComments() {
  const panel = document.getElementById('commentsPanel');
  if (!panel) return;
  panel.innerHTML = `<div class="dash-header"><div><div class="dash-greeting">Feedback</div><h1 class="dash-title">Comments</h1></div></div><div style="color:var(--ash);padding:2rem;text-align:center">Loading...</div>`;

  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return;
  const { data: { user: sbUser } } = await sb.auth.getUser();
  if (!sbUser) return;

  const { data: novels } = await sb.from('novels').select('id').eq('author_id', sbUser.id);
  const novelIds = novels?.map(n => n.id) || [];
  if (!novelIds.length) { panel.innerHTML += `<div style="padding:2rem;color:var(--ash)">No novels yet.</div>`; return; }

  const { data: comments } = await sb.from('comments')
    .select('*, author:profiles(username,avatar_url), novel:novels(title,id)')
    .in('novel_id', novelIds).eq('is_deleted', false)
    .order('created_at', { ascending: false }).limit(30);

  const listHTML = !comments?.length
    ? `<div style="padding:3rem;text-align:center;color:var(--ash)">No comments yet.</div>`
    : comments.map(c => `
        <div class="activity-item" style="border-bottom:var(--border-subtle);padding:1rem 1.5rem">
          <div class="activity-icon" style="background:rgba(40,100,180,0.1);border:1px solid rgba(40,100,180,0.2)">
            ${c.author?.avatar_url ? `<img src="${c.author.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : '💬'}
          </div>
          <div class="activity-text" style="flex:1">
            <strong>${c.author?.username||'Anonymous'}</strong> on 
            <a href="novel-detail.html?id=${c.novel?.id}" style="color:var(--crimson-glow)">${c.novel?.title||'novel'}</a><br>
            <span style="color:var(--ash-light);font-size:0.88rem">${c.text}</span>
          </div>
          <div class="activity-time">${timeAgo(c.created_at)}</div>
        </div>`).join('');

  panel.innerHTML = `<div class="dash-header"><div><div class="dash-greeting">Feedback</div><h1 class="dash-title">Comments</h1></div></div><div class="dash-panel"><div>${listHTML}</div></div>`;
}

// ─── Stats panel ──────────────────────────────
async function loadStatsPanel() {
  const panel = document.getElementById('statsPanel');
  if (!panel) return;

  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return;
  const { data: { user: sbUser } } = await sb.auth.getUser();
  if (!sbUser) return;

  const { data: novels } = await sb.from('novels').select('*').eq('author_id', sbUser.id);
  const totalViews = novels?.reduce((s,n)=>s+(n.total_views||0),0)||0;
  const totalChapters = novels?.reduce((s,n)=>s+(n.total_chapters||0),0)||0;
  const avgRating = novels?.length ? (novels.reduce((s,n)=>s+(n.avg_rating||0),0)/novels.length).toFixed(1) : '—';

  panel.innerHTML = `
    <div class="dash-header"><div><div class="dash-greeting">Analytics</div><h1 class="dash-title">Stats & Views</h1></div></div>
    <div class="stats-grid" style="margin-bottom:2rem">
      <div class="stat-card"><span class="stat-card-icon">👁️</span><div class="stat-card-value">${totalViews.toLocaleString()}</div><div class="stat-card-label">Total Views</div></div>
      <div class="stat-card"><span class="stat-card-icon">📚</span><div class="stat-card-value">${novels?.length||0}</div><div class="stat-card-label">Novels</div></div>
      <div class="stat-card"><span class="stat-card-icon">📖</span><div class="stat-card-value">${totalChapters}</div><div class="stat-card-label">Chapters</div></div>
      <div class="stat-card"><span class="stat-card-icon">⭐</span><div class="stat-card-value">${avgRating}</div><div class="stat-card-label">Avg Rating</div></div>
    </div>
    <div class="dash-panel">
      <div class="dash-panel-header"><span class="dash-panel-title">Novel Performance</span></div>
      ${!novels?.length ? '<div style="padding:2rem;text-align:center;color:var(--ash)">No novels yet.</div>' :
        novels.map(n => `
          <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:1rem;align-items:center;padding:1rem 1.5rem;border-bottom:var(--border-subtle)">
            <div style="font-family:var(--font-heading);font-size:0.85rem;color:var(--white-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.title}</div>
            <div style="text-align:center"><div style="font-family:var(--font-heading);color:var(--crimson-glow)">${(n.total_views||0).toLocaleString()}</div><div style="font-size:0.65rem;color:var(--ash);text-transform:uppercase">Views</div></div>
            <div style="text-align:center"><div style="font-family:var(--font-heading);color:var(--white)">${n.total_chapters||0}</div><div style="font-size:0.65rem;color:var(--ash);text-transform:uppercase">Ch.</div></div>
            <div style="text-align:center"><div style="font-family:var(--font-heading);color:var(--gold)">${n.avg_rating||'—'}</div><div style="font-size:0.65rem;color:var(--ash);text-transform:uppercase">★</div></div>
          </div>`).join('')
      }
    </div>`;
}

// ─── Reviews panel ────────────────────────────
async function loadReviews() {
  const panel = document.getElementById('reviewsPanel');
  if (!panel) return;
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return;
  const { data: { user: sbUser } } = await sb.auth.getUser();
  if (!sbUser) return;
  const { data: novels } = await sb.from('novels').select('id').eq('author_id', sbUser.id);
  const novelIds = novels?.map(n=>n.id)||[];
  const { data: ratings } = novelIds.length ? await sb.from('ratings')
    .select('*, user:profiles(username), novel:novels(title)')
    .in('novel_id', novelIds).order('created_at',{ascending:false}).limit(20) : { data:[] };

  panel.innerHTML = `
    <div class="dash-header"><div><div class="dash-greeting">Feedback</div><h1 class="dash-title">Reviews</h1></div></div>
    <div class="dash-panel">
      ${!ratings?.length ? '<div style="padding:3rem;text-align:center;color:var(--ash)">No ratings yet.</div>' :
        ratings.map(r=>`
          <div style="padding:1.25rem 1.5rem;border-bottom:var(--border-subtle)">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem">
              <span style="font-family:var(--font-heading);font-size:0.82rem;color:var(--white)">${r.user?.username||'Anonymous'}</span>
              <span style="color:var(--gold)">${'★'.repeat(r.score)}${'☆'.repeat(5-r.score)}</span>
            </div>
            <div style="font-size:0.72rem;color:var(--crimson-glow);margin-bottom:0.3rem">${r.novel?.title||''}</div>
            ${r.review?`<div style="font-size:0.85rem;color:var(--ash-light)">${r.review}</div>`:''}
            <div style="font-size:0.7rem;color:var(--ash);margin-top:0.25rem">${timeAgo(r.created_at)}</div>
          </div>`).join('')
      }
    </div>`;
}

// ─── Drafts panel ─────────────────────────────
async function loadDrafts() {
  const panel = document.getElementById('draftsPanel');
  if (!panel) return;
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return;
  const { data: { user: sbUser } } = await sb.auth.getUser();
  if (!sbUser) return;

  const { data: drafts } = await sb.from('chapters')
    .select('*, novel:novels(title,id)')
    .eq('author_id', sbUser.id).eq('is_published', false)
    .order('updated_at', { ascending: false });

  panel.innerHTML = `
    <div class="dash-header"><div><div class="dash-greeting">Unpublished</div><h1 class="dash-title">Drafts</h1></div><button class="btn btn-crimson" onclick="showPanel('editorPanel');populateNovelSelect()">+ New Chapter</button></div>
    <div class="dash-panel">
      ${!drafts?.length ? `<div style="padding:3rem;text-align:center"><div style="font-size:2rem;margin-bottom:1rem;opacity:0.3">📝</div><div style="color:var(--ash);margin-bottom:1.5rem">No drafts yet.</div><button class="btn btn-crimson" onclick="showPanel('editorPanel')">Start Writing</button></div>` :
        drafts.map(d=>`
          <div style="display:flex;align-items:center;gap:1rem;padding:1.25rem 1.5rem;border-bottom:var(--border-subtle)">
            <div style="flex:1;min-width:0">
              <div style="font-family:var(--font-heading);font-size:0.88rem;color:var(--white-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.title}</div>
              <div style="font-size:0.75rem;color:var(--ash);margin-top:0.2rem">${d.novel?.title||''} · Ch.${d.number} · ${d.word_count||0} words</div>
            </div>
            <button class="btn btn-outline" style="font-size:0.7rem;white-space:nowrap" onclick="editDraft('${d.id}')">Edit</button>
            <button class="manage-btn" title="Publish" onclick="publishDraft('${d.id}','${d.title.replace(/'/g,"\\'")}')">✓</button>
          </div>`).join('')
      }
    </div>`;
}

// ─── Delete novel ─────────────────────────────
window.deleteNovel = async function(id, title) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return;
  const { error } = await sb.from('novels').delete().eq('id', id);
  if (error) { window.showToast('Delete failed: ' + error.message, 'error'); return; }
  window.showToast(`"${title}" deleted.`);
  loadMyNovels();
};

window.openChapterEditor = function(novelId, novelTitle) {
  showPanel('editorPanel');
  populateNovelSelect().then(() => {
    const select = document.getElementById('novelSelectForChapter');
    if (select) select.value = novelId;
    document.getElementById('editorPanel').dataset.novelId = novelId;
  });
};

window.editDraft = async function(id) {
  showPanel('editorPanel');
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return;
  const { data } = await sb.from('chapters').select('*').eq('id', id).single();
  if (data) {
    const titleEl = document.getElementById('chapterTitleInput');
    const areaEl  = document.getElementById('editorArea');
    if (titleEl) titleEl.value = data.title || '';
    if (areaEl)  areaEl.value  = data.content || '';
    document.getElementById('editorPanel').dataset.chapterId = id;
    document.getElementById('editorPanel').dataset.novelId   = data.novel_id;
    updateWordCount();
    await populateNovelSelect();
    const select = document.getElementById('novelSelectForChapter');
    if (select) select.value = data.novel_id;
  }
};

window.publishDraft = async function(id, title) {
  if (!confirm(`Publish "${title}"?`)) return;
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return;
  const { error } = await sb.from('chapters').update({ is_published: true, published_at: new Date().toISOString() }).eq('id', id);
  if (error) { window.showToast('Failed: ' + error.message, 'error'); return; }
  window.showToast(`"${title}" published! ✦`);
  loadDrafts();
};

// ─── Populate novel select ────────────────────
async function populateNovelSelect() {
  const select = document.getElementById('novelSelectForChapter');
  if (!select) return;
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return;
  const { data: { user: sbUser } } = await sb.auth.getUser();
  if (!sbUser) return;
  const { data } = await sb.from('novels').select('id, title').eq('author_id', sbUser.id).order('created_at', { ascending: false });
  select.innerHTML = `<option value="">Select novel...</option>` + (data||[]).map(n => `<option value="${n.id}">${n.title}</option>`).join('');
}

// ─── Word count ───────────────────────────────
function updateWordCount() {
  const area = document.getElementById('editorArea');
  if (!area) return;
  const text  = area.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const el = id => document.getElementById(id);
  if (el('wordCount'))  el('wordCount').textContent  = words.toLocaleString();
  if (el('charCount'))  el('charCount').textContent  = text.length.toLocaleString();
  if (el('readTime'))   el('readTime').textContent   = Math.ceil(words / 250);
}

// ─── Editor ───────────────────────────────────
function initEditor() {
  const area = document.getElementById('editorArea');
  area?.addEventListener('input', updateWordCount);
  updateWordCount();

  let autoTimer;
  area?.addEventListener('input', () => { clearTimeout(autoTimer); autoTimer = setTimeout(saveDraft, 30000); });

  document.getElementById('saveDraft')?.addEventListener('click', saveDraft);
  document.getElementById('publishChapter')?.addEventListener('click', publishChapter);
  document.getElementById('backToDash')?.addEventListener('click', () => showPanel('overviewPanel'));
  document.getElementById('backToDash2')?.addEventListener('click', () => showPanel('overviewPanel'));

  document.querySelectorAll('.toolbar-btn').forEach(btn => {
    if (btn.title === 'Scene Break') {
      btn.addEventListener('click', () => {
        if (!area) return;
        const pos = area.selectionStart;
        area.value = area.value.slice(0, pos) + '\n\n— ✦ —\n\n' + area.value.slice(area.selectionEnd);
        updateWordCount();
      });
    }
  });
}

async function saveDraft() {
  const title    = document.getElementById('chapterTitleInput')?.value?.trim();
  const content  = document.getElementById('editorArea')?.value;
  const novelId  = document.getElementById('novelSelectForChapter')?.value || document.getElementById('editorPanel')?.dataset?.novelId;
  const chapterId = document.getElementById('editorPanel')?.dataset?.chapterId;

  if (!title)   { window.showToast('Add a chapter title.', 'error'); return; }
  if (!content) { window.showToast('Write some content first.', 'error'); return; }
  if (!novelId) { window.showToast('Select a novel first.', 'error'); return; }

  const sb  = await window.GT_Supabase?.getSupabase();
  const { data: { user: sbUser } } = await sb.auth.getUser();
  if (!sbUser) { window.showToast('Sign in required.', 'error'); return; }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  if (chapterId) {
    const { error } = await sb.from('chapters').update({ title, content, word_count: wordCount }).eq('id', chapterId);
    if (error) { window.showToast('Save failed: ' + error.message, 'error'); return; }
  } else {
    const { data: lastCh } = await sb.from('chapters').select('number').eq('novel_id', novelId).order('number', { ascending: false }).limit(1);
    const number = (lastCh?.[0]?.number || 0) + 1;
    const { data, error } = await sb.from('chapters')
      .insert({ novel_id: novelId, author_id: sbUser.id, title, content, number, word_count: wordCount, is_published: false })
      .select().single();
    if (error) { window.showToast('Save failed: ' + error.message, 'error'); return; }
    document.getElementById('editorPanel').dataset.chapterId = data.id;
  }
  window.showToast('Draft saved! ✦');
}

async function publishChapter() {
  const title   = document.getElementById('chapterTitleInput')?.value?.trim();
  const content = document.getElementById('editorArea')?.value?.trim();
  if (!title)           { window.showToast('Add a chapter title.', 'error'); return; }
  if (!content || content.length < 50) { window.showToast('Chapter is too short.', 'error'); return; }

  await saveDraft();
  const chapterId = document.getElementById('editorPanel')?.dataset?.chapterId;
  if (!chapterId) return;

  const sb = await window.GT_Supabase?.getSupabase();
  const novelId = document.getElementById('novelSelectForChapter')?.value || document.getElementById('editorPanel')?.dataset?.novelId;

  const { error } = await sb.from('chapters').update({ is_published: true, published_at: new Date().toISOString() }).eq('id', chapterId);
  if (error) { window.showToast('Publish failed: ' + error.message, 'error'); return; }

  if (novelId) await sb.from('novels').update({ last_chapter_at: new Date().toISOString() }).eq('id', novelId);

  window.showToast('Chapter published! ✦');
  document.getElementById('editorPanel').dataset.chapterId = '';
  document.getElementById('chapterTitleInput').value = '';
  document.getElementById('editorArea').value = '';
  updateWordCount();
  setTimeout(() => showPanel('overviewPanel'), 900);
}

// ─── Create novel ─────────────────────────────
function initNewNovel() {
  const panel = document.getElementById('newNovelPanel');
  if (!panel) return;
  const createBtn = panel.querySelector('.btn-crimson');
  if (!createBtn) return;

  createBtn.addEventListener('click', async () => {
    const inputs = panel.querySelectorAll('input[type="text"]');
    const title  = inputs[0]?.value?.trim();
    const genre  = panel.querySelector('select')?.value;
    const syn    = panel.querySelector('textarea')?.value?.trim();

    if (!title) { window.showToast('Enter a novel title.', 'error'); return; }
    if (!syn)   { window.showToast('Add a synopsis.', 'error'); return; }

    const sb = await window.GT_Supabase?.getSupabase();
    const { data: { user: sbUser } } = await sb.auth.getUser();
    if (!sbUser) { window.showToast('Sign in required.', 'error'); return; }

    createBtn.textContent = 'Creating...'; createBtn.disabled = true;

    const { data, error } = await sb.from('novels').insert({
      author_id: sbUser.id, title, synopsis: syn,
      genres: genre ? [genre] : [], status: 'draft',
    }).select().single();

    createBtn.textContent = 'Create Novel →'; createBtn.disabled = false;

    if (error) { window.showToast('Failed: ' + error.message, 'error'); return; }

    window.showToast(`"${title}" created! ✦`);
    showPanel('overviewPanel');
    loadMyNovels();
  });
}

// ─── Sidebar nav ──────────────────────────────
function initSidebarNav() {
  document.querySelectorAll('.dash-nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const panelId = link.dataset.panel;
      if (!panelId) return;
      if (panelId === 'notifications') { window.location.href = 'notifications.html'; return; }
      if (panelId === 'profile')       { window.location.href = 'user-profile.html'; return; }
      if (panelId === 'settings')      { window.location.href = 'settings.html'; return; }
      showPanel(panelId);
      loadPanelData(panelId);
    });
  });

  document.getElementById('dashWriteChapter')?.addEventListener('click', () => { showPanel('editorPanel'); populateNovelSelect(); });
  document.getElementById('dashNewNovel')?.addEventListener('click', () => showPanel('newNovelPanel'));
}

function loadPanelData(panelId) {
  switch(panelId) {
    case 'overviewPanel':  loadMyNovels(); loadActivity(); break;
    case 'draftsPanel':    loadDrafts(); break;
    case 'statsPanel':     loadStatsPanel(); break;
    case 'commentsPanel':  loadComments(); break;
    case 'reviewsPanel':   loadReviews(); break;
    case 'editorPanel':    populateNovelSelect(); break;
  }
}

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d);
  const m = Math.floor(diff/60000), h = Math.floor(m/60), dy = Math.floor(h/24);
  if (dy > 0) return `${dy}d ago`;
  if (h > 0)  return `${h}h ago`;
  if (m > 0)  return `${m}m ago`;
  return 'just now';
}
window.timeAgo = timeAgo;

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initSidebarNav();
  initEditor();
  initNewNovel();
  showPanel('overviewPanel');
  await loadDashboardUser();
  await loadStats();
  loadMyNovels();
  loadActivity();
});

