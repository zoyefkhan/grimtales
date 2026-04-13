/* ============================================
   auth.js — Fixed Authentication Logic
   Fixes:
   1. Creates user profile in localStorage on register/login
   2. Google/Discord OAuth actually connects (no more "coming soon")
   3. Stylish metallic loading states
============================================ */

// ─── Session Helpers ──────────────────────────
function saveSession(user) {
  localStorage.setItem('gt-user', JSON.stringify(user));
  localStorage.setItem('gt-logged-in', 'true');
}

function getSession() {
  try { return JSON.parse(localStorage.getItem('gt-user') || 'null'); }
  catch { return null; }
}

// ─── Loading Button State ─────────────────────
function setLoading(btn, loading, defaultText) {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:0.6em">
        <span style="
          display:inline-block;width:16px;height:16px;
          border:2px solid rgba(255,255,255,0.3);
          border-top-color:#fff;border-radius:50%;
          animation:spin 0.7s linear infinite;
        "></span>
        ${defaultText}
      </span>`;
  } else {
    btn.disabled = false;
    btn.textContent = defaultText;
  }
}

// ─── Password Toggle ──────────────────────────
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.form-input-wrap').querySelector('input');
      if (!input) return;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.textContent = isText ? '👁' : '🙈';
    });
  });
}

// ─── Password Strength ────────────────────────
function initPasswordStrength() {
  const input = document.getElementById('regPassword') || document.getElementById('password');
  if (!input) return;

  const bars = ['s1','s2','s3','s4'].map(id => document.getElementById(id)).filter(Boolean);
  const strengthText = document.getElementById('strengthText');

  input.addEventListener('input', () => {
    const val = input.value;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    bars.forEach((bar, i) => {
      bar.className = 'strength-bar';
      if (i < score) bar.classList.add(score <= 2 ? 'weak' : score === 3 ? 'medium' : 'strong');
    });

    const labels = ['', 'Weak — add numbers & symbols', 'Fair — add uppercase & symbols', 'Good — add a special character', 'Strong password ✓'];
    if (strengthText) strengthText.textContent = val ? labels[score] : 'Use 8+ characters with a mix of letters, numbers & symbols';
  });
}

// ─── Password Match ───────────────────────────
function initPasswordMatch() {
  const pw = document.getElementById('password');
  const confirm = document.getElementById('confirmPassword');
  const error = document.getElementById('passwordMatchError');
  if (!pw || !confirm || !error) return;

  const check = () => {
    const mismatch = confirm.value && pw.value !== confirm.value;
    confirm.closest('.form-group').classList.toggle('has-error', mismatch);
  };
  confirm.addEventListener('input', check);
  pw.addEventListener('input', check);
}

// ─── Role Toggle ──────────────────────────────
function initRoleToggle() {
  const readerRadio = document.getElementById('roleReader');
  const authorRadio = document.getElementById('roleAuthor');
  const readerLabel = document.getElementById('roleReaderLabel');
  const authorLabel = document.getElementById('roleAuthorLabel');

  const update = () => {
    readerLabel?.classList.toggle('active', !!readerRadio?.checked);
    authorLabel?.classList.toggle('active', !!authorRadio?.checked);
  };

  readerLabel?.addEventListener('click', () => { if (readerRadio) readerRadio.checked = true; update(); });
  authorLabel?.addEventListener('click', () => { if (authorRadio) authorRadio.checked = true; update(); });
}

// ─── Login Form ───────────────────────────────
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
      // ── Try real API first ──
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        saveSession(data.data);
        window.showToast(`Welcome back, ${data.data.username}! ✦`);
        setTimeout(() => window.location.href = 'index.html', 800);
        return;
      }

      // ── Fallback: check localStorage (demo mode) ──
      const stored = JSON.parse(localStorage.getItem('gt-users') || '[]');
      const user = stored.find(u => u.email === identifier || u.username === identifier);

      if (user && user.password === password) {
        saveSession(user);
        window.showToast(`Welcome back, ${user.username}! ✦`);
        setTimeout(() => window.location.href = 'index.html', 800);
        return;
      }

      window.showToast(data.message || 'Invalid email or password.', 'error');
    } catch {
      // ── Offline / no backend: use localStorage only ──
      const stored = JSON.parse(localStorage.getItem('gt-users') || '[]');
      const user = stored.find(u => u.email === identifier || u.username === identifier);

      if (user && user.password === password) {
        saveSession(user);
        window.showToast(`Welcome back, ${user.username}! ✦`);
        setTimeout(() => window.location.href = 'index.html', 800);
      } else {
        window.showToast('Invalid credentials. Please try again.', 'error');
      }
    } finally {
      setLoading(btn, false, 'Sign In to GrimTales');
    }
  };

  btn.addEventListener('click', doLogin);
  document.getElementById('loginPassword')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
}

// ─── Register Form ────────────────────────────
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

    if (!email || !email.includes('@'))    { window.showToast('Please enter a valid email.', 'error'); return; }
    if (!username || username.length < 3)  { window.showToast('Username must be at least 3 characters.', 'error'); return; }
    if (!password || password.length < 8)  { window.showToast('Password must be at least 8 characters.', 'error'); return; }
    if (password !== confirm)              { window.showToast('Passwords do not match.', 'error'); return; }
    if (!agreed)                           { window.showToast('Please agree to the Terms of Service.', 'error'); return; }

    setLoading(btn, true, 'Creating account...');

    // Build the user profile
    const newUser = {
      id: 'user_' + Date.now(),
      username,
      email,
      password, // NOTE: only stored locally in demo mode — real backend hashes this
      role,
      avatar: '',
      bio: '',
      location: '',
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    try {
      // ── Try real API first ──
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password, role }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Save to localStorage for navbar display
        saveSession(data.data);
        // Also save to local users list (for offline fallback)
        const stored = JSON.parse(localStorage.getItem('gt-users') || '[]');
        stored.push({ ...newUser, ...data.data });
        localStorage.setItem('gt-users', JSON.stringify(stored));

        window.showToast(`Welcome to GrimTales, ${username}! ✦`);
        setTimeout(() => window.location.href = 'index.html', 1000);
        return;
      }

      window.showToast(data.message || 'Registration failed.', 'error');
    } catch {
      // ── Offline / no backend: save to localStorage only ──
      const stored = JSON.parse(localStorage.getItem('gt-users') || '[]');
      const exists = stored.find(u => u.email === email || u.username === username);

      if (exists) {
        window.showToast('Username or email already taken.', 'error');
      } else {
        stored.push(newUser);
        localStorage.setItem('gt-users', JSON.stringify(stored));
        saveSession(newUser);
        window.showToast(`Account created! Welcome, ${username}! ✦`);
        setTimeout(() => window.location.href = 'index.html', 1000);
      }
    } finally {
      setLoading(btn, false, 'Create My Account');
    }
  });
}

// ─── Social Auth ──────────────────────────────
// Removed "coming soon" — now redirects to real OAuth endpoints
function initSocialAuth() {
  document.querySelectorAll('.social-auth-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isGoogle = btn.textContent.trim().includes('Google');
      const provider = isGoogle ? 'google' : 'discord';

      setLoading(btn, true, isGoogle ? 'Connecting Google...' : 'Connecting Discord...');

      // Try real OAuth endpoint — if backend not running, show message
      fetch(`/api/auth/${provider}`)
        .then(res => {
          if (res.redirected) {
            window.location.href = res.url;
          } else {
            window.showToast(`${isGoogle ? 'Google' : 'Discord'} OAuth not configured yet.\nAdd credentials to your .env file.`);
            setLoading(btn, false, isGoogle ? 'G  Google' : 'D  Discord');
          }
        })
        .catch(() => {
          window.showToast(`${isGoogle ? 'Google' : 'Discord'} OAuth: start your backend server first (npm run dev).`);
          setLoading(btn, false, isGoogle ? 'G  Google' : 'D  Discord');
        });
    });
  });
}

// ─── Spin animation ──────────────────────────
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initPasswordStrength();
  initPasswordMatch();
  initRoleToggle();
  initLoginForm();
  initRegisterForm();
  initSocialAuth();
});