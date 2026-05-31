document.addEventListener('DOMContentLoaded', () => {
  const navbar  = document.getElementById('navbar');
  const actions = document.getElementById('nav-actions');
  const navLinks = document.getElementById('nav-links');
  if (!actions) return;

  // ── Auth button ──
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
    loginBtn.href = '/pages/auth/login.html';
    loginBtn.className = 'navbar__icon-btn navbar__login';
    loginBtn.textContent = 'Se connecter';
    actions.appendChild(loginBtn);
  }

  // ── Hamburger (injected once, works on every page) ──
  if (navbar && navLinks) {
    const hamburger = document.createElement('button');
    hamburger.className = 'navbar__hamburger';
    hamburger.setAttribute('aria-label', 'Menu');
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    navbar.appendChild(hamburger);

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    // close menu on link click
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      })
    );
  }
});
