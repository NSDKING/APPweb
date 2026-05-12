/* =============================================================
   commande.js — Logique de la page de commande ShoeBox
   ============================================================= */

const API_BASE = '/api';

// ── Placeholders ─────────────────────────────────────────────
// Utilisés quand le panier est vide (démo / navigation directe)
// Remplacer par de vrais produits issus de la BDD une fois l'API prête.

const PLACEHOLDER_PRODUCTS = [
  {
    id: 1,
    name: 'Nike Air Force 1 \'07',
    size: '42',
    color: 'Blanc',
    quantity: 1,
    price: 119,
    image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?q=80&w=200',
  },
  {
    id: 2,
    name: 'Air Jordan 1 Retro High',
    size: '41',
    color: 'Noir / Rouge',
    quantity: 1,
    price: 189,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200',
  },
];

// Utilisateur placeholder (affiché dans le bandeau si localStorage vide)
const PLACEHOLDER_USER = {
  id: null,
  name: 'Jean Dupont',
  email: 'jean.dupont@email.com',
  adresse: '12 rue de la Paix, 75001 Paris',
};

// ── Utilitaires ──────────────────────────────────────────────

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast--${type} toast--visible`;
  setTimeout(() => toast.classList.remove('toast--visible'), 3500);
}

function getToken() {
  return localStorage.getItem('token') || null;
}

function getUser() {
  const raw = localStorage.getItem('user');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function getCart() {
  const raw = localStorage.getItem('cart');
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function formatPrice(amount) {
  return parseFloat(amount).toFixed(2).replace('.', ',') + ' €';
}

// ── Rendu du panier ───────────────────────────────────────────

/**
 * Construit le HTML d'un produit dans le récapitulatif.
 * Fonctionne avec les items du localStorage ET les placeholders.
 */
function renderCartItem(item) {
  const img = item.image
    ? `<img src="${item.image}" alt="${item.name}" width="64" height="64" style="object-fit:cover;border-radius:8px;">`
    : `<div style="width:64px;height:64px;border-radius:8px;background:#f0f0f0;flex-shrink:0;"></div>`;

  const detail = [
    item.size ? `Taille ${item.size}` : null,
    item.color || null,
    `Qté ${item.quantity}`,
  ].filter(Boolean).join(' · ');

  const lineTotal = item.price * item.quantity;

  return `
    <div class="produit">
        ${img}
        <div class="produit-info">
            <h4>${item.name}</h4>
            <p>${detail}</p>
        </div>
        <span class="produit-price">${formatPrice(lineTotal)}</span>
    </div>`;
}

/**
 * Affiche les produits du panier (ou les placeholders si vide).
 * Met à jour le sous-total, le total et le bouton Payer.
 */
function renderCart() {
  const listEl = document.getElementById('cart-items-list');
  const subtotEl = document.getElementById('subtotal');
  const totalEl = document.getElementById('total-amount');
  const btnPay = document.getElementById('btn-pay');

  let items = getCart();
  let isPlaceholder = false;

  if (!items.length) {
    items = PLACEHOLDER_PRODUCTS;
    isPlaceholder = true;
  }

  listEl.innerHTML = items.map(renderCartItem).join('');

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  subtotEl.textContent = formatPrice(total);
  totalEl.textContent = formatPrice(total);
  btnPay.textContent = `Payer ${formatPrice(total)}`;

  // Mise à jour du compteur navbar
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    const qty = items.reduce((s, i) => s + i.quantity, 0);
    cartCount.textContent = qty;
  }

  if (isPlaceholder) {
    // Petite notice discrète sous les produits
    listEl.insertAdjacentHTML('beforeend', `
            <p style="font-size:.75rem;color:#bbb;text-align:center;padding:.5rem 0;">
                Aperçu — ajoutez des produits depuis la boutique
            </p>`);
  }
}

// ── Préremplissage ───────────────────────────────────────────

/**
 * Décompose une adresse "12 rue de la Paix, 75001 Paris"
 * en { rue, cp, ville }.
 */
function parseAdresse(adresse) {
  const cpMatch = adresse.match(/\b(\d{5})\b/);
  if (!cpMatch) return { rue: adresse, ville: '', cp: '' };
  const cp = cpMatch[1];
  const idx = adresse.indexOf(cp);
  const rue = adresse.slice(0, idx).replace(/,\s*$/, '').trim();
  const ville = adresse.slice(idx + cp.length).replace(/^[\s,]+/, '').trim();
  return { rue, cp, ville };
}

/**
 * Remplit le formulaire à partir d'un objet profil.
 */
function fillForm(profile) {
  const adresseParts = parseAdresse(profile.adresse ?? '');
  document.getElementById('field-nom').value = profile.name ?? '';
  document.getElementById('field-email').value = profile.email ?? '';
  document.getElementById('field-adresse').value = adresseParts.rue || profile.adresse || '';
  document.getElementById('field-ville').value = adresseParts.ville || '';
  document.getElementById('field-cp').value = adresseParts.cp || '';
}

/**
 * Initialise le bandeau autofill.
 * - Si connecté → affiche le vrai nom et préremplie depuis l'API
 * - Sinon → affiche le placeholder user
 */
function initAutofill() {
  const user = getUser();
  const banner = document.getElementById('autofill-banner');
  const nameSpan = document.getElementById('autofill-username');
  const btn = document.getElementById('btn-autofill');

  // Détermine le profil à afficher (réel ou placeholder)
  const profile = user ?? PLACEHOLDER_USER;
  const isReal = !!user;

  nameSpan.textContent = `Connecté en tant que ${profile.name || profile.email}`;
  banner.style.display = 'flex';

  if (!isReal) {
    // Mode démo : préremplissage immédiat avec le placeholder
    nameSpan.textContent = `Aperçu — ${PLACEHOLDER_USER.name}`;
    btn.addEventListener('click', () => {
      fillForm(PLACEHOLDER_USER);
      showToast('Infos de démo préremplies (non connecté)');
    });
    return;
  }

  // Mode connecté : appel API pour récupérer le profil à jour
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Chargement…';
    try {
      const res = await fetch(`${API_BASE}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Impossible de récupérer le profil.');
      const data = await res.json();
      fillForm(data.user ?? data);
      showToast('Informations préremplies ✓');
    } catch (err) {
      // Fallback sur les données stockées au login
      fillForm(user);
      showToast('Prérempli depuis votre session.', 'success');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Préremplir mes infos';
    }
  });
}

