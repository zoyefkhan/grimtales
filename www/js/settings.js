/* ============================================
   settings.js — Settings Page Logic
============================================ */

// ─── Cloudinary config ────────────────────────
// Replace with your Cloudinary cloud name
const CLOUDINARY_CLOUD = 'YOUR_CLOUDINARY_CLOUD_NAME';
const CLOUDINARY_PRESET = 'grimtales_avatars'; // unsigned upload preset

// ─── Panel Switching ─────────────────────────
function initSettingsNav() {
  const panels = {
    profile:'profilePanel', account:'accountPanel',
    notifications:'notificationsPanel', reading:'readingPanel',
    privacy:'privacyPanel', danger:'dangerPanel',
  };
  document.querySelectorAll('.settings-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.settings-nav-link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
      link.classList.add('active');
      document.getElementById(panels[link.dataset.panel])?.classList.add('active');
    });
  });
  const hash = window.location.hash.replace('#','');
  if (hash && panels[hash]) document.querySelector(`[data-panel="${hash}"]`)?.click();
}

// ─── Load current user data into form ─────────
function loadUserData() {
  const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
  if (!user.username) return;

  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  set('profileUsername', user.username);
  set('profileDisplayName', user.displayName || user.username);
  set('profileBio', user.bio || '');
  set('profileLocation', user.location || '');
  set('profileWebsite', user.website || '');
  set('accountEmail', user.email || '');

  // Show avatar
  if (user.avatar) {
    const img = document.getElementById('currentAvatarImg');
    if (img) { img.src = user.avatar; img.style.display = 'block'; }
    const placeholder = document.getElementById('avatarPlaceholder');
    if (placeholder) placeholder.style.display = 'none';
  }

  // Show role
  const roleEl = document.getElementById('currentRole');
  if (roleEl) roleEl.textContent = user.role === 'author' ? '✦ Author' : '✦ Reader';
}

// ─── Avatar Upload ────────────────────────────
function initAvatarUpload() {
  const uploadBtn  = document.getElementById('uploadAvatarBtn');
  const removeBtn  = document.getElementById('removeAvatarBtn');
  const fileInput  = document.getElementById('avatarFileInput');

  if (!uploadBtn || !fileInput) return;

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    // Validate file
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      window.showToast('Only JPG, PNG or WEBP images allowed.', 'error'); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      window.showToast('Image must be under 2MB.', 'error'); return;
    }

    uploadBtn.textContent = 'Uploading...';
    uploadBtn.disabled = true;

    try {
      let avatarUrl = '';

      if (CLOUDINARY_CLOUD !== 'YOUR_CLOUDINARY_CLOUD_NAME') {
        // ── Real Cloudinary upload ──
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_PRESET);
        formData.append('folder', 'grimtales/avatars');

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        avatarUrl = data.secure_url;

      } else {
        // ── Fallback: base64 local preview ──
        avatarUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        window.showToast('Preview only — add Cloudinary keys for permanent storage.');
      }

      // Update avatar in UI
      const img = document.getElementById('currentAvatarImg');
      if (img) { img.src = avatarUrl; img.style.display = 'block'; }
      const placeholder = document.getElementById('avatarPlaceholder');
      if (placeholder) placeholder.style.display = 'none';

      // Save to localStorage
      const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
      user.avatar = avatarUrl;
      localStorage.setItem('gt-user', JSON.stringify(user));

      // Save to Supabase if connected
      try {
        if (window._sbClient) {
          await window._sbClient.auth.updateUser({ data: { avatar_url: avatarUrl } });
        }
      } catch(e) { /* silent */ }

      window.showToast('Profile photo updated! ✦');

    } catch (err) {
      console.error('Upload error:', err);
      window.showToast('Upload failed: ' + err.message, 'error');
    } finally {
      uploadBtn.textContent = 'Upload Photo';
      uploadBtn.disabled = false;
      fileInput.value = '';
    }
  });

  removeBtn?.addEventListener('click', () => {
    const img = document.getElementById('currentAvatarImg');
    if (img) { img.src = ''; img.style.display = 'none'; }
    const placeholder = document.getElementById('avatarPlaceholder');
    if (placeholder) placeholder.style.display = 'flex';
    const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
    user.avatar = '';
    localStorage.setItem('gt-user', JSON.stringify(user));
    window.showToast('Avatar removed.');
  });
}

