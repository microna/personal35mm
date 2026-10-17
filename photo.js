const PHOTO_ID = 'photo_kyiv_2024_01';
const LIKES_KEY = `${PHOTO_ID}_likes`;
const LIKED_KEY = `${PHOTO_ID}_liked`;
const COMMENTS_KEY = `${PHOTO_ID}_comments`;

const likeBtn = document.getElementById('likeBtn');
const likeCount = document.getElementById('likeCount');
const commentForm = document.getElementById('commentForm');
const commentsList = document.getElementById('commentsList');
const formError = document.getElementById('formError');

// ── Header background on scroll ────────────────────────
const header = document.querySelector('header');

function updateHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 8);
}

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

// ── Lightbox (fit, zoom, pan) ──────────────────────────
const lightbox = document.getElementById('lightbox');
const stage = document.getElementById('lightboxStage');
const lbImg = document.getElementById('lightboxImg');
const zoomLabel = document.getElementById('lightboxZoom');
const openBtn = document.getElementById('openLightbox');
const heroImg = openBtn.querySelector('img');

const MAX_SCALE = 2;  // up to 200% of the file's own pixels
const view = { scale: 1, fit: 1, x: 0, y: 0 };
const pointers = new Map();
let gesture = null;
let lastFocus = null;

function isZoomed() {
  return view.scale > view.fit + 0.001;
}

function computeFit() {
  // Breathing room around the photo at "fit"; edge-to-edge on phones
  const pad = stage.clientWidth < 768 ? 0 : 24;
  const w = stage.clientWidth - pad * 2;
  const h = stage.clientHeight - pad * 2;
  // Never upscale past native size at "fit" — small files stay sharp
  view.fit = Math.min(w / lbImg.naturalWidth, h / lbImg.naturalHeight, 1);
}

// Centre the photo when it's smaller than the screen, otherwise keep its edges on-screen
function clampView() {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  const iw = lbImg.naturalWidth * view.scale;
  const ih = lbImg.naturalHeight * view.scale;
  view.x = iw <= w ? (w - iw) / 2 : Math.min(0, Math.max(w - iw, view.x));
  view.y = ih <= h ? (h - ih) / 2 : Math.min(0, Math.max(h - ih, view.y));
}

function render(animate = false) {
  clampView();
  lbImg.classList.toggle('is-animating', animate);
  lbImg.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  stage.classList.toggle('is-zoomed', isZoomed());
  zoomLabel.textContent = `${Math.round(view.scale * 100)}%`;
}

// Zoom keeping the point (cx, cy) under the cursor/fingers still
function zoomTo(scale, cx = stage.clientWidth / 2, cy = stage.clientHeight / 2, animate = false) {
  const next = Math.min(Math.max(scale, view.fit), Math.max(MAX_SCALE, view.fit));
  view.x = cx - (cx - view.x) * (next / view.scale);
  view.y = cy - (cy - view.y) * (next / view.scale);
  view.scale = next;
  render(animate);
}

function fitToScreen(animate = false) {
  computeFit();
  view.scale = view.fit;
  render(animate);
}

function toggleZoom(cx, cy) {
  if (isZoomed()) fitToScreen(true);
  // One step in: actual pixels on desktop, at most 3× on small screens so you keep your bearings
  else zoomTo(view.fit < 1 ? Math.min(1, view.fit * 3) : view.fit * 2, cx, cy, true);
}

function openLightbox() {
  lastFocus = document.activeElement;
  lightbox.hidden = false;
  document.documentElement.classList.add('lightbox-open');
  lightbox.querySelector('[data-action="close"]').focus();

  const src = heroImg.dataset.full || heroImg.currentSrc || heroImg.src;
  lbImg.alt = heroImg.alt;
  if (lbImg.getAttribute('src') !== src) {
    lightbox.classList.add('is-loading');
    lbImg.src = src;
  }
  lbImg.decode()
    .catch(() => {})
    .then(() => {
      lightbox.classList.remove('is-loading');
      if (lbImg.naturalWidth) fitToScreen();
    });
}

