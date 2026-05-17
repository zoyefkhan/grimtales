/* ============================================
   user-profile.js — Reader Profile (Real Data)
   No demo data — everything from Supabase
   
   FIX: Wait for Supabase session on mobile before
   falling back to localStorage check
============================================ */

// ─── Tab Switching ────────────────────────────
function initProfileTabs() {
  const panels = { library:'libraryPanel', history:'historyPanel', badges:'badgesPanel', following:'followingPanel', comments:'commentsPanel' };
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById(panels[tab.dataset.tab]);
      if (panel) { panel.classList.add('active'); loadTabData(tab.dataset.tab); }
    });
  });
}

// FIX: Get user from Supabase session first, then fall back to localStorage.
// On mobile, the session may not have been written to localStorage yet.
async function getActiveUser() {
  // First try Supabase session (most reliable, works on mobile)
  try {
    const sb = await window.GT_Supabase?.getSupabase();
    if (sb) {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        // Sync to localStorage so other parts of the app can use it
        const sbUser = session.user;
        const user = {
          id:        sbUser.id,
          username:  sbUser.user_metadata?.username
                     || sbUser.user_metadata?.full_name
                     || sbUser.user_metadata?.name
                     || sbUser.email?.split('@')[0]
                     || 'User',
          email:     sbUser.email,
          role:      sbUser.user_metadata?.role || 'reader',
          avatar:    sbUser.user_metadata?.avatar_url
                     || sbUser.user_metadata?.picture
                     || '',
          createdAt: sbUser.created_at,
        };
        localStorage.setItem('gt-user', JSON.stringify(user));
        localStorage.setItem('gt-logged-in', 'true');
        return user;
      }
    }
  } catch(e) {
    console.warn('Supabase session check failed, falling back to localStorage:', e);
  }

  // Fall back to localStorage (desktop / already-synced sessions)
  const stored = localStorage.getItem('gt-user');
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }

  return null;
}

// ─── Load real user data ──────────────────────
async function loadProfileData() {
  // FIX: Use getActiveUser() instead of directly reading localStorage
  const user = await getActiveUser();

  if (!user || !user.username) {
    window.location.href = 'login.html';
    return;
  }

  // Update profile display
  const initials = user.username.slice(0,2).toUpperCase();
  document.querySelectorAll('.profile-username').forEach(el => el.textContent = user.username);
  document.querySelectorAll('.profile-avatar-wrap').forEach(el => {
    if (user.avatar) {
      el.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      el.textContent = initials;
    }
  });

  const memberEl = document.querySelector('.profile-member');
  if (memberEl) {
    const since = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en',{month:'long',year:'numeric'}) : 'Recently';
    memberEl.textContent = `Member since ${since} · ${user.role==='author'?'Author':'Reader'}`;
  }

  // Load real stats from Supabase
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb || !user.id) return;

  try {
    const [bookmarksRes, commentsRes, followingRes, historyRes] = await Promise.all([
      sb.from('bookmarks').select('*', {count:'exact',head:true}).eq('user_id', user.id),
      sb.from('comments').select('*', {count:'exact',head:true}).eq('author_id', user.id),
      sb.from('follows').select('*', {count:'exact',head:true}).eq('follower_id', user.id),
      sb.from('reading_history').select('*', {count:'exact',head:true}).eq('user_id', user.id),
    ]);

    const booksRead = bookmarksRes.count || 0;
    const commentCount = commentsRes.count || 0;

    const stats = {
      booksRead,
      chapters:  historyRes.count || 0,
      following: followingRes.count || 0,
      comments:  commentCount,
      badges:    [
        true,
        booksRead >= 10,
        commentCount >= 10,
        false,
        false,
        false,
        false,
        false,
        false,
      ].filter(Boolean).length,
    };

    const el = id => document.getElementById(id);
    if (el('statBooksRead'))  el('statBooksRead').textContent  = stats.booksRead;
    if (el('statChapters'))   el('statChapters').textContent   = stats.chapters;
    if (el('statFollowing'))  el('statFollowing').textContent  = stats.following;
    if (el('statComments'))   el('statComments').textContent   = stats.comments;
    if (el('statBadges'))     el('statBadges').textContent     = stats.badges;

  } catch(e) { console.error(e); }
}

// ─── Load tab data ────────────────────────────
function loadTabData(tab) {
  switch(tab) {
    case 'library':   loadLibrary(); break;
    case 'history':   loadHistory(); break;
    case 'badges':    loadBadges(); break;
    case 'following': loadFollowing(); break;
    case 'comments':  loadMyComments(); break;
  }
}

