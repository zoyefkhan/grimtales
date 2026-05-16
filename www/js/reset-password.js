/* ============================================
   reset-password.js — Reset Password Page
============================================ */

// ─── Check Token from URL ─────────────────────
function getToken() {
  return new URLSearchParams(window.location.search).get('token');
}

function initTokenCheck() {
  const token = getToken();
  if (!token) {
    document.getElementById('resetFormState').style.display = 'none';
    document.getElementById('invalidTokenState').style.display = 'block';
    return false;
  }
  return true;
}

// ─── Password Strength ────────────────────────
function initPasswordStrength() {
  const input = document.getElementById('newPassword');
  if (!input) return;

  const bars = ['r1','r2','r3','r4'].map(id => document.getElementById(id));
  const text = document.getElementById('resetStrengthText');

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
        bar.classList.add(score <= 2 ? 'weak' : score === 3 ? 'medium' : 'strong');
      }
    });

    const labels = ['', 'Weak', 'Fair — add more variety', 'Good — almost there', 'Strong password ✓'];
    if (text) text.textContent = val ? labels[score] || '' : 'Use 8+ characters with letters, numbers & symbols';
  });
}

// ─── Password Toggle ──────────────────────────
function initToggles() {
  [['toggleNew','newPassword'], ['toggleConfirm','confirmNewPassword']].forEach(([btnId, inputId]) => {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.textContent = isText ? '👁' : '🙈';
    });
  });
}

// ─── Password Match ───────────────────────────
function initMatchCheck() {
  const pw = document.getElementById('newPassword');
  const confirm = document.getElementById('confirmNewPassword');
  const error = document.getElementById('resetMatchError');
  if (!pw || !confirm || !error) return;

  const check = () => {
    const mismatch = confirm.value && pw.value !== confirm.value;
    confirm.closest('.form-group').classList.toggle('has-error', mismatch);
  };

  pw.addEventListener('input', check);
  confirm.addEventListener('input', check);
}

// ─── Submit ───────────────────────────────────
function initSubmit() {
  const btn = document.getElementById('resetBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const pw = document.getElementById('newPassword')?.value;
    const confirm = document.getElementById('confirmNewPassword')?.value;

    if (!pw || pw.length < 8) {
      window.showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (pw !== confirm) {
      window.showToast('Passwords do not match.', 'error');
      return;
    }

    btn.textContent = 'Updating...';
    btn.disabled = true;

    // In production: POST /api/auth/reset-password/:token with { password: pw }
    setTimeout(() => {
      document.getElementById('resetForm').style.display = 'none';
      document.getElementById('resetSuccessState').style.display = 'block';
    }, 1200);
  });
}

// ─── Request New Link ─────────────────────────
function initRequestNew() {
  const btn = document.getElementById('requestNewLink');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.location.href = 'login.html';
  });
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const valid = initTokenCheck();
  if (valid) {
    initPasswordStrength();
    initToggles();
    initMatchCheck();
    initSubmit();
  }
  initRequestNew();
});
