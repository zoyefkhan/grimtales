/* ============================================
   browse.js — Browse Page Logic
============================================ */

let currentView = 'grid';
let currentPage = 1;
let currentGenre = 'all';
let currentSort = 'trending';
const PER_PAGE = 12;

// ─── Filter Chips ────────────────────────────
function initFilterChips() {
  document.querySelectorAll('.filter-chip[data-genre]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-genre]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentGenre = chip.dataset.genre;
      currentPage = 1;
      renderNovels();
    });
  });
}

// ─── Sort ────────────────────────────────────
function initSort() {
  const sortSelect = document.getElementById('sortSelect');
  if (!sortSelect) return;
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    currentPage = 1;
    renderNovels();
  });
}

// ─── View Toggle ─────────────────────────────
function initViewToggle() {
  const grid = document.getElementById('novelsGrid');
  const list = document.getElementById('novelsList');
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      if (currentView === 'grid') {
        grid.style.display = 'grid';
        list.style.display = 'none';
      } else {
        grid.style.display = 'none';
        list.style.display = 'flex';
      }
      renderNovels();
    });
  });
}

// ─── Filter Checkboxes ────────────────────────
function initFilterOptions() {
  document.querySelectorAll('.filter-option').forEach(option => {
    option.addEventListener('click', () => {
      option.classList.toggle('checked');
      renderNovels();
    });
  });

  // Rating stars
  const stars = document.querySelectorAll('.rating-star-btn');
  stars.forEach((star, i) => {
    star.addEventListener('click', () => {
      const rating = parseInt(star.dataset.rating);
      stars.forEach((s, j) => {
        s.classList.toggle('active', j < rating);
      });
    });
  });

  // Filter reset
  const reset = document.getElementById('resetFilters');
  if (reset) {
    reset.addEventListener('click', () => {
      document.querySelectorAll('.filter-option').forEach(o => o.classList.remove('checked'));
      document.querySelectorAll('.filter-chip[data-genre]').forEach(c => {
        c.classList.toggle('active', c.dataset.genre === 'all');
      });
      currentGenre = 'all';
      currentPage = 1;
      renderNovels();
      window.showToast('Filters cleared.');
    });
  }
}

// ─── Search ───────────────────────────────────
function initBrowseSearch() {
  const searchInput = document.getElementById('browseSearch');
  const searchBtn = document.getElementById('searchBtn');

  const doSearch = () => {
    const q = searchInput?.value.trim();
    if (q) {
      currentPage = 1;
      renderNovels(q);
    }
  };

  searchBtn?.addEventListener('click', doSearch);
  searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });

  // Pre-fill from URL param
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q && searchInput) { searchInput.value = q; doSearch(); }

  const genre = params.get('genre');
  if (genre) {
    const chip = document.querySelector(`.filter-chip[data-genre="${genre}"]`);
    if (chip) {
      document.querySelectorAll('.filter-chip[data-genre]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentGenre = genre;
    }
  }
}

// ─── Render Novels ────────────────────────────
function getFilteredNovels(q = '') {
  let novels = [...(window.MOCK_NOVELS || [])];

  // Genre filter
  if (currentGenre !== 'all') {
    novels = novels.filter(n => n.genre.toLowerCase().replace(/\s/g, '-').includes(currentGenre));
  }

  // Search filter
  if (q) {
    const lower = q.toLowerCase();
    novels = novels.filter(n =>
      n.title.toLowerCase().includes(lower) ||
      n.author.toLowerCase().includes(lower) ||
      n.genre.toLowerCase().includes(lower)
    );
  }

  // Sort
  if (currentSort === 'rating') novels.sort((a, b) => b.rating - a.rating);
  else if (currentSort === 'new') novels.sort((a, b) => (b.badge === 'new' ? 1 : 0) - (a.badge === 'new' ? 1 : 0));
  else if (currentSort === 'views') {
    const toNum = v => parseFloat(v) * (v.includes('M') ? 1000000 : v.includes('K') ? 1000 : 1);
    novels.sort((a, b) => toNum(b.views) - toNum(a.views));
  }

  return novels;
}

function renderNovels(q = '') {
  const novels = getFilteredNovels(q);
  const grid = document.getElementById('novelsGrid');
  const list = document.getElementById('novelsList');
  const countEl = document.getElementById('resultsCount');

  if (countEl) countEl.textContent = (novels.length * 84).toLocaleString(); // Simulate large count

  const start = (currentPage - 1) * PER_PAGE;
  const page = novels.slice(start, start + PER_PAGE);

  if (grid) grid.innerHTML = page.length ? page.map(n => window.renderNovelCard(n)).join('') : '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--ash)">No novels found matching your criteria.</div>';

  if (list) list.innerHTML = page.map(n => window.renderNovelListItem(n)).join('');

  renderPagination(novels.length);
}

// ─── Pagination ───────────────────────────────
function renderPagination(total) {
  const totalPages = Math.ceil((total * 84) / PER_PAGE); // simulated
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  let html = `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" id="prevPage">‹</button>`;

  const range = [];
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    range.push(i);
  }

  if (range[0] > 1) { html += `<button class="page-btn" data-page="1">1</button>`; if (range[0] > 2) html += `<span style="color:var(--ash);padding:0 0.25rem">...</span>`; }

  range.forEach(p => {
    html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
  });

  if (range[range.length - 1] < totalPages) {
    if (range[range.length - 1] < totalPages - 1) html += `<span style="color:var(--ash);padding:0 0.25rem">...</span>`;
    html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  html += `<button class="page-btn ${currentPage >= totalPages ? 'disabled' : ''}" id="nextPage">›</button>`;

  pagination.innerHTML = html;

  // Bind page buttons
  pagination.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      renderNovels();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });
  });

  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  prev?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderNovels(); window.scrollTo({ top: 300, behavior: 'smooth' }); } });
  next?.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderNovels(); window.scrollTo({ top: 300, behavior: 'smooth' }); } });
}

// ─── Sort Buttons ─────────────────────────────
function initSortBtns() {
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initFilterChips();
  initSort();
  initViewToggle();
  initFilterOptions();
  initBrowseSearch();
  initSortBtns();
  renderNovels();
});
