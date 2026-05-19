/* ============================================
   reader.js — Chapter Reader (Fixed)
   Loads real data from Supabase via URL ?id=
============================================ */

// ─── Get chapter ID from URL ──────────────────
function getChapterId() {
  return new URLSearchParams(window.location.search).get('id');
}

// ─── Get novel ID from URL ────────────────────
function getNovelId() {
  return new URLSearchParams(window.location.search).get('novel');
}

// ─── Load chapter data ────────────────────────
async function loadChapter() {
  let chapterId = getChapterId();
  const novelId = getNovelId();
  if (!chapterId && !novelId) {
    showReaderError('No chapter specified.');
    return;
  }

  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) { showReaderError('Not connected to database.'); return; }

  let chapter;
  if (chapterId) {
    const { data, error } = await sb
      .from('chapters')
      .select('*, novel:novels(id, title, author_id, total_chapters)')
      .eq('id', chapterId)
      .single();
    if (error || !data) { showReaderError('Chapter not found.'); return; }
    chapter = data;
  } else {
    const { data, error } = await sb
      .from('chapters')
      .select('*, novel:novels(id, title, author_id, total_chapters)')
      .eq('novel_id', novelId)
      .eq('is_published', true)
      .order('number', { ascending: true })
      .limit(1)
      .single();
    if (error || !data) { showReaderError('No published chapters found for this novel.'); return; }
    chapter = data;
    chapterId = chapter.id;
    window.history.replaceState(null, '', `chapter-read.html?id=${chapterId}`);
  }

  if (error || !chapter) { showReaderError('Chapter not found.'); return; }

  const novel = chapter.novel;

  // ── Update page title ──
  document.title = `${chapter.title} — ${novel?.title || 'GrimTales'}`;

  // ── Update reader header ──
  const novelLink = document.querySelector('.reader-novel-link');
  if (novelLink) {
    novelLink.textContent = `← ${novel?.title || 'Novel'}`;
    novelLink.href = `novel-detail.html?id=${novel?.id}`;
  }

  // Also update navbar Novel link
  const navNovelLink = document.querySelector('.navbar-nav a[href="novel-detail.html"]');
  if (navNovelLink) navNovelLink.href = `novel-detail.html?id=${novel?.id}`;

  const chapterTitleEl = document.querySelector('.reader-chapter-title');
  if (chapterTitleEl) chapterTitleEl.textContent = chapter.title;

  // ── Update chapter heading ──
  const chapterNumEl = document.querySelector('.chapter-number');
  if (chapterNumEl) chapterNumEl.textContent = `Chapter ${toRoman(chapter.number)}`;

  const chapterTitleMain = document.querySelector('.chapter-title-main');
  if (chapterTitleMain) chapterTitleMain.textContent = chapter.title;

  // ── Update chapter meta ──
  const metaRow = document.querySelector('.chapter-meta-row');
  if (metaRow) {
    const wordCount = chapter.word_count || chapter.content?.trim().split(/\s+/).length || 0;
    const readTime = Math.ceil(wordCount / 250);
    const pubDate = chapter.published_at
      ? new Date(chapter.published_at).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })
      : '';
    metaRow.innerHTML = `
      ${pubDate ? `<span>${pubDate}</span><span>·</span>` : ''}
      <span>${wordCount.toLocaleString()} words</span>
      <span>·</span>
      <span>~${readTime} min read</span>`;
  }

  // ── Render chapter body ──
  const chapterBody = document.getElementById('chapterBody');
  if (chapterBody && chapter.content) {
    chapterBody.innerHTML = chapter.content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => p === '— ✦ —' || p === '* * *'
        ? `<div class="chapter-ornament">— ✦ —</div>`
        : `<p>${p}</p>`)
      .join('');
  }

  // ── Save reading progress key ──
  const progressKey = `gt-progress-${novel?.id}-${chapterId}`;
  initProgressBar(progressKey);

  // ── Load all chapters for TOC + navigation ──
  const { data: allChapters } = await sb
    .from('chapters')
    .select('id, number, title')
    .eq('novel_id', novel?.id)
    .eq('is_published', true)
    .order('number', { ascending: true });

  if (allChapters?.length) {
    // Build TOC
    buildTOC(allChapters, chapterId);

    // Build navigation
    const currentIndex = allChapters.findIndex(c => c.id === chapterId);
    const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;
    const totalChapters = allChapters.length;

    buildNavigation(prevChapter, nextChapter, chapter.number, totalChapters);
  }

  // ── Increment views ──
  sb.from('chapters').update({ views: (chapter.views || 0) + 1 }).eq('id', chapterId).then(() => {});

  // ── Load comments ──
  loadChapterComments(chapterId, novel?.id);
}

// ─── Build Table of Contents ──────────────────
function buildTOC(chapters, currentId) {
  const tocList = document.getElementById('tocList');
  if (!tocList) return;

  tocList.innerHTML = chapters.map(ch => `
    <li>
      <a href="chapter-read.html?id=${ch.id}" 
         class="${ch.id === currentId ? 'active' : ''}">
        Chapter ${ch.number}: ${ch.title}
      </a>
    </li>`).join('');
}

