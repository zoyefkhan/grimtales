/* ============================================
   verify-email.js — Email Verification Page
============================================ */

function getToken() {
  return new URLSearchParams(window.location.search).get('token');
}

function showState(id) {
  ['verifyingState','successState','errorState'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? 'block' : 'none';
  });
}

async function verifyToken(token) {
  // In production: GET /api/auth/verify-email/:token
  // Simulating network delay + success
  return new Promise(resolve => setTimeout(() => resolve({ success: true }), 1800));
}

function initResend() {
  const btn = document.getElementById('resendBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const email = document.getElementById('resendEmail')?.value?.trim();
    if (!email || !email.includes('@')) {
      window.showToast('Please enter a valid email address.', 'error');
      return;
    }
    btn.textContent = 'Sending...';
    btn.disabled = true;

    // In production: POST /api/auth/resend-verification with { email }
    setTimeout(() => {
      window.showToast('Verification email sent! Check your inbox.');
      btn.textContent = 'Resend Verification Email';
      btn.disabled = false;
    }, 1200);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();

  if (!token) {
    showState('errorState');
    initResend();
    return;
  }

  showState('verifyingState');

  try {
    const result = await verifyToken(token);
    if (result.success) {
      showState('successState');
    } else {
      showState('errorState');
      initResend();
    }
  } catch {
    showState('errorState');
    initResend();
  }
});
