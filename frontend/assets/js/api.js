const API_BASE = '/api';

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp < Math.floor(Date.now() / 1000);
  } catch { return true; }
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');

  // Nettoyer un token expiré
  if (token && isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: false, message: 'Session expirée. Veuillez vous reconnecter.', expired: true };
  }

  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(API_BASE + path, { ...options, headers });
    return await res.json();
  } catch (e) {
    return { success: false, message: 'Impossible de joindre le serveur.' };
  }
}

function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = count);
}

document.addEventListener('DOMContentLoaded', updateCartCount);
