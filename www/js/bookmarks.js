/* ============================================
   bookmarks.js — Centralised Bookmark Logic
   Handles saving/loading reading positions
   across all pages
============================================ */

const BOOKMARKS_KEY = 'gt-bookmarks';
const PROGRESS_KEY  = 'gt-progress';

// ─── Load all bookmarks ───────────────────────
function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '{}');
  } catch {
    return {};
  }
}

// ─── Save all bookmarks ───────────────────────
function saveBookmarks(data) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(data));
}

// ─── Bookmark a chapter ───────────────────────
function bookmarkChapter(novelId, chapterId, chapterTitle, novelTitle) {
  const bookmarks = getBookmarks();
  const key = `${novelId}-${chapterId}`;

  if (bookmarks[key]) {
    delete bookmarks[key];
    saveBookmarks(bookmarks);
    window.showToast('Bookmark removed.');
    return false;
  }

  bookmarks[key] = {
    novelId,
    chapterId,
    chapterTitle,
    novelTitle,
    savedAt: Date.now(),
    scrollPosition: window.scrollY,
  };

  saveBookmarks(bookmarks);
  window.showToast('Chapter bookmarked! ✦');
  return true;
}

// ─── Check if bookmarked ──────────────────────
function isBookmarked(novelId, chapterId) {
  const bookmarks = getBookmarks();
  return !!bookmarks[`${novelId}-${chapterId}`];
}

// ─── Get all bookmarks as array ───────────────
function getAllBookmarks() {
  const bookmarks = getBookmarks();
  return Object.values(bookmarks).sort((a, b) => b.savedAt - a.savedAt);
}

// ─── Save reading progress ────────────────────
function saveProgress(novelId, chapterId, percent) {
  try {
    const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    progress[`${novelId}-${chapterId}`] = {
      percent: Math.round(percent),
      novelId,
      chapterId,
      updatedAt: Date.now(),
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch { /* silent */ }
}

// ─── Load reading progress ────────────────────
function getProgress(novelId, chapterId) {
  try {
    const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    return progress[`${novelId}-${chapterId}`]?.percent || 0;
  } catch {
    return 0;
  }
}

// ─── Get last read chapter for a novel ────────
function getLastRead(novelId) {
  try {
    const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    const entries = Object.values(progress)
      .filter(p => p.novelId === novelId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return entries[0] || null;
  } catch {
    return null;
  }
}

// ─── Clear all data ───────────────────────────
function clearAllBookmarks() {
  localStorage.removeItem(BOOKMARKS_KEY);
  localStorage.removeItem(PROGRESS_KEY);
}

// ─── Auto-save progress on scroll (reader) ────
function initAutoProgressSave(novelId, chapterId) {
  if (!novelId || !chapterId) return;

  let saveTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      saveProgress(novelId, chapterId, percent);
    }, 500);
  }, { passive: true });
}

// ─── Restore scroll position ──────────────────
function restoreScrollPosition(novelId, chapterId) {
  const progress = getProgress(novelId, chapterId);
  if (progress > 0 && progress < 95) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = (progress / 100) * docHeight;

    setTimeout(() => {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
      window.showToast(`Restored to ${Math.round(progress)}% ✦`);
    }, 600);
  }
}

// ─── Export for use in other scripts ──────────
window.GT_Bookmarks = {
  bookmark: bookmarkChapter,
  isBookmarked,
  getAll: getAllBookmarks,
  saveProgress,
  getProgress,
  getLastRead,
  clear: clearAllBookmarks,
  initAutoSave: initAutoProgressSave,
  restore: restoreScrollPosition,
};
