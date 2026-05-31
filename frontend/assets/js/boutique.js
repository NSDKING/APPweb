let allProducts = [];
let selectedBrand = 'all';
let selectedPrice = 'all';
let searchQuery   = new URLSearchParams(window.location.search).get('search') || '';

const grid      = document.getElementById('products-grid');
const count     = document.getElementById('product-count');
const noResults = document.getElementById('no-results');

function matchesPrice(product) {
  const price = parseFloat(product.sale_price || product.price);
  if (selectedPrice === 'under100')  return price < 100;
  if (selectedPrice === '100to150')  return price >= 100 && price <= 150;
  if (selectedPrice === 'over150')   return price > 150;
  return true;
}

function render() {
  const filtered = allProducts.filter(p => {
    const matchesBrand  = selectedBrand === 'all' || p.brand.toLowerCase() === selectedBrand;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesPrice(p) && matchesSearch;
  });

  count.textContent = `${filtered.length} produit${filtered.length !== 1 ? 's' : ''} disponible${filtered.length !== 1 ? 's' : ''}`;
  grid.innerHTML = '';

  if (filtered.length === 0) {
    noResults.style.display = 'block';
    return;
  }
  noResults.style.display = 'none';

  filtered.forEach(product => {
    const price = parseFloat(product.price);
    const sale  = product.sale_price ? parseFloat(product.sale_price) : null;
    const isFav = isFavourite(product.id);
    grid.insertAdjacentHTML('beforeend', `
      <a href="/pages/shop/product.html?id=${product.id}" class="product-card">
        <div class="product-card__img-wrapper">
          ${sale ? `<span class="product-card__badge">Promo</span>` : ''}
          <img src="${product.img_url || 'https://via.placeholder.com/600x400'}" alt="${product.name}" class="product-card__img" />
          <button class="product-card__fav ${isFav ? 'product-card__fav--active' : ''}" data-id="${product.id}" aria-label="Favoris">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button class="product-card__quick-add" aria-label="Ajouter au panier">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </button>
        </div>
        <p class="product-card__brand">${product.brand}</p>
        <h3 class="product-card__name">${product.name}</h3>
        <div class="product-card__pricing">
          <span class="product-card__price">${sale ?? price}€</span>
          ${sale ? `<span class="product-card__original">${price}€</span>` : ''}
        </div>
      </a>
    `);
  });
}

Promise.all([apiFetch('/products'), loadFavourites()]).then(([res]) => {
  allProducts = res.data || [];
  render();
});

document.querySelectorAll('input[name="brand"]').forEach(input => {
  input.addEventListener('change', e => { selectedBrand = e.target.value; render(); });
});

document.querySelectorAll('input[name="price"]').forEach(input => {
  input.addEventListener('change', e => { selectedPrice = e.target.value; render(); });
});

document.getElementById('filters-reset').addEventListener('click', () => {
  selectedBrand = 'all';
  selectedPrice = 'all';
  document.querySelector('input[name="brand"][value="all"]').checked = true;
  document.querySelector('input[name="price"][value="all"]').checked  = true;
  render();
});

// Heart button — event delegation
grid.addEventListener('click', async e => {
  const btn = e.target.closest('.product-card__fav');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();

  btn.style.opacity = '0.5';
  try {
    const added = await toggleFavouriteApi(btn.dataset.id);
    if (added === null) return; // redirected to login
    btn.classList.toggle('product-card__fav--active', added);
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', added ? 'currentColor' : 'none');
  } catch (err) {
    console.error('Favourites error:', err);
  } finally {
    btn.style.opacity = '';
  }
});

const filterToggle  = document.getElementById('filter-toggle');
const filterSidebar = document.getElementById('filters-sidebar');
filterToggle.addEventListener('click', () => {
  const open = filterSidebar.classList.toggle('filters-sidebar--open');
  filterToggle.textContent = open ? 'Masquer les filtres' : 'Afficher les filtres';
});
