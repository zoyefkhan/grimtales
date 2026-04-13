/* ============================================
   auth.js — GrimTales Authentication
   
   ⚠️  IMPORTANT — PASTE YOUR KEYS BELOW:
   Get them from: supabase.com → your project
   → Settings → API
============================================ */

// ════════════════════════════════════════════
//   PASTE YOUR SUPABASE KEYS HERE ↓↓↓
// ════════════════════════════════════════════
const SUPABASE_URL  = 'https://ukgqdgjtbvyybgvpmkcv.supabase.co';
//  e.g: 'https://ukgqdgjtbvyybgvpmkcv.supabase.co'

const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZ3FkZ2p0YnZ5eWJndnBta2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTI2OTEsImV4cCI6MjA5MTY2ODY5MX0.9t4p1Lcvu_j8hg0hWz3imLMb4NDBItPdyCogcTwiIAI';
//  e.g: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
// ════════════════════════════════════════════

// ─── Load Supabase SDK ────────────────────────
let _sb = null;
async function getSB() {
  if (_sb) return _sb;
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') return null;

  // Load SDK if not already loaded
  if (!window.supabase) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _sb;
}

// ─── Session helpers ──────────────────────────
function saveUser(user) {
  localStorage.setItem('gt-user', JSON.stringify(user));
  localStorage.setItem('gt-logged-in', 'true');
}

function buildUserObj(sbUser, extra = {}) {
  return {
    id:        sbUser.id,
    username:  extra.username
               || sbUser.user_metadata?.username
               || sbUser.user_metadata?.full_name
               || sbUser.user_metadata?.name
               || sbUser.email?.split('@')[0]
               || 'User',
    email:     sbUser.email,
    role:      extra.role || sbUser.user_metadata?.role || 'reader',
    avatar:    sbUser.user_metadata?.avatar_url
               || sbUser.user_metadata?.picture
               || '',
    createdAt: sbUser.created_at,
  };
}

// ─── Button loading state ─────────────────────
const spin = `<span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:gt-spin 0.7s linear infinite;vertical-align:middle;margin-right:6px"></span>`;

if (!document.getElementById('gt-spin-style')) {
  const st = document.createElement('style');
  st.id = 'gt-spin-style';
  st.textContent = '@keyframes gt-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(st);
}

function setBtn(btn, loading, label) {
  btn.disabled = loading;
  btn.innerHTML = loading ? spin + label : label;
}

// ─── Password toggle ──────────────────────────
function initToggles() {
  document.querySelectorAll('.password-toggle').forEach(b => {
    b.addEventListener('click', () => {
      const inp = b.closest('.form-input-wrap')?.querySelector('input');
      if (!inp) return;
      inp.type = inp.type === 'text' ? 'password' : 'text';
      b.textContent = inp.type === 'password' ? '👁' : '🙈';
    });
  });
}

// ─── Password strength ────────────────────────
function initStrength() {
  const inp = document.getElementById('password');
  if (!inp) return;
  const bars = ['s1','s2','s3','s4'].map(id => document.getElementById(id)).filter(Boolean);
  const txt  = document.getElementById('strengthText');
  inp.addEventListener('input', () => {
    const v = inp.value; let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    bars.forEach((b,i) => { b.className='strength-bar'; if(i<s) b.classList.add(s<=2?'weak':s===3?'medium':'strong'); });
    if (txt) txt.textContent = v ? ['','Weak','Fair','Good','Strong ✓'][s] : 'Use 8+ characters with letters, numbers & symbols';
  });
}

// ─── Password match ───────────────────────────
function initMatch() {
  const pw = document.getElementById('password');
  const cf = document.getElementById('confirmPassword');
  if (!pw || !cf) return;
  const chk = () => cf.closest('.form-group')?.classList.toggle('has-error', !!(cf.value && pw.value !== cf.value));
  pw.addEventListener('input', chk);
  cf.addEventListener('input', chk);
}

