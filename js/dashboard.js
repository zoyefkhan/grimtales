/* ============================================
   dashboard.js — Author Dashboard Logic
============================================ */

// ─── Mock Data ───────────────────────────────
const MY_NOVELS = [
  { id: 1, title: 'The Obsidian Court', chapters: 284, status: 'ongoing', views: '1.2M', rating: 4.8, color: ['#1a0808','#2d1010'] },
  { id: 2, title: 'Blood of Pale Kings', chapters: 512, status: 'completed', views: '3.8M', rating: 4.9, color: ['#1a1508','#2a2010'] },
  { id: 3, title: 'The Iron Séance', chapters: 22, status: 'draft', views: '—', rating: null, color: ['#0d0d0d','#1a1a1a'] },
];

const ACTIVITY_FEED = [
  { icon: '💬', type: 'comment', text: '<strong>ShadowReader92</strong> commented on <a href="#">Chapter 284</a>: "This plot twist destroyed me..."', time: '2m ago' },
  { icon: '⭐', type: 'rating', text: '<strong>ElenaVance</strong> rated <a href="#">The Obsidian Court</a> 5 stars', time: '18m ago' },
  { icon: '❤️', type: 'follow', text: '<strong>NocturnalistX</strong> started following you', time: '45m ago' },
  { icon: '👁️', type: 'view', text: '<a href="#">Chapter 284</a> reached <strong>10,000 views</strong>', time: '2h ago' },
  { icon: '💬', type: 'comment', text: '<strong>DarkFantasyFan</strong> commented on <a href="#">Chapter 283</a>: "The court scene was brilliant"', time: '3h ago' },
  { icon: '❤️', type: 'follow', text: '<strong>TormentedPages</strong> added <a href="#">The Obsidian Court</a> to their library', time: '4h ago' },
  { icon: '⭐', type: 'rating', text: '<strong>Nocturnalist</strong> rated <a href="#">Blood of Pale Kings</a> 5 stars', time: '6h ago' },
];

