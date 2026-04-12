/* ============================================
   settings.js — Settings Page Logic
============================================ */

// ─── Panel Switching ─────────────────────────
function initSettingsNav() {
  const panels = {
    profile: 'profilePanel', account: 'accountPanel',
    notifications: 'notificationsPanel', reading: 'readingPanel',
    privacy: 'privacyPanel', danger: 'dangerPanel',
  };

  document.querySelectorAll('.settings-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.settings-nav-link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
      link.classList.add('active');
      const panel = document.getElementById(panels[link.dataset.panel]);
      if (panel) panel.classList.add('active');
    });
  });

  // Handle URL hash
  const hash = window.location.hash.replace('#', '');
  if (hash && panels[hash]) {
    const link = document.querySelector(`[data-panel="${hash}"]`);
    link?.click();
  }
}

// ─── Genre Toggles ────────────────────────────
function initGenreToggles() {
  document.querySelectorAll('#genreToggles .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('active'));
  });
}

// ─── Save Profile ─────────────────────────────
function initSaveProfile() {
  const saveBtn = document.getElementById('saveProfile');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', () => {
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    setTimeout(() => {
      window.showToast('Profile updated successfully! ✦');
      saveBtn.textContent = 'Save Profile';
      saveBtn.disabled = false;
    }, 900);
  });
}

// ─── Toggle switches feedback ─────────────────
function initToggles() {
  document.querySelectorAll('.toggle-switch input[type="checkbox"]').forEach(toggle => {
    toggle.addEventListener('change', () => {
      // Silent save — no toast for every toggle, just confirmation on save
    });
  });
}

// ─── Avatar Upload ────────────────────────────
function initAvatarUpload() {
  // Handled inline in HTML onclick for simplicity
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSettingsNav();
  initGenreToggles();
  initSaveProfile();
  initToggles();
});