// ─── Role toggle ──────────────────────────────
function initRole() {
  const rR=document.getElementById('roleReader'), rA=document.getElementById('roleAuthor');
  const lR=document.getElementById('roleReaderLabel'), lA=document.getElementById('roleAuthorLabel');
  const upd = () => { lR?.classList.toggle('active',!!rR?.checked); lA?.classList.toggle('active',!!rA?.checked); };
  lR?.addEventListener('click', () => { if(rR) rR.checked=true; upd(); });
  lA?.addEventListener('click', () => { if(rA) rA.checked=true; upd(); });
}

// ════════════════════════════════════════════
//   LOGIN
// ════════════════════════════════════════════
function initLogin() {
  const btn = document.getElementById('loginBtn');
  if (!btn) return;

  async function doLogin() {
    const email    = document.getElementById('loginIdentifier')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email)    { window.showToast('Please enter your email.', 'error'); return; }
    if (!password) { window.showToast('Please enter your password.', 'error'); return; }

    setBtn(btn, true, 'Signing in...');

    try {
      const sb = await getSB();

      if (sb) {
        // ── Supabase login ──
        const { data, error } = await sb.auth.signInWithPassword({ email, password });

        if (error) {
          // Friendly error messages
          const msg = error.message.toLowerCase();
          if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
            window.showToast('Wrong email or password. Try again.', 'error');
          } else if (msg.includes('confirm') || msg.includes('verified')) {
            window.showToast('Please confirm your email first — check your inbox!', 'error');
          } else if (msg.includes('rate') || msg.includes('too many')) {
            window.showToast('Too many attempts. Wait 1 minute and try again.', 'error');
          } else {
            window.showToast(error.message, 'error');
          }
          return;
        }

        if (data?.user) {
          const user = buildUserObj(data.user);
          saveUser(user);
          window.showToast(`Welcome back, ${user.username}! ✦`);
          const dest = sessionStorage.getItem('gt-redirect-after-login') || 'index.html';
          sessionStorage.removeItem('gt-redirect-after-login');
          setTimeout(() => window.location.href = dest, 700);
          return;
        }
      }

      // ── Offline / demo fallback ──
      const stored = JSON.parse(localStorage.getItem('gt-users') || '[]');
      const found  = stored.find(u => u.email === email || u.username === email);
      if (found && found.password === password) {
        saveUser(found);
        window.showToast(`Welcome back, ${found.username}! ✦`);
        const dest = sessionStorage.getItem('gt-redirect-after-login') || 'index.html';
        sessionStorage.removeItem('gt-redirect-after-login');
        setTimeout(() => window.location.href = dest, 700);
      } else {
        window.showToast('Wrong email or password.', 'error');
      }

    } catch (err) {
      console.error('Login error:', err);
      window.showToast('Login failed. Check your internet connection.', 'error');
    } finally {
      setBtn(btn, false, 'Sign In to GrimTales');
    }
  }

  btn.addEventListener('click', doLogin);
  document.getElementById('loginPassword')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('loginIdentifier')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
}

