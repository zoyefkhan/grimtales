/* ============================================
   search.js — Search Page Logic
============================================ */

let currentTab = 'novels';
let currentQuery = '';

function getQueryFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('q') || '';
}

function updateURL(q) {
  const url = new URL(window.location);
  if (q) url.searchParams.set('q', q);
  else url.searchParams.delete('q');
  window.history.pushState({}, '', url);
}

async function searchNovels(q) {
  if (!q || !window.GT_Supabase) return [];
  const sb = await window.GT_Supabase.getSupabase();
  if (!sb) return [];
  const like = `%${q}%`;
  const { data, error } = await sb.from('novels')
    .select('*, author:profiles(username,avatar_url)')
    .eq('is_visible', true)
    .or(`title.ilike.${like},author.username.ilike.${like}`)
    .limit(50);

  if (error) {
    console.warn('search.js searchNovels:', error.message);
    return [];
  }
  return data || [];
}

async function searchAuthors(q) {
  if (!q || !window.GT_Supabase) return [];
  const sb = await window.GT_Supabase.getSupabase();
  if (!sb) return [];
  const like = `%${q}%`;
  const { data, error } = await sb.from('profiles')
    .select('id, username, avatar_url, bio')
    .or(`username.ilike.${like},bio.ilike.${like}`)
    .limit(30);

  if (error) {
    console.warn('search.js searchAuthors:', error.message);
    return [];
  }
  return data || [];
}

async function searchTags(q) {
  if (!q || !window.GT_Supabase) return [];
  const sb = await window.GT_Supabase.getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from('novels')
    .select('genres')
    .eq('is_visible', true)
    .limit(200);

  if (error) {
    console.warn('search.js searchTags:', error.message);
    return [];
  }

  const lower = q.toLowerCase();
  const tags = new Set();
  (data || []).forEach(novel => {
    (novel.genres || []).forEach(tag => {
      if (tag.toLowerCase().includes(lower)) tags.add(tag);
    });
  });
  return Array.from(tags).slice(0, 24);
}

function setTextContent(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderAuthorCard(author) {
  const initials = (author.username || 'AU').slice(0, 2).toUpperCase();
  const avatar = author.avatar_url
    ? `<img src="${author.avatar_url}" alt="${author.username}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
    : `<div class="author-result-avatar">${initials}</div>`;
  return `
    <a href="author-profile.html?id=${author.id}" class="author-result-card">
      ${author.avatar_url ? `<div class="author-result-avatar">${avatar}</div>` : avatar}
      <div>
        <div class="author-result-name">${author.username || 'Unknown Author'}</div>
        <div class="author-result-meta">${author.bio ? author.bio.slice(0, 80) + '...' : 'Author on GrimTales'}</div>
      </div>
    </a>
  `;
}

async function renderResults(q) {
  currentQuery = q;
  const [novels, authors, tags] = await Promise.all([
    searchNovels(q),
    searchAuthors(q),
    searchTags(q),
  ]);

  setTextContent('searchQueryDisplay', `"${q || 'all'}"`);
  setTextContent('novelsTabCount', `(${novels.length})`);
  setTextContent('authorsTabCount', `(${authors.length})`);
  setTextContent('tagsTabCount', `(${tags.length})`);

  const novelResults = document.getElementById('novelResults');
  const noNovels = document.getElementById('noNovels');
  const novelsCount = document.getElementById('novelsCount');
  if (novelResults) {
    novelResults.innerHTML = novels.map(n => window.renderNovelListItem(n)).join('');
    if (novelsCount) novelsCount.innerHTML = `Found <span>${novels.length}</span> novels${q ? ` for <em>"${q}"</em>` : ''}`;
    if (noNovels) noNovels.style.display = novels.length === 0 ? 'block' : 'none';
    novelResults.style.display = novels.length === 0 ? 'none' : 'flex';
  }

  const authorResults = document.getElementById('authorResults');
  const noAuthors = document.getElementById('noAuthors');
  const authorsCount = document.getElementById('authorsCount');
  if (authorResults) {
    authorResults.innerHTML = authors.map(renderAuthorCard).join('');
    if (authorsCount) authorsCount.innerHTML = `Found <span>${authors.length}</span> authors`;
    if (noAuthors) noAuthors.style.display = authors.length === 0 ? 'block' : 'none';
    authorResults.style.display = authors.length === 0 ? 'none' : 'grid';
  }

  const tagResults = document.getElementById('tagResults');
  const tagsCount = document.getElementById('tagsCount');
  if (tagResults) {
    tagResults.innerHTML = tags.map(t => `
      <button class="suggestion-chip" onclick="doSearch('${t}')">#${t}</button>
    `).join('');
    if (tagsCount) tagsCount.innerHTML = `Found <span>${tags.length}</span> tags`;
  }

  const suggestions = document.getElementById('searchSuggestions');
  if (suggestions) suggestions.style.display = q ? 'none' : 'block';
}

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
  document.querySelectorAll('.suggestion-chip[data-q]').forEach(chip => {
    chip.addEventListener('click', () => doSearch(chip.dataset.q));
  });
  document.getElementById('novelSort')?.addEventListener('change', () => renderResults(currentQuery));
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSearchBar();
  const q = getQueryFromURL();
  const input = document.getElementById('searchInput');
  if (input && q) input.value = q;
  renderResults(q);
});