// ─── Library ──────────────────────────────────
async function loadLibrary() {
  const grid = document.getElementById('libraryGrid');
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem"><div class="inline-loading"><img src="assets/loader.svg" alt="Loading library" /><span>Loading...</span></div></div>`;

  const sb = await window.GT_Supabase?.getSupabase();
  const user = await getActiveUser();
  if (!sb || !user?.id) { grid.innerHTML = `<div class="library-empty">Sign in to see your library.</div>`; return; }

  const { data: bookmarks } = await sb.from('bookmarks')
    .select('*, novel:novels(*, author:profiles(username))')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (!bookmarks?.length) {
    grid.innerHTML = `
      <div class="library-empty">
        <div style="font-size:2.5rem;margin-bottom:1rem;opacity:0.3">📚</div>
        <h3 style="font-family:var(--font-display);color:var(--white);margin-bottom:0.5rem">Your library is empty</h3>
        <p style="color:var(--ash);margin-bottom:1.5rem">Start adding novels by clicking the bookmark button on any novel.</p>
        <a href="browse.html" class="btn btn-crimson">Browse Novels</a>
      </div>`;
    return;
  }

  grid.innerHTML = bookmarks.map(b => window.renderNovelCard(b.novel)).join('');
}

// ─── History ──────────────────────────────────
async function loadHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;

  const sb = await window.GT_Supabase?.getSupabase();
  const user = await getActiveUser();
  if (!sb || !user?.id) { list.innerHTML = `<div style="color:var(--ash);padding:1rem">Sign in to see your history.</div>`; return; }

  const { data: history } = await sb.from('reading_history')
    .select('*, novel:novels(id,title,cover_url,author:profiles(username)), chapter:chapters(id,title,number)')
    .eq('user_id', user.id)
    .order('read_at', { ascending: false })
    .limit(20);

  if (!history?.length) {
    list.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--ash)">No reading history yet. <a href="browse.html" style="color:var(--crimson-glow)">Start reading!</a></div>`;
    return;
  }

  list.innerHTML = history.map(item => {
    const progress = window.GT_Bookmarks?.getProgress(item.novel_id, item.chapter_id) || 0;
    const cover = item.novel?.cover_url
      ? `<img src="${item.novel.cover_url}" style="width:100%;height:100%;object-fit:cover">`
      : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a0000,#2d0505)"></div>`;
    return `
      <div class="history-item" onclick="window.location='chapter-read.html?id=${item.chapter_id}'">
        <div class="history-cover">${cover}</div>
        <div style="flex:1;min-width:0">
          <div style="font-family:var(--font-heading);font-size:0.88rem;color:var(--white-dim);margin-bottom:0.15rem">${item.novel?.title||'Unknown'}</div>
          <div style="font-size:0.78rem;color:var(--ash);margin-bottom:0.5rem">${item.novel?.author?.username||''} · Ch. ${item.chapter?.number||'?'}: ${item.chapter?.title||''}</div>
          <div class="history-progress-bar"><div class="history-progress-fill" style="width:${progress}%"></div></div>
          <div style="font-size:0.68rem;color:var(--ash);margin-top:0.2rem">${progress}% complete</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:0.72rem;color:var(--ash);font-family:var(--font-heading);margin-bottom:0.5rem">${window.timeAgo?window.timeAgo(item.read_at):''}</div>
          <a href="chapter-read.html?id=${item.chapter_id}" class="btn btn-crimson" style="font-size:0.65rem;padding:0.35em 0.8em">Continue</a>
        </div>
      </div>`;
  }).join('');
}

// ─── Badges ───────────────────────────────────
async function loadBadges() {
  const grid = document.getElementById('badgesGrid');
  if (!grid) return;

  const sb = await window.GT_Supabase?.getSupabase();
  const user = await getActiveUser();

  let booksRead = 0, commentCount = 0;
  if (sb && user?.id) {
    const [b, c] = await Promise.all([
      sb.from('bookmarks').select('*',{count:'exact',head:true}).eq('user_id', user.id),
      sb.from('comments').select('*',{count:'exact',head:true}).eq('author_id', user.id),
    ]);
    booksRead    = b.count || 0;
    commentCount = c.count || 0;
  }

  const BADGES = [
    { icon:'📖', name:'First Chapter',   desc:'Read your first chapter',          earned: true },
    { icon:'📚', name:'Bookworm',        desc:'Add 10 novels to your library',    earned: booksRead >= 10 },
    { icon:'💬', name:'Voice in the Dark', desc:'Post 10 comments',              earned: commentCount >= 10 },
    { icon:'🔥', name:'On Fire',         desc:'Read 7 days in a row',             earned: false },
    { icon:'🌑', name:'Dark Devotee',    desc:'Read 50 dark fantasy chapters',    earned: false },
    { icon:'⭐', name:'Critic',          desc:'Rate 20 novels',                   earned: false },
    { icon:'❤️', name:'Loyal Reader',   desc:'Follow 20 authors',                earned: false },
    { icon:'🏆', name:'Century Reader',  desc:'Read 100 chapters',                earned: false },
    { icon:'💀', name:'Horror Fiend',    desc:'Read 30 horror chapters',          earned: false },
    { icon:'👑', name:'Dark Sovereign',  desc:'Read 1000 chapters total',         earned: false },
  ];

  grid.innerHTML = BADGES.map(b => `
    <div class="badge-card ${b.earned ? '' : 'locked'}">
      <span class="badge-icon">${b.icon}</span>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
      ${b.earned ? `<div class="badge-earned">✦ Earned</div>` : `<div style="font-size:0.65rem;color:var(--ash);margin-top:0.4rem">🔒 Locked</div>`}
    </div>`).join('');
}

