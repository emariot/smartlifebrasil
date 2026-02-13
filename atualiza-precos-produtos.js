// atualizar-precos.js
(function() {
  'use strict';
  
  console.log('🔄 Script de atualização de preços carregado');
  
  /**
   * Busca os preços atualizados do JSON
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
   * Atualiza os preços na página
   */
  function atualizarPrecos(dados) {
    if (!dados || !dados.products) return;
    
    // Pega o ID do produto da URL
    const urlPath = window.location.pathname;
    const produtoId = urlPath.split('/').filter(Boolean).pop();
    
    console.log('📄 Produto atual:', produtoId);
    
    // Procura o produto no JSON
    const produto = dados.products.find(p => p.id === produtoId);
    
    if (!produto) {
      console.log('ℹ️ Produto não encontrado no JSON');
      return;
    }
    
    console.log('✅ Produto encontrado:', produto.nome);
    
    let precosAtualizados = 0;
    
    // Atualiza cada oferta
    produto.ofertas.forEach(oferta => {
      // Procura o elemento do preço na página
      // Usando um seletor mais específico
      const elementos = document.querySelectorAll('.bg-white.rounded-lg.p-4');
      
      elementos.forEach(elemento => {
        const marketplace = elemento.querySelector('.text-xs.text-gray-500.uppercase');
        
        if (marketplace && marketplace.textContent.trim() === oferta.marketplace) {
          const precoElement = elemento.querySelector('.font-bold');
          
          if (precoElement) {
            const precoAtual = precoElement.textContent.trim();
            const precoNovo = `R$ ${oferta.preco.toFixed(2).replace('.', ',')}`;
            
            // Só atualiza se for diferente
            if (precoAtual !== precoNovo) {
              precoElement.textContent = precoNovo;
              console.log(`💰 ${oferta.marketplace}: ${precoAtual} → ${precoNovo}`);
              precosAtualizados++;
            }
          }
        }
      });
    });
    
    if (precosAtualizados > 0) {
      console.log(`✅ ${precosAtualizados} preço(s) atualizado(s)`);
      mostrarNotificacao(dados.lastUpdated);
    } else {
      console.log('ℹ️ Todos os preços já estavam atualizados');
    }
  }
  
  /**
   * Mostra notificação de preços atualizados
   */
  function mostrarNotificacao(timestamp) {
    const data = new Date(timestamp);
    const dataFormatada = data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Atualiza o texto existente
    const avisoElement = document.querySelector('.text-xs.text-gray-500.text-center');
    if (avisoElement) {
      avisoElement.innerHTML = `
        <svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Preços atualizados em ${dataFormatada}
      `;
    }
  }
  
  /**
   * Inicializa quando a página carregar
   */
  async function init() {
    console.log('🚀 Iniciando atualização de preços...');
    
    const dados = await carregarPrecos();
    
    if (dados) {
      atualizarPrecos(dados);
    }
  }
  
  // Executa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();