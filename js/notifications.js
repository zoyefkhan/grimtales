/* ============================================
   notifications.js — Notifications Page
============================================ */

let currentFilter = 'all';
let notifsState = [];

function getIconClass(type) {
  const map = { chapter: 'chapter', comment: 'comment', follow: 'follow', rating: 'rating', system: 'system' };
  return map[type] || '';
}

async function loadNotifications() {
  if (!window.GT_Supabase) return [];
  try {
    const sb = await window.GT_Supabase.getSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from('notifications')
      .select('*, initiator:profiles(username,avatar_url)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('notifications.js loadNotifications:', error.message);
      return [];
    }
    return data || [];
  } catch (error) {
    console.warn('notifications.js loadNotifications error:', error);
    return [];
  }
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

  const days = { today: [], yesterday: [], older: [] };
  const dayLabels = { today: 'Today', yesterday: 'Yesterday', older: 'Earlier' };
  filtered.forEach(n => (days[n.day] || days.older).push(n));

  let html = '';
  Object.entries(days).forEach(([day, items]) => {
    if (items.length === 0) return;
    html += `<div class="notif-day-label">${dayLabels[day]}</div>`;
    html += items.map(n => `
      <div class="notif-item ${n.unread ? 'unread' : ''}" data-id="${n.id}" onclick="markRead(${n.id})">
        <div class="notif-icon ${getIconClass(n.type)}">${n.icon || '🔔'}</div>
        <div class="notif-body">
          <div class="notif-text">${n.text}</div>
          <div class="notif-time">${n.time || ''}</div>
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

document.addEventListener('DOMContentLoaded', async () => {
  initFilters();
  initMarkAllRead();
  initLoadMore();
  notifsState = await loadNotifications();
  renderNotifs();
});
