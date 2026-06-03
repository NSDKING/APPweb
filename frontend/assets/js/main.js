const defaultSlides = [
  {
    title: "Nouvelle Collection",
    subtitle: "Printemps 2026",
    description: "Découvrez les dernières sneakers tendances et exclusives. Livraison gratuite dès 100€.",
    buttonText: "Découvrir la boutique",
    link: "/pages/boutique/boutique.html",
    image: "https://images.unsplash.com/photo-1634996086190-431e727e490a?q=80&w=1080",
  },
  {
    title: "Les Plus Populaires",
    subtitle: "Must-Have 2026",
    description: "Les modèles qui font vibrer la culture sneaker cette saison. Ne passez pas à côté.",
    buttonText: "Voir les best-sellers",
    link: "/pages/boutique/boutique.html",
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1080",
  },
  {
    title: "Promotions d'Hiver",
    subtitle: "Jusqu'à -50%",
    description: "C'est le moment de craquer. Profitez de prix exceptionnels sur une sélection de marques.",
    buttonText: "Profiter des offres",
    link: "/pages/boutique/boutique.html",
    image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1080",
  }
];

async function initCarousel() {
  let slides = defaultSlides;
  try {
    const res = await apiFetch('/carousel');
    if (res.success && res.data?.length) slides = res.data;
  } catch {}

  const track = document.getElementById('carousel-track');
  const dotsContainer = document.getElementById('carousel-dots');

  slides.forEach((slide, i) => {
    track.innerHTML += `
      <div class="carousel__slide" style="background-image: url('${slide.image}')">
        <div class="carousel__content">
          <p class="carousel__subtitle">${slide.subtitle || ''}</p>
          <h1 class="carousel__title">${slide.title}</h1>
          <p class="carousel__description">${slide.description || ''}</p>
          <a href="${slide.link || '#'}" class="carousel__btn-cta">${slide.buttonText || ''}</a>
        </div>
      </div>
    `;
    dotsContainer.innerHTML += `<span class="carousel__dot ${i === 0 ? 'carousel__dot--active' : ''}"></span>`;
  });

  const dots = document.querySelectorAll('.carousel__dot');
  let current = 0;

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach(d => d.classList.remove('carousel__dot--active'));
    dots[current].classList.add('carousel__dot--active');
  }

  document.getElementById('carousel-prev').addEventListener('click', () => goTo(current - 1));
  document.getElementById('carousel-next').addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
  setInterval(() => goTo(current + 1), 4000);
}

initCarousel();

// Featured products from API
const grid = document.getElementById('products-grid');

Promise.all([apiFetch('/products'), loadFavourites()]).then(([res]) => {
  const products = (res.data || []).slice(0, 4);
  products.forEach(product => {
    const price = parseFloat(product.price);
    const sale  = product.sale_price ? parseFloat(product.sale_price) : null;
    const isFav = isFavourite(product.id);
    grid.innerHTML += `
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
          <span class="product-card__price">${sale ? sale : price}€</span>
          ${sale ? `<span class="product-card__original">${price}€</span>` : ''}
        </div>
      </a>
    `;
  });
});

// Heart button — registered once, outside the .then()
grid.addEventListener('click', async e => {
  const btn = e.target.closest('.product-card__fav');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  btn.style.opacity = '0.5';
  try {
    const added = await toggleFavouriteApi(btn.dataset.id);
    if (added === null) return;
    btn.classList.toggle('product-card__fav--active', added);
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', added ? 'currentColor' : 'none');
  } finally {
    btn.style.opacity = '';
  }
});
