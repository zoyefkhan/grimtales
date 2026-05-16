/* ============================================
   app.js — GrimTales Core
   Fixed: navbar, author role persistence,
   no demo data, no double avatar
============================================ */

// ─── Theme ────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const savedTheme  = localStorage.getItem('gt-theme') || 'dark';

function applyTheme(theme) {
  document.body.classList.toggle('light-mode', theme === 'light');
  if (themeToggle) themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
  localStorage.setItem('gt-theme', theme);
}
applyTheme(savedTheme);
themeToggle?.addEventListener('click', () => {
  applyTheme(localStorage.getItem('gt-theme') === 'dark' ? 'light' : 'dark');
});

// ─── Navbar scroll ────────────────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
}

// ─── Hamburger ────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    const spans = hamburger.querySelectorAll('span');
    const open  = mobileNav.classList.contains('open');
    spans[0].style.transform = open ? 'translateY(7px) rotate(45deg)' : '';
    spans[1].style.opacity   = open ? '0' : '';
    spans[2].style.transform = open ? 'translateY(-7px) rotate(-45deg)' : '';
  });
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
      hamburger.querySelectorAll('span').forEach(s => { s.style.transform=''; s.style.opacity=''; });
    }
  });
}

// ─── Navbar search ────────────────────────────
document.getElementById('navSearch')?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.value.trim()) {
    window.location.href = `search.html?q=${encodeURIComponent(e.target.value.trim())}`;
  }
});

// ─── Toast ────────────────────────────────────
function showToast(message, type = 'success') {
  document.querySelector('.gt-toast')?.remove();
  const t = document.createElement('div');
  t.className = 'gt-toast';
  t.style.cssText = `
    position:fixed;bottom:2rem;right:1rem;left:1rem;z-index:99999;
    background:${type==='success'?'linear-gradient(135deg,#1a0000,#2d0505)':'linear-gradient(135deg,#2d0000,#4d0000)'};
    border:1px solid ${type==='success'?'rgba(139,26,26,0.5)':'var(--crimson)'};
    color:var(--white-dim);padding:1rem 1.25rem;border-radius:var(--radius-lg);
    font-family:var(--font-heading);font-size:0.82rem;letter-spacing:0.04em;
    box-shadow:0 8px 32px rgba(0,0,0,0.6),0 0 20px rgba(139,26,26,0.2);
    animation:fadeInUp 0.3s ease;display:flex;align-items:center;
    gap:0.6rem;max-width:400px;margin:0 auto;
  `;
  t.innerHTML = `<span style="color:${type==='success'?'var(--crimson-glow)':'#ff6b6b'};font-size:1rem">${type==='success'?'✦':'!'}</span> ${message}`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.3s ease'; setTimeout(()=>t.remove(),300); }, 3500);
}
window.showToast = showToast;

// ─── Novel Card Renderer ──────────────────────
function renderNovelCard(novel) {
  if (!novel) return '';
  const cover = novel.cover_url
    ? `<img src="${novel.cover_url}" alt="${novel.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover"/>`
    : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a0000,#2d0505,#1a0000);display:flex;align-items:center;justify-content:center;padding:0.75rem;text-align:center"><span style="font-family:var(--font-heading);font-size:0.72rem;color:var(--white-dim);line-height:1.4">${novel.title}</span></div>`;

  return `
    <div class="novel-card" onclick="window.location='novel-detail.html?id=${novel.id}'">
      <div class="novel-cover">${cover}
        <div class="novel-cover-overlay"><div class="novel-quick-read">Read Now →</div></div>
      </div>
      <div class="novel-info">
        <div class="novel-title">${novel.title}</div>
        <div class="novel-author">✦ ${novel.author?.username||'Unknown'}</div>
        <div class="novel-meta">
          <span class="novel-rating">★ ${novel.avg_rating||'—'}</span>
          <span class="novel-chapters">${novel.total_chapters||0} ch.</span>
        </div>
      </div>
    </div>`;
}

