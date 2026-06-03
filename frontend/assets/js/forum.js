// ── Utilitaires ──────────────────────────────────────────────────────────────
const isForumIndex    = !!document.getElementById('categories-list');
const isThreadPage    = !!document.getElementById('thread-container');
const isNewThreadPage = !!document.getElementById('f-category');

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400)return `Il y a ${Math.floor(diff/3600)}h`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
}

// ── Page index ───────────────────────────────────────────────────────────────
if (isForumIndex) {
  document.addEventListener('DOMContentLoaded', loadCategories);

  async function loadCategories() {
    const res = await apiFetch('/forum/categories');
    const container = document.getElementById('categories-list');

    if (!res || !res.success || !res.data?.length) {
      container.innerHTML = '<p style="color:#aaa;text-align:center;padding:40px;">Aucune catégorie disponible pour l\'instant.</p>';
      return;
    }

    container.innerHTML = res.data.map(cat => `
      <div class="forum-cat" id="cat-${cat.id}">
        <div class="forum-cat__header" onclick="toggleCategory(${cat.id})">
          <div>
            <div class="forum-cat__name">${esc(cat.name)}</div>
            ${cat.description ? `<div class="forum-cat__desc">${esc(cat.description)}</div>` : ''}
          </div>
          <div class="forum-cat__stats">
            ${cat.thread_count} fils · ${cat.post_count} messages
          </div>
        </div>
        <div class="forum-threads" id="threads-${cat.id}" style="display:none;">
          <p class="threads-loading">Chargement…</p>
        </div>
      </div>`).join('');
  }

  async function toggleCategory(catId) {
    const el = document.getElementById('threads-' + catId);
    if (el.style.display === 'none') {
      el.style.display = '';
      el.innerHTML = '<p class="threads-loading">Chargement…</p>';
      const res = await apiFetch(`/forum/categories/${catId}/threads`);
      renderThreads(el, res?.data || []);
    } else {
      el.style.display = 'none';
    }
  }

  function renderThreads(container, threads) {
    if (!threads.length) {
      container.innerHTML = '<p class="forum-empty">Aucun fil dans cette catégorie. <a href="/pages/forum/new-thread.html">Créer le premier →</a></p>';
      return;
    }
    container.innerHTML = threads.map(t => `
      <a class="forum-thread" href="/pages/forum/thread.html?id=${t.id}">
        <div class="thread-icon ${t.is_pinned ? 'thread-icon--pinned' : ''}">
          ${t.is_pinned
            ? '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#92400e" stroke-width="2"><path d="M5 12l7-7 7 7"/><path d="M12 5v14"/></svg>'
            : '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#888" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>'}
        </div>
        <div style="flex:1;min-width:0;">
          <div class="thread-title">${esc(t.title)}${t.is_locked ? ' 🔒' : ''}</div>
          <div class="thread-meta">Par ${esc(t.author_name)} · ${timeAgo(t.created_at)}</div>
        </div>
        <div class="thread-replies">
          ${t.reply_count} réponse${t.reply_count !== 1 ? 's' : ''}
          ${t.last_reply_at ? `<br><span style="font-size:.72rem;">Dernière : ${timeAgo(t.last_reply_at)}</span>` : ''}
        </div>
      </a>`).join('');
  }
}

