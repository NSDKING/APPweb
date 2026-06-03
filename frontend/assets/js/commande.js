/* =============================================================
   commande.js — dépend de api.js (getCart, saveCart, apiFetch)
   ============================================================= */

// ── Utilitaires ──────────────────────────────────────────────

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast--${type} toast--visible`;
  setTimeout(() => toast.classList.remove('toast--visible'), 3500);
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function formatPrice(amount) {
  return parseFloat(amount).toFixed(2).replace('.', ',') + ' €';
}

// ── Rendu du panier ───────────────────────────────────────────

function renderCartItem(item) {
  const img = item.image
    ? `<img src="${item.image}" alt="${item.name}" width="64" height="64" style="object-fit:cover;border-radius:8px;flex-shrink:0;">`
    : `<div style="width:64px;height:64px;border-radius:8px;background:#f4f4f5;flex-shrink:0;"></div>`;

  const detail = [
    item.size  ? `Taille ${item.size}` : null,
    item.color || null,
    `Qté ${item.quantity}`,
  ].filter(Boolean).join(' · ');

  return `
    <div class="produit">
      ${img}
      <div class="produit-info">
        <h4>${item.name}</h4>
        <p>${detail}</p>
      </div>
      <span class="produit-price">${formatPrice(item.price * item.quantity)}</span>
    </div>`;
}

function renderCart() {
  const listEl   = document.getElementById('cart-items-list');
  const subtotEl = document.getElementById('subtotal');
  const totalEl  = document.getElementById('total-amount');
  const btnPay   = document.getElementById('btn-pay');

  const items = getCart(); // from api.js

  if (!items.length) {
    listEl.innerHTML     = '<p style="color:#888;text-align:center;padding:24px 0;">Votre panier est vide.</p>';
    subtotEl.textContent = formatPrice(0);
    totalEl.textContent  = formatPrice(0);
    btnPay.textContent   = 'Panier vide';
    btnPay.disabled      = true;
    return;
  }

  listEl.innerHTML = items.map(renderCartItem).join('');

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  subtotEl.textContent = formatPrice(total);
  totalEl.textContent  = formatPrice(total);
  btnPay.textContent   = `Payer ${formatPrice(total)}`;
  btnPay.disabled      = false;
}

// ── Préremplissage ───────────────────────────────────────────

function parseAdresse(adresse = '') {
  const cpMatch = adresse.match(/\b(\d{5})\b/);
  if (!cpMatch) return { rue: adresse, ville: '', cp: '' };
  const cp    = cpMatch[1];
  const idx   = adresse.indexOf(cp);
  const rue   = adresse.slice(0, idx).replace(/,\s*$/, '').trim();
  const ville = adresse.slice(idx + cp.length).replace(/^[\s,]+/, '').trim();
  return { rue, cp, ville };
}

function fillForm(profile) {
  const { rue, cp, ville } = parseAdresse(profile.adresse ?? '');
  document.getElementById('field-nom').value     = profile.name  ?? '';
  document.getElementById('field-email').value   = profile.email ?? '';
  document.getElementById('field-adresse').value = rue || profile.adresse || '';
  document.getElementById('field-ville').value   = ville;
  document.getElementById('field-cp').value      = cp;
}

function initAutofill() {
  const user    = getUser();
  const banner  = document.getElementById('autofill-banner');
  const nameSpan = document.getElementById('autofill-username');
  const btn     = document.getElementById('btn-autofill');

  if (!user) {
    banner.style.display = 'none';
    return;
  }

  nameSpan.textContent = `Connecté en tant que ${user.name || user.email}`;
  banner.style.display = 'flex';

  btn.addEventListener('click', async () => {
    btn.disabled    = true;
    btn.textContent = 'Chargement…';
    try {
      const res = await apiFetch('/users/me'); // from api.js — attaches Bearer token automatically
      fillForm(res.user ?? res);
      showToast('Informations préremplies ✓');
    } catch {
      fillForm(user); // fallback to stored login data
      showToast('Prérempli depuis votre session.');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Préremplir mes infos';
    }
  });
}

// ── Soumission ────────────────────────────────────────────────

async function submitCommande(event) {
  event.preventDefault();

  const btn = document.getElementById('btn-pay');
  btn.disabled    = true;
  btn.textContent = 'Traitement…';

  const items = getCart(); // from api.js
  if (!items.length) {
    showToast('Votre panier est vide.', 'error');
    btn.disabled    = false;
    btn.textContent = 'Panier vide';
    return;
  }

  const nom     = document.getElementById('field-nom').value.trim();
  const email   = document.getElementById('field-email').value.trim();
  const adresse = document.getElementById('field-adresse').value.trim();
  const ville   = document.getElementById('field-ville').value.trim();
  const cp      = document.getElementById('field-cp').value.trim();
  const carte   = document.getElementById('field-carte').value.replace(/\s/g, '');
  const expiry  = document.getElementById('field-expiry').value.trim();

  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const payload = {
    shipping: { nom, email, adresse: `${adresse}, ${cp} ${ville}` },
    payment:  { carte_last4: carte.slice(-4), expiry },
    cart:     items.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price })),
    total_amount: totalAmount,
  };

  // ── Décommente quand l'API /api/orders est prête ──
  /*
  try {
    const data = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(payload) });
    saveCart([]); // from api.js — clears cart + resets navbar counter
    showToast('Commande confirmée ! Redirection…');
    setTimeout(() => window.location.href = `confirmation.html?email=${encodeURIComponent(email)}`, 1800);
  } catch (err) {
    showToast(err.message || 'Une erreur est survenue.', 'error');
    btn.disabled    = false;
    btn.textContent = `Payer ${formatPrice(totalAmount)}`;
  }
  */

  // ── Simulation ──
  saveCart([]); // from api.js
  showToast('Commande confirmée ! Redirection…');
  setTimeout(() => {
    window.location.href = `confirmation.html?email=${encodeURIComponent(email)}`;
  }, 1800);
}

// ── Init ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  initAutofill();

  document.getElementById('field-carte')?.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
  });

  document.getElementById('field-expiry')?.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
  });
});
