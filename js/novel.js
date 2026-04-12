/* ============================================
   novel.js — Novel Detail Page Logic
============================================ */

// ─── Synopsis Toggle ─────────────────────────
function initSynopsisToggle() {
  const text = document.getElementById('synopsisText');
  const toggle = document.getElementById('synopsisToggle');
  if (!text || !toggle) return;

  let collapsed = true;

  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    text.classList.toggle('collapsed', collapsed);
    toggle.textContent = collapsed ? '▾ Read More' : '▴ Show Less';
  });
}

// ─── Chapter List ─────────────────────────────
const CHAPTERS = Array.from({ length: 30 }, (_, i) => ({
  num: i + 1,
  title: [
    'The Fall of House Morn', 'The Exiled Road', 'Court of Shadows',
    'Blood Contracts', 'The First Lie', 'The Sorceress of Ashen Moors',
    'A Jester\'s Riddle', 'Queen\'s Gambit', 'The Obsidian Gate Opens',
    'Allies and Assassins', 'The Weight of Secrets', 'Crown Without a King',
    'Midnight Audience', 'The Price of Entry', 'Three Moves Ahead',
    'Shattered Vows', 'The Bleeding Archive', 'What the Shadows Remember',
    'Coronation of Ash', 'The Pale Conspiracy', 'Thornhold\'s Secret',
    'A Name Written in Smoke', 'The Sorceress Speaks', 'Court Martial',
    'Unmarked Graves', 'The Empty Throne', 'Fractured Alliances',
    'Blood on the Marble', 'The Final Audience', 'Into the Dark Below',
  ][i] || `Chapter ${i + 1}`,
  date: `${Math.floor(Math.random() * 28) + 1} days ago`,
  read: i < 3,
}));

function initChapterList() {
  const list = document.getElementById('chaptersList');
  if (!list) return;

  function render(chapters) {
    list.innerHTML = chapters.map(ch => `
      <a href="chapter-read.html" class="chapter-list-item ${ch.read ? 'read' : 'unread'}">
        <div class="chapter-list-num">${String(ch.num).padStart(3, '0')}</div>
        <div class="chapter-read-indicator"></div>
        <div class="chapter-list-title">${ch.title}</div>
        <div class="chapter-list-date">${ch.date}</div>
      </a>
    `).join('');
  }

  render(CHAPTERS.slice(0, 15));

  // Sort buttons
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const reversed = btn.textContent.trim() === 'Newest';
      render(reversed ? [...CHAPTERS].reverse().slice(0, 15) : CHAPTERS.slice(0, 15));
    });
  });

  // Load more
  let showing = 15;
  const loadMore = document.getElementById('loadMoreChapters');
  if (loadMore) {
    loadMore.addEventListener('click', () => {
      showing = Math.min(showing + 15, CHAPTERS.length);
      render(CHAPTERS.slice(0, showing));
      if (showing >= CHAPTERS.length) loadMore.style.display = 'none';
    });
  }
}

// ─── Follow / Bookmark / Rate ─────────────────
function initNovelActions() {
  const followBtn = document.getElementById('followBtn');
  const bookmarkBtn = document.getElementById('bookmarkBtn');
  const rateBtn = document.getElementById('rateBtn');

  let following = false;
  let bookmarked = false;

  followBtn?.addEventListener('click', () => {
    following = !following;
    followBtn.textContent = following ? '♥ Following' : '♡ Follow';
    followBtn.classList.toggle('btn-crimson', following);
    followBtn.classList.toggle('btn-outline', !following);
    window.showToast(following ? 'Now following The Obsidian Court! ✦' : 'Unfollowed.');
  });

  bookmarkBtn?.addEventListener('click', () => {
    bookmarked = !bookmarked;
    bookmarkBtn.textContent = bookmarked ? '🔖 Bookmarked' : '🔖 Bookmark';
    window.showToast(bookmarked ? 'Added to your library!' : 'Removed from library.');
  });

  rateBtn?.addEventListener('click', () => {
    window.showToast('Sign in to rate this novel.');
  });
}

// ─── Similar Novels ───────────────────────────
function initSimilarNovels() {
  const container = document.getElementById('similarList');
  if (!container) return;

  const similar = (window.MOCK_NOVELS || []).slice(1, 5);
  container.innerHTML = similar.map(n => `
    <div class="similar-item" onclick="window.location='novel-detail.html'">
      <div class="similar-cover">
        <div style="width:100%;height:100%;background:linear-gradient(135deg,${n.color[0]},${n.color[1]});display:flex;align-items:center;justify-content:center;padding:0.25rem">
          <span style="font-family:var(--font-heading);font-size:0.5rem;color:var(--white);text-align:center;line-height:1.2">${n.title}</span>
        </div>
      </div>
      <div>
        <div class="similar-title">${n.title}</div>
        <div class="similar-author">${n.author}</div>
        <div class="similar-rating">★ ${n.rating}</div>
      </div>
    </div>
  `).join('');
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSynopsisToggle();
  initChapterList();
  initNovelActions();
  initSimilarNovels();
});
