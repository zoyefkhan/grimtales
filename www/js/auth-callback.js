/* ============================================
   auth-callback.js
   Catches OAuth session on every page
   Ensures profile exists (Android fix)
============================================ */
(function () {
  const SUPABASE_URL  = 'https://ukgqdgjtbvyybgvpmkcv.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZ3FkZ2p0YnZ5eWJndnBta2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTI2OTEsImV4cCI6MjA5MTY2ODY5MX0.9t4p1Lcvu_j8hg0hWz3imLMb4NDBItPdyCogcTwiIAI';

  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') return;

  async function loadSB() {
    if (window._sbClient) return window._sbClient;
    if (!window.supabase) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    window._sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    return window._sbClient;
  }

  // Ensure profile row exists — same as auth.js
  async function ensureProfile(sb, sbUser) {
    try {
      const { data: existing } = await sb.from('profiles').select('id,username,role,avatar_url').eq('id', sbUser.id).single();
      if (existing) return existing;

      const username =
        sbUser.user_metadata?.username ||
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.name ||
        sbUser.email?.split('@')[0] ||
        'User' + Math.floor(Math.random() * 9999);

      const { data } = await sb.from('profiles').insert({
        id: sbUser.id,
        username,
        display_name: sbUser.user_metadata?.full_name || username,
        avatar_url: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || '',
        role: sbUser.user_metadata?.role || 'reader',
      }).select().single();

      return data;
    } catch(e) {
      return null;
    }
  }

  function saveUser(sbUser, profile) {
    const user = {
      id:        sbUser.id,
      username:  profile?.username || sbUser.user_metadata?.username || sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
      email:     sbUser.email,
      role:      profile?.role || sbUser.user_metadata?.role || 'reader',
      avatar:    profile?.avatar_url || sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || '',
      createdAt: sbUser.created_at,
    };
    localStorage.setItem('gt-user', JSON.stringify(user));
    localStorage.setItem('gt-logged-in', 'true');
    return user;
  }

  async function init() {
    const sb = await loadSB();
    if (!sb) return;

    // Handle URL hash (OAuth redirect)
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token') || hash.includes('error_description'))) {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        const profile = await ensureProfile(sb, session.user);
        const user = saveUser(session.user, profile);
        window.history.replaceState(null, '', window.location.pathname);
        if (window.showToast) {
          setTimeout(() => window.showToast(`Welcome, ${user.username}! ✦`), 300);
        }
        return;
      }
    }

    // Check session on every page load
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) {
      const profile = await ensureProfile(sb, session.user);
      saveUser(session.user, profile);
    }

    // Watch for auth changes (handles Android OAuth)
    sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await ensureProfile(sb, session.user);
        saveUser(session.user, profile);
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('gt-user');
        localStorage.removeItem('gt-logged-in');
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();