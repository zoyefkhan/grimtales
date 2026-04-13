/* ============================================
   app.js — GrimTales Core App Logic
   Shared across all pages
============================================ */

// ─── Theme Toggle ───────────────────────────
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('gt-theme') || 'dark';

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    if (themeToggle) themeToggle.textContent = '☀️';
  } else {
    document.body.classList.remove('light-mode');
    if (themeToggle) themeToggle.textContent = '🌙';
  }
  localStorage.setItem('gt-theme', theme);
}

applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = localStorage.getItem('gt-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

// ─── Navbar Scroll Effect ────────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// ─── Hamburger Menu ──────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    const spans = hamburger.querySelectorAll('span');
    const isOpen = mobileNav.classList.contains('open');
    spans[0].style.transform = isOpen ? 'translateY(7px) rotate(45deg)' : '';
    spans[1].style.opacity = isOpen ? '0' : '';
    spans[2].style.transform = isOpen ? 'translateY(-7px) rotate(-45deg)' : '';
  });

  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
      hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

// ─── Navbar Search ───────────────────────────
const navSearch = document.getElementById('navSearch');
if (navSearch) {
  navSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && navSearch.value.trim()) {
      window.location.href = `search.html?q=${encodeURIComponent(navSearch.value.trim())}`;
    }
  });
}

// ─── User Avatar Dropdown ─────────────────────
const userAvatar = document.querySelector('.user-avatar');
if (userAvatar) {
  userAvatar.addEventListener('click', () => {
    let menu = document.getElementById('userDropdown');
    if (menu) { menu.remove(); return; }

    menu = document.createElement('div');
    menu.id = 'userDropdown';
    menu.style.cssText = `
      position:fixed;top:70px;right:1.5rem;
      background:var(--charcoal);border:var(--border-subtle);
      border-radius:var(--radius-lg);padding:0.5rem 0;
      box-shadow:var(--shadow-deep);z-index:999;min-width:200px;
      animation:fadeInUp 0.2s ease;
    `;
    menu.innerHTML = `
      <div style="padding:0.75rem 1.25rem;border-bottom:var(--border-subtle);margin-bottom:0.25rem">
        <div style="font-family:var(--font-heading);font-size:0.8rem;color:var(--white)">ShadowReader92</div>
        <div style="font-size:0.72rem;color:var(--ash)">shadow@example.com</div>
      </div>
      <a href="user-profile.html" style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 1.25rem;color:var(--ash-light);font-family:var(--font-heading);font-size:0.78rem;text-decoration:none;transition:var(--transition)" onmouseenter="this.style.background='rgba(139,26,26,0.08)';this.style.color='var(--white)'" onmouseleave="this.style.background='';this.style.color=''">👤 My Profile</a>
      <a href="dashboard.html" style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 1.25rem;color:var(--ash-light);font-family:var(--font-heading);font-size:0.78rem;text-decoration:none;transition:var(--transition)" onmouseenter="this.style.background='rgba(139,26,26,0.08)';this.style.color='var(--white)'" onmouseleave="this.style.background='';this.style.color=''">✍️ Dashboard</a>
      <a href="notifications.html" style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 1.25rem;color:var(--ash-light);font-family:var(--font-heading);font-size:0.78rem;text-decoration:none;transition:var(--transition)" onmouseenter="this.style.background='rgba(139,26,26,0.08)';this.style.color='var(--white)'" onmouseleave="this.style.background='';this.style.color=''">🔔 Notifications <span style="background:var(--crimson);color:white;font-size:0.6rem;padding:0.1em 0.4em;border-radius:8px;margin-left:auto">8</span></a>
      <a href="settings.html" style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 1.25rem;color:var(--ash-light);font-family:var(--font-heading);font-size:0.78rem;text-decoration:none;transition:var(--transition)" onmouseenter="this.style.background='rgba(139,26,26,0.08)';this.style.color='var(--white)'" onmouseleave="this.style.background='';this.style.color=''">⚙️ Settings</a>
      <div style="border-top:var(--border-subtle);margin-top:0.25rem;padding-top:0.25rem">
        <a href="index.html" style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 1.25rem;color:var(--crimson-glow);font-family:var(--font-heading);font-size:0.78rem;text-decoration:none;transition:var(--transition)" onmouseenter="this.style.background='rgba(139,26,26,0.08)'" onmouseleave="this.style.background=''">🚪 Sign Out</a>
      </div>
    `;
    document.body.appendChild(menu);
    setTimeout(() => {
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !userAvatar.contains(e.target)) menu.remove();
      }, { once: true });
    }, 10);
  });
}