// ── Soumission de commande ────────────────────────────────────

async function submitCommande(event) {
  event.preventDefault();

  const btn = document.getElementById('btn-pay');
  btn.disabled = true;
  btn.textContent = 'Traitement…';

  const nom = document.getElementById('field-nom').value.trim();
  const email = document.getElementById('field-email').value.trim();
  const adresse = document.getElementById('field-adresse').value.trim();
  const ville = document.getElementById('field-ville').value.trim();
  const cp = document.getElementById('field-cp').value.trim();
  const carte = document.getElementById('field-carte').value.replace(/\s/g, '');
  const expiry = document.getElementById('field-expiry').value.trim();

  const shippingAddress = `${adresse}, ${cp} ${ville}`;

  let items = getCart();
  if (!items.length) items = PLACEHOLDER_PRODUCTS; // démo

  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const payload = {
    shipping: { nom, email, adresse: shippingAddress },
    payment: { carte_last4: carte.slice(-4), expiry },
    cart: items.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    })),
    total_amount: totalAmount,
  };

  console.log('Payload commande :', JSON.stringify(payload, null, 2));

  // ── Décommente ce bloc quand l'API /api/orders est prête ──
  /*
  try {
      const headers = { 'Content-Type': 'application/json' };
      const token = getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/orders`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la commande.');

      localStorage.removeItem('cart');
      showToast('Commande confirmée ! Redirection…');
      setTimeout(() => {
          window.location.href = `confirmation.html?email=${encodeURIComponent(email)}`;
      }, 1800);

  } catch (err) {
      showToast(err.message || 'Une erreur est survenue.', 'error');
      btn.disabled = false;
      btn.textContent = `Payer ${formatPrice(totalAmount)}`;
  }
  */

  // ── Simulation (retirer quand l'API est active) ──
  localStorage.removeItem('cart');
  showToast('Commande confirmée ! Redirection…');
  setTimeout(() => {
    window.location.href = `confirmation.html?email=${encodeURIComponent(email)}`;
  }, 1800);
}

// ── Formatage champs carte ────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  initAutofill();

  // Numéro de carte : groupes de 4
  const carteInput = document.getElementById('field-carte');
  if (carteInput) {
    carteInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 16);
      e.target.value = val.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  // Expiration MM/AA
  const expiryInput = document.getElementById('field-expiry');
  if (expiryInput) {
    expiryInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
      e.target.value = val;
    });
  }
});