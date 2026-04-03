const slides = [
  {
    title: "Nouvelle Collection",
    subtitle: "Printemps 2026",
    description: "Découvrez les dernières sneakers tendances et exclusives. Livraison gratuite dès 100€.",
    buttonText: "Découvrir la boutique",
    link: "/shop?category=new",
    image: "https://images.unsplash.com/photo-1634996086190-431e727e490a?q=80&w=1080",
  },
  {
    title: "Les Plus Populaires",
    subtitle: "Must-Have 2026",
    description: "Les modèles qui font vibrer la culture sneaker cette saison. Ne passez pas à côté.",
    buttonText: "Voir les best-sellers",
    link: "/shop?category=popular",
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1080",
  },
  {
    title: "Promotions d'Hiver",
    subtitle: "Jusqu'à -50%",
    description: "C'est le moment de craquer. Profitez de prix exceptionnels sur une sélection de marques.",
    buttonText: "Profiter des offres",
    link: "/shop?category=promo",
    image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1080",
  }
];

// ── Build carousel from data  
const track = document.getElementById('carousel-track');
const dotsContainer = document.getElementById('carousel-dots');

slides.forEach((slide, i) => {
  // Slide
  track.innerHTML += `
    <div class="carousel__slide" style="background-image: url('${slide.image}')">
      <div class="carousel__content">
        <p class="carousel__subtitle">${slide.subtitle}</p>
        <h1 class="carousel__title">${slide.title}</h1>
        <p class="carousel__description">${slide.description}</p>
        <a href="${slide.link}" class="carousel__btn-cta">${slide.buttonText}</a>
      </div>
    </div>
  `;

  // Dot
  dotsContainer.innerHTML += `<span class="carousel__dot ${i === 0 ? 'carousel__dot--active' : ''}"></span>`;
});

// ── Controls 
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

// ── Featured Products  
const featuredProducts = [
  { id: 1, brand: "Nike",   name: "Air Force 1 '07",       price: 119, originalPrice: null, isNew: true,  image: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?q=80&w=600" },
  { id: 2, brand: "Jordan", name: "Air Jordan 1 Retro High",price: 189, originalPrice: 220, isNew: false, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600" },
  { id: 3, brand: "Adidas", name: "Yeezy Boost 350 V2",    price: 249, originalPrice: 310, isNew: false, image: "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?q=80&w=600" },
  { id: 4, brand: "Nike",   name: "Dunk Low Panda",        price: 139, originalPrice: null, isNew: true,  image: "https://images.unsplash.com/photo-1612892483236-52d32a0e0ac1?q=80&w=600" },
];

const grid = document.getElementById('products-grid');

featuredProducts.forEach(product => {
  grid.innerHTML += `
    <div class="product-card">
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
    </div>
  `;
});
