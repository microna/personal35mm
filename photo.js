const PHOTO_ID = 'photo_kyiv_2024_01';
const LIKES_KEY = `${PHOTO_ID}_likes`;
const LIKED_KEY = `${PHOTO_ID}_liked`;
const COMMENTS_KEY = `${PHOTO_ID}_comments`;

const likeBtn = document.getElementById('likeBtn');
const likeCount = document.getElementById('likeCount');
const commentForm = document.getElementById('commentForm');
const commentsList = document.getElementById('commentsList');
const formError = document.getElementById('formError');

// ── Likes ──────────────────────────────────────────────
let likes = parseInt(localStorage.getItem(LIKES_KEY) || '0', 10);
let liked = localStorage.getItem(LIKED_KEY) === 'true';

function renderLike() {
  likeCount.textContent = likes;
  likeBtn.classList.toggle('liked', liked);
  likeBtn.setAttribute('aria-pressed', String(liked));
}

likeBtn.addEventListener('click', () => {
  if (liked) {
    likes = Math.max(0, likes - 1);
    liked = false;
  } else {
    likes += 1;
    liked = true;
  }
  localStorage.setItem(LIKES_KEY, String(likes));
  localStorage.setItem(LIKED_KEY, String(liked));
  renderLike();
});

renderLike();

// ── Comments ───────────────────────────────────────────
function loadComments() {
  try {
    return JSON.parse(localStorage.getItem(COMMENTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveComments(comments) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderComments() {
  const comments = loadComments();
  if (comments.length === 0) {
    commentsList.innerHTML = '<p class="comments-empty">No comments yet — be the first.</p>';
    return;
  }
  commentsList.innerHTML = comments
    .slice()
    .reverse()
    .map(c => `
      <article class="comment-item">
        <div class="comment-item__header">
          <span class="comment-item__name">${escapeHtml(c.name)}</span>
          <span class="comment-item__date">${formatDate(c.date)}</span>
        </div>
        <p class="comment-item__text">${escapeHtml(c.text)}</p>
      </article>
    `)
    .join('');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

commentForm.addEventListener('submit', e => {
  e.preventDefault();
  formError.textContent = '';

  const nameEl = document.getElementById('commentName');
  const textEl = document.getElementById('commentText');
  const name = nameEl.value.trim();
  const text = textEl.value.trim();

  if (!name) {
    formError.textContent = 'Please enter your name.';
    nameEl.focus();
    return;
  }
  if (!text) {
    formError.textContent = 'Please write something before posting.';
    textEl.focus();
    return;
  }

  const comments = loadComments();
  comments.push({ name, text, date: new Date().toISOString() });
  saveComments(comments);

  nameEl.value = '';
  textEl.value = '';
  renderComments();
});

renderComments();
