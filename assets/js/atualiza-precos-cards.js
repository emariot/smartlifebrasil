// assets/atualizar-precos-cards.js
(function() {
  'use strict';
  
  console.log('🔄 Script de atualização de preços nos cards carregado');
  
  /**
   * Busca os preços atualizados
   */
  async function carregarPrecos() {
    try {
      const response = await fetch('/precos.json');
      
      if (!response.ok) {
        console.warn('⚠️ precos.json não encontrado');
        return null;
      }
      
      const dados = await response.json();
      console.log('✅ Preços carregados:', dados.lastUpdated);
      
      return dados;
      
    } catch (erro) {
      console.error('❌ Erro ao carregar preços:', erro);
      return null;
    }
  }
  
  /**
   * Atualiza os preços nos cards da home
   */
  function atualizarCards(dados) {
    if (!dados || !dados.products) return;
    
    let cardsAtualizados = 0;
    
    // Para cada card na página
    const cards = document.querySelectorAll('.produto-carousel-card');
    
    cards.forEach(card => {
      // Pega o link do produto
      const linkDetalhes = card.querySelector('a[href*="/produtos/"]');
      if (!linkDetalhes) return;
      
      // Extrai o ID do produto da URL
      // Ex: /produtos/casa/lampadas-inteligentes/elgin/smart-color-led-A60/
      const url = linkDetalhes.getAttribute('href');
      const produtoId = url.split('/').filter(Boolean).pop();
      
      // Procura o produto no JSON
      const produto = dados.products.find(p => p.id === produtoId);
      
      if (!produto || !produto.ofertas || produto.ofertas.length === 0) {
        return;
      }
      
      // Encontra o menor preço
      const precos = produto.ofertas.map(o => o.preco).filter(p => p > 0);
      if (precos.length === 0) return;
      
      const menorPreco = Math.min(...precos);
      
      // Atualiza o preço no card
      const precoElement = card.querySelector('.text-green-600.font-bold');
      if (precoElement) {
        const precoNovo = `R$ ${menorPreco.toFixed(2).replace('.', ',')}`;
        const precoAtual = precoElement.textContent.trim();
        
        if (precoAtual !== precoNovo) {
          precoElement.textContent = precoNovo;
          cardsAtualizados++;
        }
      }
      
      // Atualiza as ofertas no overlay
      const ofertasContainer = card.querySelector('.ofertas-overlay .space-y-2');
      if (ofertasContainer) {
        // Ordena ofertas por preço
        const ofertasOrdenadas = [...produto.ofertas].sort((a, b) => a.preco - b.preco);
        
        // Limpa ofertas antigas
        ofertasContainer.innerHTML = '';
        
        // Adiciona ofertas atualizadas
        ofertasOrdenadas.forEach((oferta, index) => {
          const posicao = index + 1;
          const emoji = posicao === 1 ? '🥇' : (posicao === 2 ? '🥈' : (posicao === 3 ? '🥉' : '4️⃣'));
          
          let bgColor = 'bg-blue-600 hover:bg-blue-700';
          if (oferta.marketplace === 'Mercado Livre') {
            bgColor = 'bg-yellow-400 hover:bg-yellow-500 text-gray-800';
          } else if (oferta.marketplace === 'Shopee') {
            bgColor = 'bg-orange-500 hover:bg-orange-600';
          } else if (oferta.marketplace === 'Amazon') {
            bgColor = 'bg-blue-600 hover:bg-blue-700';
          } else {
            bgColor = 'bg-green-500 hover:bg-green-600';
          }
          
          const freteTexto = oferta.freteGratis ? 'Frete grátis' : 'Consulte o frete';
          
          const ofertaHTML = `
            <a href="${oferta.link}" 
              target="_blank" 
              rel="noopener noreferrer nofollow"
              onclick="if(typeof gtag !== 'undefined') { gtag('event', 'click_oferta_overlay_home', {'marketplace': '${oferta.marketplace}', 'produto': '${produto.nome}', 'preco': '${oferta.preco}', 'posicao': '${posicao}'}); }"
              class="${bgColor} text-white text-xs px-3 py-3 rounded-lg font-semibold transition shadow-md hover:shadow-lg flex items-center justify-between gap-2">
              <span class="flex items-center gap-2">
                <span class="text-lg">${emoji}</span>
                <span class="flex flex-col items-start leading-tight">
                  <span>${oferta.marketplace}</span>
                  <span class="text-xs text-white font-normal">${freteTexto}</span>
                </span>
              </span>
              <span class="text-lg font-bold">R$ ${oferta.preco.toFixed(2).replace('.', ',')}</span>
            </a>
          `;
          
          ofertasContainer.insertAdjacentHTML('beforeend', ofertaHTML);
        });
      }
    });
    
    if (cardsAtualizados > 0) {
      console.log(`✅ ${cardsAtualizados} card(s) atualizado(s)`);
    } else {
      console.log('ℹ️ Todos os preços já estavam atualizados');
    }
  }
  
  /**
   * Inicializa
   */
  async function init() {
    console.log('🚀 Iniciando atualização de preços nos cards...');
    
    const dados = await carregarPrecos();
    
    if (dados) {
      atualizarCards(dados);
    }
  }
  
  // Executa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();