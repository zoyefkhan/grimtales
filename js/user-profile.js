/* ============================================
   user-profile.js — Reader Profile Page
============================================ */

// ─── Tab Switching ────────────────────────────
function initProfileTabs() {
  const panels = { library: 'libraryPanel', history: 'historyPanel', badges: 'badgesPanel', following: 'followingPanel', comments: 'commentsPanel' };

  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById(panels[tab.dataset.tab]);
      if (panel) panel.classList.add('active');
    });
  });
}

// ─── Library Grid ─────────────────────────────
function initLibrary() {
  const grid = document.getElementById('libraryGrid');
  if (!grid) return;

  const saved = (window.MOCK_NOVELS || []).slice(0, 8);
  if (saved.length === 0) {
    grid.innerHTML = `
      <div class="library-empty" style="grid-column:1/-1">
        <div style="font-size:2.5rem;margin-bottom:1rem">📚</div>
        <h3 style="font-family:var(--font-display);color:var(--white);margin-bottom:0.5rem">Your library is empty</h3>
        <p style="color:var(--ash);margin-bottom:1.5rem">Start adding novels to your library by clicking the bookmark button.</p>
        <a href="browse.html" class="btn btn-crimson">Browse Novels</a>
      </div>`;
    return;
  }
  grid.innerHTML = saved.map(n => window.renderNovelCard(n)).join('');
}

// ─── Reading History ──────────────────────────
const HISTORY_DATA = [
  { title: 'The Obsidian Court', author: 'Marcus Vale', chapter: 'Chapter 284', progress: 92, color: ['#1a0808','#2d1010'], lastRead: '2 hours ago' },
  { title: 'Court of Bleeding Stars', author: 'Lyra Mourne', chapter: 'Chapter 112', progress: 45, color: ['#1a0808','#200808'], lastRead: '1 day ago' },
  { title: 'Pale Kings Rising', author: 'Marcus Vale', chapter: 'Chapter 512', progress: 100, color: ['#1a1508','#2a2010'], lastRead: '3 days ago' },
  { title: 'Daughters of Ash', author: 'Seraphina Lowe', chapter: 'Chapter 67', progress: 30, color: ['#0d0d1a','#1a0d2d'], lastRead: '5 days ago' },
  { title: 'The Last Gravedigger', author: 'Tor Halverson', chapter: 'Chapter 201', progress: 68, color: ['#0a1a0a','#0d240d'], lastRead: '1 week ago' },
];

function initHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;

  list.innerHTML = HISTORY_DATA.map(item => `
    <div class="history-item" onclick="window.location='chapter-read.html'">
      <div class="history-cover">
        <div style="width:100%;height:100%;background:linear-gradient(135deg,${item.color[0]},${item.color[1]});display:flex;align-items:center;justify-content:center;padding:0.3rem">
          <span style="font-family:var(--font-heading);font-size:0.5rem;color:var(--white);text-align:center;line-height:1.2">${item.title}</span>
        </div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-family:var(--font-heading);font-size:0.88rem;color:var(--white-dim);margin-bottom:0.15rem">${item.title}</div>
        <div style="font-size:0.78rem;color:var(--ash);margin-bottom:0.5rem">${item.author} · ${item.chapter}</div>
        <div class="history-progress-bar">
          <div class="history-progress-fill" style="width:${item.progress}%"></div>
        </div>
        <div style="font-size:0.68rem;color:var(--ash);margin-top:0.2rem;font-family:var(--font-heading)">${item.progress}% complete</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:0.72rem;color:var(--ash);font-family:var(--font-heading);margin-bottom:0.5rem">${item.lastRead}</div>
        <a href="chapter-read.html" class="btn btn-crimson" style="font-size:0.65rem;padding:0.35em 0.8em">Continue</a>
      </div>
    </div>
  `).join('');
}

// ─── Badges ───────────────────────────────────
const BADGES_DATA = [
  { icon: '📖', name: 'First Chapter', desc: 'Read your first chapter', earned: 'Jan 2024', locked: false },
  { icon: '📚', name: 'Bookworm', desc: 'Add 10 novels to your library', earned: 'Jan 2024', locked: false },
  { icon: '🔥', name: 'On Fire', desc: 'Read 7 days in a row', earned: 'Feb 2024', locked: false },
  { icon: '🌑', name: 'Dark Devotee', desc: 'Read 50 dark fantasy chapters', earned: 'Mar 2024', locked: false },
  { icon: '💬', name: 'Voice of the Dark', desc: 'Post 10 comments', earned: 'Apr 2024', locked: false },
  { icon: '⭐', name: 'Critic', desc: 'Rate 20 novels', earned: 'Apr 2024', locked: false },
  { icon: '❤️', name: 'Loyal Reader', desc: 'Follow 20 authors', earned: 'May 2024', locked: false },
  { icon: '🏆', name: 'Century Reader', desc: 'Read 100 chapters', earned: 'Jun 2024', locked: false },
  { icon: '💀', name: 'Horror Fiend', desc: 'Read 30 horror chapters', earned: null, locked: true },
  { icon: '🧛', name: 'Vampire Obsessed', desc: 'Complete 5 vampire novels', earned: null, locked: true },
  { icon: '🕯️', name: 'Night Owl', desc: 'Read past midnight 10 times', earned: null, locked: true },
  { icon: '👑', name: 'Dark Sovereign', desc: 'Read 1000 chapters total', earned: null, locked: true },
  { icon: '📜', name: 'Lore Keeper', desc: 'Read 5 completed novels', earned: null, locked: true },
  { icon: '🩸', name: 'Blood Reader', desc: 'Read 500 chapters in one genre', earned: null, locked: true },
];

