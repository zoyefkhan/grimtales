/* ============================================
   auth.js — GrimTales Authentication
   Fixed: profile creation on all devices
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

// ─── CRITICAL: Ensure profile exists ─────────
// Called after every login/register
// Handles cases where the DB trigger failed
async function ensureProfile(sb, sbUser, extra = {}) {
  try {
    // Check if profile already exists
    const { data: existing } = await sb
      .from('profiles')
      .select('id, username, role')
      .eq('id', sbUser.id)
      .single();

    if (existing) {
      // Profile exists — return it
      return existing;
    }

    // Profile doesn't exist — create it manually
    // (trigger may have failed on mobile)
    const username =
      extra.username ||
      sbUser.user_metadata?.username ||
      sbUser.user_metadata?.full_name ||
      sbUser.user_metadata?.name ||
      sbUser.email?.split('@')[0] ||
      'User' + Math.floor(Math.random() * 9999);

    const role = extra.role || sbUser.user_metadata?.role || 'reader';
    const avatar = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || '';

    const { data: newProfile, error } = await sb
      .from('profiles')
      .insert({
        id: sbUser.id,
        username,
        display_name: sbUser.user_metadata?.full_name || username,
        avatar_url: avatar,
        role,
        bio: '',
        location: '',
        website: '',
      })
      .select()
      .single();

    if (error) {
      // If duplicate key error, try fetching again
      if (error.code === '23505') {
        const { data: retry } = await sb.from('profiles').select('*').eq('id', sbUser.id).single();
        return retry;
      }
      console.error('Profile creation error:', error);
      return null;
    }

    return newProfile;
  } catch (e) {
    console.error('ensureProfile error:', e);
    return null;
  }
}

// ─── Build local user object ──────────────────
function buildUser(sbUser, profile = null, extra = {}) {
  return {
    id:        sbUser.id,
    username:  profile?.username || extra.username || sbUser.user_metadata?.username || sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
    email:     sbUser.email,
    role:      profile?.role || extra.role || sbUser.user_metadata?.role || 'reader',
    avatar:    profile?.avatar_url || sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || '',
    bio:       profile?.bio || '',
    createdAt: sbUser.created_at,
  };
}

function saveUser(user) {
  localStorage.setItem('gt-user', JSON.stringify(user));
  localStorage.setItem('gt-logged-in', 'true');
}

// ─── Loading button ───────────────────────────
if (!document.getElementById('_spinStyle')) {
  const s = document.createElement('style');
  s.id = '_spinStyle';
  s.textContent = '@keyframes _sp{to{transform:rotate(360deg)}}';
  document.head.appendChild(s);
}

function setBtn(btn, loading, label) {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span style="display:inline-flex;align-items:center;gap:8px"><span style="width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:_sp .7s linear infinite;display:inline-block"></span>${label}</span>`
    : label;
}

// ─── Password toggle ──────────────────────────
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
    bars.forEach((b, i) => {
      b.className = 'strength-bar';
      if (i < s) b.classList.add(s <= 2 ? 'weak' : s === 3 ? 'medium' : 'strong');
    });
    if (txt) txt.textContent = v ? ['','Weak','Fair','Good','Strong ✓'][s] : 'Use 8+ characters';
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
  const rR = document.getElementById('roleReader');
  const rA = document.getElementById('roleAuthor');
  const lR = document.getElementById('roleReaderLabel');
  const lA = document.getElementById('roleAuthorLabel');
  const upd = () => {
    lR?.classList.toggle('active', !!rR?.checked);
    lA?.classList.toggle('active', !!rA?.checked);
  };
  lR?.addEventListener('click', () => { if (rR) rR.checked = true; upd(); });
  lA?.addEventListener('click', () => { if (rA) rA.checked = true; upd(); });
}

// ════════════════════════════════════════════
//   LOGIN
// ════════════════════════════════════════════
function initLogin() {
  const btn = document.getElementById('loginBtn');
  if (!btn) return;

  async function doLogin() {
    const email = document.getElementById('loginIdentifier')?.value?.trim();
    const pass  = document.getElementById('loginPassword')?.value;

    if (!email) { window.showToast('Enter your email or username.', 'error'); return; }
    if (!pass)  { window.showToast('Enter your password.', 'error'); return; }

    setBtn(btn, true, 'Signing in...');

    try {
      const sb = await getSB();

      if (sb) {
        const { data, error } = await sb.auth.signInWithPassword({
          email,
          password: pass,
        });

        if (error) {
          const m = error.message.toLowerCase();
          if (m.includes('invalid') || m.includes('credentials') || m.includes('password')) {
            window.showToast('Wrong email or password.', 'error');
          } else if (m.includes('confirm') || m.includes('verif')) {
            window.showToast('Please confirm your email first — check your inbox!', 'error');
          } else if (m.includes('rate') || m.includes('too many')) {
            window.showToast('Too many attempts. Wait 1 minute.', 'error');
          } else {
            window.showToast(error.message, 'error');
          }
          return;
        }

        if (data?.user) {
          const profile = await ensureProfile(sb, data.user);
          const user = buildUser(data.user, profile);
          saveUser(user);

          window.showToast(`Welcome back, ${user.username}! ✦`);
          const dest = sessionStorage.getItem('gt-redirect-after-login') || 'index.html';
          sessionStorage.removeItem('gt-redirect-after-login');
          setTimeout(() => window.location.href = dest, 700);
          return;
        }
      }

      window.showToast('Wrong email or password.', 'error');

    } catch (e) {
      console.error('Login error:', e);
      window.showToast('Login failed. Check your connection.', 'error');
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
    const pass     = document.getElementById('password')?.value;
    const confirm  = document.getElementById('confirmPassword')?.value;
    const agreed   = document.getElementById('agreeTerms')?.checked;
    const role     = document.getElementById('roleAuthor')?.checked ? 'author' : 'reader';

    if (!email || !email.includes('@'))   { window.showToast('Enter a valid email.', 'error'); return; }
    if (!username || username.length < 3) { window.showToast('Username needs 3+ characters.', 'error'); return; }
    if (!pass || pass.length < 8)         { window.showToast('Password needs 8+ characters.', 'error'); return; }
    if (pass !== confirm)                 { window.showToast('Passwords do not match.', 'error'); return; }
    if (!agreed)                          { window.showToast('Please agree to Terms of Service.', 'error'); return; }

    setBtn(btn, true, 'Creating account...');

    try {
      const sb = await getSB();

      if (sb) {
        // Check username not taken first
        const { data: existingUser } = await sb
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();

        if (existingUser) {
          window.showToast('Username already taken. Choose another.', 'error');
          return;
        }

        const { data, error } = await sb.auth.signUp({
          email,
          password: pass,
          options: {
            data: { username, role },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          const m = error.message.toLowerCase();
          if (m.includes('already') || m.includes('exists')) {
            window.showToast('Email already registered. Try logging in.', 'error');
          } else if (m.includes('password')) {
            window.showToast('Password too weak. Use 8+ chars with numbers & symbols.', 'error');
          } else {
            window.showToast(error.message, 'error');
          }
          return;
        }

        if (data?.user) {
          // ── CRITICAL: Create profile immediately ──
          // Don't rely on trigger alone — create it directly
          await ensureProfile(sb, data.user, { username, role });

          const needsConfirm = !data.session;

          if (needsConfirm) {
            showEmailSent(email);
          } else {
            const user = buildUser(data.user, null, { username, role });
            saveUser(user);
            window.showToast(`Welcome to GrimTales, ${username}! ✦`);
            setTimeout(() => window.location.href = 'index.html', 800);
          }
          return;
        }
      }

      window.showToast('Registration failed. Check your connection or try again later.', 'error');

    } catch (e) {
      console.error('Register error:', e);
      window.showToast('Registration failed. Check your connection.', 'error');
    } finally {
      setBtn(btn, false, 'Create My Account');
    }
  });
}

// ─── Email confirmation screen ────────────────
function showEmailSent(email) {
  const c = document.querySelector('.auth-form-container');
  if (!c) return;
  c.innerHTML = `
    <div style="text-align:center;padding:2rem 0">
      <div style="font-size:3.5rem;margin-bottom:1.5rem">📬</div>
      <h2 style="font-family:var(--font-display);color:var(--white);font-size:1.3rem;margin-bottom:0.75rem">Check Your Email</h2>
      <p style="color:var(--ash);font-size:0.88rem;line-height:1.7;margin-bottom:0.5rem">Confirmation link sent to:</p>
      <p style="color:var(--crimson-glow);font-family:var(--font-heading);margin-bottom:1.5rem">${email}</p>
      <p style="color:var(--ash);font-size:0.82rem;line-height:1.7;margin-bottom:2rem">
        Click the link in the email to activate your account.<br>
        Check your <strong style="color:var(--ash-light)">spam / junk folder</strong> if you don't see it.
      </p>
      <a href="login.html" class="btn btn-crimson" style="display:inline-block">Go to Sign In →</a>
      <div style="margin-top:1rem">
        <button onclick="resendEmail('${email}')" style="background:none;border:none;color:var(--ash);font-size:0.8rem;cursor:pointer;font-family:var(--font-heading);letter-spacing:0.05em;text-decoration:underline">
          Didn't get it? Resend email
        </button>
      </div>
    </div>`;
}

window.resendEmail = async function(email) {
  const sb = await getSB();
  if (!sb) return;
  const { error } = await sb.auth.resend({ type: 'signup', email });
  if (!error) window.showToast('Verification email resent! Check inbox + spam.');
  else window.showToast('Could not resend. Try again in 1 minute.', 'error');
};

// ════════════════════════════════════════════
//   GOOGLE & FACEBOOK OAUTH
// ════════════════════════════════════════════
function initSocial() {
  document.querySelectorAll('.social-auth-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const isGoogle = btn.textContent.trim().toLowerCase().includes('google');
      const provider = isGoogle ? 'google' : 'facebook';
      const label    = isGoogle ? 'Google' : 'Facebook';

      if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        window.showToast('Add your Supabase keys to js/auth.js first.', 'error');
        return;
      }

      setBtn(btn, true, `Opening ${label}...`);

      try {
        const sb = await getSB();
        if (!sb) throw new Error('Supabase not available');

        const { data, error } = await sb.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin + '/',
            skipBrowserRedirect: true,
            queryParams: isGoogle ? { access_type: 'offline', prompt: 'consent' } : {},
          },
        });

        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
        }

      } catch (e) {
        console.error('OAuth error:', e);
        window.showToast(`${label} login failed. Try email login instead.`, 'error');
        setBtn(btn, false, `${label[0]}  ${label}`);
      }
    });
  });
}

// ════════════════════════════════════════════
//   HANDLE OAUTH CALLBACK
//   Catches session after Google/Facebook redirect
//   Also ensures profile exists for social logins
// ════════════════════════════════════════════
async function handleOAuthCallback() {
  const sb = await getSB();
  if (!sb) return;

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('error') || urlParams.get('error_code')) {
    const errDesc = urlParams.get('error_description') || 'Authentication failed.';
    window.history.replaceState(null, '', window.location.pathname);
    setTimeout(() => window.showToast(errDesc.replace(/\+/g, ' '), 'error'), 300);
  }

  // Listen for auth state changes
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      // ── Always ensure profile on sign in ──
      const profile = await ensureProfile(sb, session.user);
      const user    = buildUser(session.user, profile);
      saveUser(user);

      // Redirect if on login/register page
      const page = window.location.pathname.split('/').pop();
      if (page === 'login.html' || page === 'register.html') {
        const dest = sessionStorage.getItem('gt-redirect-after-login') || 'index.html';
        sessionStorage.removeItem('gt-redirect-after-login');
        setTimeout(() => window.location.href = dest, 500);
      }
    }

    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('gt-user');
      localStorage.removeItem('gt-logged-in');
    }
  });

  // Check existing session on page load
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    const profile = await ensureProfile(sb, session.user);
    const user    = buildUser(session.user, profile);
    saveUser(user);
  }
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  handleOAuthCallback();
  initToggles();
  initStrength();
  initMatch();
  initRole();
  initLogin();
  initRegister();
  initSocial();
});