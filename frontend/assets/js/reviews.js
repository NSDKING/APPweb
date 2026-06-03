// Gestion des avis produits
(function () {
  const params = new URLSearchParams(location.search);
  const productId = params.get('id');
  if (!productId) return;

  let selectedRating = 0;

  function starsHtml(rating, max = 5) {
    let html = '';
    for (let i = 1; i <= max; i++) {
      html += `<span class="star ${i <= rating ? 'star--filled' : ''}">★</span>`;
    }
    return html;
  }

  async function loadReviews() {
    const data = await apiFetch(`/products/${productId}/reviews`);

    // Toujours afficher la section, même si l'API échoue
    if (!data || !data.success) {
      document.getElementById('reviews-empty').style.display = '';
      // Afficher formulaire si connecté
      if (localStorage.getItem('token')) {
        document.getElementById('review-form-wrap').style.display = '';
      }
      return;
    }

    const { reviews, average, count } = data.data;

    document.getElementById('reviews-avg').textContent = average > 0 ? average.toFixed(1) : '—';
    document.getElementById('reviews-stars-avg').innerHTML = starsHtml(Math.round(average));
    document.getElementById('reviews-count').textContent =
      count === 0 ? 'Aucun avis' : `${count} avis`;

    const list = document.getElementById('reviews-list');
    document.getElementById('reviews-empty').style.display = count === 0 ? '' : 'none';

    list.querySelectorAll('.review-card').forEach(el => el.remove());

    reviews.forEach(r => {
      const card = document.createElement('div');
      card.className = 'review-card';
      card.innerHTML = `
        <div class="review-card__header">
          <strong class="review-card__author">${escapeHtml(r.user_name)}</strong>
          <div class="review-card__stars">${starsHtml(r.rating)}</div>
          <span class="review-card__date">${new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
        ${r.comment ? `<p class="review-card__comment">${escapeHtml(r.comment)}</p>` : ''}
      `;
      list.appendChild(card);
    });

    // Afficher formulaire si connecté et pas encore noté
    const token = localStorage.getItem('token');
    if (token) {
      const payload = parseJwt(token);
      const alreadyReviewed = reviews.some(r => r.user_id == payload?.user_id);
      if (!alreadyReviewed) {
        document.getElementById('review-form-wrap').style.display = '';
      }
    }
  }

  function setupStarPicker() {
    const picks = document.querySelectorAll('.star-pick');
    picks.forEach(btn => {
      btn.addEventListener('mouseover', () => highlightStars(+btn.dataset.v));
      btn.addEventListener('mouseout', () => highlightStars(selectedRating));
      btn.addEventListener('click', () => {
        selectedRating = +btn.dataset.v;
        highlightStars(selectedRating);
      });
    });
  }

  function highlightStars(n) {
    document.querySelectorAll('.star-pick').forEach((btn, i) => {
      btn.classList.toggle('star-pick--active', i < n);
    });
  }

  async function submitReview() {
    const msg = document.getElementById('review-msg');
    if (selectedRating === 0) {
      msg.textContent = 'Veuillez sélectionner une note.';
      msg.style.color = '#c00';
      return;
    }

    const comment = document.getElementById('review-comment').value.trim();
    const btn = document.getElementById('review-submit-btn');
    btn.disabled = true;

    console.log('[reviews] token in localStorage:', localStorage.getItem('token')?.slice(0, 30) + '...');
    const res = await apiFetch(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: selectedRating, comment }),
    });
    console.log('[reviews] server response:', res);

    btn.disabled = false;

    if (res && res.success) {
      msg.textContent = 'Avis publié, merci !';
      msg.style.color = '#2a7a2a';
      document.getElementById('review-form-wrap').style.display = 'none';
      loadReviews();
    } else if (res?.expired) {
      msg.textContent = 'Session expirée — veuillez vous reconnecter.';
      msg.style.color = '#c00';
      setTimeout(() => { window.location.href = '/pages/auth/login.html'; }, 1500);
    } else {
      msg.textContent = res?.message || 'Erreur lors de la publication.';
      msg.style.color = '#c00';
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch { return null; }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
    setupStarPicker();
    document.getElementById('review-submit-btn')?.addEventListener('click', submitReview);
  });
})();
