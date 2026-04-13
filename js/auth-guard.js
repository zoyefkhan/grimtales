/* ============================================
   auth-guard.js — Auth + Role Protection
   Protects pages based on login + role
============================================ */

(function () {

  // ─── Page protection rules ────────────────
  const RULES = {
    // Requires login (any role)
    'user-profile.html':    { requireLogin: true },
    'settings.html':        { requireLogin: true },
    'notifications.html':   { requireLogin: true },

    // Requires login + author role
    'dashboard.html':       { requireLogin: true, requireRole: 'author' },

    // Guest only (redirect logged-in users away)
    'login.html':           { guestOnly: true },
    'register.html':        { guestOnly: true },
  };

  // ─── Get session ──────────────────────────
  function getUser() {
    try { return JSON.parse(localStorage.getItem('gt-user') || 'null'); }
    catch { return null; }
  }

  const user   = getUser();
  const loggedIn = !!(user && user.id && user.username);
  const role   = user?.role || 'reader';

  // ─── Current page ─────────────────────────
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const rule = RULES[page];

  // ─── Redirect helper ──────────────────────
  function showRedirect(title, subtitle, dest, delay = 1400) {
    document.documentElement.style.overflow = 'hidden';

    const render = () => {
      document.body.innerHTML = `
        <div style="
          position:fixed;inset:0;
          background:#060608;
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          font-family:Georgia,serif;gap:1.5rem;
          padding:2rem;text-align:center;
        ">
          <div style="
            width:64px;height:64px;
            clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
            background:linear-gradient(180deg,#3a0000,#8b1a1a,#c0392b,#8b1a1a,#3a0000);
            display:flex;align-items:center;justify-content:center;
            font-size:1.5rem;color:white;
            box-shadow:0 0 30px rgba(139,26,26,0.6);
            margin-bottom:0.5rem;
          ">✦</div>
          <div style="color:#f0eee8;font-size:1.1rem;letter-spacing:0.05em;font-weight:bold">${title}</div>
          <div style="color:#9a9aaa;font-size:0.85rem;max-width:300px;line-height:1.6">${subtitle}</div>
          <div style="width:220px;height:3px;background:#1a0000;border-radius:2px;overflow:hidden;margin-top:0.5rem">
            <div id="guardBar" style="
              height:100%;width:0%;
              background:linear-gradient(90deg,#8b1a1a,#c0392b);
              border-radius:2px;transition:width ${delay - 200}ms linear;
            "></div>
          </div>
        </div>
      `;
      setTimeout(() => {
        const bar = document.getElementById('guardBar');
        if (bar) bar.style.width = '100%';
      }, 50);
    };

    if (document.body) render();
    else document.addEventListener('DOMContentLoaded', render);

    setTimeout(() => { window.location.href = dest; }, delay);
  }

  // ─── Apply rules ──────────────────────────
  if (rule) {

    // Guest-only page — redirect logged-in users
    if (rule.guestOnly && loggedIn) {
      const dest = sessionStorage.getItem('gt-redirect-after-login') || 'index.html';
      sessionStorage.removeItem('gt-redirect-after-login');
      window.location.href = dest;
      return;
    }

    // Needs login — not logged in
    if (rule.requireLogin && !loggedIn) {
      sessionStorage.setItem('gt-redirect-after-login', window.location.href);
      showRedirect(
        'Sign in required',
        'You need to be signed in to view this page.',
        'login.html'
      );
      return;
    }

    // Needs author role — is a reader
    if (rule.requireRole === 'author' && loggedIn && role !== 'author' && role !== 'admin') {
      showRedirect(
        'Authors only 📖',
        'The writing dashboard is only available to Author accounts.<br><br>You registered as a <strong style="color:#c0392b">Reader</strong>.<br>Create a new account and select <strong style="color:#c0392b">Author</strong> to start writing.',
        'register.html',
        3000
      );
      return;
    }
  }

  // ─── Expose to other scripts ───────────────
  window.GT_User      = user;
  window.GT_isLoggedIn = loggedIn;
  window.GT_Role      = role;

  // ─── Show role badge on dashboard ─────────
  if (page === 'dashboard.html' && loggedIn) {
    document.addEventListener('DOMContentLoaded', () => {
      const badge = document.querySelector('.dash-role');
      if (badge) {
        badge.textContent = role === 'author' ? '✦ Verified Author' : '✦ Author';
      }
      const name = document.querySelector('.dash-username');
      if (name && user.username) name.textContent = user.username;
      const greeting = document.querySelector('.dash-title');
      if (greeting && user.username) greeting.textContent = user.username;
    });
  }

})();