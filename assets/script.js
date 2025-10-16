document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.grid-produtos');

  // --- CARREGA PRODUTOS ---
  fetch('produtos.json')
    .then(r => r.json())
    .then(produtos => {
      produtos.forEach(p => {
        container.innerHTML += `
          <div class="bg-white rounded-lg shadow-md overflow-hidden flex flex-col" data-categoria="${p.categoria}">
            <img src="${p.imagem}" alt="${p.nome}" class="w-full h-48 object-cover">
            <div class="p-4 flex flex-col flex-grow">
              <h3 class="text-lg font-bold mb-2">${p.nome}</h3>
              <p class="text-gray-600 mb-4 flex-grow">${p.descricao}</p>
              <a href="produtos/${p.id}.html" target="_blank" class="bg-blue-500 text-white px-4 py-2 rounded text-center hover:bg-blue-600">Ver Produto</a>
            </div>
          </div>
        `;
      });

      // --- FILTROS ---
      const filterBtns = document.querySelectorAll('.filter-btn');
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const filtro = btn.dataset.filter;
          const produtosCards = document.querySelectorAll('.grid-produtos > div');
          produtosCards.forEach(p => {
            if (filtro === 'all' || p.dataset.categoria === filtro) {
              p.classList.remove('hidden');
            } else {
              p.classList.add('hidden');
            }
          });
        });
      });

      // --- PESQUISA ---
      const searchInput = document.getElementById('search-input');
      const searchBtn = document.getElementById('search-btn');

      function pesquisar() {
        const termo = searchInput.value.toLowerCase();
        const produtosCards = document.querySelectorAll('.grid-produtos > div');
        produtosCards.forEach(p => {
          const nome = p.querySelector('h3').textContent.toLowerCase();
          if (nome.includes(termo)) {
            p.classList.remove('hidden');
          } else {
            p.classList.add('hidden');
          }
        });
      }

      searchBtn.addEventListener('click', pesquisar);
      searchInput.addEventListener('keyup', e => {
        if (e.key === 'Enter') pesquisar();
      });

    })
    .catch(err => console.error('Erro ao carregar produtos.json:', err));
});