// ─── Mock Novel Data ─────────────────────────
const MOCK_NOVELS = [
  { id: 1, title: 'The Obsidian Court', author: 'Marcus Vale', genre: 'Dark Fantasy', rating: 4.8, chapters: 284, views: '1.2M', status: 'ongoing', badge: 'hot', color: ['#1a0808','#2d1010'] },
  { id: 2, title: 'Daughters of Ash', author: 'Seraphina Lowe', genre: 'Gothic Horror', rating: 4.6, chapters: 142, views: '840K', status: 'ongoing', badge: 'new', color: ['#0d0d1a','#1a0d2d'] },
  { id: 3, title: 'The Last Gravedigger', author: 'Tor Halverson', genre: 'Horror', rating: 4.7, chapters: 320, views: '2.1M', status: 'completed', badge: null, color: ['#0a1a0a','#0d240d'] },
  { id: 4, title: 'Veil of Crimson', author: 'Elara Voss', genre: 'Vampire', rating: 4.5, chapters: 88, views: '410K', status: 'ongoing', badge: 'new', color: ['#1a0808','#2d0f0f'] },
  { id: 5, title: 'Pale Kings Rising', author: 'Marcus Vale', genre: 'Dark Fantasy', rating: 4.9, chapters: 512, views: '3.8M', status: 'completed', badge: null, color: ['#1a1508','#2a2010'] },
  { id: 6, title: 'The Iron Séance', author: 'Nadia Crow', genre: 'Supernatural', rating: 4.4, chapters: 67, views: '290K', status: 'ongoing', badge: 'new', color: ['#0d0d0d','#1a1a1a'] },
  { id: 7, title: 'Thornwood Asylum', author: 'Callum Rye', genre: 'Psychological', rating: 4.6, chapters: 198, views: '920K', status: 'ongoing', badge: null, color: ['#0d0a1a','#1a1030'] },
  { id: 8, title: 'Court of Bleeding Stars', author: 'Lyra Mourne', genre: 'Gothic Romance', rating: 4.7, chapters: 445, views: '5.1M', status: 'completed', badge: 'hot', color: ['#1a0808','#200808'] },
];

// ─── Render Novel Card ────────────────────────
function renderNovelCard(novel) {
  const badgeHTML = novel.badge
    ? `<div class="novel-badge badge-${novel.badge}">${novel.badge === 'hot' ? '🔥 Hot' : '✦ New'}</div>`
    : '';

  const statusClass = { ongoing: 'status-ongoing', completed: 'status-completed', hiatus: 'status-hiatus' }[novel.status] || '';

  return `
    <div class="novel-card" onclick="window.location='novel-detail.html'">
      <div class="novel-cover">
        <div class="novel-cover-placeholder" style="background:linear-gradient(135deg,${novel.color[0]},${novel.color[1]})">
          <div class="title" style="font-family:var(--font-display);font-size:0.75rem;color:var(--white);text-align:center;padding:0.5rem">${novel.title}</div>
        </div>
        ${badgeHTML}
        <div class="novel-cover-overlay">
          <div class="novel-quick-read">Read Now →</div>
        </div>
      </div>
      <div class="novel-info">
        <div class="novel-title">${novel.title}</div>
        <div class="novel-author">✦ ${novel.author}</div>
        <div class="novel-meta">
          <span class="novel-rating">★ ${novel.rating}</span>
          <span class="novel-chapters">${novel.chapters} ch.</span>
        </div>
      </div>
    </div>
  `;
}

// ─── Render List Item ─────────────────────────
function renderNovelListItem(novel) {
  return `
    <div class="novel-list-item" onclick="window.location='novel-detail.html'">
      <div class="novel-list-cover">
        <div style="width:100%;height:100%;background:linear-gradient(135deg,${novel.color[0]},${novel.color[1]});display:flex;align-items:center;justify-content:center;padding:0.5rem">
          <span style="font-family:var(--font-heading);font-size:0.6rem;color:var(--white);text-align:center;line-height:1.3">${novel.title}</span>
        </div>
      </div>
      <div class="novel-list-info">
        <div class="novel-list-title">${novel.title}</div>
        <div class="novel-list-author">by ${novel.author}</div>
        <div class="novel-list-tags">
          <span class="tag">${novel.genre}</span>
        </div>
        <div class="novel-list-desc">A gripping tale of darkness, power, and the price of survival in a world where shadows hold more truth than light ever could...</div>
      </div>
      <div class="novel-list-stats">
        <span class="list-stat list-stat-rating">★ ${novel.rating}</span>
        <span class="list-stat">${novel.chapters} chapters</span>
        <span class="list-stat">${novel.views} views</span>
      </div>
    </div>
  `;
}

