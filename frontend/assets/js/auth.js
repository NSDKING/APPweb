function togglePassword(icon) {
  const input = icon.previousElementSibling;
  input.type = input.type === 'password' ? 'text' : 'password';
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