// ── Page thread ──────────────────────────────────────────────────────────────
if (isThreadPage) {
  const threadId = new URLSearchParams(location.search).get('id');

  document.addEventListener('DOMContentLoaded', () => {
    if (!threadId) { window.location.href = '/pages/forum/index.html'; return; }
    loadThread();
  });

  async function loadThread() {
    const res = await apiFetch(`/forum/threads/${threadId}`);
    const container = document.getElementById('thread-container');

    if (!res || !res.success) {
      container.innerHTML = '<p style="color:#c00;text-align:center;">Fil introuvable.</p>';
      return;
    }

    const { thread, posts } = res.data;

    // Breadcrumb
    const catEl = document.getElementById('breadcrumb-cat');
    catEl.textContent = thread.category_name;
    catEl.href = '/pages/forum/index.html';
    document.getElementById('breadcrumb-thread').textContent = thread.title;
    document.title = thread.title + ' — ShoeBox Forum';

    // Thread header
    const token   = localStorage.getItem('token');
    let userId = 0;
    try { userId = JSON.parse(atob(token.split('.')[1])).user_id; } catch {}

    container.innerHTML = `
      <h1 class="thread-title">${esc(thread.title)}</h1>
      <div class="thread-info">
        Par <strong>${esc(thread.author_name)}</strong> · ${timeAgo(thread.created_at)}
        · ${posts.length} réponse${posts.length !== 1 ? 's' : ''}
        ${thread.is_pinned ? '<span class="badge-pin">Épinglé</span>' : ''}
        ${thread.is_locked ? '<span class="badge-lock">Verrouillé</span>' : ''}
      </div>
      <div id="posts-list">${renderPosts(posts, userId)}</div>
      ${renderReplyArea(thread.is_locked, !!token)}
    `;

    // Événements likes
    container.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => likePost(btn));
    });

    // Événement réponse
    const replyBtn = document.getElementById('reply-btn');
    if (replyBtn) replyBtn.addEventListener('click', submitReply);
  }

  function renderPosts(posts, currentUserId) {
    return posts.map(p => {
      const ini   = initials(p.author_name);
      const liked = p.user_liked == 1;
      return `
        <div class="post" id="post-${p.id}">
          <div class="post__header">
            <div class="post__avatar">${esc(ini)}</div>
            <div>
              <div class="post__author">${esc(p.author_name)}</div>
              <div class="post__date">${new Date(p.created_at).toLocaleString('fr-FR')}</div>
            </div>
          </div>
          <div class="post__body">${esc(p.body)}</div>
          <div class="post__footer">
            <button class="like-btn ${liked ? 'like-btn--liked' : ''}" data-post-id="${p.id}" data-liked="${liked ? '1' : '0'}">
              ♥ <span class="like-count">${p.like_count}</span>
            </button>
          </div>
        </div>`;
    }).join('');
  }

  function renderReplyArea(isLocked, isLoggedIn) {
    if (isLocked) return '<div class="locked-notice">Ce fil est verrouillé — les nouvelles réponses sont désactivées.</div>';
    if (!isLoggedIn) return `<div class="login-prompt">
      <a href="/pages/auth/login.html">Connectez-vous</a> pour répondre à ce fil.
    </div>`;
    return `
      <div class="reply-form">
        <h3>Votre réponse</h3>
        <textarea id="reply-body" placeholder="Rédigez votre réponse…"></textarea>
        <button class="reply-btn" id="reply-btn">Publier</button>
        <p class="reply-msg" id="reply-msg"></p>
      </div>`;
  }

  async function likePost(btn) {
    const postId = btn.dataset.postId;
    const res = await apiFetch(`/forum/posts/${postId}/like`, { method: 'POST' });
    if (!res || !res.success) return;

    const liked = res.data.liked;
    const countEl = btn.querySelector('.like-count');
    const current = parseInt(countEl.textContent);
    countEl.textContent = liked ? current + 1 : current - 1;
    btn.dataset.liked = liked ? '1' : '0';
    btn.classList.toggle('like-btn--liked', liked);
  }

  async function submitReply() {
    const body = document.getElementById('reply-body').value.trim();
    const msg  = document.getElementById('reply-msg');
    const btn  = document.getElementById('reply-btn');

    if (!body) { msg.textContent = 'Le message ne peut pas être vide.'; msg.style.color = '#c00'; return; }

    btn.disabled = true;
    const res = await apiFetch(`/forum/threads/${threadId}/posts`, {
      method: 'POST', body: JSON.stringify({ body }),
    });
    btn.disabled = false;

    if (res?.success) {
      document.getElementById('reply-body').value = '';
      msg.textContent = 'Réponse publiée !'; msg.style.color = '#2a7a2a';
      loadThread();
    } else {
      msg.textContent = res?.message || 'Erreur.'; msg.style.color = '#c00';
    }
  }
}

// ── Page nouveau fil ─────────────────────────────────────────────────────────
if (isNewThreadPage) {
  document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('token')) {
      document.getElementById('form-wrap').style.display  = 'none';
      document.getElementById('login-wall').style.display = '';
      return;
    }

    const res = await apiFetch('/forum/categories');
    const select = document.getElementById('f-category');
    if (res?.success && res.data?.length) {
      select.innerHTML = res.data.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    } else {
      select.innerHTML = '<option value="">Aucune catégorie disponible</option>';
    }
  });

  async function submitThread() {
    const categoryId = document.getElementById('f-category').value;
    const title      = document.getElementById('f-title').value.trim();
    const body       = document.getElementById('f-body').value.trim();
    const msg        = document.getElementById('form-msg');
    const btn        = document.getElementById('submit-btn');

    if (!categoryId || !title || !body) {
      msg.textContent = 'Tous les champs sont requis.'; msg.style.color = '#c00'; return;
    }

    btn.disabled = true;
    const res = await apiFetch('/forum/threads', {
      method: 'POST', body: JSON.stringify({ category_id: +categoryId, title, body }),
    });
    btn.disabled = false;

    if (res?.success) {
      window.location.href = `/pages/forum/thread.html?id=${res.data.thread_id}`;
    } else {
      msg.textContent = res?.message || 'Erreur lors de la création.'; msg.style.color = '#c00';
    }
  }

  // Exposer pour onclick
  window.submitThread = submitThread;
}
