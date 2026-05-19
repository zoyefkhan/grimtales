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

// ─── Browse API ─────────────────────────────
async function getSupabase() {
  return window.GT_Supabase?.getSupabase();
}

async function fetchBrowseNovels(q = '') {
  const sb = await getSupabase();
  if (!sb) return { novels: [], total: 0 };

  const offset = (currentPage - 1) * PER_PAGE;
  const likeQuery = q ? `%${q}%` : null;
  let query = sb.from('novels')
    .select('*, author:profiles!novels_author_id_fkey(username,avatar_url)', { count: 'exact' })
    .eq('is_visible', true);

  if (currentGenre !== 'all') {
    query = query.contains('genres', [currentGenre]);
  }

  if (likeQuery) {
    query = query.or(`title.ilike.${likeQuery},author.username.ilike.${likeQuery}`);
  }

  const sortMap = {
    trending: { column: 'total_views', ascending: false },
    new: { column: 'created_at', ascending: false },
    rating: { column: 'avg_rating', ascending: false },
    views: { column: 'total_views', ascending: false },
    updated: { column: 'last_chapter_at', ascending: false },
  };

  const sort = sortMap[currentSort] || sortMap.trending;
  query = query.order(sort.column, { ascending: sort.ascending }).range(offset, offset + PER_PAGE - 1);

  const { data, count, error } = await query;
  if (error) {
    console.warn('browse.js fetchBrowseNovels:', error.message);
    return { novels: [], total: 0 };
  }

  return { novels: data || [], total: count || 0 };
}

function updateResultsCount(total) {
  const countEl = document.getElementById('resultsCount');
  if (countEl) countEl.textContent = total.toLocaleString();
}

function renderNovelsPage(pageNovels) {
  const grid = document.getElementById('novelsGrid');
  const list = document.getElementById('novelsList');
  const emptyMessage = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--ash)">No novels found matching your criteria.</div>';

  if (grid) grid.innerHTML = pageNovels.length ? pageNovels.map(n => window.renderNovelCard(n)).join('') : emptyMessage;
  if (list) list.innerHTML = pageNovels.length ? pageNovels.map(n => window.renderNovelListItem(n)).join('') : '';
}

async function renderNovels(q = '') {
  const { novels, total } = await fetchBrowseNovels(q);
  updateResultsCount(total);

  const pageNovels = novels.slice(0, PER_PAGE);
  renderNovelsPage(pageNovels);
  renderPagination(total);
}

// ─── Pagination ─────────────────────────────
function renderPagination(total) {
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  let html = `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" id="prevPage">‹</button>`;
  const range = [];

  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i += 1) {
    range.push(i);
  }

  if (range[0] > 1) {
    html += `<button class="page-btn" data-page="1">1</button>`;
    if (range[0] > 2) html += `<span style="color:var(--ash);padding:0 0.25rem">...</span>`;
  }

  range.forEach(p => {
    html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
  });

  if (range[range.length - 1] < totalPages) {
    if (range[range.length - 1] < totalPages - 1) html += `<span style="color:var(--ash);padding:0 0.25rem">...</span>`;
    html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  html += `<button class="page-btn ${currentPage >= totalPages ? 'disabled' : ''}" id="nextPage">›</button>`;
  pagination.innerHTML = html;

  pagination.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page, 10);
      renderNovels(document.getElementById('browseSearch')?.value.trim() || '');
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });
  });

  document.getElementById('prevPage')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      renderNovels(document.getElementById('browseSearch')?.value.trim() || '');
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  });

  document.getElementById('nextPage')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage += 1;
      renderNovels(document.getElementById('browseSearch')?.value.trim() || '');
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  });
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