// ─── Smooth Anchor Scroll ────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── Intersection Observer for animations ────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(el => {
    if (el.isIntersecting) {
      el.target.style.opacity = '1';
      el.target.style.transform = 'translateY(0)';
      observer.unobserve(el.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.novel-card, .trending-item, .genre-card, .stat-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// ─── Toast Notifications ─────────────────────
function showToast(message, type = 'success') {
  const existing = document.querySelector('.gt-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'gt-toast';
  toast.style.cssText = `
    position: fixed; bottom: 2rem; right: 2rem; z-index: 9998;
    background: ${type === 'success' ? 'var(--charcoal)' : 'rgba(139,26,26,0.9)'};
    border: 1px solid ${type === 'success' ? 'var(--charcoal-border)' : 'var(--crimson)'};
    color: var(--white-dim); padding: 1rem 1.5rem; border-radius: var(--radius-lg);
    font-family: var(--font-heading); font-size: 0.82rem; letter-spacing: 0.05em;
    box-shadow: var(--shadow-deep); animation: fadeInUp 0.3s ease;
    display: flex; align-items: center; gap: 0.6rem; max-width: 300px;
  `;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '!'}</span> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'fadeIn 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); }, 3000);
}

window.showToast = showToast;
window.MOCK_NOVELS = MOCK_NOVELS;
window.renderNovelCard = renderNovelCard;
window.renderNovelListItem = renderNovelListItem;

// ─── Session: Update Navbar for Logged-In User ─
(function updateNavbarForSession() {
  try {
    const user = JSON.parse(localStorage.getItem('gt-user') || 'null');
    if (!user) return;

    // Replace Sign In / Join buttons with user avatar + name
    const actions = document.querySelector('.navbar-actions');
    if (!actions) return;

    // Remove auth buttons
    actions.querySelectorAll('a[href="login.html"], a[href="register.html"]').forEach(el => el.remove());

    // Build initials for avatar
    const initials = user.username ? user.username.slice(0, 2).toUpperCase() : 'GT';

    // Notification dot
    const notifBadge = `<span style="
      position:absolute;top:-3px;right:-3px;
      width:9px;height:9px;border-radius:50%;
      background:var(--crimson);border:2px solid var(--black);
    "></span>`;

    // Insert avatar if not already there
    if (!document.getElementById('navUserAvatar')) {
      const avatarWrap = document.createElement('div');
      avatarWrap.style.cssText = 'display:flex;align-items:center;gap:0.6rem';
      avatarWrap.innerHTML = `
        <a href="notifications.html" style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:var(--ash);font-size:1.1rem;transition:color 0.2s" title="Notifications">
          🔔${notifBadge}
        </a>
        <div id="navUserAvatar" style="
          width:36px;height:36px;border-radius:50%;
          border:2px solid var(--crimson);
          background:linear-gradient(135deg,#2d0f0f,#1a0808);
          display:flex;align-items:center;justify-content:center;
          font-family:var(--font-heading);font-size:0.75rem;
          color:var(--crimson-glow);cursor:pointer;
          transition:all 0.2s;flex-shrink:0;
          box-shadow:0 0 10px rgba(139,26,26,0.3);
        " title="${user.username}">${user.avatar ? `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : initials}</div>
      `;
      actions.appendChild(avatarWrap);

      // Dropdown on click
      document.getElementById('navUserAvatar').addEventListener('click', (e) => {
        e.stopPropagation();
        let menu = document.getElementById('userDropdown');
        if (menu) { menu.remove(); return; }

        menu = document.createElement('div');
        menu.id = 'userDropdown';
        menu.style.cssText = `
          position:fixed;top:68px;right:1.5rem;
          background:var(--charcoal);border:var(--border-subtle);
          border-radius:var(--radius-lg);padding:0.5rem 0;
          box-shadow:0 8px 32px rgba(0,0,0,0.6),0 0 0 1px rgba(139,26,26,0.2);
          z-index:9998;min-width:210px;
          animation:fadeInUp 0.18s ease;
        `;
        menu.innerHTML = `
          <div style="padding:0.85rem 1.25rem;border-bottom:var(--border-subtle)">
            <div style="font-family:var(--font-heading);font-size:0.85rem;color:var(--white);margin-bottom:0.1rem">${user.username}</div>
            <div style="font-size:0.72rem;color:var(--ash)">${user.email || ''}</div>
            <div style="font-size:0.65rem;color:var(--crimson-glow);font-family:var(--font-heading);letter-spacing:0.1em;text-transform:uppercase;margin-top:0.25rem">✦ ${user.role || 'Reader'}</div>
          </div>
          ${[
            ['user-profile.html','👤','My Profile'],
            ['dashboard.html','✍️','Dashboard'],
            ['notifications.html','🔔','Notifications'],
            ['settings.html','⚙️','Settings'],
          ].map(([href,icon,label]) => `
            <a href="${href}" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1.25rem;color:var(--ash-light);font-family:var(--font-heading);font-size:0.78rem;text-decoration:none;transition:all 0.2s" onmouseenter="this.style.background='rgba(139,26,26,0.1)';this.style.color='var(--white)'" onmouseleave="this.style.background='';this.style.color=''">${icon} ${label}</a>
          `).join('')}
          <div style="border-top:var(--border-subtle);margin-top:0.25rem">
            <a href="#" id="signOutBtn" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1.25rem;color:var(--crimson-glow);font-family:var(--font-heading);font-size:0.78rem;text-decoration:none;transition:all 0.2s" onmouseenter="this.style.background='rgba(139,26,26,0.08)'" onmouseleave="this.style.background=''">🚪 Sign Out</a>
          </div>
        `;
        document.body.appendChild(menu);

        document.getElementById('signOutBtn').addEventListener('click', (ev) => {
          ev.preventDefault();
          localStorage.removeItem('gt-user');
          localStorage.removeItem('gt-logged-in');
          window.showToast('Signed out. See you in the dark. 🌑');
          setTimeout(() => window.location.href = 'index.html', 700);
        });

        setTimeout(() => {
          document.addEventListener('click', () => menu?.remove(), { once: true });
        }, 10);
      });
    }
  } catch { /* silent */ }
})();

// ─── Role-based UI adjustments ───────────────
document.addEventListener('DOMContentLoaded', () => {
  const user     = window.GT_User || null;
  const role     = window.GT_Role || (user?.role) || 'reader';
  const loggedIn = window.GT_isLoggedIn || false;

  if (!loggedIn) return;

  // Show "Write" nav link only for authors
  document.querySelectorAll('a[href="dashboard.html"]').forEach(link => {
    if (role !== 'author' && role !== 'admin') {
      // Replace with "Become Author" for readers
      link.textContent = '✍ Write';
      link.href = 'register.html';
      link.title = 'Create an Author account to start writing';
      link.style.color = 'var(--gold)';
    }
  });

  // Show upgrade banner for readers on certain pages
  const page = window.location.pathname.split('/').pop();
  if (page === 'index.html' || page === '' || page === '/') {
    if (role === 'reader') {
      const banner = document.createElement('div');
      banner.style.cssText = `
        position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);
        background:linear-gradient(135deg,#1a0808,#2d1010);
        border:1px solid rgba(139,26,26,0.5);
        border-radius:8px;padding:0.85rem 1.5rem;
        display:flex;align-items:center;gap:1rem;
        box-shadow:0 4px 24px rgba(0,0,0,0.6),0 0 20px rgba(139,26,26,0.2);
        z-index:500;font-family:Georgia,serif;
        animation:fadeInUp 0.5s ease both;
        max-width:90vw;
      `;
      banner.innerHTML = `
        <span style="font-size:1.2rem">✍️</span>
        <span style="font-size:0.82rem;color:#c4c4d4">
          Want to publish your own stories?
        </span>
        <a href="register.html" style="
          background:linear-gradient(180deg,#3a0000,#8b1a1a,#c0392b,#8b1a1a,#3a0000);
          color:white;padding:0.4em 1em;border-radius:4px;
          font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;
          font-family:Georgia,serif;text-decoration:none;white-space:nowrap;
          box-shadow:0 0 12px rgba(139,26,26,0.4);
        ">Become an Author</a>
        <button onclick="this.parentElement.remove()" style="
          background:none;border:none;color:#6a6a7a;
          font-size:1.1rem;cursor:pointer;padding:0 0.25rem;
        ">×</button>
      `;
      setTimeout(() => document.body.appendChild(banner), 2000);
      setTimeout(() => banner?.remove(), 10000);
    }
  }
});