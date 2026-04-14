/* ============================================
   auth-callback.js
   Handles Supabase OAuth redirect on EVERY page
   Must be loaded on index.html and all pages
   so session is captured after Google/Discord
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
        window._sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
        resolve(window._sbClient);
        return;
      }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = () => {
        window._sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
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

  // Run immediately when page loads
  async function handleCallback() {
    const sb = await loadSDK();
    if (!sb) return;

    // Check URL hash for OAuth tokens (Supabase puts them here)
    const hash = window.location.hash;
    const hasToken = hash.includes('access_token') || hash.includes('error');

    if (hasToken) {
      // Supabase reads the hash automatically
      const { data: { session }, error } = await sb.auth.getSession();

      if (session?.user) {
        const user = saveUser(session.user);

        // Clean the URL hash
        window.history.replaceState(null, '', window.location.pathname + window.location.search);

        // Show welcome message
        setTimeout(() => {
          if (window.showToast) {
            window.showToast(`Welcome, ${user.username}! ✦`);
          }
          // Reload navbar to show user avatar
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

    // No hash — just check if already have a session
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

  // Run as soon as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleCallback);
  } else {
    handleCallback();
  }

})();