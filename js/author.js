/* ============================================
   author.js — Author Profile Page Logic
============================================ */

function getAuthorId() {
  return new URLSearchParams(window.location.search).get('id');
}

function formatNumber(value) {
  return value != null && !Number.isNaN(Number(value))
    ? Number(value).toLocaleString()
    : '—';
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en', { month: 'short', year: 'numeric' });
}

function updateText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

async function initAuthorProfile() {
  const authorId = getAuthorId();
  if (!authorId || !window.GT_Supabase) return;

  const sb = await window.GT_Supabase.getSupabase();
  if (!sb) return;

  const { data: profile, error: profileError } = await sb.from('profiles')
    .select('id, username, avatar_url, bio, location, website, is_verified, created_at')
    .eq('id', authorId)
    .single();

  if (profileError || !profile) {
    console.warn('author.js initAuthorProfile:', profileError?.message);
    return;
  }

  const authorName = profile.username || 'Author';
  const initials = authorName.slice(0, 2).toUpperCase();
  const avatarContainer = document.querySelector('.author-avatar-large');
  if (avatarContainer) {
    avatarContainer.innerHTML = profile.avatar_url
      ? `<img src="${profile.avatar_url}" alt="${authorName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : initials;
  }

  updateText('.author-name-large', authorName);
  const badges = document.querySelector('.author-badges');
  if (badges) {
    badges.innerHTML = profile.is_verified
      ? '<span class="author-badge badge-verified">✦ Verified Author</span>'
      : '';
  }

  updateText('.author-tagline', profile.bio || 'Author on GrimTales.');

  const aboutTitle = document.querySelector('.profile-panel-title');
  if (aboutTitle) aboutTitle.textContent = `About ${authorName}`;
}

async function initAuthorNovels() {
  const authorId = getAuthorId();
  if (!authorId || !window.GT_Supabase) return;

  const sb = await window.GT_Supabase.getSupabase();
  if (!sb) return;

  const { data: novels, error } = await sb.from('novels')
    .select('id, title, cover_url, total_chapters, total_views, avg_rating, last_chapter_at, is_visible')
    .eq('author', authorId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.warn('author.js initAuthorNovels:', error.message);
    return;
  }

  const visibleNovels = novels || [];
  const grid = document.getElementById('authorNovelsGrid');
  if (grid) {
    grid.innerHTML = visibleNovels.length
      ? visibleNovels.map(n => window.renderNovelCard(n)).join('')
      : '<div style="color:var(--ash);padding:2rem;text-align:center">No published novels found yet.</div>';
  }

  const stats = {
    novels: visibleNovels.length,
    totalViews: visibleNovels.reduce((sum, n) => sum + (Number(n.total_views) || 0), 0),
    totalChapters: visibleNovels.reduce((sum, n) => sum + (Number(n.total_chapters) || 0), 0),
  };

  const statEls = document.querySelectorAll('.author-stats-row .author-stat-num');
  if (statEls.length >= 4) {
    statEls[0].textContent = formatNumber(stats.novels);
    statEls[1].textContent = '—';
    statEls[2].textContent = formatNumber(stats.totalViews);
    statEls[3].textContent = formatNumber(stats.totalChapters);
  }

  const panelTitles = document.querySelectorAll('.profile-panel-title');
  if (panelTitles.length >= 2) {
    panelTitles[1].textContent = `Published Novels (${stats.novels})`;
  }

  const profileInfoItems = Array.from(document.querySelectorAll('.profile-info-item'));
  profileInfoItems.forEach(item => {
    const key = item.querySelector('.profile-info-key')?.textContent?.trim();
    const val = item.querySelector('.profile-info-val');
    if (!key || !val) return;
    if (key.includes('Member Since')) val.textContent = formatDate(profile.created_at);
    if (key.includes('Location')) val.textContent = profile.location || 'Unknown';
    if (key.includes('Update Schedule') && visibleNovels.length === 0) val.textContent = 'To be announced';
    if (key.includes('Total Words')) val.textContent = formatNumber(visibleNovels.reduce((sum, n) => sum + ((n.word_count && Number(n.word_count)) || 0), 0));
    if (key.includes('Avg. Rating')) val.textContent = visibleNovels.length
      ? `★ ${(visibleNovels.reduce((sum, n) => sum + (Number(n.avg_rating) || 0), 0) / visibleNovels.length).toFixed(1)} / 5.0`
      : '—';
  });
}

function renderRecentUpdates(novels) {
  const container = document.getElementById('recentUpdates');
  if (!container) return;

  const recent = (novels || [])
    .filter(n => n.last_chapter_at)
    .sort((a, b) => new Date(b.last_chapter_at) - new Date(a.last_chapter_at))
    .slice(0, 4);

  if (!recent.length) {
    container.innerHTML = '<div style="color:var(--ash);padding:2rem;text-align:center">No recent updates available.</div>';
    return;
  }

  container.innerHTML = recent.map(n => `
    <a href="novel-detail.html?id=${n.id}" style="
      display:flex;align-items:center;gap:1rem;
      padding:1rem 1.5rem;border-bottom:var(--border-subtle);
      transition:var(--transition);text-decoration:none;
    " class="update-row">
      <div style="flex:1;min-width:0">
        <div style="font-family:var(--font-heading);font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--crimson-glow);margin-bottom:0.2rem">${n.title}</div>
        <div style="font-size:0.88rem;color:var(--ash-light);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Latest chapter updated</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:0.75rem;color:var(--ash);font-family:var(--font-heading)">${formatDate(n.last_chapter_at)}</div>
      </div>
    </a>
  `).join('');

  document.querySelectorAll('.update-row').forEach(row => {
    row.addEventListener('mouseenter', () => {
      row.style.background = 'rgba(139,26,26,0.04)';
      row.style.paddingLeft = '2rem';
    });
    row.addEventListener('mouseleave', () => {
      row.style.background = '';
      row.style.paddingLeft = '';
    });
  });
}

function initFollowAuthor() {
  const btn = document.getElementById('followAuthorBtn');
  if (!btn) return;

  let following = false;
  btn.addEventListener('click', () => {
    following = !following;
    btn.textContent = following ? '♥ Following' : '♡ Follow Author';
    btn.classList.toggle('btn-crimson', following);
    btn.classList.toggle('btn-outline', !following);
    window.showToast(following ? 'Now following this author! ✦' : 'Unfollowed.');
  });
}

async function initAuthorPage() {
  await initAuthorProfile();
  await initAuthorNovels();
  const authorId = getAuthorId();
  if (!authorId || !window.GT_Supabase) return;
  const sb = await window.GT_Supabase.getSupabase();
  if (!sb) return;
  const { data: novels } = await sb.from('novels')
    .select('id, title, last_chapter_at, is_visible')
    .eq('author', authorId)
    .eq('is_visible', true)
    .order('last_chapter_at', { ascending: false })
    .limit(20);
  renderRecentUpdates(novels || []);
}

document.addEventListener('DOMContentLoaded', () => {
  initAuthorPage();
  initFollowAuthor();
});