// ─── Save Profile ─────────────────────────────
function initSaveProfile() {
  const btn = document.getElementById('saveProfile');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const updates = {
      username:    document.getElementById('profileUsername')?.value?.trim(),
      displayName: document.getElementById('profileDisplayName')?.value?.trim(),
      bio:         document.getElementById('profileBio')?.value?.trim(),
      location:    document.getElementById('profileLocation')?.value?.trim(),
      website:     document.getElementById('profileWebsite')?.value?.trim(),
    };
    if (!updates.username || updates.username.length < 3) {
      window.showToast('Username must be at least 3 characters.', 'error'); return;
    }
    btn.textContent = 'Saving...'; btn.disabled = true;
    try {
      const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
      Object.assign(user, updates);
      localStorage.setItem('gt-user', JSON.stringify(user));
      if (window._sbClient) {
        await window._sbClient.auth.updateUser({ data: updates });
      }
      window.showToast('Profile saved! ✦');
    } catch(e) {
      window.showToast('Save failed. Try again.', 'error');
    } finally {
      btn.textContent = 'Save Profile'; btn.disabled = false;
    }
  });
}

// ─── Change Password ──────────────────────────
function initChangePassword() {
  document.querySelector('[onclick*="Password updated"]')?.removeAttribute('onclick');
  const btn = document.getElementById('changePasswordBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const current = document.getElementById('currentPassword')?.value;
    const newPw   = document.getElementById('newPassword')?.value;
    const confirm = document.getElementById('confirmNewPassword')?.value;
    if (!current) { window.showToast('Enter your current password.', 'error'); return; }
    if (!newPw || newPw.length < 8) { window.showToast('New password must be 8+ characters.', 'error'); return; }
    if (newPw !== confirm) { window.showToast('Passwords do not match.', 'error'); return; }
    btn.textContent = 'Updating...'; btn.disabled = true;
    try {
      if (window._sbClient) {
        const { error } = await window._sbClient.auth.updateUser({ password: newPw });
        if (error) throw error;
      }
      window.showToast('Password updated successfully! ✦');
      ['currentPassword','newPassword','confirmNewPassword'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
    } catch(e) {
      window.showToast('Failed: ' + e.message, 'error');
    } finally {
      btn.textContent = 'Update Password'; btn.disabled = false;
    }
  });
}

// ─── Genre toggles ────────────────────────────
function initGenreToggles() {
  document.querySelectorAll('#genreToggles .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('active'));
  });
}

// ─── Upgrade to Author ────────────────────────
function initUpgradeRole() {
  const user = JSON.parse(localStorage.getItem('gt-user') || '{}');
  const roleEl = document.getElementById('currentRole');
  if (roleEl) roleEl.textContent = user.role === 'author' ? '✦ Author' : '✦ Reader';

  const upgradeSection = document.getElementById('upgradeToAuthor');
  if (upgradeSection) {
    upgradeSection.style.display = user.role === 'author' ? 'none' : 'block';
  }

  const upgradeBtn = document.getElementById('upgradeRoleBtn');
  if (!upgradeBtn) return;
  upgradeBtn.addEventListener('click', async () => {
    upgradeBtn.textContent = 'Upgrading...'; upgradeBtn.disabled = true;
    const u = JSON.parse(localStorage.getItem('gt-user') || '{}');
    u.role = 'author';
    localStorage.setItem('gt-user', JSON.stringify(u));
    try {
      if (window._sbClient) await window._sbClient.auth.updateUser({ data: { role: 'author' } });
    } catch(e) { /* silent */ }
    window.showToast('Account upgraded to Author! ✦ You can now write and publish novels.');
    if (roleEl) roleEl.textContent = '✦ Author';
    if (upgradeSection) upgradeSection.style.display = 'none';
    upgradeBtn.textContent = '✓ Upgraded'; 
  });
}

// ─── Sign out ─────────────────────────────────
function initSignOut() {
  document.querySelectorAll('[data-signout]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (window._sbClient) await window._sbClient.auth.signOut().catch(() => {});
      localStorage.removeItem('gt-user');
      localStorage.removeItem('gt-logged-in');
      window.showToast('Signed out. See you in the dark. 🌑');
      setTimeout(() => window.location.href = 'index.html', 700);
    });
  });
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSettingsNav();
  loadUserData();
  initAvatarUpload();
  initSaveProfile();
  initChangePassword();
  initGenreToggles();
  initUpgradeRole();
  initSignOut();
});