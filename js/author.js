/* ============================================
   author.js — Author Profile Page Logic
============================================ */

// ─── Author Novels Grid ───────────────────────
function initAuthorNovels() {
  const grid = document.getElementById('authorNovelsGrid');
  if (!grid) return;

  const novels = window.MOCK_NOVELS || [];
  grid.innerHTML = novels.slice(0, 6).map(n => window.renderNovelCard(n)).join('');
}

// ─── Recent Updates ───────────────────────────
const RECENT_UPDATES = [
  { novel: 'The Obsidian Court', chapter: 'Chapter 284: Into the Dark Below', date: '2 days ago', words: '4,200' },
  { novel: 'The Obsidian Court', chapter: 'Chapter 283: Blood on the Marble', date: '5 days ago', words: '3,800' },
  { novel: 'The Obsidian Court', chapter: 'Chapter 282: The Final Audience', date: '9 days ago', words: '5,100' },
  { novel: 'Blood of Pale Kings', chapter: 'Epilogue: The Last Dawn', date: '14 days ago', words: '6,200' },
];

function initRecentUpdates() {
  const container = document.getElementById('recentUpdates');
  if (!container) return;

  container.innerHTML = RECENT_UPDATES.map(update => `
    <a href="chapter-read.html" style="
      display:flex;align-items:center;gap:1rem;
      padding:1rem 1.5rem;border-bottom:var(--border-subtle);
      transition:var(--transition);text-decoration:none;
    " class="update-row">
      <div style="flex:1;min-width:0">
        <div style="font-family:var(--font-heading);font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--crimson-glow);margin-bottom:0.2rem">${update.novel}</div>
        <div style="font-size:0.88rem;color:var(--ash-light);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${update.chapter}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:0.75rem;color:var(--ash);font-family:var(--font-heading)">${update.date}</div>
        <div style="font-size:0.72rem;color:var(--ash);margin-top:0.15rem">${update.words} words</div>
      </div>
    </a>
  `).join('');

  // Hover effect
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

// ─── Follow Author ────────────────────────────
function initFollowAuthor() {
  const btn = document.getElementById('followAuthorBtn');
  if (!btn) return;

  let following = false;

  btn.addEventListener('click', () => {
    following = !following;
    btn.textContent = following ? '♥ Following' : '♡ Follow Author';
    btn.classList.toggle('btn-crimson', following);
    btn.classList.toggle('btn-outline', !following);
    window.showToast(following ? 'Now following Marcus Vale! ✦' : 'Unfollowed.');
  });
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAuthorNovels();
  initRecentUpdates();
  initFollowAuthor();
});
