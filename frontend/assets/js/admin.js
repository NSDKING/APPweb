// ===== Auth guard =====
(function () {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = '/pages/account/login.html'; return; }

  // Decode JWT payload (no verification — backend validates)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role !== 'admin') {
      window.location.href = '/';
      return;
    }
    document.getElementById('admin-username').textContent = payload.name || payload.email || '';
  } catch {
    window.location.href = '/';
  }
})();

// ===== Tab switching =====
document.querySelectorAll('.admin-nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');

    const titles = { products: 'Produits', users: 'Utilisateurs', carousel: 'Carrousel' };
    document.getElementById('admin-page-title').textContent = titles[tab] || '';

    if (tab === 'products') loadProducts();
    else if (tab === 'users') loadUsers();
    else if (tab === 'carousel') renderSlidesAdmin();
  });
});

// ===== Logout =====
document.getElementById('admin-logout-btn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
});

// ===== Modal helpers =====
function openModal(id) { document.getElementById(id).hidden = false; }
function closeModal(id) { document.getElementById(id).hidden = true; }

document.querySelectorAll('[data-close-modal]').forEach(el =>
  el.addEventListener('click', () => closeModal('product-modal'))
);
document.querySelectorAll('[data-close-confirm]').forEach(el =>
  el.addEventListener('click', () => closeModal('confirm-modal'))
);

document.getElementById('product-modal').addEventListener('click', e => {
  if (e.target.classList.contains('admin-modal__backdrop')) closeModal('product-modal');
});
document.getElementById('confirm-modal').addEventListener('click', e => {
  if (e.target.classList.contains('admin-modal__backdrop')) closeModal('confirm-modal');
});

// ===== PRODUCTS =====
let allProducts = [];

async function loadProducts() {
  const tbody = document.getElementById('products-tbody');
  tbody.innerHTML = '<tr><td colspan="9" class="admin-table__loading">Chargement…</td></tr>';

  const res = await apiFetch('/admin/products');
  if (!res.success) {
    tbody.innerHTML = `<tr><td colspan="9" class="admin-table__loading">${res.message || 'Erreur'}</td></tr>`;
    return;
  }
  allProducts = res.data || [];
  renderProductsTable(allProducts);
}

function renderProductsTable(products) {
  const tbody = document.getElementById('products-tbody');
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="admin-table__loading">Aucun produit.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.img_url
        ? `<img class="admin-table__img" src="${escHtml(p.img_url)}" alt="" loading="lazy" onerror="this.style.display='none'">`
        : `<span class="admin-table__img-placeholder"></span>`}</td>
      <td>${escHtml(p.name)}</td>
      <td>${escHtml(p.brand || '—')}</td>
      <td>${formatPrice(p.price)}${p.sale_price ? ` <s style="color:#52525b;font-size:12px">${formatPrice(p.sale_price)}</s>` : ''}</td>
      <td><span class="admin-badge ${p.is_promo ? 'admin-badge--yes' : 'admin-badge--no'}">${p.is_promo ? 'Oui' : 'Non'}</span></td>
      <td><span class="admin-badge ${p.is_new ? 'admin-badge--yes' : 'admin-badge--no'}">${p.is_new ? 'Oui' : 'Non'}</span></td>
      <td>${p.stock ?? 0}</td>
      <td>
        <div class="admin-table__actions">
          <button class="admin-btn admin-btn--ghost admin-btn--sm" onclick="openEditProduct(${p.id})">Modifier</button>
          <button class="admin-btn admin-btn--danger admin-btn--sm" onclick="openDeleteProduct(${p.id})">Supprimer</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Product search filter
document.getElementById('product-search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const filtered = allProducts.filter(p =>
    (p.name || '').toLowerCase().includes(q) ||
    (p.brand || '').toLowerCase().includes(q) ||
    (p.category || '').toLowerCase().includes(q)
  );
  renderProductsTable(filtered);
});

// ---- Add product ----
document.getElementById('open-add-product').addEventListener('click', () => {
  resetProductForm();
  document.getElementById('product-modal-title').textContent = 'Ajouter un produit';
  document.getElementById('product-submit-btn').textContent = 'Créer';
  openModal('product-modal');
});

function resetProductForm() {
  document.getElementById('product-id').value = '';
  document.getElementById('product-form').reset();
  document.getElementById('product-form-error').hidden = true;
}

