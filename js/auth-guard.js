/* ============================================
   auth-guard.js — Auth + Role Protection
============================================ */
(function () {
  const RULES = {
    'user-profile.html':  { requireLogin: true },
    'settings.html':      { requireLogin: true },
    'notifications.html': { requireLogin: true },
    'dashboard.html':     { requireLogin: true, requireRole: 'author' },
    'login.html':         { guestOnly: true },
    'register.html':      { guestOnly: true },
  };

  function getUser() {
    try { return JSON.parse(localStorage.getItem('gt-user') || 'null'); }
    catch { return null; }
  }

  const user     = getUser();
  const loggedIn = !!(user && user.id && user.username);
  const role     = user?.role || 'reader';
  const page     = window.location.pathname.split('/').pop() || 'index.html';
  const rule     = RULES[page];

  function showRedirect(title, subtitle, dest, delay, extraHTML = '') {
    document.documentElement.style.overflow = 'hidden';
    const render = () => {
      document.body.innerHTML = `
        <div style="position:fixed;inset:0;background:#060608;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Georgia,serif;gap:1.5rem;padding:2rem;text-align:center">
          <div style="width:64px;height:64px;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);background:linear-gradient(180deg,#3a0000,#8b1a1a,#c0392b,#8b1a1a,#3a0000);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:white;box-shadow:0 0 30px rgba(139,26,26,0.6)">✦</div>
          <div style="color:#f0eee8;font-size:1.1rem;font-weight:bold">${title}</div>
          <div style="color:#9a9aaa;font-size:0.85rem;max-width:340px;line-height:1.7">${subtitle}</div>
          ${extraHTML}
          <div style="width:220px;height:3px;background:#1a0000;border-radius:2px;overflow:hidden">
            <div id="gBar" style="height:100%;width:0%;background:linear-gradient(90deg,#8b1a1a,#c0392b);border-radius:2px;transition:width ${delay-200}ms linear"></div>
          </div>
        </div>`;
      setTimeout(() => { const b=document.getElementById('gBar'); if(b) b.style.width='100%'; }, 50);
    };
    if (document.body) render();
    else document.addEventListener('DOMContentLoaded', render);
    setTimeout(() => { window.location.href = dest; }, delay);
  }

  if (rule) {
    if (rule.guestOnly && loggedIn) {
      const dest = sessionStorage.getItem('gt-redirect-after-login') || 'index.html';
      sessionStorage.removeItem('gt-redirect-after-login');
      window.location.href = dest; return;
    }
    if (rule.requireLogin && !loggedIn) {
      sessionStorage.setItem('gt-redirect-after-login', window.location.href);
      showRedirect('Sign in required', 'You need to be signed in to view this page.', 'login.html', 1400);
      return;
    }
    // Author required — but NOW we show upgrade option instead of register
    if (rule.requireRole === 'author' && loggedIn && role !== 'author' && role !== 'admin') {
      document.documentElement.style.overflow = 'hidden';
      const render = () => {
        document.body.innerHTML = `
          <div style="position:fixed;inset:0;background:#060608;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Georgia,serif;gap:1.25rem;padding:2rem;text-align:center">
            <div style="width:64px;height:64px;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);background:linear-gradient(180deg,#3a0000,#8b1a1a,#c0392b,#8b1a1a,#3a0000);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:white;box-shadow:0 0 30px rgba(139,26,26,0.6)">✍️</div>
            <div style="color:#f0eee8;font-size:1.2rem;font-weight:bold">Become an Author</div>
            <div style="color:#9a9aaa;font-size:0.85rem;max-width:360px;line-height:1.8">
              You're currently a <strong style="color:#c0392b">Reader</strong>.<br>
              Upgrade your account to start writing and publishing novels — completely free.
            </div>
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:center;margin-top:0.5rem">
              <button id="upgradeBtn" style="background:linear-gradient(180deg,#3a0000,#8b1a1a,#c0392b,#8b1a1a,#3a0000);color:white;padding:0.75em 2em;border-radius:4px;font-size:0.85rem;letter-spacing:0.12em;text-transform:uppercase;border:1px solid rgba(192,57,43,0.5);cursor:pointer;font-family:Georgia,serif;box-shadow:0 0 20px rgba(139,26,26,0.4)">
                ✦ Upgrade to Author — Free
              </button>
              <a href="index.html" style="background:linear-gradient(180deg,#0d0000,#1a0505);color:#9a9aaa;padding:0.75em 1.5em;border-radius:4px;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;border:1px solid rgba(139,26,26,0.2);text-decoration:none;font-family:Georgia,serif">
                Back to Home
              </a>
            </div>
            <div id="upgradeMsg" style="color:#9a9aaa;font-size:0.8rem;min-height:1.2em"></div>
          </div>`;

        document.getElementById('upgradeBtn').addEventListener('click', async () => {
          const btn = document.getElementById('upgradeBtn');
          const msg = document.getElementById('upgradeMsg');
          btn.textContent = 'Upgrading...';
          btn.disabled = true;

          // Update role in localStorage
          const u = JSON.parse(localStorage.getItem('gt-user') || '{}');
          u.role = 'author';
          localStorage.setItem('gt-user', JSON.stringify(u));

          // Update in users list too
          const users = JSON.parse(localStorage.getItem('gt-users') || '[]');
          const idx = users.findIndex(x => x.id === u.id || x.email === u.email);
          if (idx > -1) { users[idx].role = 'author'; localStorage.setItem('gt-users', JSON.stringify(users)); }

          // Try update in Supabase if connected
          try {
            if (window._sbClient) {
              await window._sbClient.auth.updateUser({ data: { role: 'author' } });
            }
          } catch(e) { /* silent */ }

          msg.style.color = '#5dba7d';
          msg.textContent = '✓ Account upgraded! Welcome, Author. Taking you to dashboard...';
          setTimeout(() => window.location.href = 'dashboard.html', 1200);
        });
      };
      if (document.body) render();
      else document.addEventListener('DOMContentLoaded', render);
      return;
    }
  }

  window.GT_User = user;
  window.GT_isLoggedIn = loggedIn;
  window.GT_Role = role;
})();