/* ============================================
   search.js — Search Page Logic
============================================ */

const MOCK_AUTHORS = [
  { id: 1, name: 'Marcus Vale', initial: 'MV', novels: 8, followers: '124K', genres: ['Dark Fantasy', 'Gothic Horror'] },
  { id: 2, name: 'Seraphina Lowe', initial: 'SL', novels: 4, followers: '38K', genres: ['Gothic Horror', 'Supernatural'] },
  { id: 3, name: 'Tor Halverson', initial: 'TH', novels: 6, followers: '72K', genres: ['Horror', 'Psychological'] },
  { id: 4, name: 'Lyra Mourne', initial: 'LM', novels: 3, followers: '210K', genres: ['Gothic Romance', 'Dark Fantasy'] },
  { id: 5, name: 'Elara Voss', initial: 'EV', novels: 5, followers: '54K', genres: ['Vampire', 'Supernatural'] },
  { id: 6, name: 'Nadia Crow', initial: 'NC', novels: 2, followers: '18K', genres: ['Supernatural', 'Mystery'] },
];

const MOCK_TAGS = [
  'anti-hero', 'dark fantasy', 'magic system', 'political intrigue', 'gothic romance',
  'slow burn', 'vampire', 'horror', 'psychological', 'redemption', 'tragedy', 'revenge',
  'found family', 'court drama', 'supernatural', 'apocalyptic', 'dark MC', 'completed',
];

let currentTab = 'novels';
let currentQuery = '';

// ─── Get query from URL ───────────────────────
function getQueryFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('q') || '';
}

// ─── Update URL ───────────────────────────────
function updateURL(q) {
  const url = new URL(window.location);
  if (q) url.searchParams.set('q', q);
  else url.searchParams.delete('q');
  window.history.pushState({}, '', url);
}

// ─── Search Logic ─────────────────────────────
function searchNovels(q) {
  if (!q) return window.MOCK_NOVELS || [];
  const lower = q.toLowerCase();
  return (window.MOCK_NOVELS || []).filter(n =>
    n.title.toLowerCase().includes(lower) ||
    n.author.toLowerCase().includes(lower) ||
    n.genre.toLowerCase().includes(lower)
  );
}

function searchAuthors(q) {
  if (!q) return MOCK_AUTHORS;
  const lower = q.toLowerCase();
  return MOCK_AUTHORS.filter(a =>
    a.name.toLowerCase().includes(lower) ||
    a.genres.some(g => g.toLowerCase().includes(lower))
  );
}

function searchTags(q) {
  if (!q) return MOCK_TAGS;
  const lower = q.toLowerCase();
  return MOCK_TAGS.filter(t => t.includes(lower));
}

// ─── Render Results ───────────────────────────
function renderResults(q) {
  currentQuery = q;
  const novels = searchNovels(q);
  const authors = searchAuthors(q);
  const tags = searchTags(q);

  // Update heading
  const heading = document.getElementById('searchQueryDisplay');
  if (heading) heading.textContent = `"${q || 'all'}"`;

  // Update tab counts
  document.getElementById('novelsTabCount').textContent = `(${novels.length})`;
  document.getElementById('authorsTabCount').textContent = `(${authors.length})`;
  document.getElementById('tagsTabCount').textContent = `(${tags.length})`;

  // Novels
  const novelResults = document.getElementById('novelResults');
  const noNovels = document.getElementById('noNovels');
  const novelsCount = document.getElementById('novelsCount');

  if (novelResults) {
    novelResults.innerHTML = novels.map(n => window.renderNovelListItem(n)).join('');
    if (novelsCount) novelsCount.innerHTML = `Found <span>${novels.length}</span> novels${q ? ` for <em>"${q}"</em>` : ''}`;
    noNovels.style.display = novels.length === 0 ? 'block' : 'none';
    novelResults.style.display = novels.length === 0 ? 'none' : 'flex';
  }

  // Authors
  const authorResults = document.getElementById('authorResults');
  const noAuthors = document.getElementById('noAuthors');
  const authorsCount = document.getElementById('authorsCount');

  if (authorResults) {
    authorResults.innerHTML = authors.map(a => `
      <a href="author-profile.html" class="author-result-card">
        <div class="author-result-avatar">${a.initial}</div>
        <div>
          <div class="author-result-name">${a.name}</div>
          <div class="author-result-meta">${a.novels} novels · ${a.followers} followers</div>
          <div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-top:0.4rem">
            ${a.genres.map(g => `<span class="tag" style="font-size:0.6rem">${g}</span>`).join('')}
          </div>
        </div>
      </a>
    `).join('');
    if (authorsCount) authorsCount.innerHTML = `Found <span>${authors.length}</span> authors`;
    noAuthors.style.display = authors.length === 0 ? 'block' : 'none';
    authorResults.style.display = authors.length === 0 ? 'none' : 'grid';
  }

  // Tags
  const tagResults = document.getElementById('tagResults');
  const tagsCount = document.getElementById('tagsCount');

  if (tagResults) {
    tagResults.innerHTML = tags.map(t => `
      <button class="suggestion-chip" onclick="doSearch('${t}')">#${t}</button>
    `).join('');
    if (tagsCount) tagsCount.innerHTML = `Found <span>${tags.length}</span> tags`;
  }

  // Show/hide suggestions
  const suggestions = document.getElementById('searchSuggestions');
  if (suggestions) suggestions.style.display = q ? 'none' : 'block';
}

// ─── Tab Switching ────────────────────────────
function initTabs() {
  document.querySelectorAll('.search-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;

      ['novels', 'authors', 'tags'].forEach(id => {
        const el = document.getElementById(`${id}Tab`);
        if (el) el.style.display = id === currentTab ? 'block' : 'none';
      });
    });
  });
}

// ─── Search Input ─────────────────────────────
function doSearch(q) {
  const input = document.getElementById('searchInput');
  if (input) input.value = q;
  updateURL(q);
  renderResults(q);
}

function initSearchBar() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');

  btn?.addEventListener('click', () => doSearch(input?.value.trim() || ''));
  input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(input.value.trim()); });

  // Suggestion chips
  document.querySelectorAll('.suggestion-chip[data-q]').forEach(chip => {
    chip.addEventListener('click', () => doSearch(chip.dataset.q));
  });

  // Sort
  document.getElementById('novelSort')?.addEventListener('change', () => renderResults(currentQuery));
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSearchBar();

  const q = getQueryFromURL();
  const input = document.getElementById('searchInput');
  if (input && q) input.value = q;

  renderResults(q);
});
