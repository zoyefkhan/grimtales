/* ============================================
   comments.js — Comment Section Logic
============================================ */

let commentsState = [];

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderComment(comment) {
  const author = comment.author || {};
  const initials = (author.username || '??').slice(0, 2).toUpperCase();
  const avatar = author.avatar_url
    ? `<img src="${author.avatar_url}" alt="${author.username || 'User'}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
    : `<div class="comment-avatar-placeholder">${initials}</div>`;

  return `
    <div class="comment-item" data-id="${comment.id}">
      <div class="comment-avatar">${avatar}</div>
      <div>
        <div class="comment-username">${author.username || 'Anonymous'}</div>
        <div class="comment-date">${formatDate(comment.created_at)}</div>
        <div class="comment-text">${comment.text || ''}</div>
        <div class="comment-actions">
          <button class="comment-action-btn like-btn ${comment.liked ? 'liked' : ''}" data-id="${comment.id}">
            ${comment.liked ? '♥' : '♡'} <span class="like-count">${comment.like_count || 0}</span>
          </button>
          <button class="comment-action-btn reply-btn">↩ Reply</button>
          <button class="comment-action-btn report-btn">⚑ Report</button>
        </div>
      </div>
    </div>
  `;
}

function bindCommentEvents(container) {
  if (!container) return;

  container.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const comment = commentsState.find(c => c.id === id);
      if (!comment) return;
      comment.liked = !comment.liked;
      comment.like_count = (comment.like_count || 0) + (comment.liked ? 1 : -1);
      renderCommentSection(container, commentsState);
    });
  });

  container.querySelectorAll('.reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.showToast('Sign in to reply to comments.');
    });
  });

  container.querySelectorAll('.report-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.showToast('Comment reported. Thank you.');
    });
  });
}

function renderCommentSection(container, comments) {
  container.innerHTML = comments.length
    ? comments.map(renderComment).join('')
    : '<div class="comments-empty">No comments yet. Be the first to leave one.</div>';
  bindCommentEvents(container);
}

async function fetchChapterComments(chapterId) {
  if (!chapterId || !window.GT_Data) return [];
  return window.GT_Data.fetchComments(chapterId).catch(() => []);
}

async function fetchNovelCommentsById(novelId) {
  if (!novelId || !window.GT_Data?.fetchNovelComments) return [];
  return window.GT_Data.fetchNovelComments(novelId).catch(() => []);
}

async function initComments() {
  const container = document.getElementById('commentsSection');
  if (!container) return;

  const chapterId = getQueryParam('id');
  commentsState = await fetchChapterComments(chapterId);
  commentsState = commentsState.map(c => ({ ...c, liked: false, like_count: c.like_count || 0 }));

  renderCommentSection(container, commentsState);

  const loadMore = document.getElementById('loadMoreComments');
  if (loadMore) {
    loadMore.addEventListener('click', () => {
      window.showToast('Sign in to load more comments.');
    });
  }

  document.querySelectorAll('.comment-form .btn-crimson').forEach(btn => {
    btn.addEventListener('click', () => {
      window.showToast('Sign in to post a comment.');
    });
  });
}

async function initNovelComments() {
  const container = document.getElementById('commentsList');
  if (!container) return;

  const novelId = getQueryParam('id');
  const comments = await fetchNovelCommentsById(novelId);
  renderCommentSection(container, comments.map(c => ({ ...c, liked: false, like_count: c.like_count || 0 })));
}

document.addEventListener('DOMContentLoaded', () => {
  initComments();
  initNovelComments();
});
