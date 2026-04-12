/* ============================================
   comments.js — Comment Section Logic
============================================ */

const MOCK_COMMENTS = [
  {
    id: 1, username: 'ShadowReader92', initial: 'SR', date: '2 hours ago',
    text: "The ending of this chapter hit me harder than I expected. The moment Kael burns the execution order — pure character establishment. You immediately know who he is and what this story is going to cost him.",
    likes: 284, liked: false,
  },
  {
    id: 2, username: 'ElenaVance', initial: 'EV', date: '5 hours ago',
    text: "Marcus Vale writes political intrigue unlike anyone else on this platform. The obsidian coin reveal at the end is such a perfectly planted hook. I read chapter 2 immediately after finishing this.",
    likes: 157, liked: false,
  },
  {
    id: 3, username: 'DarkFantasyFan', initial: 'DF', date: '1 day ago',
    text: "Just discovered this through the Editor's Pick and I'm genuinely blown away by the prose quality. The line 'parchment stained with the King's seal — red wax pressed in the shape of a crown that looked, to Kael's eyes, exactly like a wound' is going to live in my head forever.",
    likes: 412, liked: true,
  },
  {
    id: 4, username: 'Nocturnalist', initial: 'N', date: '1 day ago',
    text: "Reread this for the third time and I'm still catching new details. The way the girl's eyes are described as 'too old for her face' tells you everything about the world's cruelty without a single expository sentence.",
    likes: 98, liked: false,
  },
  {
    id: 5, username: 'TormentedPages', initial: 'TP', date: '2 days ago',
    text: "Chapter 1 establishing Kael's moral line so clearly is brilliant setup for everything that follows in the Obsidian Court arc. Don't want to spoil anything for new readers but this decision echoes throughout the entire series.",
    likes: 203, liked: false,
  },
];

function renderComment(comment) {
  return `
    <div class="comment-item" data-id="${comment.id}">
      <div class="comment-avatar">
        <div class="comment-avatar-placeholder">${comment.initial}</div>
      </div>
      <div>
        <div class="comment-username">${comment.username}</div>
        <div class="comment-date">${comment.date}</div>
        <div class="comment-text">${comment.text}</div>
        <div class="comment-actions">
          <button class="comment-action-btn like-btn ${comment.liked ? 'liked' : ''}" data-id="${comment.id}">
            ${comment.liked ? '♥' : '♡'} <span class="like-count">${comment.likes}</span>
          </button>
          <button class="comment-action-btn reply-btn">↩ Reply</button>
          <button class="comment-action-btn report-btn">⚑ Report</button>
        </div>
      </div>
    </div>
  `;
}

function initComments() {
  const container = document.getElementById('commentsSection');
  if (!container) return;

  // Track comment state
  const commentsState = MOCK_COMMENTS.map(c => ({ ...c }));

  function render() {
    container.innerHTML = commentsState.map(renderComment).join('');
    bindCommentEvents();
  }

  function bindCommentEvents() {
    // Like buttons
    container.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const comment = commentsState.find(c => c.id === id);
        if (!comment) return;

        comment.liked = !comment.liked;
        comment.likes += comment.liked ? 1 : -1;
        render();
      });
    });

    // Reply buttons
    container.querySelectorAll('.reply-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.showToast('Sign in to reply to comments.');
      });
    });

    // Report buttons
    container.querySelectorAll('.report-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.showToast('Comment reported. Thank you.');
      });
    });
  }

  render();

  // Load more
  const loadMore = document.getElementById('loadMoreComments');
  if (loadMore) {
    loadMore.addEventListener('click', () => {
      window.showToast('Sign in to load more comments.');
    });
  }

  // Comment form submission
  const textareas = document.querySelectorAll('.comment-form textarea');
  const submitBtns = document.querySelectorAll('.comment-form .btn-crimson');

  submitBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      window.showToast('Sign in to post a comment.');
    });
  });
}

// Novel detail page comments
function initNovelComments() {
  const container = document.getElementById('commentsList');
  if (!container) return;

  container.innerHTML = MOCK_COMMENTS.slice(0, 3).map(renderComment).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  initComments();
  initNovelComments();
});
