const cartItemsEl   = document.getElementById('cart-items');
const cartTitleEl   = document.getElementById('cart-title');
const subtotalEl    = document.getElementById('cart-total');
const finalTotalEl  = document.getElementById('cart-final-total');

function renderCart() {
  const cart = getCart();
  cartItemsEl.innerHTML = '';

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart__empty">Votre panier est vide.</p>';
    if (cartTitleEl) cartTitleEl.textContent = 'Panier (0)';
    subtotalEl.textContent  = '0.00 €';
    finalTotalEl.textContent = '0.00 €';
    return;
  }

  if (cartTitleEl) cartTitleEl.textContent = `Panier (${cart.length})`;

  cart.forEach((item, index) => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    cartItemsEl.insertAdjacentHTML('beforeend', `
      <div class="cart__item" data-index="${index}">
        <img src="${item.image}" alt="${item.name}" class="cart__item-image" />
        <div class="cart__item-details">
          <h3 class="cart__item-brand">${item.brand}</h3>
          <h2 class="cart__item-name">${item.name}</h2>
          <div class="cart__item-size">
            <p class="cart__item-size-label">Taille:</p>
            <span class="cart__item-size-value">${item.size}</span>
          </div>
          <span class="cart__item-price">${itemTotal}€</span>
          <div class="cart__item-actions">
            <button class="cart__item-btn cart__item-btn--decrease" data-index="${index}">-</button>
            <span class="cart__item-quantity">${item.quantity}</span>
            <button class="cart__item-btn cart__item-btn--increase" data-index="${index}">+</button>
            <button class="cart__item-btn cart__item-btn--remove" data-index="${index}">Supprimer</button>
          </div>
        </div>
      </div>
    `);
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  subtotalEl.textContent   = subtotal.toFixed(2) + ' €';
  finalTotalEl.textContent = subtotal.toFixed(2) + ' €';
}

cartItemsEl.addEventListener('click', e => {
  const btn   = e.target.closest('button[data-index]');
  if (!btn) return;
  const index = parseInt(btn.dataset.index);
  const cart  = getCart();

  if (btn.classList.contains('cart__item-btn--increase')) {
    cart[index].quantity += 1;
  } else if (btn.classList.contains('cart__item-btn--decrease')) {
    cart[index].quantity -= 1;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
  } else if (btn.classList.contains('cart__item-btn--remove')) {
    cart.splice(index, 1);
  }

  saveCart(cart);
  renderCart();
});

document.getElementById('checkout-btn')?.addEventListener('click', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/pages/auth/login.html';
    return;
  }
  window.location.href = '/pages/checkout/commande.html';
});

renderCart();