// ════════════════════════════════════════════
//   REGISTER
// ════════════════════════════════════════════
function initRegister() {
  const btn = document.getElementById('registerBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const email    = document.getElementById('email')?.value?.trim();
    const username = document.getElementById('username')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const confirm  = document.getElementById('confirmPassword')?.value;
    const agreed   = document.getElementById('agreeTerms')?.checked;
    const role     = document.getElementById('roleAuthor')?.checked ? 'author' : 'reader';

    if (!email || !email.includes('@'))   { window.showToast('Enter a valid email address.', 'error'); return; }
    if (!username || username.length < 3) { window.showToast('Username must be at least 3 characters.', 'error'); return; }
    if (!password || password.length < 8) { window.showToast('Password must be at least 8 characters.', 'error'); return; }
    if (password !== confirm)             { window.showToast('Passwords do not match.', 'error'); return; }
    if (!agreed)                          { window.showToast('Please agree to the Terms of Service.', 'error'); return; }

    setBtn(btn, true, 'Creating account...');

    try {
      const sb = await getSB();

      if (sb) {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: {
            data: { username, role },
            emailRedirectTo: window.location.origin + '/index.html',
          },
        });

        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('already') || msg.includes('exists')) {
            window.showToast('Email already registered. Try logging in.', 'error');
          } else if (msg.includes('password')) {
            window.showToast('Password too weak. Use 8+ characters with numbers & symbols.', 'error');
          } else {
            window.showToast(error.message, 'error');
          }
          return;
        }

        if (data?.user) {
          // Check if email confirmation is required
          const needsConfirm = !data.session;

          if (needsConfirm) {
            // Supabase sent a confirmation email
            showEmailSent(email);
          } else {
            // Auto-confirmed — log them in immediately
            const user = buildUserObj(data.user, { username, role });
            saveUser(user);
            window.showToast(`Welcome to GrimTales, ${username}! ✦`);
            setTimeout(() => window.location.href = 'index.html', 800);
          }

          // Save locally too
          const stored = JSON.parse(localStorage.getItem('gt-users') || '[]');
          stored.push({ id: data.user.id, username, email, role, createdAt: new Date().toISOString() });
          localStorage.setItem('gt-users', JSON.stringify(stored));
          return;
        }
      }

      // ── Demo fallback ──
      const stored = JSON.parse(localStorage.getItem('gt-users') || '[]');
      if (stored.find(u => u.email === email || u.username === username)) {
        window.showToast('Email or username already taken.', 'error');
        return;
      }
      const newUser = { id: 'local_' + Date.now(), username, email, password, role, avatar: '', createdAt: new Date().toISOString() };
      stored.push(newUser);
      localStorage.setItem('gt-users', JSON.stringify(stored));
      saveUser(newUser);
      window.showToast(`Welcome to GrimTales, ${username}! ✦`);
      setTimeout(() => window.location.href = 'index.html', 800);

    } catch (err) {
      console.error('Register error:', err);
      window.showToast('Registration failed. Check your connection.', 'error');
    } finally {
      setBtn(btn, false, 'Create My Account');
    }
  });
}

// ─── Email confirmation screen ────────────────
function showEmailSent(email) {
  document.querySelector('.auth-form-container').innerHTML = `
    <div style="text-align:center;padding:2rem 0">
      <div style="font-size:3rem;margin-bottom:1.5rem">📬</div>
      <h2 style="font-family:var(--font-display);color:var(--white);font-size:1.4rem;margin-bottom:0.75rem">
        Check Your Email
      </h2>
      <p style="color:var(--ash);font-size:0.9rem;line-height:1.7;margin-bottom:0.5rem">
        We sent a confirmation link to:
      </p>
      <p style="color:var(--crimson-glow);font-family:var(--font-heading);font-size:0.9rem;margin-bottom:2rem">
        ${email}
      </p>
      <p style="color:var(--ash);font-size:0.82rem;line-height:1.7;margin-bottom:2rem">
        Click the link in the email to activate your account.<br>
        Check your <strong style="color:var(--ash-light)">spam folder</strong> if you don't see it.
      </p>
      <a href="login.html" class="btn btn-crimson" style="display:inline-block">
        Back to Sign In →
      </a>
      <div style="margin-top:1rem">
        <button onclick="resendEmail('${email}')" style="background:none;border:none;color:var(--ash);font-size:0.8rem;cursor:pointer;font-family:var(--font-heading);letter-spacing:0.05em">
          Didn't get it? Resend email
        </button>
      </div>
    </div>
  `;
}

// ─── Resend confirmation email ────────────────
window.resendEmail = async function(email) {
  const sb = await getSB();
  if (!sb) return;
  const { error } = await sb.auth.resend({ type: 'signup', email });
  if (!error) window.showToast('Confirmation email resent! Check your inbox.');
  else window.showToast('Could not resend. Try again in 1 minute.', 'error');
};

// ════════════════════════════════════════════
//   SOCIAL LOGIN — Google & Discord
// ════════════════════════════════════════════
function initSocial() {
  document.querySelectorAll('.social-auth-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const isGoogle = btn.textContent.trim().toLowerCase().includes('google');
      const provider = isGoogle ? 'google' : 'discord';
      const label    = isGoogle ? 'Google' : 'Discord';

      if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        showSetupGuide(label, provider);
        return;
      }

      setBtn(btn, true, `Connecting ${label}...`);
      try {
        const sb = await getSB();
        if (!sb) throw new Error('Could not load Supabase');

        const { error } = await sb.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin + '/index.html',
          },
        });
        if (error) throw error;
        // Supabase handles the redirect automatically

      } catch (err) {
        window.showToast(`${label} login failed: ${err.message}`, 'error');
        setBtn(btn, false, `${isGoogle ? 'G' : 'D'}  ${label}`);
      }
    });
  });
}

