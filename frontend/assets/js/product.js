const sizes = [38, 39, 40, 41, 42, 43, 44, 45];

const params = new URLSearchParams(window.location.search);
const id     = parseInt(params.get('id'));

apiFetch(`/products/${id}`).then(res => {
  if (!res.success) {
    document.getElementById('product-container').style.display = 'none';
    document.getElementById('not-found').style.display = 'block';
    return;
  }

  const product = res.data;
  const price   = parseFloat(product.price);
  const sale    = product.sale_price ? parseFloat(product.sale_price) : null;

  document.title = `${product.name} – ShoeBox`;
  document.getElementById('breadcrumb-name').textContent = product.name;
  document.getElementById('product-img').src             = product.img_url || '';
  document.getElementById('product-img').alt             = product.name;
  document.getElementById('product-brand').textContent   = product.brand;
  document.getElementById('product-name').textContent    = product.name;
  document.getElementById('product-price').textContent   = `${sale ?? price}€`;

  const badgeEl = document.getElementById('product-badge');
  if (badgeEl && sale) badgeEl.style.display = 'block';

  const originalEl = document.getElementById('product-original');
  if (originalEl && sale) {
    originalEl.textContent   = `${price}€`;
    originalEl.style.display = 'inline';
  }

  const sizeGrid   = document.getElementById('size-grid');
  let selectedSize = null;

  sizes.forEach(size => {
    const btn = document.createElement('button');
    btn.className   = 'size-btn';
    btn.textContent = size;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('size-btn--selected'));
      btn.classList.add('size-btn--selected');
      selectedSize = size;
    });
    sizeGrid.appendChild(btn);
  });

  document.getElementById('add-to-cart-btn').addEventListener('click', () => {
    if (!selectedSize) {
      alert('Veuillez sélectionner une taille.');
      return;
    }

    const cart = getCart();
    const existing = cart.find(i => i.id === product.id && i.size === selectedSize);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id:       product.id,
        name:     product.name,
        brand:    product.brand,
        price:    sale ?? price,
        image:    product.img_url || '',
        size:     selectedSize,
        quantity: 1,
      });
    }

    saveCart(cart);
    alert(`"${product.name}" (taille ${selectedSize}) ajouté au panier !`);
  });
});