// ─── Following ────────────────────────────────
async function loadFollowing() {
  const grid = document.getElementById('followingGrid');
  if (!grid) return;

  const sb = await window.GT_Supabase?.getSupabase();
  const user = await getActiveUser();
  if (!sb || !user?.id) return;

  const { data: follows } = await sb.from('follows')
    .select('following:profiles!follows_following_id_fkey(id, username, avatar_url)')
    .eq('follower_id', user.id)
    .limit(30);

  if (!follows?.length) {
    grid.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--ash);grid-column:1/-1">You're not following anyone yet. <a href="browse.html" style="color:var(--crimson-glow)">Discover authors!</a></div>`;
    return;
  }

  grid.innerHTML = follows.map(f => {
    const a = f.following;
    const initials = (a.username||'?').slice(0,2).toUpperCase();
    return `
      <a href="author-profile.html?id=${a.id}" style="display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;background:var(--metal-card);border:var(--border-subtle);border-radius:var(--radius-lg);transition:var(--transition);text-decoration:none" onmouseenter="this.style.borderColor='rgba(139,26,26,0.4)'" onmouseleave="this.style.borderColor=''">
        <div style="width:46px;height:46px;border-radius:50%;border:2px solid var(--crimson);background:linear-gradient(135deg,#2d0f0f,#1a0808);display:flex;align-items:center;justify-content:font-family:var(--font-heading);font-size:0.9rem;color:var(--crimson-glow);flex-shrink:0;overflow:hidden">
          ${a.avatar_url ? `<img src="${a.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : initials}
        </div>
        <div style="font-family:var(--font-heading);font-size:0.88rem;color:var(--white)">${a.username}</div>
      </a>`;
  }).join('');
}

// ─── My Comments ──────────────────────────────
async function loadMyComments() {
  const list = document.getElementById('myCommentsList');
  if (!list) return;

  const sb = await window.GT_Supabase?.getSupabase();
  const user = await getActiveUser();
  if (!sb || !user?.id) return;

  const { data: comments } = await sb.from('comments')
    .select('*, novel:novels(id, title), chapter:chapters(id, number, title)')
    .eq('author_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!comments?.length) {
    list.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--ash)">No comments posted yet.</div>`;
    return;
  }

  list.innerHTML = comments.map(c => `
    <div style="background:var(--metal-card);border:var(--border-subtle);border-radius:var(--radius-lg);padding:1.25rem;margin-bottom:0.75rem">
      <div style="display:flex;gap:0.5rem;margin-bottom:0.6rem;flex-wrap:wrap">
        <a href="novel-detail.html?id=${c.novel?.id}" style="font-family:var(--font-heading);font-size:0.72rem;color:var(--crimson-glow);letter-spacing:0.08em;text-transform:uppercase">${c.novel?.title||'Unknown'}</a>
        <span style="color:var(--ash);font-size:0.72rem">·</span>
        <a href="chapter-read.html?id=${c.chapter?.id}" style="font-size:0.72rem;color:var(--ash)">Chapter ${c.chapter?.number||'?'}</a>
      </div>
      <p style="font-size:0.88rem;color:var(--ash-light);line-height:1.65;margin-bottom:0.6rem">${c.text}</p>
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.72rem;color:var(--ash);font-family:var(--font-heading)">
        <span>${window.timeAgo?window.timeAgo(c.created_at):''}</span>
        <span style="color:var(--gold)">♥ ${c.like_count||0} likes</span>
      </div>
    </div>`).join('');
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadProfileData();
  initProfileTabs();
  loadLibrary();
});