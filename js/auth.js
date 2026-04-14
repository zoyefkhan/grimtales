/* ============================================
   auth.js — GrimTales Authentication

   STEP 1: Replace these 2 values with yours:
   Supabase → Settings → API
============================================ */

const SUPABASE_URL  = 'https://ukgqdgjtbvyybgvpmkcv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZ3FkZ2p0YnZ5eWJndnBta2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTI2OTEsImV4cCI6MjA5MTY2ODY5MX0.9t4p1Lcvu_j8hg0hWz3imLMb4NDBItPdyCogcTwiIAI';

/* ============================================
   DO NOT EDIT BELOW THIS LINE
============================================ */

let _sb = null;

async function getSB() {
  if (_sb) return _sb;
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') return null;
  if (!window.supabase) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  window._sbClient = _sb;
  return _sb;
}

function saveUser(sbUser, extra = {}) {
  const user = {
    id:        sbUser.id,
    username:  extra.username || sbUser.user_metadata?.username || sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
    email:     sbUser.email,
    role:      extra.role || sbUser.user_metadata?.role || 'reader',
    avatar:    sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || '',
    createdAt: sbUser.created_at,
  };
  localStorage.setItem('gt-user', JSON.stringify(user));
  localStorage.setItem('gt-logged-in', 'true');
  return user;
}

// Button loading
const spinCSS = document.createElement('style');
spinCSS.textContent = '@keyframes _spin{to{transform:rotate(360deg)}}';
document.head.appendChild(spinCSS);

