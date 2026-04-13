/* ============================================
   auth.js — Authentication with Supabase
   Free Google + Discord OAuth
   No backend needed for social login!
============================================ */

// ─── Supabase Config ──────────────────────────
// Replace these with YOUR Supabase project values
// Get them free at: https://supabase.com
const SUPABASE_URL    = 'https://ukgqdgjtbvyybgvpmkcv.supabase.co';   
const SUPABASE_ANON   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZ3FkZ2p0YnZ5eWJndnBta2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTI2OTEsImV4cCI6MjA5MTY2ODY5MX0.9t4p1Lcvu_j8hg0hWz3imLMb4NDBItPdyCogcTwiIAI';

// ─── Load Supabase SDK from CDN ───────────────
let supabase = null;

async function loadSupabase() {
  if (supabase) return supabase;
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    s.onload = () => {
      if (SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      }
      resolve(supabase);
    };
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

// ─── Session Helpers ──────────────────────────
function saveSession(user) {
  localStorage.setItem('gt-user', JSON.stringify(user));
  localStorage.setItem('gt-logged-in', 'true');
}

function getSession() {
  try { return JSON.parse(localStorage.getItem('gt-user') || 'null'); }
  catch { return null; }
}

// ─── Loading Button ───────────────────────────
function setLoading(btn, loading, text) {
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span style="display:inline-flex;align-items:center;gap:0.6em">
        <span style="display:inline-block;width:15px;height:15px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite"></span>
        ${text}
       </span>`
    : text;
}

// ─── Password Toggle ──────────────────────────
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.form-input-wrap').querySelector('input');
      if (!input) return;
      input.type = input.type === 'text' ? 'password' : 'text';
      btn.textContent = input.type === 'password' ? '👁' : '🙈';
    });
  });
}

// ─── Password Strength ────────────────────────
function initPasswordStrength() {
  const input = document.getElementById('regPassword') || document.getElementById('password');
  if (!input) return;
  const bars = ['s1','s2','s3','s4'].map(id => document.getElementById(id)).filter(Boolean);
  const text = document.getElementById('strengthText');
  input.addEventListener('input', () => {
    const v = input.value;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    bars.forEach((b, i) => {
      b.className = 'strength-bar';
      if (i < score) b.classList.add(score <= 2 ? 'weak' : score === 3 ? 'medium' : 'strong');
    });
    const labels = ['','Weak','Fair — add uppercase & symbols','Good — add a special character','Strong ✓'];
    if (text) text.textContent = v ? labels[score] : 'Use 8+ characters with letters, numbers & symbols';
  });
}

// ─── Password Match ───────────────────────────
function initPasswordMatch() {
  const pw = document.getElementById('password');
  const cf = document.getElementById('confirmPassword');
  if (!pw || !cf) return;
  const check = () => cf.closest('.form-group').classList.toggle('has-error', !!(cf.value && pw.value !== cf.value));
  pw.addEventListener('input', check);
  cf.addEventListener('input', check);
}

// ─── Role Toggle ──────────────────────────────
function initRoleToggle() {
  const rR = document.getElementById('roleReader');
  const rA = document.getElementById('roleAuthor');
  const lR = document.getElementById('roleReaderLabel');
  const lA = document.getElementById('roleAuthorLabel');
  const update = () => {
    lR?.classList.toggle('active', !!rR?.checked);
    lA?.classList.toggle('active', !!rA?.checked);
  };
  lR?.addEventListener('click', () => { if (rR) rR.checked = true; update(); });
  lA?.addEventListener('click', () => { if (rA) rA.checked = true; update(); });
}

// ─── LOGIN ────────────────────────────────────
function initLoginForm() {
  const btn = document.getElementById('loginBtn');
  if (!btn) return;

  const doLogin = async () => {
    const identifier = document.getElementById('loginIdentifier')?.value?.trim();
    const password   = document.getElementById('loginPassword')?.value;
    if (!identifier) { window.showToast('Please enter your email or username.', 'error'); return; }
    if (!password)   { window.showToast('Please enter your password.', 'error'); return; }

    setLoading(btn, true, 'Signing in...');

    try {
      // ── Try Supabase first ──
      const sb = await loadSupabase();
      if (sb) {
        const { data, error } = await sb.auth.signInWithPassword({ email: identifier, password });
        if (!error && data.user) {
          const user = {
            id:       data.user.id,
            username: data.user.user_metadata?.username || identifier.split('@')[0],
            email:    data.user.email,
            role:     data.user.user_metadata?.role || 'reader',
            avatar:   data.user.user_metadata?.avatar_url || '',
            createdAt: data.user.created_at,
          };
          saveSession(user);
          window.showToast(`Welcome back, ${user.username}! ✦`);
          const dest = sessionStorage.getItem('gt-redirect-after-login') || 'index.html';
          sessionStorage.removeItem('gt-redirect-after-login');
          setTimeout(() => window.location.href = dest, 800);
          return;
        }
        if (error) { window.showToast(error.message || 'Invalid credentials.', 'error'); return; }
      }

      // ── Fallback: localStorage demo mode ──
      const stored = JSON.parse(localStorage.getItem('gt-users') || '[]');
      const found  = stored.find(u => u.email === identifier || u.username === identifier);
      if (found && found.password === password) {
        saveSession(found);
        window.showToast(`Welcome back, ${found.username}! ✦`);
        const dest = sessionStorage.getItem('gt-redirect-after-login') || 'index.html';
        sessionStorage.removeItem('gt-redirect-after-login');
        setTimeout(() => window.location.href = dest, 800);
      } else {
        window.showToast('Invalid email or password.', 'error');
      }
    } catch (err) {
      window.showToast('Login failed. Check your connection.', 'error');
    } finally {
      setLoading(btn, false, 'Sign In to GrimTales');
    }
  };

  btn.addEventListener('click', doLogin);
  document.getElementById('loginPassword')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
}

// ─── REGISTER ─────────────────────────────────
function initRegisterForm() {
  const btn = document.getElementById('registerBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const email    = document.getElementById('email')?.value?.trim();
    const username = document.getElementById('username')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const confirm  = document.getElementById('confirmPassword')?.value;
    const agreed   = document.getElementById('agreeTerms')?.checked;
    const role     = document.getElementById('roleAuthor')?.checked ? 'author' : 'reader';

    if (!email || !email.includes('@')) { window.showToast('Please enter a valid email.', 'error'); return; }
    if (!username || username.length < 3) { window.showToast('Username must be at least 3 characters.', 'error'); return; }
    if (!password || password.length < 8) { window.showToast('Password must be at least 8 characters.', 'error'); return; }
    if (password !== confirm) { window.showToast('Passwords do not match.', 'error'); return; }
    if (!agreed) { window.showToast('Please agree to the Terms of Service.', 'error'); return; }

    setLoading(btn, true, 'Creating account...');

    const newUser = {
      id: 'local_' + Date.now(),
      username, email, password, role,
      avatar: '', bio: '', createdAt: new Date().toISOString(),
    };

    try {
      // ── Try Supabase first ──
      const sb = await loadSupabase();
      if (sb) {
        const { data, error } = await sb.auth.signUp({
          email, password,
          options: { data: { username, role } },
        });
        if (!error && data.user) {
          const user = {
            id:       data.user.id,
            username, email, role,
            avatar:   '',
            createdAt: data.user.created_at,
          };
          saveSession(user);
          // Save locally too
          const stored = JSON.parse(localStorage.getItem('gt-users') || '[]');
          stored.push({ ...newUser, id: data.user.id });
          localStorage.setItem('gt-users', JSON.stringify(stored));
          window.showToast(`Welcome to GrimTales, ${username}! ✦`);
          setTimeout(() => window.location.href = 'index.html', 1000);
          return;
        }
        if (error) { window.showToast(error.message || 'Registration failed.', 'error'); return; }
      }

      // ── Fallback: localStorage demo mode ──
      const stored = JSON.parse(localStorage.getItem('gt-users') || '[]');
      if (stored.find(u => u.email === email || u.username === username)) {
        window.showToast('Username or email already taken.', 'error');
      } else {
        stored.push(newUser);
        localStorage.setItem('gt-users', JSON.stringify(stored));
        saveSession(newUser);
        window.showToast(`Welcome to GrimTales, ${username}! ✦`);
        setTimeout(() => window.location.href = 'index.html', 1000);
      }
    } catch {
      window.showToast('Registration failed. Check your connection.', 'error');
    } finally {
      setLoading(btn, false, 'Create My Account');
    }
  });
}

// ─── SOCIAL AUTH (Google & Discord via Supabase) ─
function initSocialAuth() {
  document.querySelectorAll('.social-auth-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const isGoogle  = btn.textContent.trim().toLowerCase().includes('google');
      const provider  = isGoogle ? 'google' : 'discord';
      const label     = isGoogle ? 'Google' : 'Discord';

      // Check if Supabase is configured
      if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        // Show setup instructions instead of error
        showSupabaseSetup(label);
        return;
      }

      setLoading(btn, true, `Connecting ${label}...`);

      try {
        const sb = await loadSupabase();
        if (!sb) throw new Error('Supabase not loaded');

        const { error } = await sb.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin + '/index.html',
          },
        });

        if (error) throw error;
        // Supabase redirects automatically — no need to do anything
      } catch (err) {
        window.showToast(`${label} login failed: ${err.message}`, 'error');
        setLoading(btn, false, `${isGoogle ? 'G' : 'D'}  ${label}`);
      }
    });
  });
}

// ─── Show Supabase Setup Guide ────────────────
function showSupabaseSetup(provider) {
  const existing = document.getElementById('supabaseGuide');
  if (existing) { existing.remove(); return; }

  const box = document.createElement('div');
  box.id = 'supabaseGuide';
  box.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(6,6,8,0.95);
    display:flex;align-items:center;justify-content:center;
    padding:1.5rem;animation:fadeIn 0.2s ease;
  `;
  box.innerHTML = `
    <div style="
      background:linear-gradient(170deg,#110000,#220505,#110000);
      border:1px solid rgba(139,26,26,0.5);
      border-radius:12px;padding:2rem;max-width:480px;width:100%;
      box-shadow:0 8px 40px rgba(0,0,0,0.8),0 0 30px rgba(139,26,26,0.2);
      font-family:Georgia,serif;
    ">
      <div style="font-size:1.5rem;margin-bottom:1rem;text-align:center">⚙️</div>
      <h2 style="font-family:Georgia,serif;font-size:1.1rem;color:#f0eee8;margin-bottom:0.5rem;text-align:center">
        Setup ${provider} Login — Free
      </h2>
      <p style="color:#9a9aaa;font-size:0.82rem;margin-bottom:1.25rem;text-align:center;line-height:1.6">
        ${provider} login uses Supabase (100% free). Follow these steps:
      </p>
      <ol style="color:#c4c4d4;font-size:0.82rem;line-height:2;padding-left:1.25rem">
        <li>Go to <a href="https://supabase.com" target="_blank" style="color:#e74c3c">supabase.com</a> → Create free account</li>
        <li>Create a new project (free tier)</li>
        <li>Go to <strong style="color:#f0eee8">Settings → API</strong></li>
        <li>Copy your <strong style="color:#f0eee8">Project URL</strong> and <strong style="color:#f0eee8">anon public key</strong></li>
        <li>Open <strong style="color:#f0eee8">js/auth.js</strong> and replace:<br>
          <code style="background:#0d0000;padding:0.2em 0.5em;border-radius:3px;font-size:0.75rem;color:#e74c3c">YOUR_SUPABASE_URL</code><br>
          <code style="background:#0d0000;padding:0.2em 0.5em;border-radius:3px;font-size:0.75rem;color:#e74c3c">YOUR_SUPABASE_ANON_KEY</code>
        </li>
        <li>In Supabase → <strong style="color:#f0eee8">Authentication → Providers</strong><br>
          Enable <strong style="color:#f0eee8">${provider}</strong> and add your OAuth credentials</li>
        <li>Done! ${provider} login will work ✦</li>
      </ol>
      <div style="margin-top:1.5rem;display:flex;gap:0.75rem;justify-content:center">
        <a href="https://supabase.com" target="_blank" style="
          background:linear-gradient(180deg,#3a0000,#8b1a1a,#c0392b,#8b1a1a,#3a0000);
          color:white;padding:0.6em 1.4em;border-radius:4px;
          font-size:0.8rem;letter-spacing:0.1em;text-transform:uppercase;
          text-decoration:none;
        ">Open Supabase →</a>
        <button onclick="document.getElementById('supabaseGuide').remove()" style="
          background:linear-gradient(180deg,#0d0000,#1a0505);
          color:#9a9aaa;padding:0.6em 1.4em;border-radius:4px;
          font-size:0.8rem;letter-spacing:0.1em;text-transform:uppercase;
          border:1px solid rgba(139,26,26,0.3);cursor:pointer;
        ">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(box);
  box.addEventListener('click', e => { if (e.target === box) box.remove(); });
}

// ─── Handle Supabase OAuth redirect ──────────
// When Supabase redirects back after Google/Discord login
async function handleOAuthRedirect() {
  const sb = await loadSupabase();
  if (!sb) return;

  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    const u = session.user;
    const user = {
      id:       u.id,
      username: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0],
      email:    u.email,
      role:     u.user_metadata?.role || 'reader',
      avatar:   u.user_metadata?.avatar_url || u.user_metadata?.picture || '',
      createdAt: u.created_at,
    };
    saveSession(user);
  }
}

// ─── Spin animation ───────────────────────────
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  handleOAuthRedirect();
  initPasswordToggles();
  initPasswordStrength();
  initPasswordMatch();
  initRoleToggle();
  initLoginForm();
  initRegisterForm();
  initSocialAuth();
});