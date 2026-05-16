/* ============================================
   reader.js — Chapter Reader Logic
============================================ */

// ─── Reading Progress Bar ─────────────────────
function initProgressBar() {
  const bar = document.getElementById('progressBar');
  const indicator = document.getElementById('progressIndicator');
  const percent = document.getElementById('readingPercent');

  if (!bar) return;

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;

    bar.style.width = progress + '%';
    if (indicator) indicator.style.height = progress + '%';
    if (percent) percent.textContent = Math.round(progress) + '%';

    // Save progress to localStorage
    const novelId = 'obsidian-court';
    const chapterId = 'ch-1';
    localStorage.setItem(`gt-progress-${novelId}-${chapterId}`, Math.round(progress));
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

// ─── Reader Settings ──────────────────────────
const READER_DEFAULTS = {
  fontSize: 18,
  lineHeight: 1.95,
  theme: 'dark',
  font: 'crimson',
};

const FONT_MAP = {
  crimson: "'Crimson Text', serif",
  garamond: "'EB Garamond', serif",
  georgia: "Georgia, serif",
  cinzel: "'Cinzel', serif",
};

function loadSettings() {
  const saved = JSON.parse(localStorage.getItem('gt-reader-settings') || '{}');
  return { ...READER_DEFAULTS, ...saved };
}

function saveSettings(settings) {
  localStorage.setItem('gt-reader-settings', JSON.stringify(settings));
}

function applyReaderSettings(settings) {
  const body = document.body;
  const chapterBody = document.getElementById('chapterBody');
  if (!chapterBody) return;

  chapterBody.style.fontSize = settings.fontSize + 'px';
  chapterBody.style.lineHeight = settings.lineHeight;
  chapterBody.style.fontFamily = FONT_MAP[settings.font] || FONT_MAP.crimson;

  // Update font size display
  const display = document.getElementById('fontSizeDisplay');
  if (display) display.textContent = settings.fontSize + 'px';

  // Update font option buttons
  document.querySelectorAll('.font-option').forEach(el => {
    el.classList.toggle('active', el.dataset.font === settings.font);
  });

  // Update theme swatches
  document.querySelectorAll('.theme-swatch').forEach(el => {
    el.classList.toggle('active', el.dataset.theme === settings.theme);
  });

  // Apply reader background theme
  const readerContent = document.getElementById('readerContent');
  if (readerContent) {
    if (settings.theme === 'sepia') {
      readerContent.style.background = '#1a1408';
      chapterBody.style.color = '#c8b896';
    } else if (settings.theme === 'light') {
      readerContent.style.background = '#f5f0e8';
      chapterBody.style.color = '#2e2418';
    } else {
      readerContent.style.background = '';
      chapterBody.style.color = '';
    }
  }

  // Update line height slider
  const slider = document.getElementById('lineHeightSlider');
  if (slider) slider.value = settings.lineHeight;
}

function initSettings() {
  const settings = loadSettings();
  applyReaderSettings(settings);

  const panel = document.getElementById('settingsPanel');
  const btn = document.getElementById('settingsBtn');

  if (btn && panel) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target !== btn) {
        panel.classList.remove('open');
      }
    });
  }

  // Font size controls
  const increase = document.getElementById('fontIncrease');
  const decrease = document.getElementById('fontDecrease');

  if (increase) {
    increase.addEventListener('click', () => {
      const s = loadSettings();
      if (s.fontSize < 28) { s.fontSize += 1; saveSettings(s); applyReaderSettings(s); }
    });
  }

  if (decrease) {
    decrease.addEventListener('click', () => {
      const s = loadSettings();
      if (s.fontSize > 14) { s.fontSize -= 1; saveSettings(s); applyReaderSettings(s); }
    });
  }

  // Font family
  document.querySelectorAll('.font-option').forEach(el => {
    el.addEventListener('click', () => {
      const s = loadSettings();
      s.font = el.dataset.font;
      saveSettings(s);
      applyReaderSettings(s);
    });
  });

  // Theme swatches
  document.querySelectorAll('.theme-swatch').forEach(el => {
    el.addEventListener('click', () => {
      const s = loadSettings();
      s.theme = el.dataset.theme;
      saveSettings(s);
      applyReaderSettings(s);
    });
  });

  // Line height slider
  const slider = document.getElementById('lineHeightSlider');
  if (slider) {
    slider.addEventListener('input', () => {
      const s = loadSettings();
      s.lineHeight = parseFloat(slider.value);
      saveSettings(s);
      applyReaderSettings(s);
    });
  }
}

// ─── Bookmark Button ─────────────────────────
function initBookmark() {
  const btn = document.getElementById('bookmarkBtn');
  if (!btn) return;

  const key = 'gt-bookmark-obsidian-ch1';
  const isBookmarked = localStorage.getItem(key);
  if (isBookmarked) btn.textContent = '🔖 Bookmarked';

  btn.addEventListener('click', () => {
    const now = localStorage.getItem(key);
    if (now) {
      localStorage.removeItem(key);
      btn.textContent = '🔖 Bookmark';
      window.showToast('Bookmark removed.');
    } else {
      localStorage.setItem(key, Date.now());
      btn.textContent = '🔖 Bookmarked';
      window.showToast('Chapter bookmarked! ✦');
    }
  });
}

// ─── Chapter Navigation ───────────────────────
function initChapterNav() {
  const next = document.getElementById('nextChapter');
  const nextBottom = document.getElementById('nextChapterBottom');
  const prev = document.getElementById('prevChapter');
  const prevBottom = document.getElementById('prevChapterBottom');

  const goNext = () => {
    window.showToast('Next chapter loading...');
    setTimeout(() => window.location.reload(), 800);
  };

  const goPrev = () => {
    window.showToast('No previous chapter.', 'error');
  };

  [next, nextBottom].forEach(el => el && el.addEventListener('click', goNext));
  [prev, prevBottom].forEach(el => el && el.addEventListener('click', goPrev));
}

// ─── Keyboard Shortcuts ───────────────────────
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowRight' || e.key === 'l') {
      document.getElementById('nextChapterBottom')?.click();
    }
    if (e.key === 'ArrowLeft' || e.key === 'h') {
      document.getElementById('prevChapterBottom')?.click();
    }
    if (e.key === 's' || e.key === 'S') {
      document.getElementById('settingsBtn')?.click();
    }
    if (e.key === 'b' || e.key === 'B') {
      document.getElementById('bookmarkBtn')?.click();
    }
  });
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initProgressBar();
  initSettings();
  initBookmark();
  initChapterNav();
  initKeyboardShortcuts();
});
