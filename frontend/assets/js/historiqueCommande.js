/* =============================================================
   historiqueCommande.js — Historique des commandes ShoeBox
   ============================================================= */

const API_BASE = 'http://localhost:8000';

// ── Utilitaires ──────────────────────────────────────────────

function getToken() {
    return localStorage.getItem('shoebox_token') || null;
}

function getUser() {
    const raw = localStorage.getItem('shoebox_user');
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast--${type} toast--visible`;
    setTimeout(() => toast.classList.remove('toast--visible'), 3500);
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatPrice(amount) {
    return parseFloat(amount).toFixed(2).replace('.', ',') + ' €';
}

// ── Badges statut ────────────────────────────────────────────

const PAYMENT_LABELS = {
    paid: { label: 'Payé', css: 'paid' },
    pending: { label: 'En attente', css: 'pending' },
    failed: { label: 'Échoué', css: 'failed' },
};

const SHIPPING_LABELS = {
    pending: { label: 'Préparation', css: 'pending' },
    shipped: { label: 'Expédié', css: 'shipped' },
    delivered: { label: 'Livré', css: 'delivered' },
    canceled: { label: 'Annulé', css: 'canceled' },
};

function badge(map, key) {
    const info = map[key] ?? { label: key, css: 'pending' };
    return `<span class="badge badge--${info.css}">${info.label}</span>`;
}

// ── Rendu HTML d'une commande ─────────────────────────────────

function renderOrder(order) {
    // Produits de la commande
    const itemsHtml = (order.items || []).map(item => {
        const img = item.img_url
            ? `<img src="${item.img_url}" alt="${item.product_name}" width="64" height="64">`
            : `<div style="width:64px;height:64px;border-radius:8px;background:#f0f0f0;flex-shrink:0;"></div>`;

        return `
        <div class="produit">
            ${img}
            <div class="produit-info">
                <h4>${item.product_name ?? 'Produit'}</h4>
                <p>Qté : ${item.quantity}</p>
            </div>
            <span class="produit-price">${formatPrice(item.price * item.quantity)}</span>
        </div>`;
    }).join('');

    // Livraison
    const livraison = 0; // gratuite dans cet exemple
    const total = parseFloat(order.total_amount);

    return `
    <div class="order-card" data-id="${order.id}">
        <div class="order-header">
            <div class="order-meta">
                <span class="order-id">#${order.id}</span>
                <span class="order-date">${formatDate(order.created_at)}</span>
                <span class="order-total">${formatPrice(order.total_amount)}</span>
            </div>
            <div class="order-badges">
                ${badge(PAYMENT_LABELS, order.payment_status)}
                ${badge(SHIPPING_LABELS, order.shipping_status)}
                <svg class="order-chevron" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
            </div>
        </div>

        <div class="order-detail">
            <p class="detail-section-title">Adresse de livraison</p>
            <p class="detail-address">${order.shipping_address ?? '—'}</p>

            <p class="detail-section-title">Produits</p>
            ${itemsHtml || '<p style="font-size:.85rem;color:#999;">Détail non disponible.</p>'}

            <div class="detail-totaux recap-rows">
                <div class="recap-row">
                    <span>Sous-total</span>
                    <span>${formatPrice(total - livraison)}</span>
                </div>
                <div class="recap-row">
                    <span>Livraison</span>
                    <span>${livraison === 0 ? 'Gratuite' : formatPrice(livraison)}</span>
                </div>
                <div class="recap-row total">
                    <span>Total</span>
                    <span>${formatPrice(total)}</span>
                </div>
            </div>
        </div>
    </div>`;
}

// ── Données placeholder (utilisées si pas connecté / API KO) ─

const PLACEHOLDER_ORDERS = [
    {
        id: 1042,
        created_at: '2026-04-18T14:32:00',
        total_amount: 179.90,
        payment_status: 'paid',
        shipping_status: 'delivered',
        shipping_address: '12 rue de la Paix, 75001 Paris',
        items: [
            { product_name: 'Air Max Pulse', quantity: 1, price: 129.90, img_url: '' },
            { product_name: 'Chaussettes Sport (x3)', quantity: 1, price: 19.90, img_url: '' },
            { product_name: 'Lacets plats noirs', quantity: 1, price: 9.90, img_url: '' },
        ]
    },
    {
        id: 987,
        created_at: '2026-03-05T09:11:00',
        total_amount: 89.95,
        payment_status: 'paid',
        shipping_status: 'shipped',
        shipping_address: '12 rue de la Paix, 75001 Paris',
        items: [
            { product_name: 'Stan Smith Classic', quantity: 1, price: 89.95, img_url: '' },
        ]
    },
    {
        id: 856,
        created_at: '2026-01-22T17:48:00',
        total_amount: 219.80,
        payment_status: 'paid',
        shipping_status: 'delivered',
        shipping_address: '12 rue de la Paix, 75001 Paris',
        items: [
            { product_name: 'New Balance 574', quantity: 2, price: 109.90, img_url: '' },
        ]
    },
];

// ── Initialisation accordion ──────────────────────────────────

function initAccordion() {
    document.querySelectorAll('.order-header').forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.order-card');
            const wasOpen = card.classList.contains('open');
            // Ferme tout
            document.querySelectorAll('.order-card.open').forEach(c => c.classList.remove('open'));
            // Ouvre si pas déjà ouvert
            if (!wasOpen) card.classList.add('open');
        });
    });
}

// ── Chargement principal ──────────────────────────────────────

async function loadOrders() {
    const skeleton = document.getElementById('skeleton');
    const list = document.getElementById('orders-list');
    const emptyState = document.getElementById('empty-state');

    const token = getToken();
    const user = getUser();

    // Pas connecté → affiche les placeholders avec une notice
    if (!token || !user) {
        skeleton.style.display = 'none';
        showToast('Aperçu — connectez-vous pour voir vos vraies commandes.', 'error');
        list.innerHTML = PLACEHOLDER_ORDERS.map(renderOrder).join('');
        initAccordion();
        return;
    }

    // Connecté → appel API
    try {
        const res = await fetch(`${API_BASE}/api/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`Erreur ${res.status}`);

        const data = await res.json();
        const orders = data.orders ?? data;

        skeleton.style.display = 'none';

        if (!orders.length) {
            emptyState.style.display = 'flex';
            return;
        }

        list.innerHTML = orders.map(renderOrder).join('');
        initAccordion();

    } catch (err) {
        skeleton.style.display = 'none';
        showToast('Impossible de charger les commandes.', 'error');

        // Fallback placeholders en cas d'erreur réseau
        list.innerHTML = PLACEHOLDER_ORDERS.map(renderOrder).join('');
        initAccordion();
    }
}

document.addEventListener('DOMContentLoaded', loadOrders);