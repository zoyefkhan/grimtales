/* ============================================
   supabase.js — Single Supabase Client
   Import this on every page that needs data
   
   PASTE YOUR KEYS HERE:
============================================ */

const SUPABASE_URL  = 'https://ukgqdgjtbvyybgvpmkcv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZ3FkZ2p0YnZ5eWJndnBta2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTI2OTEsImV4cCI6MjA5MTY2ODY5MX0.9t4p1Lcvu_j8hg0hWz3imLMb4NDBItPdyCogcTwiIAI';

// ─── Singleton client ─────────────────────────
let _client = null;

async function getSupabase() {
  if (_client) return _client;
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.warn('⚠️ Add your Supabase keys to js/supabase.js');
    return null;
  }
  if (!window.supabase) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  window._sbClient = _client;
  return _client;
}

// ─── Auth helpers ─────────────────────────────
async function getCurrentUser() {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  return user || null;
}

async function getSession() {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

// ─── Expose globally ──────────────────────────
window.GT_Supabase = { getSupabase, getCurrentUser, getSession };