let favSet = new Set();

async function loadFavourites() {
  const res = await apiFetch('/favourites');
  if (res.success && res.data) {
    favSet = new Set(res.data.map(p => parseInt(p.id)));
  }
  updateFavCount();
}

function isFavourite(id) {
  return favSet.has(parseInt(id));
}

async function toggleFavouriteApi(productId) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/pages/auth/login.html';
    return null;
  }

  const id = parseInt(productId);
  console.log('[FAV] clicking product id:', id, '| currently fav:', isFavourite(id));

  if (isFavourite(id)) {
    const res = await apiFetch(`/favourites/${id}`, { method: 'DELETE' });
    console.log('[FAV] DELETE response:', res);
    if (res.success) {
      favSet.delete(id);
      updateFavCount();
      return false;
    }
  } else {
    const res = await apiFetch('/favourites', {
      method: 'POST',
      body: JSON.stringify({ product_id: id }),
    });
    console.log('[FAV] POST response:', res);
    if (res.success) {
      favSet.add(id);
      updateFavCount();
      return true;
    }
  }
  return isFavourite(id);
}

function updateFavCount() {
  const count = favSet.size;
  document.querySelectorAll('.navbar__fav-count').forEach(el => {
    el.textContent = count > 0 ? count : '';
  });
}
