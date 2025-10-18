// Função para carregar JSON de uma categoria
async function carregarCategoria(caminho) {
  try {
    const resp = await fetch(caminho);
    if (!resp.ok) throw new Error(`Erro ao carregar ${caminho}`);
    return await resp.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Inicializa a página
async function init() {
  const container = document.querySelector('.grid-produtos');
  
  // Carrega todas as categorias
  const [casa, negocios, vida] = await Promise.all([
    carregarCategoria('/data/casa/casa.json'),
    carregarCategoria('/data/negocios/negocios.json'),
    carregarCategoria('/data/vida/vida.json')
  ]);

  // Une todos os produtos
  const produtos = [...casa, ...negocios, ...vida];

  // Renderiza os cards
  produtos.forEach(p => {
    container.innerHTML += `
      <div class="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transform transition duration-300 hover:scale-105 hover:shadow-xl" data-categoria="${p.categoria}">
        <img src="${p.imagem}" alt="${p.nome}" class="w-full h-48 object-contain bg-gray-100">
        <div class="p-4 flex flex-col flex-grow">
          <h3 class="text-lg font-bold mb-2">${p.nome}</h3>
          <p class="text-gray-600 mb-4 flex-grow">${p.descricao}</p>
          <a href="/produtos/${p.categoria}/${p.tipo}/${p.marca}/${p.id}/" 
             class="bg-blue-500 text-white px-4 py-2 rounded text-center hover:bg-blue-600">
            Ver Produto
          </a>
        </div>
      </div>
    `;
  });

  // === FILTROS ===
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
      
      // Destaca o botão ativo
      filterBtns.forEach(b => b.classList.remove('ring-2', 'ring-blue-300'));
      btn.classList.add('ring-2', 'ring-blue-300');
    });
  });

  // === PESQUISA ===
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
}

// Executa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}