document.addEventListener('DOMContentLoaded', () => {
  const input   = document.getElementById('search-page-input');
  const clearBtn = document.getElementById('search-page-clear');
  if (!input) return;

  input.value = searchQuery || '';
  updateClear();

  input.addEventListener('input', () => {
    searchQuery = input.value.trim();
    updateClear();
    render();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value = '';
      searchQuery = '';
      updateClear();
      render();
    }
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    searchQuery = '';
    updateClear();
    render();
    input.focus();
  });

  function updateClear() {
    if (clearBtn) clearBtn.style.display = input.value ? 'flex' : 'none';
  }

  input.focus();
});
