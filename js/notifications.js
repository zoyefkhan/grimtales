/* ============================================
   notifications.js — Notifications Page
============================================ */

const MOCK_NOTIFS = [
  { id: 1, type: 'chapter', icon: '📖', text: '<strong>Marcus Vale</strong> posted a new chapter: <a href="chapter-read.html">Chapter 285: The Gates Open</a> in The Obsidian Court', time: '5 minutes ago', unread: true, day: 'today' },
  { id: 2, type: 'comment', icon: '💬', text: '<strong>ElenaVance</strong> replied to your comment on <a href="chapter-read.html">Chapter 284</a>: "Couldn\'t agree more!"', time: '2 hours ago', unread: true, day: 'today' },
  { id: 3, type: 'follow', icon: '❤️', text: '<strong>NocturnalistX</strong> started following you', time: '3 hours ago', unread: true, day: 'today' },
  { id: 4, type: 'chapter', icon: '📖', text: '<strong>Lyra Mourne</strong> posted a new chapter: <a href="chapter-read.html">Chapter 113</a> in Court of Bleeding Stars', time: '6 hours ago', unread: true, day: 'today' },
  { id: 5, type: 'rating', icon: '⭐', text: 'Your comment on <a href="novel-detail.html">The Obsidian Court</a> received <strong>50 likes</strong> — it\'s trending!', time: '8 hours ago', unread: true, day: 'today' },
  { id: 6, type: 'system', icon: '✦', text: 'Welcome back! You have <strong>3 unread chapters</strong> from authors you follow', time: '10 hours ago', unread: true, day: 'today' },
  { id: 7, type: 'follow', icon: '❤️', text: '<strong>TormentedPages</strong> added <a href="novel-detail.html">The Obsidian Court</a> to their library', time: '1 day ago', unread: true, day: 'yesterday' },
  { id: 8, type: 'chapter', icon: '📖', text: '<strong>Tor Halverson</strong> posted a new chapter: <a href="chapter-read.html">Chapter 321</a> in The Last Gravedigger', time: '1 day ago', unread: false, day: 'yesterday' },
  { id: 9, type: 'comment', icon: '💬', text: '<strong>ShadowReader99</strong> liked your comment on <a href="chapter-read.html">Pale Kings Rising Ch. 488</a>', time: '2 days ago', unread: false, day: 'older' },
  { id: 10, type: 'system', icon: '🏆', text: 'You earned a new badge: <strong>Century Reader</strong> — 100 chapters read!', time: '3 days ago', unread: false, day: 'older' },
  { id: 11, type: 'chapter', icon: '📖', text: '<strong>Seraphina Lowe</strong> posted a new chapter in <a href="novel-detail.html">Daughters of Ash</a>', time: '4 days ago', unread: false, day: 'older' },
  { id: 12, type: 'follow', icon: '❤️', text: '<strong>DarkFantasyFan</strong> started following you', time: '5 days ago', unread: false, day: 'older' },
];

let currentFilter = 'all';
let notifsState = MOCK_NOTIFS.map(n => ({ ...n }));

function getIconClass(type) {
  const map = { chapter: 'chapter', comment: 'comment', follow: 'follow', rating: 'rating', system: 'system' };
  return map[type] || '';
}

function renderNotifs() {
  const list = document.getElementById('notifsList');
  if (!list) return;

  let filtered = notifsState;
  if (currentFilter !== 'all') {
    const map = { chapters: 'chapter', comments: 'comment', follows: 'follow', system: 'system' };
    filtered = notifsState.filter(n => n.type === map[currentFilter]);
  }

  const unreadCount = notifsState.filter(n => n.unread).length;
  const unreadEl = document.getElementById('unreadCount');
  if (unreadEl) unreadEl.textContent = unreadCount;

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="notifs-empty">
        <div style="font-size:2.5rem;margin-bottom:1rem;opacity:0.4">🔔</div>
        <h3 style="font-family:var(--font-display);color:var(--white);margin-bottom:0.5rem">No notifications</h3>
        <p style="color:var(--ash)">You're all caught up!</p>
      </div>`;
    return;
  }

  // Group by day
  const days = { today: [], yesterday: [], older: [] };
  const dayLabels = { today: 'Today', yesterday: 'Yesterday', older: 'Earlier' };
  filtered.forEach(n => (days[n.day] || days.older).push(n));

  let html = '';
  Object.entries(days).forEach(([day, items]) => {
    if (items.length === 0) return;
    html += `<div class="notif-day-label">${dayLabels[day]}</div>`;
    html += items.map(n => `
      <div class="notif-item ${n.unread ? 'unread' : ''}" data-id="${n.id}" onclick="markRead(${n.id})">
        <div class="notif-icon ${getIconClass(n.type)}">${n.icon}</div>
        <div class="notif-body">
          <div class="notif-text">${n.text}</div>
          <div class="notif-time">${n.time}</div>
        </div>
        ${n.unread ? '<div class="notif-unread-dot"></div>' : ''}
      </div>
    `).join('');
  });

  list.innerHTML = html;
}

function markRead(id) {
  const notif = notifsState.find(n => n.id === id);
  if (notif) notif.unread = false;
  renderNotifs();
}

window.markRead = markRead;

function initFilters() {
  document.querySelectorAll('.notif-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.notif-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderNotifs();
    });
  });
}

function initMarkAllRead() {
  document.getElementById('markAllRead')?.addEventListener('click', () => {
    notifsState.forEach(n => n.unread = false);
    renderNotifs();
    window.showToast('All notifications marked as read ✦');
  });
}

function initLoadMore() {
  document.getElementById('loadMoreNotifs')?.addEventListener('click', () => {
    window.showToast('All notifications loaded.');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  initMarkAllRead();
  initLoadMore();
  renderNotifs();
});
