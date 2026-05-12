document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('search-btn');
  if (!searchBtn) return;

  // Inject search overlay into the page
  const overlay = document.createElement('div');
  overlay.id = 'search-overlay';
  overlay.innerHTML = `
    <div class="search-overlay__backdrop"></div>
    <div class="search-overlay__box">
      <input id="search-input" class="search-overlay__input" type="text" placeholder="Rechercher une sneaker, une marque..." autocomplete="off" />
      <button id="search-close" class="search-overlay__close" aria-label="Fermer">✕</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const input    = document.getElementById('search-input');
  const closeBtn = document.getElementById('search-close');
  const backdrop = overlay.querySelector('.search-overlay__backdrop');

  function openSearch() {
    overlay.classList.add('search-overlay--open');
    input.focus();
  }

  function closeSearch() {
    overlay.classList.remove('search-overlay--open');
    input.value = '';
  }

  function submitSearch() {
    const q = input.value.trim();
    if (!q) return;
    window.location.href = `/pages/boutique/boutique.html?search=${encodeURIComponent(q)}`;
  }

  searchBtn.addEventListener('click', openSearch);
  closeBtn.addEventListener('click', closeSearch);
  backdrop.addEventListener('click', closeSearch);

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitSearch();
    if (e.key === 'Escape') closeSearch();
  });
});
