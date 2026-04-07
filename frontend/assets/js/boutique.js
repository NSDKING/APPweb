const products = [
  { id: 1, brand: 'nike',        name: 'Air Force 1 \'07',         price: 119, originalPrice: null, isNew: true,  image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?q=80&w=600' },
  { id: 2, brand: 'jordan',      name: 'Air Jordan 1 Retro High',  price: 189, originalPrice: 220,  isNew: false, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600' },
  { id: 3, brand: 'adidas',      name: 'Yeezy Boost 350 V2',       price: 249, originalPrice: 310,  isNew: false, image: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?q=80&w=600' },
  { id: 4, brand: 'nike',        name: 'Dunk Low Panda',            price: 139, originalPrice: null, isNew: true,  image: 'https://images.unsplash.com/photo-1612892483236-52d32a0e0ac1?q=80&w=600' },
  { id: 5, brand: 'new balance', name: '550 White Green',           price: 110, originalPrice: null, isNew: false, image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=600' },
  { id: 6, brand: 'adidas',      name: 'Stan Smith',                price: 90,  originalPrice: null, isNew: false, image: 'https://images.unsplash.com/photo-1465453869711-7e174808ace9?q=80&w=600' },
];

let selectedBrand = 'all';
let selectedPrice = 'all';

const grid      = document.getElementById('products-grid');
const count     = document.getElementById('product-count');
const noResults = document.getElementById('no-results');

function matchesPrice(product) {
  if (selectedPrice === 'under100')  return product.price < 100;
  if (selectedPrice === '100to150')  return product.price >= 100 && product.price <= 150;
  if (selectedPrice === 'over150')   return product.price > 150;
  return true;
}

function render() {
  const filtered = products.filter(p =>
    (selectedBrand === 'all' || p.brand === selectedBrand) && matchesPrice(p)
  );

  count.textContent = `${filtered.length} produit${filtered.length !== 1 ? 's' : ''} disponible${filtered.length !== 1 ? 's' : ''}`;
  grid.innerHTML = '';

  if (filtered.length === 0) {
    noResults.style.display = 'block';
    return;
  }
  noResults.style.display = 'none';

  filtered.forEach(product => {
    grid.insertAdjacentHTML('beforeend', `
      <a href="../shop/product.html?id=${product.id}" class="product-card">
          <div class="product-card__img-wrapper">
            ${product.isNew ? `<span class="product-card__badge">New Drop</span>` : ''}
            <img src="${product.image}" alt="${product.name}" class="product-card__img" />
            <button class="product-card__quick-add" aria-label="Ajouter au panier">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </button>
          </div>
          <p class="product-card__brand">${product.brand}</p>
          <h3 class="product-card__name">${product.name}</h3>
          <div class="product-card__pricing">
            <span class="product-card__price">${product.price}€</span>
            ${product.originalPrice ? `<span class="product-card__original">${product.originalPrice}€</span>` : ''}
          </div>
      </a>
    `);
  });
}

// Brand filter
document.querySelectorAll('input[name="brand"]').forEach(input => {
  input.addEventListener('change', e => {
    selectedBrand = e.target.value;
    render();
  });
});

// Price filter
document.querySelectorAll('input[name="price"]').forEach(input => {
  input.addEventListener('change', e => {
    selectedPrice = e.target.value;
    render();
  });
});

// Reset
document.getElementById('filters-reset').addEventListener('click', () => {
  selectedBrand = 'all';
  selectedPrice = 'all';
  document.querySelector('input[name="brand"][value="all"]').checked = true;
  document.querySelector('input[name="price"][value="all"]').checked = true;
  render();
});

// Mobile toggle
const filterToggle  = document.getElementById('filter-toggle');
const filterSidebar = document.getElementById('filters-sidebar');
filterToggle.addEventListener('click', () => {
  const open = filterSidebar.classList.toggle('filters-sidebar--open');
  filterToggle.textContent = open ? 'Masquer les filtres' : 'Afficher les filtres';
});

render();
