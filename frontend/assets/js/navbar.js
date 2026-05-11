document.addEventListener('DOMContentLoaded', () => {
  const actions = document.getElementById('nav-actions');
  if (!actions) return;

  const user  = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  if (token && user) {
    const authBtn = document.createElement('div');
    authBtn.className = 'navbar__user';
    authBtn.innerHTML = `
      <span class="navbar__username">Bonjour, ${user.name.split(' ')[0]}</span>
      <button id="logout-btn" class="navbar__icon-btn navbar__logout">Déconnexion</button>
    `;
    actions.appendChild(authBtn);

    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    });
  } else {
    const loginBtn = document.createElement('a');
    loginBtn.href = 'D:/code/appweb/APPweb/frontend/pages/auth/login.html';
    loginBtn.className = 'navbar__icon-btn navbar__login';
    loginBtn.textContent = 'Se connecter';
    actions.appendChild(loginBtn);
  }
});