function closeLightbox() {
  lightbox.hidden = true;
  document.documentElement.classList.remove('lightbox-open');
  pointers.clear();
  gesture = null;
  if (lastFocus) lastFocus.focus();
}

openBtn.addEventListener('click', openLightbox);

lightbox.addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'close') closeLightbox();
  if (action === 'fit') fitToScreen(true);
  if (action === 'zoom-in') zoomTo(view.scale * 1.5, undefined, undefined, true);
  if (action === 'zoom-out') zoomTo(view.scale / 1.5, undefined, undefined, true);
});

function stagePoint(clientX, clientY) {
  const rect = stage.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

// Mouse wheel and trackpad pinch (which arrives as wheel + ctrlKey)
stage.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
  const p = stagePoint(e.clientX, e.clientY);
  zoomTo(view.scale * Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0015)), p.x, p.y);
}, { passive: false });

// Drag to pan, tap/click to toggle zoom, two fingers to pinch
stage.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  stage.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) {
    gesture = { type: 'pan', startX: e.clientX, startY: e.clientY, viewX: view.x, viewY: view.y, moved: false };
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    gesture = { type: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
  }
});

stage.addEventListener('pointermove', e => {
  if (!gesture || !pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (gesture.type === 'pan') {
    const dx = e.clientX - gesture.startX;
    const dy = e.clientY - gesture.startY;
    if (!gesture.moved && Math.hypot(dx, dy) < 4) return;
    gesture.moved = true;
    stage.classList.add('is-dragging');
    view.x = gesture.viewX + dx;
    view.y = gesture.viewY + dy;
    render();
  } else {
    const [a, b] = [...pointers.values()];
    const mid = stagePoint((a.x + b.x) / 2, (a.y + b.y) / 2);
    zoomTo(gesture.scale * Math.hypot(a.x - b.x, a.y - b.y) / gesture.dist, mid.x, mid.y);
  }
});

function endPointer(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  stage.classList.remove('is-dragging');

  if (e.type === 'pointerup' && gesture?.type === 'pan' && !gesture.moved) {
    const p = stagePoint(e.clientX, e.clientY);
    toggleZoom(p.x, p.y);
  }

  if (pointers.size === 1) {
    // Lifting one finger after a pinch: carry on panning with the other
    const [p] = pointers.values();
    gesture = { type: 'pan', startX: p.x, startY: p.y, viewX: view.x, viewY: view.y, moved: true };
  } else if (pointers.size === 0) {
    gesture = null;
  }
}

stage.addEventListener('pointerup', endPointer);
stage.addEventListener('pointercancel', endPointer);

document.addEventListener('keydown', e => {
  if (lightbox.hidden) return;
  const PAN_STEP = 80;
  switch (e.key) {
    case 'Escape': closeLightbox(); break;
    case '+': case '=': zoomTo(view.scale * 1.5, undefined, undefined, true); break;
    case '-': case '_': zoomTo(view.scale / 1.5, undefined, undefined, true); break;
    case '0': fitToScreen(true); break;
    case 'ArrowLeft':  if (!isZoomed()) return; view.x += PAN_STEP; render(true); break;
    case 'ArrowRight': if (!isZoomed()) return; view.x -= PAN_STEP; render(true); break;
    case 'ArrowUp':    if (!isZoomed()) return; view.y += PAN_STEP; render(true); break;
    case 'ArrowDown':  if (!isZoomed()) return; view.y -= PAN_STEP; render(true); break;
    case 'Tab': {
      // Keep focus inside the viewer while it's open
      const focusable = [...lightbox.querySelectorAll('button')];
      const i = focusable.indexOf(document.activeElement);
      const next = e.shiftKey ? (i <= 0 ? focusable.length - 1 : i - 1) : (i + 1) % focusable.length;
      focusable[next].focus();
      break;
    }
    default: return;
  }
  e.preventDefault();
});

window.addEventListener('resize', () => {
  if (lightbox.hidden || !lbImg.naturalWidth) return;
  const wasFit = !isZoomed();
  computeFit();
  view.scale = wasFit ? view.fit : Math.max(view.scale, view.fit);
  render();
});

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
