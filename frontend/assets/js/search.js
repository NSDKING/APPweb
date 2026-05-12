document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('search-btn');
  if (!searchBtn) return;

  const onSearchPage = window.location.pathname.toLowerCase().includes('/search/');

  searchBtn.addEventListener('click', () => {
    if (onSearchPage) {
      document.getElementById('search-page-input')?.focus();
    } else {
      window.location.href = '/pages/Search/search.html';
    }
  });
});