// ─── Build Chapter Navigation ─────────────────
function buildNavigation(prev, next, currentNum, total) {
  // Top nav buttons
  const prevTop  = document.getElementById('prevChapter');
  const nextTop  = document.getElementById('nextChapter');
  // Bottom nav buttons
  const prevBot  = document.getElementById('prevChapterBottom');
  const nextBot  = document.getElementById('nextChapterBottom');
  // Progress text
  const progress = document.querySelector('.chapter-nav-progress');

  if (progress) progress.textContent = `Chapter ${currentNum} of ${total}`;

  // Previous
  [prevTop, prevBot].forEach(btn => {
    if (!btn) return;
    if (prev) {
      btn.disabled = false;
      btn.onclick = () => window.location.href = `chapter-read.html?id=${prev.id}`;
      const nameEl = btn.querySelector('.nav-chapter-name');
      if (nameEl) nameEl.textContent = prev.title;
    } else {
      btn.disabled = true;
      const nameEl = btn.querySelector('.nav-chapter-name');
      if (nameEl) nameEl.textContent = '—';
    }
  });

  // Next
  [nextTop, nextBot].forEach(btn => {
    if (!btn) return;
    if (next) {
      btn.disabled = false;
      btn.onclick = () => window.location.href = `chapter-read.html?id=${next.id}`;
      const nameEl = btn.querySelector('.nav-chapter-name');
      if (nameEl) nameEl.textContent = next.title;
    } else {
      btn.disabled = true;
      const nameEl = btn.querySelector('.nav-chapter-name');
      if (nameEl) nameEl.textContent = '—';
    }
  });
}