// ─── Render Novel Management List ────────────
function initNovelManageList() {
  const container = document.getElementById('novelManageList');
  if (!container) return;

  container.innerHTML = MY_NOVELS.map(novel => {
    const statusClass = { ongoing: 'status-ongoing', completed: 'status-completed', draft: 'status-draft', hiatus: 'status-hiatus' }[novel.status] || 'status-draft';
    const statusLabel = { ongoing: 'Ongoing', completed: 'Completed', draft: 'Draft', hiatus: 'Hiatus' }[novel.status] || 'Draft';

    return `
      <div class="novel-manage-item">
        <div class="novel-manage-cover">
          <div style="width:100%;height:100%;background:linear-gradient(135deg,${novel.color[0]},${novel.color[1]});display:flex;align-items:center;justify-content:center;padding:0.3rem">
            <span style="font-family:var(--font-heading);font-size:0.5rem;color:var(--white);text-align:center;line-height:1.2">${novel.title}</span>
          </div>
        </div>
        <div>
          <div class="novel-manage-title">${novel.title}</div>
          <div class="novel-manage-meta">
            <span class="novel-status ${statusClass}">${statusLabel}</span>
            <span>${novel.chapters} chapters</span>
            <span>${novel.views} views</span>
            ${novel.rating ? `<span style="color:var(--gold)">★ ${novel.rating}</span>` : ''}
          </div>
        </div>
        <div class="novel-manage-actions">
          <button class="manage-btn" title="Write Chapter" onclick="openEditor()">✍</button>
          <button class="manage-btn" title="Edit Novel" onclick="window.showToast('Edit novel coming soon.')">✏</button>
          <button class="manage-btn" title="Stats" onclick="window.showToast('Analytics coming soon.')">📊</button>
          <button class="manage-btn delete" title="Delete" onclick="window.showToast('Are you sure? This cannot be undone.', 'error')">🗑</button>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Render Activity Feed ─────────────────────
function initActivityFeed() {
  const container = document.getElementById('activityFeed');
  if (!container) return;

  container.innerHTML = ACTIVITY_FEED.map(item => `
    <div class="activity-item">
      <div class="activity-icon ${item.type}">${item.icon}</div>
      <div class="activity-text">${item.text}</div>
      <div class="activity-time">${item.time}</div>
    </div>
  `).join('');
}

// ─── Panel Switching ─────────────────────────
function showPanel(panelId) {
  ['overviewPanel', 'editorPanel', 'newNovelPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === panelId ? 'block' : 'none';
  });
}

function openEditor() {
  showPanel('editorPanel');
}

function openNewNovel() {
  showPanel('newNovelPanel');
}

window.openEditor = openEditor;

function initPanelSwitching() {
  // Nav links
  document.getElementById('writeChapterLink')?.addEventListener('click', (e) => { e.preventDefault(); openEditor(); });
  document.getElementById('newNovelLink')?.addEventListener('click', (e) => { e.preventDefault(); openNewNovel(); });
  document.getElementById('myNovelsLink')?.addEventListener('click', (e) => { e.preventDefault(); showPanel('overviewPanel'); });

  // Header buttons
  document.getElementById('dashWriteChapter')?.addEventListener('click', openEditor);
  document.getElementById('dashNewNovel')?.addEventListener('click', openNewNovel);

  // Back buttons
  document.getElementById('backToDash')?.addEventListener('click', () => showPanel('overviewPanel'));
  document.getElementById('backToDash2')?.addEventListener('click', () => showPanel('overviewPanel'));
}

// ─── Chapter Editor ───────────────────────────
function initChapterEditor() {
  const area = document.getElementById('editorArea');
  if (!area) return;

  const wordCount = document.getElementById('wordCount');
  const charCount = document.getElementById('charCount');
  const readTime = document.getElementById('readTime');

  function updateCounts() {
    const text = area.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const mins = Math.ceil(words / 250);

    if (wordCount) wordCount.textContent = words.toLocaleString();
    if (charCount) charCount.textContent = chars.toLocaleString();
    if (readTime) readTime.textContent = mins;
  }

  area.addEventListener('input', updateCounts);
  updateCounts();

  // Auto-save draft every 30 seconds
  let autoSaveTimer;
  area.addEventListener('input', () => {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      const title = document.getElementById('chapterTitleInput')?.value || 'Untitled';
      localStorage.setItem('gt-draft', JSON.stringify({ title, content: area.value, savedAt: new Date().toISOString() }));
      window.showToast('Draft auto-saved ✦');
    }, 30000);
  });

  // Restore draft
  const draft = JSON.parse(localStorage.getItem('gt-draft') || 'null');
  if (draft && draft.content) {
    const titleInput = document.getElementById('chapterTitleInput');
    if (titleInput && !titleInput.value) titleInput.value = draft.title || '';
    if (!area.value) {
      area.value = draft.content;
      updateCounts();
    }
  }

  // Toolbar buttons
  document.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.title === 'Scene Break') {
        const pos = area.selectionStart;
        const before = area.value.substring(0, pos);
        const after = area.value.substring(area.selectionEnd);
        area.value = before + '\n\n— ✦ —\n\n' + after;
        area.selectionStart = area.selectionEnd = pos + 10;
        updateCounts();
        return;
      }
      btn.classList.toggle('active');
    });
  });

  // Save draft manually
  document.getElementById('saveDraft')?.addEventListener('click', () => {
    const title = document.getElementById('chapterTitleInput')?.value || 'Untitled';
    localStorage.setItem('gt-draft', JSON.stringify({ title, content: area.value, savedAt: new Date().toISOString() }));
    window.showToast('Draft saved successfully!');
  });

  // Publish
  document.getElementById('publishChapter')?.addEventListener('click', () => {
    const title = document.getElementById('chapterTitleInput')?.value?.trim();
    if (!title) { window.showToast('Please add a chapter title.', 'error'); return; }
    if (!area.value.trim() || area.value.trim().length < 100) { window.showToast('Chapter is too short to publish.', 'error'); return; }
    window.showToast('Chapter published successfully! ✦');
    setTimeout(() => showPanel('overviewPanel'), 1200);
  });

  // Preview
  document.getElementById('previewChapter')?.addEventListener('click', () => {
    window.showToast('Preview mode coming soon.');
  });
}

// ─── Cover Upload Hover ───────────────────────
function initCoverUpload() {
  const upload = document.getElementById('coverUpload');
  if (!upload) return;

  upload.addEventListener('mouseenter', () => {
    upload.style.borderColor = 'var(--crimson)';
    upload.style.background = 'rgba(139,26,26,0.04)';
  });

  upload.addEventListener('mouseleave', () => {
    upload.style.borderColor = '';
    upload.style.background = '';
  });

  upload.addEventListener('click', () => {
    window.showToast('File upload will connect to Cloudinary in production.');
  });
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNovelManageList();
  initActivityFeed();
  initPanelSwitching();
  initChapterEditor();
  initCoverUpload();
});
