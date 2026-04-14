/* ============================================
   auth-guard.js — Auth + Role Protection
   Fixed: author role reads from Supabase
   so it persists permanently
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

  // ── Sync role from Supabase (fixes role reset) ──
  async function syncRoleFromSupabase(userId) {
    try {
      const sb = await window.GT_Supabase?.getSupabase();
      if (!sb || !userId) return null;

      const { data: profile } = await sb
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role) {
        const user = getUser();
        if (user && user.role !== profile.role) {
          user.role = profile.role;
          localStorage.setItem('gt-user', JSON.stringify(user));
        }
        return profile.role;
      }
    } catch(e) { /* silent */ }
    return null;
  }

  const user     = getUser();
  const loggedIn = !!(user && user.id && user.username);
  const page     = window.location.pathname.split('/').pop() || 'index.html';
  const rule     = RULES[page];

  function showBlockScreen(title, subtitle, dest, delay, extraHTML='') {
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
      setTimeout(() => { document.getElementById('gBar')?.style.setProperty('width','100%'); }, 50);
    };
    if (document.body) render();
    else document.addEventListener('DOMContentLoaded', render);
    setTimeout(() => window.location.href = dest, delay);
  }

  if (!rule) {
    // Public page — expose globals and exit
    window.GT_User = user;
    window.GT_isLoggedIn = loggedIn;
    window.GT_Role = user?.role || 'reader';
    return;
  }

  // Guest-only pages
  if (rule.guestOnly && loggedIn) {
    const dest = sessionStorage.getItem('gt-redirect-after-login') || 'index.html';
    sessionStorage.removeItem('gt-redirect-after-login');
    window.location.href = dest;
    return;
  }

  // Requires login
  if (rule.requireLogin && !loggedIn) {
    sessionStorage.setItem('gt-redirect-after-login', window.location.href);
    showBlockScreen('Sign in required', 'You need to be signed in to view this page.', 'login.html', 1400);
    return;
  }

  // Requires author role
  if (rule.requireRole === 'author' && loggedIn) {
    const localRole = user?.role || 'reader';

    // If already author locally — allow in immediately
    if (localRole === 'author' || localRole === 'admin') {
      window.GT_User = user;
      window.GT_isLoggedIn = true;
      window.GT_Role = localRole;
      return;
    }

    // Check Supabase for real role (user may have upgraded)
    document.documentElement.style.overflow = 'hidden';

    const checkRole = async () => {
      const realRole = await syncRoleFromSupabase(user.id);
      const role = realRole || localRole;

      if (role === 'author' || role === 'admin') {
        // Unlocked — show the page
        document.documentElement.style.overflow = '';
        window.GT_User = { ...user, role };
        window.GT_isLoggedIn = true;
        window.GT_Role = role;
        return;
      }

      // Show upgrade screen
      const render = () => {
        document.body.innerHTML = `
          <div style="position:fixed;inset:0;background:#060608;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Georgia,serif;gap:1.25rem;padding:2rem;text-align:center">
            <div style="width:64px;height:64px;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);background:linear-gradient(180deg,#3a0000,#8b1a1a,#c0392b,#8b1a1a,#3a0000);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:white;box-shadow:0 0 30px rgba(139,26,26,0.6)">✍️</div>
            <div style="color:#f0eee8;font-size:1.2rem;font-weight:bold">Become an Author</div>
            <div style="color:#9a9aaa;font-size:0.85rem;max-width:360px;line-height:1.8">
              You're currently a <strong style="color:#c0392b">Reader</strong>.<br>
              Upgrade your account to start publishing novels — free and instant.
            </div>
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:center;margin-top:0.5rem">
              <button id="upgradeBtn" style="background:linear-gradient(180deg,#3a0000,#8b1a1a,#c0392b,#8b1a1a,#3a0000);color:white;padding:0.75em 2em;border-radius:4px;font-size:0.85rem;letter-spacing:0.12em;text-transform:uppercase;border:1px solid rgba(192,57,43,0.5);cursor:pointer;font-family:Georgia,serif;box-shadow:0 0 20px rgba(139,26,26,0.4)">
                ✦ Upgrade to Author — Free
              </button>
              <a href="index.html" style="background:linear-gradient(180deg,#0d0000,#1a0505);color:#9a9aaa;padding:0.75em 1.5em;border-radius:4px;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;border:1px solid rgba(139,26,26,0.2);text-decoration:none;font-family:Georgia,serif">
                Back to Home
              </a>
            </div>
            <div id="upgradeMsg" style="color:#9a9aaa;font-size:0.8rem;min-height:1.5em"></div>
          </div>`;

        document.getElementById('upgradeBtn').addEventListener('click', async () => {
          const btn = document.getElementById('upgradeBtn');
          const msg = document.getElementById('upgradeMsg');
          btn.textContent = 'Upgrading...';
          btn.disabled = true;

          try {
            // 1. Update in Supabase profiles table
            const sb = await window.GT_Supabase?.getSupabase();
            if (sb && user.id) {
              const { error } = await sb
                .from('profiles')
                .update({ role: 'author' })
                .eq('id', user.id);

              if (error) throw error;

              // 2. Update Supabase user metadata
              await sb.auth.updateUser({ data: { role: 'author' } }).catch(()=>{});
            }

            // 3. Update localStorage
            const u = JSON.parse(localStorage.getItem('gt-user') || '{}');
            u.role = 'author';
            localStorage.setItem('gt-user', JSON.stringify(u));

            msg.style.color = '#5dba7d';
            msg.textContent = '✓ Upgraded! Welcome, Author. Taking you to dashboard...';
            setTimeout(() => window.location.reload(), 1200);

          } catch(e) {
            // Fallback: update localStorage only
            const u = JSON.parse(localStorage.getItem('gt-user') || '{}');
            u.role = 'author';
            localStorage.setItem('gt-user', JSON.stringify(u));
            msg.style.color = '#5dba7d';
            msg.textContent = '✓ Upgraded! Taking you to dashboard...';
            setTimeout(() => window.location.reload(), 1200);
          }
        });
      };

      if (document.body) render();
      else document.addEventListener('DOMContentLoaded', render);
    };

    // Need to wait for Supabase to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkRole);
    } else {
      checkRole();
    }
    return;
  }

  window.GT_User = user;
  window.GT_isLoggedIn = loggedIn;
  window.GT_Role = user?.role || 'reader';

})();