// ─── Load chapter comments ────────────────────
async function loadChapterComments(chapterId, novelId) {
  const container = document.getElementById('commentsSection');
  if (!container) return;

  const sb = await window.GT_Supabase?.getSupabase();
  if (!sb) return;

  const { data: comments } = await sb
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey(username, avatar_url)')
    .eq('chapter_id', chapterId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(30);

  // Update comment count
  const countEl = document.querySelector('.comments-title span');
  if (countEl) countEl.textContent = `(${comments?.length || 0})`;

  if (!comments?.length) {
    container.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--ash);font-size:0.9rem">Be the first to comment on this chapter!</div>`;
    return;
  }

  container.innerHTML = comments.map(c => {
    const initials = (c.author?.username || '?').slice(0, 2).toUpperCase();
    const avatar = c.author?.avatar_url
      ? `<img src="${c.author.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : `<span style="font-family:var(--font-heading);font-size:0.75rem;color:var(--crimson-glow)">${initials}</span>`;
    return `
      <div class="comment-item" style="display:flex;gap:1rem;padding:1.25rem;margin-bottom:0.75rem;border-radius:var(--radius-lg)">
        <div style="width:38px;height:38px;border-radius:50%;border:2px solid var(--crimson);background:linear-gradient(135deg,#2d0f0f,#1a0808);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
          ${avatar}
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem">
            <span style="font-family:var(--font-heading);font-size:0.82rem;color:var(--white)">${c.author?.username || 'Anonymous'}</span>
            <span style="font-size:0.72rem;color:var(--ash)">${timeAgo(c.created_at)}</span>
          </div>
          <div style="font-size:0.9rem;color:var(--ash-light);line-height:1.6">${c.text}</div>
        </div>
      </div>`;
  }).join('');

  // Wire up comment form
  initCommentForm(chapterId, novelId);
}

// ─── Comment form ─────────────────────────────
function initCommentForm(chapterId, novelId) {
  const textarea = document.querySelector('.comment-form textarea');
  const footer   = document.querySelector('.comment-form-footer');
  if (!textarea || !footer) return;

  const user = JSON.parse(localStorage.getItem('gt-user') || 'null');
  if (!user?.id) return; // Not logged in — keep "Sign In" button

  // Replace Sign In with Post button
  footer.innerHTML = `<button class="btn btn-crimson" id="postCommentBtn">Post Comment</button>`;

  document.getElementById('postCommentBtn')?.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) { window.showToast('Write something first.', 'error'); return; }

    const result = await window.GT_Data?.postComment(chapterId, novelId, text);
    if (result) {
      textarea.value = '';
      window.showToast('Comment posted! ✦');
      loadChapterComments(chapterId, novelId);
    }
  });
}

// ─── Progress Bar ─────────────────────────────
function initProgressBar(progressKey) {
  const bar       = document.getElementById('progressBar');
  const indicator = document.getElementById('progressIndicator');
  const percent   = document.getElementById('readingPercent');

  if (!bar) return;

  function updateProgress() {
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const progress   = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;

    bar.style.width = progress + '%';
    if (indicator) indicator.style.height = progress + '%';
    if (percent)   percent.textContent = Math.round(progress) + '%';

    if (progressKey) localStorage.setItem(progressKey, Math.round(progress));
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

// ─── Reader Settings ──────────────────────────
const READER_DEFAULTS = { fontSize: 18, lineHeight: 1.95, theme: 'dark', font: 'crimson' };
const FONT_MAP = {
  crimson:  "'Crimson Text', serif",
  garamond: "'EB Garamond', serif",
  georgia:  "Georgia, serif",
  cinzel:   "'Cinzel', serif",
};

function loadSettings()         { return { ...READER_DEFAULTS, ...JSON.parse(localStorage.getItem('gt-reader-settings') || '{}') }; }
function saveSettings(settings) { localStorage.setItem('gt-reader-settings', JSON.stringify(settings)); }

function applyReaderSettings(settings) {

  const chapterBody = document.getElementById('chapterBody');
  if (!chapterBody) return;

  chapterBody.style.fontSize   = settings.fontSize + 'px';
  chapterBody.style.lineHeight = settings.lineHeight;
  chapterBody.style.fontFamily = FONT_MAP[settings.font] || FONT_MAP.crimson;


  const display = document.getElementById('fontSizeDisplay');
  if (display) display.textContent = settings.fontSize + 'px';

  document.querySelectorAll('.font-option').forEach(el =>
    el.classList.toggle('active', el.dataset.font === settings.font));
  document.querySelectorAll('.theme-swatch').forEach(el =>
    el.classList.toggle('active', el.dataset.theme === settings.theme));


  const readerContent = document.getElementById('readerContent');
  if (readerContent) {
    if (settings.theme === 'sepia') {
      readerContent.style.background = '#1a1408';
      chapterBody.style.color = '#c8b896';
    } else if (settings.theme === 'light') {
      readerContent.style.background = '#f5f0e8';
      chapterBody.style.color = '#2e2418';
    } else {
      readerContent.style.background = '';
      chapterBody.style.color = '';
    }
  }


  const slider = document.getElementById('lineHeightSlider');
  if (slider) slider.value = settings.lineHeight;
}

function initSettings() {
  applyReaderSettings(loadSettings());

  const panel = document.getElementById('settingsPanel');
  const btn   = document.getElementById('settingsBtn');

  btn?.addEventListener('click', e => { e.stopPropagation(); panel?.classList.toggle('open'); });
  document.addEventListener('click', e => {
    if (panel && !panel.contains(e.target) && e.target !== btn) panel.classList.remove('open');
  });

  document.getElementById('fontIncrease')?.addEventListener('click', () => {
    const s = loadSettings();
    if (s.fontSize < 28) { s.fontSize++; saveSettings(s); applyReaderSettings(s); }
  });
  document.getElementById('fontDecrease')?.addEventListener('click', () => {
    const s = loadSettings();
    if (s.fontSize > 14) { s.fontSize--; saveSettings(s); applyReaderSettings(s); }
  });

  document.querySelectorAll('.font-option').forEach(el =>
    el.addEventListener('click', () => {
      const s = loadSettings(); s.font = el.dataset.font; saveSettings(s); applyReaderSettings(s);
    }));

  document.querySelectorAll('.theme-swatch').forEach(el =>
    el.addEventListener('click', () => {
      const s = loadSettings(); s.theme = el.dataset.theme; saveSettings(s); applyReaderSettings(s);
    }));

  document.getElementById('lineHeightSlider')?.addEventListener('input', e => {
    const s = loadSettings(); s.lineHeight = parseFloat(e.target.value); saveSettings(s); applyReaderSettings(s);
  });
}

// ─── Keyboard Shortcuts ───────────────────────
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === 'l') document.getElementById('nextChapterBottom')?.click();
    if (e.key === 'ArrowLeft'  || e.key === 'h') document.getElementById('prevChapterBottom')?.click();
    if (e.key === 's' || e.key === 'S') document.getElementById('settingsBtn')?.click();
  });
}

// ─── Error state ──────────────────────────────
function showReaderError(msg) {
  document.querySelector('.reader-content').innerHTML = `
    <div style="text-align:center;padding:6rem 2rem">
      <div style="font-size:3rem;margin-bottom:1.5rem;opacity:0.3">📖</div>
      <h2 style="font-family:var(--font-display);color:var(--white);margin-bottom:1rem">Chapter Not Found</h2>
      <p style="color:var(--ash);margin-bottom:2rem">${msg}</p>
      <a href="browse.html" class="btn btn-crimson">Browse Novels</a>
    </div>`;
}

// ─── Helpers ──────────────────────────────────
function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d);
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);
  if (dy > 0) return `${dy}d ago`;
  if (h > 0)  return `${h}h ago`;
  if (m > 0)  return `${m}m ago`;
  return 'just now';
}

function toRoman(num) {
  const map = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],
               [50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let result = '';
  for (const [v, s] of map) { while (num >= v) { result += s; num -= v; } }
  return result;
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadChapter();
  initSettings();

  initKeyboardShortcuts();
});