// ---- Edit product ----
function openEditProduct(id) {
  const p = allProducts.find(x => x.id == id);
  if (!p) return;

  document.getElementById('product-id').value = p.id;
  document.getElementById('f-name').value = p.name || '';
  document.getElementById('f-brand').value = p.brand || '';
  document.getElementById('f-price').value = p.price || '';
  document.getElementById('f-sale-price').value = p.sale_price || '';
  document.getElementById('f-category').value = p.category || '';
  document.getElementById('f-stock').value = p.stock ?? 0;
  document.getElementById('f-img').value = p.img_url || '';
  document.getElementById('f-desc').value = p.description || '';
  document.getElementById('f-is-new').checked = !!p.is_new;
  document.getElementById('f-is-promo').checked = !!p.is_promo;

  document.getElementById('product-modal-title').textContent = 'Modifier le produit';
  document.getElementById('product-submit-btn').textContent = 'Enregistrer';
  document.getElementById('product-form-error').hidden = true;
  openModal('product-modal');
}

// ---- Form submit ----
document.getElementById('product-form').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = document.getElementById('product-form-error');
  errEl.hidden = true;

  const id = document.getElementById('product-id').value;
  const data = {
    name:        document.getElementById('f-name').value.trim(),
    brand:       document.getElementById('f-brand').value.trim(),
    price:       parseFloat(document.getElementById('f-price').value),
    sale_price:  document.getElementById('f-sale-price').value ? parseFloat(document.getElementById('f-sale-price').value) : null,
    category:    document.getElementById('f-category').value.trim(),
    stock:       parseInt(document.getElementById('f-stock').value) || 0,
    img_url:     document.getElementById('f-img').value.trim(),
    description: document.getElementById('f-desc').value.trim(),
    is_new:      document.getElementById('f-is-new').checked,
    is_promo:    document.getElementById('f-is-promo').checked,
  };

  const btn = document.getElementById('product-submit-btn');
  btn.disabled = true;

  const res = id
    ? await apiFetch(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    : await apiFetch('/admin/products', { method: 'POST', body: JSON.stringify(data) });

  btn.disabled = false;

  if (res.success) {
    closeModal('product-modal');
    loadProducts();
  } else {
    errEl.textContent = res.message || 'Une erreur est survenue.';
    errEl.hidden = false;
  }
});

// ---- Delete product ----
let pendingDeleteId = null;

function openDeleteProduct(id) {
  pendingDeleteId = id;
  openModal('confirm-modal');
}

document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  const btn = document.getElementById('confirm-delete-btn');
  btn.disabled = true;

  const res = await apiFetch(`/admin/products/${pendingDeleteId}`, { method: 'DELETE' });
  btn.disabled = false;
  closeModal('confirm-modal');

  if (res.success) {
    loadProducts();
  } else {
    alert(res.message || 'Erreur lors de la suppression.');
  }
  pendingDeleteId = null;
});

// ===== USERS =====
let allUsers = [];

async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="admin-table__loading">Chargement…</td></tr>';

  const res = await apiFetch('/admin/users');
  if (!res.success) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-table__loading">${res.message || 'Erreur'}</td></tr>`;
    return;
  }
  allUsers = res.data || [];
  renderUsersTable(allUsers);
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-tbody');
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="admin-table__loading">Aucun utilisateur.</td></tr>';
    return;
  }

  const token = localStorage.getItem('token');
  let selfId = null;
  try { selfId = JSON.parse(atob(token.split('.')[1])).sub; } catch {}

  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${escHtml(u.name)}</td>
      <td>${escHtml(u.email)}</td>
      <td><span class="admin-badge ${u.role === 'admin' ? 'admin-badge--admin' : 'admin-badge--user'}">${u.role}</span></td>
      <td>${formatDate(u.created_at)}</td>
      <td>
        ${u.id == selfId
          ? '<span style="color:#52525b;font-size:13px">Vous</span>'
          : u.role === 'admin'
            ? `<button class="admin-btn admin-btn--ghost admin-btn--sm" onclick="setUserRole(${u.id},'user')">Rétrograder</button>`
            : `<button class="admin-btn admin-btn--primary admin-btn--sm" onclick="setUserRole(${u.id},'admin')">Promouvoir admin</button>`
        }
      </td>
    </tr>
  `).join('');
}

// User search filter
document.getElementById('user-search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const filtered = allUsers.filter(u =>
    (u.name || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q)
  );
  renderUsersTable(filtered);
});

async function setUserRole(id, role) {
  const res = await apiFetch(`/admin/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });

  if (res.success) {
    loadUsers();
  } else {
    alert(res.message || 'Erreur lors du changement de rôle.');
  }
}

