(() => {
  const search = document.getElementById('ucSearch');
  const grid = document.getElementById('ucGrid');
  const empty = document.getElementById('ucEmpty');
  const count = document.getElementById('ucCount');
  const chips = Array.from(document.querySelectorAll('.chip'));
  let activeCat = 'all';

  const cards = Array.from(grid.querySelectorAll('.uc-card'));

  function apply() {
    const q = (search.value || '').trim().toLowerCase();
    let shown = 0;
    cards.forEach(card => {
      const cat = card.dataset.cat;
      const hay = card.dataset.title || '';
      const okCat = activeCat === 'all' || cat === activeCat;
      const okQ = !q || hay.includes(q);
      const show = okCat && okQ;
      card.style.display = show ? '' : 'none';
      if (show) shown++;
    });
    count.textContent = shown;
    empty.style.display = shown ? 'none' : 'block';
  }

  chips.forEach(btn => {
    btn.addEventListener('click', () => {
      chips.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeCat = btn.dataset.cat;
      apply();
    });
  });

  search.addEventListener('input', apply);
  apply();
})();

