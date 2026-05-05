/* =============================================================
   commande.js — Logique de la page de commande ShoeBox
   ============================================================= */

const API_BASE = 'http://localhost:8000'; // adapte selon ton environnement

// ── Utilitaires ──────────────────────────────────────────────

/** Affiche un toast temporaire */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast--${type} toast--visible`;
  setTimeout(() => toast.classList.remove('toast--visible'), 3500);
}

/** Récupère le token JWT stocké lors de la connexion */
function getToken() {
  return localStorage.getItem('shoebox_token') || null;
}

/** Retourne les données de l'utilisateur connecté (stockées au login) */
function getUser() {
  const raw = localStorage.getItem('shoebox_user');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

/** Récupère le panier depuis localStorage */
function getCart() {
  const raw = localStorage.getItem('shoebox_cart');
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

// ── Préremplissage ───────────────────────────────────────────

/**
 * Si un utilisateur est connecté, affiche le bandeau de préremplissage.
 * Au clic sur le bouton, appelle l'API pour récupérer son profil complet
 * et remplit les champs de livraison.
 */
function initAutofill() {
  const user = getUser();
  if (!user) return; // pas connecté → bandeau reste masqué

  const banner = document.getElementById('autofill-banner');
  const nameSpan = document.getElementById('autofill-username');
  const btn = document.getElementById('btn-autofill');

  nameSpan.textContent = `Connecté en tant que ${user.name || user.email}`;
  banner.style.display = 'flex';

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Chargement…';

    try {
      // Récupère le profil à jour depuis l'API
      const res = await fetch(`${API_BASE}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      if (!res.ok) throw new Error('Impossible de récupérer le profil.');

      const data = await res.json();
      const profile = data.user ?? data; // souple selon la forme de réponse

      // Décompose le champ adresse en ville + code postal si nécessaire
      const adresseParts = parseAdresse(profile.adresse ?? '');

      document.getElementById('field-nom').value = profile.name ?? '';
      document.getElementById('field-adresse').value = adresseParts.rue ?? profile.adresse ?? '';
      document.getElementById('field-ville').value = adresseParts.ville ?? '';
      document.getElementById('field-cp').value = adresseParts.cp ?? '';

      showToast('Informations préremplies ✓');
    } catch (err) {
      showToast(err.message || 'Erreur lors du préremplissage.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Préremplir mes infos';
    }
  });
}

/**
 * Tente de décomposer une adresse libre en rue / ville / CP.
 * Format attendu (best-effort) : "12 rue de la Paix, 75001 Paris"
 */
function parseAdresse(adresse) {
  // Cherche un code postal à 5 chiffres
  const cpMatch = adresse.match(/\b(\d{5})\b/);
  if (!cpMatch) return { rue: adresse, ville: '', cp: '' };

  const cp = cpMatch[1];
  const idx = adresse.indexOf(cp);
  const avant = adresse.slice(0, idx).replace(/,\s*$/, '').trim();
  const apres = adresse.slice(idx + cp.length).replace(/^[\s,]+/, '').trim();

  return { rue: avant, ville: apres, cp };
}

// ── Soumission de commande ────────────────────────────────────

async function submitCommande(event) {
  event.preventDefault();

  const btn = document.getElementById('btn-pay');
  btn.disabled = true;
  btn.textContent = 'Traitement…';

  // Collecte des champs du formulaire
  const nom = document.getElementById('field-nom').value.trim();
  const adresse = document.getElementById('field-adresse').value.trim();
  const ville = document.getElementById('field-ville').value.trim();
  const codePostal = document.getElementById('field-cp').value.trim();
  const carte = document.getElementById('field-carte').value.replace(/\s/g, '');
  const expiry = document.getElementById('field-expiry').value.trim();
  const cvv = document.getElementById('field-cvv').value.trim();

  // Adresse de livraison complète (format attendu par la BDD)
  const shippingAddress = `${adresse}, ${codePostal} ${ville}`;

  // Panier courant
  const cart = getCart();
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0) || 400;

  const payload = {
    shipping: {
      nom,
      adresse: shippingAddress,
    },
    payment: {
      // ⚠️  En production, n'envoie JAMAIS les données de carte en clair.
      // Utilise Stripe.js / tokenisation côté client et envoie uniquement le token.
      carte_last4: carte.slice(-4),
      expiry,
    },
    cart: cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    })),
    total_amount: totalAmount,
  };

  console.log('Payload de commande :', JSON.stringify(payload, null, 2)); // pour debug

  /*try {
    const headers = { 'Content-Type': 'application/json' };
    const token   = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/orders`, {
      method  : 'POST',
      headers,
      body    : JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Erreur lors de la commande.');

    // Vide le panier et redirige vers la confirmation
    localStorage.removeItem('shoebox_cart');
    showToast('Commande confirmée ! Redirection…');
    setTimeout(() => {
      window.location.href = `confirmation.html?order_id=${data.order_id ?? ''}`;
    }, 1800);

  } catch (err) {
    showToast(err.message || 'Une erreur est survenue.', 'error');
    btn.disabled = false;
    btn.textContent = `Payer ${totalAmount}€`;
  }*/
}

// ── Formatage carte ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initAutofill();

  // Formatage automatique du numéro de carte (groupes de 4)
  const carteInput = document.getElementById('field-carte');
  if (carteInput) {
    carteInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 16);
      e.target.value = val.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  // Formatage MM/AA
  const expiryInput = document.getElementById('field-expiry');
  if (expiryInput) {
    expiryInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
      e.target.value = val;
    });
  }
});