function renderNovelListItem(novel) {
  if (!novel) return '';
  const cover = novel.cover_url
    ? `<img src="${novel.cover_url}" alt="${novel.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover"/>`
    : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a0000,#2d0505);display:flex;align-items:center;justify-content:center;padding:0.3rem"><span style="font-family:var(--font-heading);font-size:0.55rem;color:var(--white-dim);text-align:center;line-height:1.2">${novel.title}</span></div>`;
  return `
    <div class="novel-list-item" onclick="window.location='novel-detail.html?id=${novel.id}'">
      <div class="novel-list-cover">${cover}</div>
      <div class="novel-list-info">
        <div class="novel-list-title">${novel.title}</div>
        <div class="novel-list-author">by ${novel.author?.username||'Unknown'}</div>
        <div class="novel-list-tags"><span class="tag">${(novel.genres||[])[0]||'Fiction'}</span></div>
        <div class="novel-list-desc">${(novel.synopsis||'').slice(0,120)}...</div>
      </div>
      <div class="novel-list-stats">
        <span class="list-stat" style="color:var(--gold)">★ ${novel.avg_rating||'—'}</span>
        <span class="list-stat">${novel.total_chapters||0} chapters</span>
        <span class="list-stat">${(novel.total_views||0).toLocaleString()} views</span>
      </div>
    </div>`;
}

window.renderNovelCard     = renderNovelCard;
window.renderNovelListItem = renderNovelListItem;

// ─── Supabase data fetchers ───────────────────
async function fetchNovels({ sort='total_views', genre, limit=20, page=1 }={}) {
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return [];
  const offset = (page-1)*limit;
  let q = sb.from('novels')
    .select('*, author:profiles(username,avatar_url)')
    .eq('is_visible',true)
    .range(offset, offset+limit-1);
  if (genre) q = q.contains('genres',[genre]);
  const sortMap = { total_views:{column:'total_views',ascending:false}, new:{column:'created_at',ascending:false}, rating:{column:'avg_rating',ascending:false}, updated:{column:'last_chapter_at',ascending:false} };
  const s = sortMap[sort]||sortMap.total_views;
  q = q.order(s.column,{ascending:s.ascending});
  const { data, error } = await q;
  if (error) { console.error('fetchNovels:',error); return []; }
  return data||[];
}

async function fetchNovel(id) {
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('novels')
    .select('*, author:profiles(id,username,avatar_url,bio,is_verified)')
    .eq('id',id).single();
  if (error) return null;
  return data;
}

async function fetchChapters(novelId,{order='asc'}={}) {
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return [];
  const { data } = await sb.from('chapters')
    .select('id,number,title,word_count,views,published_at')
    .eq('novel_id',novelId).eq('is_published',true)
    .order('number',{ascending:order==='asc'});
  return data||[];
}

async function fetchComments(chapterId) {
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return [];
  const { data } = await sb.from('comments')
    .select('*, author:profiles(username,avatar_url)')
    .eq('chapter_id', chapterId)
    .eq('is_deleted', false)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(30);
  return data || [];
}

async function fetchNovelComments(novelId) {
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return [];
  const { data } = await sb.from('comments')
    .select('*, author:profiles(username,avatar_url)')
    .eq('novel_id', novelId)
    .eq('is_deleted', false)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(30);
  return data || [];
}

async function postComment(chapterId, novelId, text) {
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) { showToast('Sign in to comment.','error'); return null; }
  const { data:{user} } = await sb.auth.getUser();
  if (!user) { showToast('Sign in to comment.','error'); return null; }
  const { data, error } = await sb.from('comments')
    .insert({ chapter_id:chapterId, novel_id:novelId, author_id:user.id, text })
    .select('*, author:profiles(username,avatar_url)').single();
  if (error) { showToast('Failed to post comment.','error'); return null; }
  return data;
}

async function toggleBookmark(novelId) {
  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) { showToast('Sign in to bookmark.','error'); return false; }
  const { data:{user} } = await sb.auth.getUser();
  if (!user) { showToast('Sign in to bookmark.','error'); return false; }
  const { data: existing } = await sb.from('bookmarks')
    .select('*').eq('user_id',user.id).eq('novel_id',novelId).single();
  if (existing) {
    await sb.from('bookmarks').delete().eq('user_id',user.id).eq('novel_id',novelId);
    showToast('Removed from library.');
    return false;
  }
  await sb.from('bookmarks').insert({ user_id:user.id, novel_id:novelId });
  showToast('Added to your library! ✦');
  return true;
}

window.GT_Data = { fetchNovels, fetchNovel, fetchChapters, fetchComments, fetchNovelComments, postComment, toggleBookmark };

