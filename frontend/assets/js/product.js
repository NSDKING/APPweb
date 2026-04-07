// Same product data as main.js — single source of truth in a real app would be an API
const products = [
  { id: 1, brand: "Nike",   name: "Air Force 1 '07",        price: 119, originalPrice: null, isNew: true,  image: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?q=80&w=800" },
  { id: 2, brand: "Jordan", name: "Air Jordan 1 Retro High", price: 189, originalPrice: 220, isNew: false, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800" },
  { id: 3, brand: "Adidas", name: "Yeezy Boost 350 V2",     price: 249, originalPrice: 310, isNew: false, image: "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?q=80&w=800" },
  { id: 4, brand: "Nike",   name: "Dunk Low Panda",         price: 139, originalPrice: null, isNew: true,  image: "https://images.unsplash.com/photo-1612892483236-52d32a0e0ac1?q=80&w=800" },
];

const sizes = [38, 39, 40, 41, 42, 43, 44, 45];

// Read ?id= from URL
const params = new URLSearchParams(window.location.search);
const id = parseInt(params.get('id'));
const product = products.find(p => p.id === id);

if (!product) {
  document.getElementById('product-container').style.display = 'none';
  document.getElementById('not-found').style.display = 'block';
} else {
  // Populate page
  document.title = `${product.name} – ShoeBox`;
  document.getElementById('breadcrumb-name').textContent = product.name;
  document.getElementById('product-img').src = product.image;
  document.getElementById('product-img').alt = product.name;
  document.getElementById('product-brand').textContent = product.brand;
  document.getElementById('product-name').textContent = product.name;
  document.getElementById('product-price').textContent = `${product.price}€`;

  if (product.isNew) {
    document.getElementById('product-badge').style.display = 'block';
  }

  if (product.originalPrice) {
    const el = document.getElementById('product-original');
    el.textContent = `${product.originalPrice}€`;
    el.style.display = 'inline';
  }

  // Size grid
  const sizeGrid = document.getElementById('size-grid');
  let selectedSize = null;

  sizes.forEach(size => {
    const btn = document.createElement('button');
    btn.className = 'size-btn';
    btn.textContent = size;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('size-btn--selected'));
      btn.classList.add('size-btn--selected');
      selectedSize = size;
    });
    sizeGrid.appendChild(btn);
  });

  // Add to cart
  document.getElementById('add-to-cart-btn').addEventListener('click', () => {
    if (!selectedSize) {
      alert('Veuillez sélectionner une taille.');
      return;
    }
    alert(`"${product.name}" (taille ${selectedSize}) ajouté au panier !`);
  });
}
