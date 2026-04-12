/* ============================================
   auth.js — Authentication Page Logic
============================================ */

// ─── Password Toggle ─────────────────────────
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.form-input-wrap');
      const input = wrap.querySelector('input');
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

  const bars = [
    document.getElementById('s1'),
    document.getElementById('s2'),
    document.getElementById('s3'),
    document.getElementById('s4'),
  ].filter(Boolean);

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
      if (i < score) {
        if (score === 1) bar.classList.add('weak');
        else if (score === 2) bar.classList.add('weak');
        else if (score === 3) bar.classList.add('medium');
        else bar.classList.add('strong');
      }
    });

    const labels = ['', 'Weak — add numbers & symbols', 'Fair — add uppercase & symbols', 'Good — add a special character', 'Strong password ✓'];
    if (strengthText) strengthText.textContent = val ? labels[score] : 'Use 8+ characters with a mix of letters, numbers & symbols';
  });
}

// ─── Password Match Validation ────────────────
function initPasswordMatch() {
  const pw = document.getElementById('password');
  const confirm = document.getElementById('confirmPassword');
  const error = document.getElementById('passwordMatchError');
  if (!pw || !confirm || !error) return;

  function check() {
    if (confirm.value && pw.value !== confirm.value) {
      confirm.closest('.form-group').classList.add('has-error');
    } else {
      confirm.closest('.form-group').classList.remove('has-error');
    }
  }

  confirm.addEventListener('input', check);
  pw.addEventListener('input', check);
}

// ─── Role Toggle ──────────────────────────────
function initRoleToggle() {
  const readerRadio = document.getElementById('roleReader');
  const authorRadio = document.getElementById('roleAuthor');
  const readerLabel = document.getElementById('roleReaderLabel');
  const authorLabel = document.getElementById('roleAuthorLabel');

  function updateLabels() {
    if (!readerLabel || !authorLabel) return;
    readerLabel.classList.toggle('active', readerRadio?.checked);
    authorLabel.classList.toggle('active', authorRadio?.checked);
  }

  readerLabel?.addEventListener('click', () => { if (readerRadio) readerRadio.checked = true; updateLabels(); });
  authorLabel?.addEventListener('click', () => { if (authorRadio) authorRadio.checked = true; updateLabels(); });
}

// ─── Login Form ───────────────────────────────
function initLoginForm() {
  const btn = document.getElementById('loginBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const identifier = document.getElementById('loginIdentifier')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!identifier) {
      window.showToast('Please enter your email or username.', 'error');
      return;
    }
    if (!password) {
      window.showToast('Please enter your password.', 'error');
      return;
    }

    btn.textContent = 'Signing in...';
    btn.disabled = true;

    // Simulate auth
    setTimeout(() => {
      window.showToast('Welcome back to the darkness! ✦');
      setTimeout(() => window.location.href = 'index.html', 800);
    }, 1200);
  });

  // Enter key support
  document.getElementById('loginPassword')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btn.click();
  });
}

// ─── Register Form ────────────────────────────
function initRegisterForm() {
  const btn = document.getElementById('registerBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const email = document.getElementById('email')?.value?.trim();
    const username = document.getElementById('username')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const confirm = document.getElementById('confirmPassword')?.value;
    const agreed = document.getElementById('agreeTerms')?.checked;

    if (!email || !email.includes('@')) {
      window.showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!username || username.length < 3) {
      window.showToast('Username must be at least 3 characters.', 'error');
      return;
    }
    if (!password || password.length < 8) {
      window.showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (password !== confirm) {
      window.showToast('Passwords do not match.', 'error');
      return;
    }
    if (!agreed) {
      window.showToast('Please agree to the Terms of Service.', 'error');
      return;
    }

    btn.textContent = 'Creating your account...';
    btn.disabled = true;

    // Simulate registration
    setTimeout(() => {
      window.showToast('Account created! Welcome to GrimTales ✦');
      setTimeout(() => window.location.href = 'index.html', 1000);
    }, 1400);
  });
}

// ─── Social Auth Buttons ─────────────────────
function initSocialAuth() {
  document.querySelectorAll('.social-auth-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.textContent.trim().includes('Google') ? 'Google' : 'Discord';
      window.showToast(`${provider} sign-in coming soon!`);
    });
  });
}

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