function initBadges() {
  const grid = document.getElementById('badgesGrid');
  if (!grid) return;

  grid.innerHTML = BADGES_DATA.map(b => `
    <div class="badge-card ${b.locked ? 'locked' : ''}">
      <span class="badge-icon">${b.icon}</span>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
      ${b.earned ? `<div class="badge-earned">✦ Earned ${b.earned}</div>` : `<div style="font-size:0.65rem;color:var(--ash);margin-top:0.4rem">🔒 Locked</div>`}
    </div>
  `).join('');
}

// ─── Following Authors ─────────────────────────
const FOLLOWING_AUTHORS = [
  { name: 'Marcus Vale', initial: 'MV', novels: 8, followers: '124K' },
  { name: 'Lyra Mourne', initial: 'LM', novels: 3, followers: '210K' },
  { name: 'Seraphina Lowe', initial: 'SL', novels: 4, followers: '38K' },
  { name: 'Tor Halverson', initial: 'TH', novels: 6, followers: '72K' },
];

function initFollowing() {
  const grid = document.getElementById('followingGrid');
  if (!grid) return;

  grid.innerHTML = FOLLOWING_AUTHORS.map(a => `
    <a href="author-profile.html" style="
      display:flex;align-items:center;gap:1rem;
      padding:1rem 1.25rem;
      background:var(--charcoal);border:var(--border-subtle);border-radius:var(--radius-lg);
      transition:var(--transition);text-decoration:none;
    " onmouseenter="this.style.borderColor='rgba(139,26,26,0.4)'" onmouseleave="this.style.borderColor=''">
      <div style="width:46px;height:46px;border-radius:50%;border:2px solid var(--crimson);background:linear-gradient(135deg,#2d0f0f,#1a0808);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1rem;color:var(--crimson-glow);flex-shrink:0">${a.initial}</div>
      <div>
        <div style="font-family:var(--font-heading);font-size:0.88rem;color:var(--white)">${a.name}</div>
        <div style="font-size:0.75rem;color:var(--ash)">${a.novels} novels · ${a.followers} followers</div>
      </div>
      <button class="btn btn-outline" style="font-size:0.65rem;padding:0.3em 0.7em;margin-left:auto" onclick="event.preventDefault();window.showToast('Unfollowed ${a.name}.')">Unfollow</button>
    </a>
  `).join('');
}

// ─── My Comments ──────────────────────────────
const MY_COMMENTS = [
  { novel: 'The Obsidian Court', chapter: 'Chapter 284', text: 'This plot twist destroyed me in the best way. The scene with the Queen was absolutely devastating.', date: '2 days ago', likes: 12 },
  { novel: 'Court of Bleeding Stars', chapter: 'Chapter 112', text: "Lyra Mourne's prose in this chapter is something else entirely. The metaphor for the dying stars hit different.", date: '5 days ago', likes: 8 },
  { novel: 'Pale Kings Rising', chapter: 'Chapter 488', text: "I've been reading this for 8 months and the ending of this arc is everything. Absolutely incredible.", date: '2 weeks ago', likes: 34 },
];

function initMyComments() {
  const list = document.getElementById('myCommentsList');
  if (!list) return;

  list.innerHTML = MY_COMMENTS.map(c => `
    <div style="background:var(--charcoal);border:var(--border-subtle);border-radius:var(--radius-lg);padding:1.25rem;margin-bottom:0.75rem">
      <div style="display:flex;gap:0.5rem;margin-bottom:0.6rem;flex-wrap:wrap">
        <a href="novel-detail.html" style="font-family:var(--font-heading);font-size:0.72rem;color:var(--crimson-glow);letter-spacing:0.08em;text-transform:uppercase">${c.novel}</a>
        <span style="color:var(--ash);font-size:0.72rem">·</span>
        <a href="chapter-read.html" style="font-size:0.72rem;color:var(--ash)">${c.chapter}</a>
      </div>
      <p style="font-size:0.88rem;color:var(--ash-light);line-height:1.65;margin-bottom:0.6rem">${c.text}</p>
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.72rem;color:var(--ash);font-family:var(--font-heading)">
        <span>${c.date}</span>
        <span style="color:var(--gold)">♥ ${c.likes} likes</span>
      </div>
    </div>
  `).join('');
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initProfileTabs();
  initLibrary();
  initHistory();
  initBadges();
  initFollowing();
  initMyComments();
});