// ─── Setup guide popup ────────────────────────
function showSetupGuide(label, provider) {
  document.getElementById('sbGuide')?.remove();
  const box = document.createElement('div');
  box.id = 'sbGuide';
  box.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(6,6,8,0.95);display:flex;align-items:center;justify-content:center;padding:1.5rem;animation:fadeIn 0.2s ease';
  box.innerHTML = `
    <div style="background:linear-gradient(170deg,#110000,#220505,#110000);border:1px solid rgba(139,26,26,0.5);border-radius:12px;padding:2rem;max-width:460px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,0.8);font-family:Georgia,serif">
      <div style="text-align:center;font-size:1.5rem;margin-bottom:1rem">⚙️</div>
      <h2 style="text-align:center;color:#f0eee8;font-size:1rem;margin-bottom:0.5rem">Setup ${label} Login — Free</h2>
      <p style="color:#9a9aaa;font-size:0.8rem;text-align:center;margin-bottom:1.25rem">Open <strong style="color:#f0eee8">js/auth.js</strong> and fill in your 2 Supabase keys at the top of the file:</p>
      <div style="background:#0d0000;border:1px solid rgba(139,26,26,0.3);border-radius:6px;padding:1rem;font-size:0.78rem;color:#c4c4d4;margin-bottom:1.25rem;line-height:2">
        <div>1. Go to <a href="https://supabase.com" target="_blank" style="color:#e74c3c">supabase.com</a> → your project</div>
        <div>2. <strong style="color:#f0eee8">Settings → API</strong></div>
        <div>3. Copy <strong style="color:#f0eee8">Project URL</strong> → paste as <code style="color:#e74c3c">SUPABASE_URL</code></div>
        <div>4. Copy <strong style="color:#f0eee8">anon public key</strong> → paste as <code style="color:#e74c3c">SUPABASE_ANON</code></div>
        <div>5. In Supabase → <strong style="color:#f0eee8">Auth → Providers → ${label}</strong> → Enable</div>
        <div>6. Push to GitHub → done ✦</div>
      </div>
      <div style="display:flex;gap:0.75rem;justify-content:center">
        <a href="https://supabase.com" target="_blank" style="background:linear-gradient(180deg,#3a0000,#8b1a1a,#c0392b,#8b1a1a,#3a0000);color:white;padding:0.6em 1.4em;border-radius:4px;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none">Open Supabase →</a>
        <button onclick="document.getElementById('sbGuide').remove()" style="background:linear-gradient(180deg,#0d0000,#1a0505);color:#9a9aaa;padding:0.6em 1.4em;border-radius:4px;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;border:1px solid rgba(139,26,26,0.3);cursor:pointer">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(box);
  box.addEventListener('click', e => { if (e.target === box) box.remove(); });
}

// ════════════════════════════════════════════
//   HANDLE OAUTH CALLBACK
//   When Supabase redirects back to the site
//   after Google/Discord login
// ════════════════════════════════════════════
async function handleCallback() {
  const sb = await getSB();
  if (!sb) return;

  // Listen for auth state changes
  sb.auth.onAuthStateChange((event, session) => {
    if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
      const user = buildUserObj(session.user);
      saveUser(user);

      // Only redirect if we're on login/register page
      const page = window.location.pathname.split('/').pop();
      if (page === 'login.html' || page === 'register.html' || page === '' || page === 'index.html') {
        const dest = sessionStorage.getItem('gt-redirect-after-login') || 'index.html';
        sessionStorage.removeItem('gt-redirect-after-login');
        if (page !== dest.replace('/', '')) {
          window.location.href = dest;
        }
      }
    }

    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('gt-user');
      localStorage.removeItem('gt-logged-in');
    }
  });

  // Also check existing session on page load
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    const user = buildUserObj(session.user);
    saveUser(user);
  }
}

// ─── Init everything ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  handleCallback();
  initToggles();
  initStrength();
  initMatch();
  initRole();
  initLogin();
  initRegister();
  initSocial();
});