// ════════════════════════════════════════════
//   NAVBAR SESSION — runs immediately
//   Hides Sign In/Join if logged in
//   Shows user avatar
// ════════════════════════════════════════════
function updateNavbarSession() {
  try {
    const user = JSON.parse(localStorage.getItem('gt-user') || 'null');
    const actions = document.querySelector('.navbar-actions');
    if (!actions) return;

    if (!user || !user.id) {
      // NOT logged in — show Sign In / Join (already in HTML, do nothing)
      return;
    }

    // LOGGED IN — remove Sign In / Join buttons immediately
    actions.querySelectorAll('a[href="login.html"], a[href="register.html"]').forEach(el => el.remove());

    // Remove from mobile nav too
    document.querySelectorAll('.mobile-nav a[href="login.html"], .mobile-nav a[href="register.html"]').forEach(el => el.remove());

    // Don't add avatar twice
    if (document.getElementById('navUserAvatar')) return;

    const initials = (user.username||'?').slice(0,2).toUpperCase();
    const avatarHTML = user.avatar
      ? `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : `<span style="font-family:var(--font-heading);font-size:0.75rem;color:var(--crimson-glow)">${initials}</span>`;

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:0.5rem';
    wrap.innerHTML = `
      <a href="notifications.html" id="navNotifBtn" style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:var(--ash);font-size:1.1rem;text-decoration:none" title="Notifications">
        🔔<span style="position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:var(--crimson);border:2px solid var(--black);display:none" id="notifDot"></span>
      </a>
      <div id="navUserAvatar" style="width:36px;height:36px;border-radius:50%;border:2px solid var(--crimson);background:linear-gradient(135deg,#2d0f0f,#1a0808);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 10px rgba(139,26,26,0.3);overflow:hidden;flex-shrink:0" title="${user.username}">
        ${avatarHTML}
      </div>`;
    actions.appendChild(wrap);

    // Dropdown
    document.getElementById('navUserAvatar').addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('userDropdown')?.remove();
      const menu = document.createElement('div');
      menu.id = 'userDropdown';
      menu.style.cssText = `position:fixed;top:68px;right:0.75rem;background:linear-gradient(170deg,#110000,#220505,#110000);border:1px solid rgba(139,26,26,0.5);border-radius:var(--radius-lg);padding:0.5rem 0;box-shadow:0 8px 32px rgba(0,0,0,0.8);z-index:9999;min-width:210px;max-width:90vw;animation:fadeInUp 0.18s ease`;
      menu.innerHTML = `
        <div style="padding:0.85rem 1.25rem;border-bottom:1px solid rgba(139,26,26,0.2)">
          <div style="font-family:var(--font-heading);font-size:0.88rem;color:var(--white);margin-bottom:0.1rem">${user.username}</div>
          <div style="font-size:0.72rem;color:var(--ash)">${user.email||''}</div>
          <div style="font-size:0.65rem;color:var(--crimson-glow);font-family:var(--font-heading);letter-spacing:0.1em;text-transform:uppercase;margin-top:0.2rem">✦ ${user.role||'Reader'}</div>
        </div>
        ${[['user-profile.html','👤','My Profile'],['dashboard.html','✍️','Dashboard'],['notifications.html','🔔','Notifications'],['settings.html','⚙️','Settings']].map(([h,i,l])=>`
          <a href="${h}" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1.25rem;color:var(--ash-light);font-family:var(--font-heading);font-size:0.78rem;text-decoration:none" onmouseenter="this.style.background='rgba(139,26,26,0.1)';this.style.color='var(--white)'" onmouseleave="this.style.background='';this.style.color=''">${i} ${l}</a>`).join('')}
        <div style="border-top:1px solid rgba(139,26,26,0.2);margin-top:0.25rem">
          <a href="#" id="dropSignOut" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1.25rem;color:var(--crimson-glow);font-family:var(--font-heading);font-size:0.78rem;text-decoration:none" onmouseenter="this.style.background='rgba(139,26,26,0.08)'" onmouseleave="this.style.background=''">🚪 Sign Out</a>
        </div>`;
      document.body.appendChild(menu);

      document.getElementById('dropSignOut').addEventListener('click', async ev => {
        ev.preventDefault();
        const sb = await window.GT_Supabase?.getSupabase();
        if (sb) await sb.auth.signOut().catch(()=>{});
        localStorage.removeItem('gt-user');
        localStorage.removeItem('gt-logged-in');
        showToast('Signed out. See you in the dark. 🌑');
        setTimeout(() => window.location.href = 'index.html', 700);
      });

      setTimeout(() => document.addEventListener('click', () => menu?.remove(), { once:true }), 10);
    });

  } catch(e) { console.error('navbar session error:', e); }
}

// Run immediately (before DOMContentLoaded for faster paint)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateNavbarSession);
} else {
  updateNavbarSession();
}

// ─── Smooth anchor scroll ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior:'smooth', block:'start' }); }
    });
  });
});