// ===== Helpers =====
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPrice(n) {
  return parseFloat(n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ===== CAROUSEL =====
let allSlides = [];

async function renderSlidesAdmin() {
  const list = document.getElementById('slides-list');
  list.innerHTML = '<p style="color:#52525b;text-align:center;padding:32px;">Chargement…</p>';

  const res = await apiFetch('/admin/carousel');
  if (!res.success) {
    list.innerHTML = `<p style="color:#f87171;text-align:center;padding:32px;">${res.message || 'Erreur'}</p>`;
    return;
  }
  allSlides = res.data || [];

  if (!allSlides.length) {
    list.innerHTML = '<p style="color:#52525b;text-align:center;padding:32px;">Aucune slide. Ajoutez-en une.</p>';
    return;
  }

  list.innerHTML = allSlides.map((s, i) => `
    <div class="admin-slide-card">
      ${s.image
        ? `<img class="admin-slide-card__thumb" src="${escHtml(s.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`
        : `<div class="admin-slide-card__thumb-placeholder"></div>`}
      <div class="admin-slide-card__info">
        <div class="admin-slide-card__title">${escHtml(s.title)}</div>
        <div class="admin-slide-card__subtitle">${escHtml(s.subtitle || '')}</div>
        <div class="admin-slide-card__desc">${escHtml(s.description || '')}</div>
      </div>
      <div class="admin-slide-card__order">
        <button class="admin-btn admin-btn--ghost admin-btn--sm" onclick="moveSlide(${s.id},'up')" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="admin-btn admin-btn--ghost admin-btn--sm" onclick="moveSlide(${s.id},'down')" ${i === allSlides.length - 1 ? 'disabled' : ''}>↓</button>
      </div>
      <div class="admin-slide-card__actions">
        <button class="admin-btn admin-btn--ghost admin-btn--sm" onclick="openEditSlide(${s.id})">Modifier</button>
        <button class="admin-btn admin-btn--danger admin-btn--sm" onclick="deleteSlide(${s.id})">Supprimer</button>
      </div>
    </div>
  `).join('');
}

async function moveSlide(id, direction) {
  await apiFetch(`/admin/carousel/${id}/move`, {
    method: 'PUT',
    body: JSON.stringify({ direction }),
  });
  renderSlidesAdmin();
}

async function deleteSlide(id) {
  const res = await apiFetch(`/admin/carousel/${id}`, { method: 'DELETE' });
  if (res.success) renderSlidesAdmin();
  else alert(res.message || 'Erreur lors de la suppression.');
}

function openEditSlide(id) {
  const s = allSlides.find(x => x.id === id);
  if (!s) return;
  document.getElementById('slide-index').value = id;
  document.getElementById('s-image').value = s.image || '';
  document.getElementById('s-title').value = s.title || '';
  document.getElementById('s-subtitle').value = s.subtitle || '';
  document.getElementById('s-description').value = s.description || '';
  document.getElementById('s-btn-text').value = s.buttonText || '';
  document.getElementById('s-link').value = s.link || '';
  updateSlidePreview(s.image || '');
  document.getElementById('slide-modal-title').textContent = 'Modifier la slide';
  document.getElementById('slide-submit-btn').textContent = 'Enregistrer';
  openModal('slide-modal');
}

function resetSlideForm() {
  document.getElementById('slide-index').value = '';
  document.getElementById('slide-form').reset();
  updateSlidePreview('');
}

function updateSlidePreview(url) {
  const preview = document.getElementById('slide-img-preview');
  if (url) {
    preview.style.backgroundImage = `url('${url}')`;
    preview.classList.add('visible');
  } else {
    preview.style.backgroundImage = '';
    preview.classList.remove('visible');
  }
}

document.getElementById('open-add-slide').addEventListener('click', () => {
  resetSlideForm();
  document.getElementById('slide-modal-title').textContent = 'Ajouter une slide';
  document.getElementById('slide-submit-btn').textContent = 'Ajouter';
  openModal('slide-modal');
});

document.getElementById('s-image').addEventListener('input', e => {
  updateSlidePreview(e.target.value.trim());
});

document.getElementById('slide-form').addEventListener('submit', async e => {
  e.preventDefault();
  const id  = document.getElementById('slide-index').value;
  const btn = document.getElementById('slide-submit-btn');
  const slide = {
    image:       document.getElementById('s-image').value.trim(),
    title:       document.getElementById('s-title').value.trim(),
    subtitle:    document.getElementById('s-subtitle').value.trim(),
    description: document.getElementById('s-description').value.trim(),
    buttonText:  document.getElementById('s-btn-text').value.trim(),
    link:        document.getElementById('s-link').value.trim(),
  };

  btn.disabled = true;
  const res = id
    ? await apiFetch(`/admin/carousel/${id}`, { method: 'PUT', body: JSON.stringify(slide) })
    : await apiFetch('/admin/carousel', { method: 'POST', body: JSON.stringify(slide) });
  btn.disabled = false;

  if (res.success) {
    closeModal('slide-modal');
    renderSlidesAdmin();
  } else {
    alert(res.message || 'Erreur.');
  }
});

document.querySelectorAll('[data-close-slide]').forEach(el =>
  el.addEventListener('click', () => closeModal('slide-modal'))
);
document.getElementById('slide-modal').addEventListener('click', e => {
  if (e.target.classList.contains('admin-modal__backdrop')) closeModal('slide-modal');
});

// ===== Init =====
document.addEventListener('DOMContentLoaded', loadProducts);
