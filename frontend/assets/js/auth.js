function togglePassword(icon) {
  const input = icon.previousElementSibling;
  input.type = input.type === 'password' ? 'text' : 'password';
}

// FORGOT PASSWORD PAGE
const forgotForm = document.getElementById('forgot-form');
const resetForm  = document.getElementById('reset-form');

if (forgotForm || resetForm) {
  const token = new URLSearchParams(window.location.search).get('token');

  if (token) {
    // Show reset form
    document.getElementById('forgotForm').classList.add('hidden');
    document.getElementById('resetForm').classList.remove('hidden');
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email   = document.getElementById('forgot-email').value.trim();
      const errorEl = document.getElementById('forgot-error');
      const succEl  = document.getElementById('forgot-success');
      const btn     = document.getElementById('forgot-btn');

      errorEl.style.display = 'none';
      succEl.style.display  = 'none';
      btn.disabled = true;

      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      btn.disabled = false;

      if (!res.success) {
        errorEl.textContent    = res.message;
        errorEl.style.display  = 'block';
        return;
      }

      succEl.textContent   = res.message;
      succEl.style.display = 'block';
      forgotForm.style.display = 'none';

      // Dev mode: show the reset link directly on the page
      if (res.data?.reset_url) {
        const linkEl = document.createElement('p');
        linkEl.style.cssText = 'font-size:13px;color:#555;margin-top:12px;word-break:break-all;';
        linkEl.innerHTML = '[DEV] Lien de reinitialisation :<br><a href="' + res.data.reset_url + '">' + res.data.reset_url + '</a>';
        document.getElementById('forgotForm').appendChild(linkEl);
      }
    });
  }

  if (resetForm) {
    resetForm.addEventListener('submit', async e => {
      e.preventDefault();
      const password  = document.getElementById('newPass').value;
      const confirm   = document.getElementById('confirmPass').value;
      const errorEl   = document.getElementById('reset-error');
      const succEl    = document.getElementById('reset-success');
      const btn       = document.getElementById('reset-btn');

      errorEl.style.display = 'none';
      succEl.style.display  = 'none';

      if (password !== confirm) {
        errorEl.textContent   = 'Les mots de passe ne correspondent pas.';
        errorEl.style.display = 'block';
        return;
      }

      btn.disabled = true;

      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });

      btn.disabled = false;

      if (!res.success) {
        errorEl.textContent   = res.message;
        errorEl.style.display = 'block';
        return;
      }

      succEl.textContent   = res.message;
      succEl.style.display = 'block';
      resetForm.style.display = 'none';

      setTimeout(() => { window.location.href = './login.html'; }, 2000);
    });
  }
}

// LOGIN
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');

    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!res.success) {
      errorEl.textContent = res.message;
      errorEl.style.display = 'block';
      return;
    }

    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    window.location.href = '/';
  });
}

// REGISTER
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const nom      = document.getElementById('reg-nom').value.trim();
    const prenom   = document.getElementById('reg-prenom').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;
    const errorEl  = document.getElementById('register-error');

    if (password !== confirm) {
      errorEl.textContent = 'Les mots de passe ne correspondent pas.';
      errorEl.style.display = 'block';
      return;
    }

    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: `${prenom} ${nom}`, email, password }),
    });

    if (!res.success) {
      errorEl.textContent = res.message;
      errorEl.style.display = 'block';
      return;
    }

    localStorage.setItem('token', res.data.token);
    window.location.href = '/';
  });
}
