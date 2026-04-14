/* ============================================
   dashboard.js — Author Dashboard
   All buttons working, real Supabase data
============================================ */

// ─── Active panel tracker ─────────────────────
let currentPanel = 'overviewPanel';

function showPanel(id) {
  document.querySelectorAll('.dash-main > div[id$="Panel"], .dash-main > div[id$="Editor"]').forEach(p => {
    p.style.display = 'none';
  });
  const panel = document.getElementById(id);
  if (panel) panel.style.display = 'block';
  currentPanel = id;

  // Update sidebar active state
  document.querySelectorAll('.dash-nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.dash-nav-link[data-panel="${id}"]`);
  if (activeLink) activeLink.classList.add('active');
}

// ─── Load real user data ──────────────────────
async function loadDashboardUser() {
  const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
  if (!user.username) return;

  // Update name displays
  document.querySelectorAll('.dash-username').forEach(el => el.textContent = user.username);
  document.querySelectorAll('.dash-title').forEach(el => el.textContent = user.username);
  document.querySelectorAll('.dash-greeting').forEach(el => {
    const h = new Date().getHours();
    el.textContent = h < 12 ? 'Good morning,' : h < 18 ? 'Good afternoon,' : 'Good evening,';
  });
  document.querySelectorAll('.dash-role').forEach(el => el.textContent = '✦ Author');

  // Avatar
  const avatarEls = document.querySelectorAll('.dash-avatar > div, #navAvatarInit');
  avatarEls.forEach(el => {
    if (user.avatar) {
      el.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      el.textContent = user.username.slice(0,2).toUpperCase();
    }
  });
}

// ─── Load real stats from Supabase ───────────
async function loadStats() {
  const sb = await window.GT_Supabase?.getSupabase();
  const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
  if (!sb || !user.id) {
    // Show zeros
    ['statViews','statFollowers','statComments','statRating'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '0';
    });
    return;
  }

  try {
    // Get author's novels
    const { data: novels } = await sb.from('novels')
      .select('id, total_views, avg_rating')
      .eq('author_id', user.id);

    const totalViews = novels?.reduce((sum, n) => sum + (n.total_views || 0), 0) || 0;
    const avgRating  = novels?.length ? (novels.reduce((s,n) => s + (n.avg_rating||0), 0) / novels.length).toFixed(1) : '—';

    // Get follower count
    const { count: followers } = await sb.from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);

    // Get comment count on their novels
    const novelIds = novels?.map(n => n.id) || [];
    let commentCount = 0;
    if (novelIds.length) {
      const { count } = await sb.from('comments')
        .select('*', { count: 'exact', head: true })
        .in('novel_id', novelIds);
      commentCount = count || 0;
    }

    const el = (id) => document.getElementById(id);
    if (el('statViews'))     el('statViews').textContent     = totalViews > 1000 ? (totalViews/1000).toFixed(1)+'K' : totalViews;
    if (el('statFollowers')) el('statFollowers').textContent = followers || 0;
    if (el('statComments'))  el('statComments').textContent  = commentCount;
    if (el('statRating'))    el('statRating').textContent    = avgRating;
  } catch(e) { console.error('loadStats:', e); }
}

