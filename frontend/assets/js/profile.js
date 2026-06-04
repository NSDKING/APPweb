// ── Garde ─────────────────────────────────────────────────────────────────────
(function () {
  if (!localStorage.getItem('token')) {
    window.location.href = '/pages/auth/login.html';
  }
})();

let originalData = {};

// ── Remplir les champs ────────────────────────────────────────────────────────
function fillFields(user) {
  document.getElementById('p-name').value    = user.name    || '';
  document.getElementById('p-email').value   = user.email   || '';
  document.getElementById('p-adresse').value = user.adresse || '';
  document.getElementById('p-since').value   = user.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : (user.since || '');
  originalData = { name: user.name || '', adresse: user.adresse || '' };
}

// ── Chargement du profil ──────────────────────────────────────────────────────
async function loadProfile() {
  const msg = document.getElementById('info-msg');

  // 1. Remplir immédiatement depuis le JWT (toujours disponible)
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // On a au minimum user_id depuis le JWT
      if (payload.user_id) {
        document.getElementById('p-name').placeholder  = 'Chargement…';
        document.getElementById('p-email').placeholder = 'Chargement…';
      }
    } catch (_) {}
  }

  // 2. Remplir depuis localStorage si disponible
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  if (stored.name || stored.email) {
    fillFields({
      name:    stored.name  || '',
      email:   stored.email || '',
      adresse: stored.adresse || '',
    });
  }

  // 3. Récupérer les données complètes depuis la BDD
  const res = await apiFetch('/users/me');

  if (res && res.success && res.data) {
    fillFields(res.data);
    // Mettre à jour le localStorage avec les données fraîches
    localStorage.setItem('user', JSON.stringify({
      ...stored,
      id:      res.data.id,
      name:    res.data.name,
      email:   res.data.email,
      role:    res.data.role,
      adresse: res.data.adresse,
    }));
  } else if (res?.expired) {
    window.location.href = '/pages/auth/login.html';
  } else {
    // API inaccessible — montrer un message mais garder les données locales
    const apiError = res?.message || 'Impossible de joindre le serveur.';
    showMsg(msg, '⚠ ' + apiError + (stored.name ? ' (données locales affichées)' : ''), 'err');

    if (!stored.name && !stored.email) {
      // Aucune donnée du tout — forcer reconnexion
      showMsg(msg, 'Session introuvable. Veuillez vous <a href="/pages/auth/login.html">reconnecter</a>.', 'err');
    }
  }
}

// ── Mode édition ─────────────────────────────────────────────────────────────
function toggleEdit() {
  const nameEl    = document.getElementById('p-name');
  const adresseEl = document.getElementById('p-adresse');
  const btnEdit   = document.getElementById('btn-edit');
  const btnCancel = document.getElementById('btn-cancel');

  if (nameEl.disabled) {
    // Passer en mode édition
    nameEl.disabled    = false;
    adresseEl.disabled = false;
    nameEl.focus();
    btnEdit.textContent      = 'Enregistrer';
    btnCancel.style.display  = '';
  } else {
    // Enregistrer
    saveProfile();
  }
}

async function saveProfile() {
  const name    = document.getElementById('p-name').value.trim();
  const adresse = document.getElementById('p-adresse').value.trim();
  const msg     = document.getElementById('info-msg');
  const btn     = document.getElementById('btn-edit');

  if (!name) { showMsg(msg, 'Le nom ne peut pas être vide.', 'err'); return; }

  btn.disabled    = true;
  btn.textContent = 'Enregistrement…';

  const res = await apiFetch('/users/me', {
    method: 'PUT',
    body: JSON.stringify({ name, adresse }),
  });

  btn.disabled = false;

  if (res?.success) {
    originalData = { name, adresse };
    disableEdit();
    showMsg(msg, '✓ Profil mis à jour avec succès.', 'ok');
    // Mettre à jour le localStorage
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...stored, name }));
  } else {
    btn.textContent = 'Enregistrer';
    showMsg(msg, res?.message || 'Erreur lors de la mise à jour.', 'err');
  }
}

function cancelEdit() {
  document.getElementById('p-name').value    = originalData.name;
  document.getElementById('p-adresse').value = originalData.adresse;
  disableEdit();
}

function disableEdit() {
  document.getElementById('p-name').disabled    = true;
  document.getElementById('p-adresse').disabled = true;
  document.getElementById('btn-edit').textContent    = 'Modifier';
  document.getElementById('btn-cancel').style.display = 'none';
}

// ── Changement de mot de passe ────────────────────────────────────────────────
async function changePassword() {
  const current = document.getElementById('pw-current').value;
  const newPw   = document.getElementById('pw-new').value;
  const confirm = document.getElementById('pw-confirm').value;
  const msg     = document.getElementById('pw-msg');
  const btn     = document.getElementById('btn-pw');

  showMsg(msg, '', '');

  if (!current)          { showMsg(msg, 'Saisissez votre mot de passe actuel.', 'err'); return; }
  if (!newPw)            { showMsg(msg, 'Saisissez un nouveau mot de passe.', 'err'); return; }
  if (newPw.length < 8)  { showMsg(msg, 'Le nouveau mot de passe doit contenir au moins 8 caractères.', 'err'); return; }
  if (!/[A-Z]/.test(newPw)) { showMsg(msg, 'Ajoutez au moins une lettre majuscule.', 'err'); return; }
  if (!/[0-9]/.test(newPw)) { showMsg(msg, 'Ajoutez au moins un chiffre.', 'err'); return; }
  if (newPw !== confirm)     { showMsg(msg, 'Les mots de passe ne correspondent pas.', 'err'); return; }

  btn.disabled    = true;
  btn.textContent = 'Modification…';

  const res = await apiFetch('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify({ current_password: current, new_password: newPw }),
  });

  btn.disabled    = false;
  btn.textContent = 'Changer le mot de passe';

  if (res?.success) {
    showMsg(msg, '✓ Mot de passe modifié avec succès.', 'ok');
    document.getElementById('pw-current').value = '';
    document.getElementById('pw-new').value     = '';
    document.getElementById('pw-confirm').value = '';
    checkPwRules('');
  } else {
    showMsg(msg, res?.message || 'Erreur — vérifiez votre mot de passe actuel.', 'err');
  }
}

// ── Règles mot de passe en temps réel ────────────────────────────────────────
function checkPwRules(v) {
  setRule('pw-rule-len',   v.length >= 8);
  setRule('pw-rule-upper', /[A-Z]/.test(v));
  setRule('pw-rule-digit', /[0-9]/.test(v));
}

function setRule(id, ok) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('ok', ok);
}

// ── Toggle visibilité mot de passe ────────────────────────────────────────────
function toggleVis(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.classList.toggle('on', show);
}

// ── Déconnexion ───────────────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

// ── Utilitaire message ────────────────────────────────────────────────────────
function showMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className   = type ? `toast-bar toast-bar--${type}` : 'toast-bar';
  if (type && text) {
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = 'toast-bar'; }, 5000);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadProfile);