function setBtn(btn, loading, label) {
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span style="display:inline-flex;align-items:center;gap:8px"><span style="width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:_spin .7s linear infinite;display:inline-block"></span>${label}</span>`
    : label;
}

// ─── Toggles, strength, match, role ──────────
function initToggles() {
  document.querySelectorAll('.password-toggle').forEach(b => {
    b.addEventListener('click', () => {
      const i = b.closest('.form-input-wrap')?.querySelector('input');
      if (!i) return;
      i.type = i.type === 'text' ? 'password' : 'text';
      b.textContent = i.type === 'password' ? '👁' : '🙈';
    });
  });
}

function initStrength() {
  const inp = document.getElementById('password'); if (!inp) return;
  const bars = ['s1','s2','s3','s4'].map(id => document.getElementById(id)).filter(Boolean);
  const txt = document.getElementById('strengthText');
  inp.addEventListener('input', () => {
    const v = inp.value; let s = 0;
    if (v.length >= 8) s++; if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++;
    bars.forEach((b,i) => { b.className='strength-bar'; if(i<s) b.classList.add(s<=2?'weak':s===3?'medium':'strong'); });
    if (txt) txt.textContent = v ? ['','Weak','Fair','Good','Strong ✓'][s] : 'Use 8+ characters';
  });
}

function initMatch() {
  const pw = document.getElementById('password'), cf = document.getElementById('confirmPassword');
  if (!pw || !cf) return;
  const chk = () => cf.closest('.form-group')?.classList.toggle('has-error', !!(cf.value && pw.value !== cf.value));
  pw.addEventListener('input', chk); cf.addEventListener('input', chk);
}

function initRole() {
  const rR=document.getElementById('roleReader'), rA=document.getElementById('roleAuthor');
  const lR=document.getElementById('roleReaderLabel'), lA=document.getElementById('roleAuthorLabel');
  const upd = () => { lR?.classList.toggle('active',!!rR?.checked); lA?.classList.toggle('active',!!rA?.checked); };
  lR?.addEventListener('click', () => { if(rR) rR.checked=true; upd(); });
  lA?.addEventListener('click', () => { if(rA) rA.checked=true; upd(); });
}

// ─── LOGIN ────────────────────────────────────
function initLogin() {
  const btn = document.getElementById('loginBtn'); if (!btn) return;

  async function doLogin() {
    const email = document.getElementById('loginIdentifier')?.value?.trim();
    const pass  = document.getElementById('loginPassword')?.value;
    if (!email) { window.showToast('Enter your email or username.', 'error'); return; }
    if (!pass)  { window.showToast('Enter your password.', 'error'); return; }

    setBtn(btn, true, 'Signing in...');
    try {
      const sb = await getSB();
      if (sb) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error) {
          const m = error.message.toLowerCase();
          if (m.includes('invalid') || m.includes('credentials') || m.includes('password')) window.showToast('Wrong email or password.', 'error');
          else if (m.includes('confirm') || m.includes('verif')) window.showToast('Please confirm your email first — check your inbox!', 'error');
          else window.showToast(error.message, 'error');
          return;
        }
        if (data?.user) {
          const user = saveUser(data.user);
          window.showToast(`Welcome back, ${user.username}! ✦`);
          const dest = sessionStorage.getItem('gt-redirect-after-login') || 'index.html';
          sessionStorage.removeItem('gt-redirect-after-login');
          setTimeout(() => window.location.href = dest, 700);
          return;
        }
      }
      // Demo fallback
      const stored = JSON.parse(localStorage.getItem('gt-users') || '[]');
      const found = stored.find(u => u.email === email || u.username === email);
      if (found && found.password === pass) {
        localStorage.setItem('gt-user', JSON.stringify(found));
        localStorage.setItem('gt-logged-in', 'true');
        window.showToast(`Welcome back, ${found.username}! ✦`);
        const dest = sessionStorage.getItem('gt-redirect-after-login') || 'index.html';
        sessionStorage.removeItem('gt-redirect-after-login');
        setTimeout(() => window.location.href = dest, 700);
      } else {
        window.showToast('Wrong email or password.', 'error');
      }
    } catch(e) {
      console.error(e);
      window.showToast('Login failed. Check your connection.', 'error');
    } finally {
      setBtn(btn, false, 'Sign In to GrimTales');
    }
  }

  btn.addEventListener('click', doLogin);
  document.getElementById('loginPassword')?.addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
  document.getElementById('loginIdentifier')?.addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
}

// ─── REGISTER ─────────────────────────────────
function initRegister() {
  const btn = document.getElementById('registerBtn'); if (!btn) return;
  btn.addEventListener('click', async () => {
    const email    = document.getElementById('email')?.value?.trim();
    const username = document.getElementById('username')?.value?.trim();
    const pass     = document.getElementById('password')?.value;
    const confirm  = document.getElementById('confirmPassword')?.value;
    const agreed   = document.getElementById('agreeTerms')?.checked;
    const role     = document.getElementById('roleAuthor')?.checked ? 'author' : 'reader';

    if (!email||!email.includes('@'))  { window.showToast('Enter a valid email.', 'error'); return; }
    if (!username||username.length<3)  { window.showToast('Username needs 3+ characters.', 'error'); return; }
    if (!pass||pass.length<8)          { window.showToast('Password needs 8+ characters.', 'error'); return; }
    if (pass!==confirm)                { window.showToast('Passwords do not match.', 'error'); return; }
    if (!agreed)                       { window.showToast('Please agree to Terms of Service.', 'error'); return; }

    setBtn(btn, true, 'Creating account...');
    try {
      const sb = await getSB();
      if (sb) {
        const { data, error } = await sb.auth.signUp({
          email, password: pass,
          options: {
            data: { username, role },
            emailRedirectTo: window.location.origin + '/index.html',
          },
        });
        if (error) { window.showToast(error.message, 'error'); return; }
        if (data?.user) {
          const stored = JSON.parse(localStorage.getItem('gt-users') || '[]');
          stored.push({ id: data.user.id, username, email, role, createdAt: new Date().toISOString() });
          localStorage.setItem('gt-users', JSON.stringify(stored));

          if (!data.session) {
            // Email confirmation required
            showEmailSent(email);
          } else {
            const user = saveUser(data.user, { username, role });
            window.showToast(`Welcome to GrimTales, ${username}! ✦`);
            setTimeout(() => window.location.href = 'index.html', 800);
          }
          return;
        }
      }
      // Demo fallback
      const stored = JSON.parse(localStorage.getItem('gt-users') || '[]');
      if (stored.find(u => u.email===email||u.username===username)) { window.showToast('Email or username already taken.', 'error'); return; }
      const nu = { id:'local_'+Date.now(), username, email, password:pass, role, avatar:'', createdAt: new Date().toISOString() };
      stored.push(nu);
      localStorage.setItem('gt-users', JSON.stringify(stored));
      localStorage.setItem('gt-user', JSON.stringify(nu));
      localStorage.setItem('gt-logged-in', 'true');
      window.showToast(`Welcome to GrimTales, ${username}! ✦`);
      setTimeout(() => window.location.href = 'index.html', 800);
    } catch(e) {
      console.error(e);
      window.showToast('Registration failed.', 'error');
    } finally {
      setBtn(btn, false, 'Create My Account');
    }
  });
}

function showEmailSent(email) {
  const c = document.querySelector('.auth-form-container');
  if (!c) return;
  c.innerHTML = `
    <div style="text-align:center;padding:2rem 0">
      <div style="font-size:3rem;margin-bottom:1.5rem">📬</div>
      <h2 style="font-family:var(--font-display);color:var(--white);font-size:1.3rem;margin-bottom:0.75rem">Check Your Email</h2>
      <p style="color:var(--ash);font-size:0.88rem;line-height:1.7;margin-bottom:0.5rem">We sent a confirmation link to:</p>
      <p style="color:var(--crimson-glow);font-family:var(--font-heading);margin-bottom:1.5rem">${email}</p>
      <p style="color:var(--ash);font-size:0.82rem;line-height:1.7;margin-bottom:2rem">Click the link in the email to activate your account.<br>Check your <strong style="color:var(--ash-light)">spam folder</strong> if you don't see it.</p>
      <a href="login.html" class="btn btn-crimson">Back to Sign In →</a>
    </div>`;
}

// ─── GOOGLE & DISCORD ─────────────────────────
function initSocial() {
  document.querySelectorAll('.social-auth-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const isGoogle = btn.textContent.trim().toLowerCase().includes('google');
      const provider = isGoogle ? 'google' : 'discord';
      const label    = isGoogle ? 'Google' : 'Discord';

      if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        window.showToast('Add your Supabase keys to js/auth.js first.', 'error');
        return;
      }

      setBtn(btn, true, `Opening ${label}...`);

      try {
        const sb = await getSB();
        if (!sb) throw new Error('Supabase not loaded');

        // This redirects the user to Google/Discord
        // When they approve, Supabase sends them back to your site
        // auth-callback.js then catches the session
        const { error } = await sb.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin + '/index.html',
            queryParams: provider === 'google' ? {
              access_type: 'offline',
              prompt: 'consent',
            } : {},
          },
        });

        if (error) throw error;
        // Page will redirect to Google/Discord automatically

      } catch (err) {
        console.error('OAuth error:', err);
        window.showToast(`${label} login failed: ${err.message}`, 'error');
        setBtn(btn, false, `${isGoogle ? 'G' : 'D'}  ${label}`);
      }
    });
  });
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initToggles();
  initStrength();
  initMatch();
  initRole();
  initLogin();
  initRegister();
  initSocial();
});