// ─── Load author's novels ─────────────────────
async function loadMyNovels() {
  const container = document.getElementById('novelManageList');
  if (!container) return;

  container.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--ash)">
    <div style="animation:pulse 1.5s ease infinite;height:60px;background:var(--charcoal-mid);border-radius:var(--radius);margin-bottom:0.5rem"></div>
    <div style="animation:pulse 1.5s ease infinite;height:60px;background:var(--charcoal-mid);border-radius:var(--radius)"></div>
  </div>`;

  const sb = await window.GT_Supabase?.getSupabase();
  const user = JSON.parse(localStorage.getItem('gt-user') || '{}');

  if (!sb || !user.id) {
    container.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--ash)">
      Sign in to see your novels. <a href="login.html" style="color:var(--crimson-glow)">Sign in →</a>
    </div>`;
    return;
  }

  const { data: novels, error } = await sb.from('novels')
    .select('*')
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false });

  if (error || !novels?.length) {
    container.innerHTML = `<div style="padding:2.5rem;text-align:center">
      <div style="font-size:2rem;margin-bottom:1rem;opacity:0.4">📚</div>
      <div style="color:var(--ash);font-size:0.9rem;margin-bottom:1.5rem">You haven't published any novels yet.</div>
      <button class="btn btn-crimson" onclick="showPanel('newNovelPanel')">+ Create Your First Novel</button>
    </div>`;
    return;
  }

  const statusMap = { ongoing:'status-ongoing', completed:'status-completed', hiatus:'status-hiatus', draft:'status-draft' };
  container.innerHTML = novels.map(novel => `
    <div class="novel-manage-item">
      <div class="novel-manage-cover">
        ${novel.cover_url
          ? `<img src="${novel.cover_url}" style="width:100%;height:100%;object-fit:cover;border-radius:3px">`
          : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a0000,#2d0505);display:flex;align-items:center;justify-content:center;padding:0.3rem;text-align:center"><span style="font-family:var(--font-heading);font-size:0.45rem;color:var(--white-dim);line-height:1.2">${novel.title}</span></div>`
        }
      </div>
      <div>
        <div class="novel-manage-title">${novel.title}</div>
        <div class="novel-manage-meta">
          <span class="novel-status ${statusMap[novel.status]||'status-draft'}">${novel.status||'draft'}</span>
          <span>${novel.total_chapters} chapters</span>
          <span>${novel.total_views?.toLocaleString()||0} views</span>
          ${novel.avg_rating ? `<span style="color:var(--gold)">★ ${novel.avg_rating}</span>` : ''}
        </div>
      </div>
      <div class="novel-manage-actions">
        <button class="manage-btn" title="Write Chapter" onclick="openChapterEditor('${novel.id}','${novel.title.replace(/'/g,"\\'")}')">✍</button>
        <button class="manage-btn" title="View Novel" onclick="window.open('novel-detail.html?id=${novel.id}')">👁</button>
        <button class="manage-btn delete" title="Delete" onclick="deleteNovel('${novel.id}','${novel.title.replace(/'/g,"\\'")}')">🗑</button>
      </div>
    </div>`).join('');
}

// ─── Load activity feed ───────────────────────
async function loadActivity() {
  const container = document.getElementById('activityFeed');
  if (!container) return;

  const sb = await window.GT_Supabase?.getSupabase();
  const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
  if (!sb || !user.id) return;

  const { data: novels } = await sb.from('novels').select('id').eq('author_id', user.id);
  const novelIds = novels?.map(n => n.id) || [];

  if (!novelIds.length) {
    container.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--ash);font-size:0.85rem">No activity yet. Publish a novel to start receiving feedback!</div>`;
    return;
  }

  const { data: comments } = await sb.from('comments')
    .select('*, author:profiles(username), novel:novels(title)')
    .in('novel_id', novelIds)
    .order('created_at', { ascending: false })
    .limit(10);

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
        <em style="color:var(--ash)">"${c.text?.slice(0,80)}${c.text?.length>80?'...':''}"</em>
      </div>
      <div class="activity-time">${timeAgo(c.created_at)}</div>
    </div>`).join('');
}

// ─── Load comments panel ──────────────────────
async function loadComments() {
  const container = document.getElementById('commentsPanel');
  if (!container) return;

  container.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--ash)">Loading comments...</div>`;

  const sb = await window.GT_Supabase?.getSupabase();
  const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
  if (!sb || !user.id) return;

  const { data: novels } = await sb.from('novels').select('id').eq('author_id', user.id);
  const novelIds = novels?.map(n => n.id) || [];
  if (!novelIds.length) { container.innerHTML = `<div style="padding:2rem;color:var(--ash)">No novels yet.</div>`; return; }

  const { data: comments } = await sb.from('comments')
    .select('*, author:profiles(username, avatar_url), novel:novels(title, id)')
    .in('novel_id', novelIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(30);

  container.innerHTML = `
    <div class="dash-header"><div><div class="dash-greeting">Feedback</div><h1 class="dash-title">Comments</h1></div></div>
    <div class="dash-panel">
      <div style="padding:0.5rem 0">
        ${!comments?.length
          ? `<div style="padding:3rem;text-align:center;color:var(--ash)">No comments yet on your novels.</div>`
          : comments.map(c => `
            <div class="activity-item" style="border-bottom:var(--border-subtle);padding:1rem 1.5rem">
              <div class="activity-icon comment" style="background:rgba(40,100,180,0.1);font-size:1rem">
                ${c.author?.avatar_url ? `<img src="${c.author.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : '💬'}
              </div>
              <div class="activity-text" style="flex:1">
                <strong>${c.author?.username||'Anonymous'}</strong> on 
                <a href="novel-detail.html?id=${c.novel?.id}" style="color:var(--crimson-glow)">${c.novel?.title||'your novel'}</a><br>
                <span style="color:var(--ash-light);font-size:0.88rem">${c.text}</span>
              </div>
              <div class="activity-time">${timeAgo(c.created_at)}</div>
            </div>`).join('')
        }
      </div>
    </div>`;
}

// ─── Load notifications ───────────────────────
async function loadNotifications() {
  window.location.href = 'notifications.html';
}

// ─── Stats panel ──────────────────────────────
async function loadStatsPanel() {
  const container = document.getElementById('statsPanel');
  if (!container) return;

  const sb = await window.GT_Supabase?.getSupabase();
  const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
  if (!sb || !user.id) return;

  const { data: novels } = await sb.from('novels').select('*').eq('author_id', user.id);

  container.innerHTML = `
    <div class="dash-header"><div><div class="dash-greeting">Analytics</div><h1 class="dash-title">Stats & Views</h1></div></div>
    <div class="stats-grid" style="margin-bottom:2rem">
      <div class="stat-card"><span class="stat-card-icon">👁️</span><div class="stat-card-value">${(novels||[]).reduce((s,n)=>s+(n.total_views||0),0).toLocaleString()}</div><div class="stat-card-label">Total Views</div></div>
      <div class="stat-card"><span class="stat-card-icon">📚</span><div class="stat-card-value">${novels?.length||0}</div><div class="stat-card-label">Novels</div></div>
      <div class="stat-card"><span class="stat-card-icon">📖</span><div class="stat-card-value">${(novels||[]).reduce((s,n)=>s+(n.total_chapters||0),0)}</div><div class="stat-card-label">Chapters</div></div>
      <div class="stat-card"><span class="stat-card-icon">⭐</span><div class="stat-card-value">${novels?.length ? ((novels||[]).reduce((s,n)=>s+(n.avg_rating||0),0)/novels.length).toFixed(1) : '—'}</div><div class="stat-card-label">Avg Rating</div></div>
    </div>
    <div class="dash-panel">
      <div class="dash-panel-header"><span class="dash-panel-title">Novel Performance</span></div>
      ${!novels?.length ? '<div style="padding:2rem;text-align:center;color:var(--ash)">No novels yet.</div>' :
        novels.map(n => `
          <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:1rem;align-items:center;padding:1rem 1.5rem;border-bottom:var(--border-subtle)">
            <div style="font-family:var(--font-heading);font-size:0.85rem;color:var(--white-dim)">${n.title}</div>
            <div style="text-align:center"><div style="font-family:var(--font-heading);color:var(--crimson-glow)">${n.total_views?.toLocaleString()||0}</div><div style="font-size:0.68rem;color:var(--ash);text-transform:uppercase;letter-spacing:0.1em">Views</div></div>
            <div style="text-align:center"><div style="font-family:var(--font-heading);color:var(--white)">${n.total_chapters||0}</div><div style="font-size:0.68rem;color:var(--ash);text-transform:uppercase;letter-spacing:0.1em">Chapters</div></div>
            <div style="text-align:center"><div style="font-family:var(--font-heading);color:var(--gold)">${n.avg_rating||'—'}</div><div style="font-size:0.68rem;color:var(--ash);text-transform:uppercase;letter-spacing:0.1em">Rating</div></div>
          </div>`).join('')
      }
    </div>`;
}

// ─── Reviews panel ────────────────────────────
async function loadReviews() {
  const container = document.getElementById('reviewsPanel');
  if (!container) return;

  const sb = await window.GT_Supabase?.getSupabase();
  const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
  if (!sb || !user.id) return;

  const { data: novels } = await sb.from('novels').select('id, title').eq('author_id', user.id);
  const novelIds = novels?.map(n => n.id) || [];

  const { data: ratings } = novelIds.length ? await sb.from('ratings')
    .select('*, user:profiles(username), novel:novels(title)')
    .in('novel_id', novelIds)
    .order('created_at', { ascending: false })
    .limit(20) : { data: [] };

  container.innerHTML = `
    <div class="dash-header"><div><div class="dash-greeting">Feedback</div><h1 class="dash-title">Reviews & Ratings</h1></div></div>
    <div class="dash-panel">
      ${!ratings?.length
        ? `<div style="padding:3rem;text-align:center;color:var(--ash)">No ratings yet on your novels.</div>`
        : ratings.map(r => `
          <div style="padding:1.25rem 1.5rem;border-bottom:var(--border-subtle)">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem">
              <span style="font-family:var(--font-heading);font-size:0.82rem;color:var(--white)">${r.user?.username||'Anonymous'}</span>
              <span style="color:var(--gold)">${'★'.repeat(r.score)}${'☆'.repeat(5-r.score)}</span>
            </div>
            <div style="font-size:0.72rem;color:var(--crimson-glow);margin-bottom:0.4rem">${r.novel?.title||''}</div>
            ${r.review ? `<div style="font-size:0.85rem;color:var(--ash-light)">${r.review}</div>` : ''}
            <div style="font-size:0.7rem;color:var(--ash);margin-top:0.3rem">${timeAgo(r.created_at)}</div>
          </div>`).join('')
      }
    </div>`;
}

// ─── Drafts panel ─────────────────────────────
async function loadDrafts() {
  const container = document.getElementById('draftsPanel');
  if (!container) return;

  const sb = await window.GT_Supabase?.getSupabase();
  const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
  if (!sb || !user.id) return;

  // Get unpublished chapters
  const { data: drafts } = await sb.from('chapters')
    .select('*, novel:novels(title, id)')
    .eq('author_id', user.id)
    .eq('is_published', false)
    .order('updated_at', { ascending: false });

  container.innerHTML = `
    <div class="dash-header"><div><div class="dash-greeting">Unpublished</div><h1 class="dash-title">Drafts</h1></div><button class="btn btn-crimson" onclick="showPanel('editorPanel')">+ New Chapter</button></div>
    <div class="dash-panel">
      ${!drafts?.length
        ? `<div style="padding:3rem;text-align:center">
            <div style="font-size:2rem;margin-bottom:1rem;opacity:0.4">📝</div>
            <div style="color:var(--ash);margin-bottom:1.5rem">No drafts yet.</div>
            <button class="btn btn-crimson" onclick="showPanel('editorPanel')">Start Writing</button>
           </div>`
        : drafts.map(d => `
          <div style="display:flex;align-items:center;gap:1rem;padding:1.25rem 1.5rem;border-bottom:var(--border-subtle)">
            <div style="flex:1">
              <div style="font-family:var(--font-heading);font-size:0.88rem;color:var(--white-dim)">${d.title}</div>
              <div style="font-size:0.75rem;color:var(--ash);margin-top:0.2rem">${d.novel?.title||''} · Ch. ${d.number} · ${d.word_count||0} words</div>
            </div>
            <span class="novel-status status-draft">Draft</span>
            <button class="btn btn-outline" style="font-size:0.72rem" onclick="editDraft('${d.id}','${d.title.replace(/'/g,"\\'")}')">Edit</button>
            <button class="manage-btn" onclick="publishDraft('${d.id}','${d.title.replace(/'/g,"\\'")}')">✓ Publish</button>
          </div>`).join('')
      }
    </div>`;
}

// ─── Delete novel ─────────────────────────────
window.deleteNovel = async function(id, title) {
  if (!confirm(`Delete "${title}"? This cannot be undone and all chapters will be removed.`)) return;
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return;
  const { error } = await sb.from('novels').delete().eq('id', id);
  if (error) { window.showToast('Delete failed: ' + error.message, 'error'); return; }
  window.showToast(`"${title}" deleted.`);
  loadMyNovels();
};

// ─── Open chapter editor for specific novel ───
window.openChapterEditor = function(novelId, novelTitle) {
  showPanel('editorPanel');
  const select = document.getElementById('novelSelectForChapter');
  if (select) {
    const opt = [...select.options].find(o => o.value === novelId);
    if (opt) select.value = novelId;
  }
  document.getElementById('editorPanel').dataset.novelId = novelId;
};

// ─── Edit draft ───────────────────────────────
window.editDraft = async function(id, title) {
  showPanel('editorPanel');
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return;
  const { data } = await sb.from('chapters').select('*').eq('id', id).single();
  if (data) {
    document.getElementById('chapterTitleInput').value = data.title || '';
    document.getElementById('editorArea').value = data.content || '';
    document.getElementById('editorPanel').dataset.chapterId = id;
    updateWordCount();
  }
};

// ─── Publish draft ────────────────────────────
window.publishDraft = async function(id, title) {
  if (!confirm(`Publish "${title}"? It will be visible to all readers.`)) return;
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
  const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
  if (!sb || !user.id) return;
  const { data } = await sb.from('novels').select('id, title').eq('author_id', user.id);
  select.innerHTML = `<option value="">Select novel...</option>` + (data||[]).map(n => `<option value="${n.id}">${n.title}</option>`).join('');
}

// ─── Word count ───────────────────────────────
function updateWordCount() {
  const area = document.getElementById('editorArea');
  if (!area) return;
  const text  = area.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const el = (id) => document.getElementById(id);
  if (el('wordCount'))  el('wordCount').textContent  = words.toLocaleString();
  if (el('charCount'))  el('charCount').textContent  = text.length.toLocaleString();
  if (el('readTime'))   el('readTime').textContent   = Math.ceil(words / 250);
}

// ─── Save / Publish chapter ───────────────────
async function initEditor() {
  const area = document.getElementById('editorArea');
  area?.addEventListener('input', updateWordCount);
  updateWordCount();

  // Auto-save every 30s
  let autoSaveTimer;
  area?.addEventListener('input', () => {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(saveDraft, 30000);
  });

  document.getElementById('saveDraft')?.addEventListener('click', saveDraft);
  document.getElementById('publishChapter')?.addEventListener('click', publishChapter);
  document.getElementById('backToDash')?.addEventListener('click', () => showPanel('overviewPanel'));
  document.getElementById('backToDash2')?.addEventListener('click', () => showPanel('overviewPanel'));

  // Toolbar scene break
  document.querySelectorAll('.toolbar-btn').forEach(btn => {
    if (btn.title === 'Scene Break') {
      btn.addEventListener('click', () => {
        const pos = area.selectionStart;
        area.value = area.value.slice(0,pos) + '\n\n— ✦ —\n\n' + area.value.slice(area.selectionEnd);
        updateWordCount();
      });
    }
  });
}

async function saveDraft() {
  const title = document.getElementById('chapterTitleInput')?.value?.trim();
  const content = document.getElementById('editorArea')?.value;
  const novelId = document.getElementById('novelSelectForChapter')?.value
    || document.getElementById('editorPanel')?.dataset?.novelId;
  const chapterId = document.getElementById('editorPanel')?.dataset?.chapterId;

  if (!title || !content || !novelId) {
    window.showToast('Please fill in the title, select a novel, and write some content.', 'error');
    return;
  }

  const sb = await window.GT_Supabase?.getSupabase();
  const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
  if (!sb || !user.id) { window.showToast('Please sign in.', 'error'); return; }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  if (chapterId) {
    // Update existing
    const { error } = await sb.from('chapters').update({ title, content, word_count: wordCount }).eq('id', chapterId);
    if (error) { window.showToast('Save failed: ' + error.message, 'error'); return; }
  } else {
    // Create new draft
    const { data: lastCh } = await sb.from('chapters').select('number').eq('novel_id', novelId).order('number', { ascending: false }).limit(1);
    const number = (lastCh?.[0]?.number || 0) + 1;
    const { data, error } = await sb.from('chapters')
      .insert({ novel_id: novelId, author_id: user.id, title, content, number, word_count: wordCount, is_published: false })
      .select().single();
    if (error) { window.showToast('Save failed: ' + error.message, 'error'); return; }
    document.getElementById('editorPanel').dataset.chapterId = data.id;
  }
  window.showToast('Draft saved! ✦');
}

async function publishChapter() {
  const title = document.getElementById('chapterTitleInput')?.value?.trim();
  const content = document.getElementById('editorArea')?.value?.trim();
  if (!title) { window.showToast('Add a chapter title.', 'error'); return; }
  if (!content || content.length < 100) { window.showToast('Chapter is too short (100+ characters).', 'error'); return; }

  await saveDraft();
  const chapterId = document.getElementById('editorPanel')?.dataset?.chapterId;
  if (!chapterId) return;

  const sb = await window.GT_Supabase?.getSupabase();
  const novelId = document.getElementById('novelSelectForChapter')?.value
    || document.getElementById('editorPanel')?.dataset?.novelId;

  const { error } = await sb.from('chapters')
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq('id', chapterId);

  if (error) { window.showToast('Publish failed: ' + error.message, 'error'); return; }

  // Update novel stats
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  await sb.from('novels').update({
    total_chapters: sb.rpc ? undefined : undefined,
    last_chapter_at: new Date().toISOString(),
  }).eq('id', novelId);

  window.showToast('Chapter published! ✦');
  document.getElementById('editorPanel').dataset.chapterId = '';
  document.getElementById('chapterTitleInput').value = '';
  document.getElementById('editorArea').value = '';
  updateWordCount();
  setTimeout(() => showPanel('overviewPanel'), 1000);
}

// ─── Create novel ─────────────────────────────
async function initNewNovel() {
  const form = document.querySelector('#newNovelPanel .write-novel-form');
  const createBtn = form?.querySelector('.btn-crimson');
  if (!createBtn) return;

  createBtn.addEventListener('click', async () => {
    const title    = form.querySelector('input[type="text"]')?.value?.trim();
    const genre    = form.querySelector('select')?.value;
    const synopsis = form.querySelector('textarea')?.value?.trim();
    if (!title)    { window.showToast('Enter a novel title.', 'error'); return; }
    if (!synopsis) { window.showToast('Add a synopsis.', 'error'); return; }

    const sb = await window.GT_Supabase?.getSupabase();
    const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
    if (!sb || !user.id) { window.showToast('Sign in required.', 'error'); return; }

    createBtn.textContent = 'Creating...'; createBtn.disabled = true;
    const { data, error } = await sb.from('novels').insert({
      author_id: user.id, title, synopsis,
      genres: genre ? [genre] : [],
      status: 'draft',
    }).select().single();

    if (error) { window.showToast('Failed: ' + error.message, 'error'); createBtn.textContent = 'Create Novel →'; createBtn.disabled = false; return; }

    window.showToast(`"${title}" created! ✦`);
    createBtn.textContent = 'Create Novel →'; createBtn.disabled = false;
    showPanel('overviewPanel');
    loadMyNovels();
  });
}

// ─── Sidebar nav wiring ───────────────────────
function initSidebarNav() {
  const navMap = {
    'overviewPanel':     ['[data-panel="overviewPanel"]', '#myNovelsLink'],
    'notificationsLink': null, // redirects
    'profileLink':       null, // redirects
    'newNovelPanel':     ['[data-panel="newNovelPanel"]', '#newNovelLink', '#dashNewNovel'],
    'editorPanel':       ['[data-panel="editorPanel"]',  '#writeChapterLink', '#dashWriteChapter'],
    'draftsPanel':       ['[data-panel="draftsPanel"]',  '#draftsLink'],
    'statsPanel':        ['[data-panel="statsPanel"]',   '#statsLink'],
    'commentsPanel':     ['[data-panel="commentsPanel"]','#commentsLink'],
    'reviewsPanel':      ['[data-panel="reviewsPanel"]', '#reviewsLink'],
  };

  // Wire all dash-nav-links by data-panel
  document.querySelectorAll('.dash-nav-link[data-panel]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const panelId = link.dataset.panel;
      if (panelId === 'notifications') { window.location.href = 'notifications.html'; return; }
      if (panelId === 'profile')       { window.location.href = 'user-profile.html'; return; }
      if (panelId === 'settings')      { window.location.href = 'settings.html'; return; }
      showPanel(panelId);
      loadPanelData(panelId);
    });
  });

  // Header buttons
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

// ─── Time ago helper ──────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff/60000), h = Math.floor(m/60), d = Math.floor(h/24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}
window.timeAgo = timeAgo;

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardUser();
  initSidebarNav();
  initEditor();
  initNewNovel();

  // Add data-panel attrs to nav links
  const panelLinks = {
    'notifications': 'notifications',
    'profile':       'profile',
    'settings':      'settings',
    'myNovels':      'overviewPanel',
    'drafts':        'draftsPanel',
    'stats':         'statsPanel',
    'comments':      'commentsPanel',
    'reviews':       'reviewsPanel',
    'newNovel':      'newNovelPanel',
    'writeChapter':  'editorPanel',
  };
  Object.entries(panelLinks).forEach(([id, panel]) => {
    const el = document.getElementById(`${id}Link`) || document.getElementById(`${id}Btn`);
    if (el) el.dataset.panel = panel;
  });

  // Load overview by default
  showPanel('overviewPanel');
  await loadStats();
  loadMyNovels();
  loadActivity();
});
