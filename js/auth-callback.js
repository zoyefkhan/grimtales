/* ============================================
   auth-callback.js
   Handles Supabase OAuth redirect on EVERY page
   Must be loaded on index.html and all pages
   so session is captured after Google/Discord
   
   FIX: Supports both hash-based (implicit) AND
   query-string-based (PKCE) OAuth flows,
   which is required for mobile browsers (Safari/iOS)
============================================ */

(function () {

  const SUPABASE_URL  = 'https://ukgqdgjtbvyybgvpmkcv.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZ3FkZ2p0YnZ5eWJndnBta2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTI2OTEsImV4cCI6MjA5MTY2ODY5MX0.9t4p1Lcvu_j8hg0hWz3imLMb4NDBItPdyCogcTwiIAI';

  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') return;

  // Load Supabase SDK
  function loadSDK() {
    return new Promise((resolve) => {
      if (window._sbClient) { resolve(window._sbClient); return; }
      if (window.supabase) {
        window._sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
          auth: {
            // FIX: detectSessionInUrl must be true so PKCE code in query string is handled
            detectSessionInUrl: true,
            // FIX: Use pkce flow as it is more reliable on mobile browsers
            flowType: 'pkce',
          }
        });
        resolve(window._sbClient);
        return;
      }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = () => {
        window._sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
          auth: {
            detectSessionInUrl: true,
            flowType: 'pkce',
          }
        });
        resolve(window._sbClient);
      };
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }

  function saveUser(sbUser) {
    const user = {
      id:        sbUser.id,
      username:  sbUser.user_metadata?.username
                 || sbUser.user_metadata?.full_name
                 || sbUser.user_metadata?.name
                 || sbUser.email?.split('@')[0]
                 || 'User',
      email:     sbUser.email,
      role:      sbUser.user_metadata?.role || 'reader',
      avatar:    sbUser.user_metadata?.avatar_url
                 || sbUser.user_metadata?.picture
                 || '',
      createdAt: sbUser.created_at,
    };
    localStorage.setItem('gt-user', JSON.stringify(user));
    localStorage.setItem('gt-logged-in', 'true');
    return user;
  }

  async function handleCallback() {
    const sb = await loadSDK();
    if (!sb) return;

    const hash   = window.location.hash;
    const search = window.location.search;

    // FIX: Check BOTH hash (implicit flow, desktop) AND query string (PKCE flow, mobile)
    const hasHashToken  = hash.includes('access_token') || hash.includes('error');
    const hasPKCECode   = search.includes('code=');
    const hasToken      = hasHashToken || hasPKCECode;

    if (hasToken) {
      // FIX: exchangeCodeForSession handles PKCE; getSession handles implicit
      // Supabase JS v2 does both automatically when detectSessionInUrl is true
      // We just need to wait for the session to be ready
      let session = null;
      let error   = null;

      if (hasPKCECode) {
        // PKCE: exchange code for session explicitly for mobile
        const result = await sb.auth.exchangeCodeForSession(window.location.href);
        session = result.data?.session;
        error   = result.error;
      } else {
        // Implicit (hash): getSession reads the hash automatically
        const result = await sb.auth.getSession();
        session = result.data?.session;
        error   = result.error;
      }

      if (session?.user) {
        const user = saveUser(session.user);

        // Clean the URL (remove hash and/or query string OAuth params)
        window.history.replaceState(null, '', window.location.pathname);

        setTimeout(() => {
          if (window.showToast) {
            window.showToast(`Welcome, ${user.username}! ✦`);
          }
          setTimeout(() => window.location.reload(), 800);
        }, 300);

      } else if (error) {
        console.error('OAuth error:', error);
        if (window.showToast) {
          window.showToast('Login failed: ' + error.message, 'error');
        }
      }
      return;
    }

    // No token in URL — check existing session
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) {
      saveUser(session.user);
    }

    // Listen for future auth changes
    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        saveUser(session.user);
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('gt-user');
        localStorage.removeItem('gt-logged-in');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleCallback);
  } else {
    handleCallback();
  }

})();