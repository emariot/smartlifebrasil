// atualiza-precos-produtos.js - VERSÃO 2.0
// Adaptado para a estrutura de cards do template produto.njk

(function() {
  'use strict';
  
  console.log('🔄 Script de atualização de preços v2.0 carregado');
  
  /**
   * Busca os preços atualizados do JSON
   */
  async function carregarPrecos() {
    try {
      const response = await fetch('/precos.json?t=' + Date.now());
      
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
   * Atualiza os preços E reconstrói os cards
   */
  function atualizarPrecos(dados) {
    if (!dados || !dados.products) return;
    
    const urlPath = window.location.pathname;
    const produtoId = urlPath.split('/').filter(Boolean).pop();
    
    console.log('📄 Produto atual:', produtoId);
    
    const produto = dados.products.find(p => p.id === produtoId);
    
    if (!produto) {
      console.log('ℹ️ Produto não encontrado no JSON');
      return;
    }
    
    console.log('✅ Produto encontrado:', produto.nome);
    console.log(`📊 Ofertas disponíveis no JSON: ${produto.ofertas.length}`);
    
    // Encontra o container das ofertas (div.space-y-3 dentro do bg-gradient)
    const containers = document.querySelectorAll('.space-y-3');
    let container = null;
    
    // Procura o container correto (dentro do bg-gradient com ofertas)
    for (const cont of containers) {
      const parent = cont.parentElement;
      if (parent && parent.className.includes('bg-gradient')) {
        container = cont;
        break;
      }
    }
    
    if (!container) {
      console.error('❌ Container de ofertas não encontrado!');
      return;
    }
    
    // Se não há ofertas, mostra mensagem de indisponível
    if (produto.ofertas.length === 0) {
      const containerPai = container.parentElement;
      if (containerPai) {
        containerPai.innerHTML = `
          <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-2">
            <div class="flex items-center gap-3 mb-2">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <h3 class="text-lg font-bold text-yellow-800">Ofertas Temporariamente Indisponíveis</h3>
            </div>
            <p class="text-yellow-700">
              ⚠️ Nenhuma oferta disponível no momento. Estamos atualizando os links.
            </p>
          </div>
        `;
      }
      console.log('⚠️ Produto sem ofertas - mostrando mensagem');
      return;
    }
    
    reconstruirCards(container, produto);
    atualizarTimestamp(dados.lastUpdated);
    
    console.log('✅ Cards de ofertas reconstruídos com sucesso');
  }
  
  /**
   * Reconstrói completamente os cards de ofertas
   */
  function reconstruirCards(container, produto) {
    // Ordena por preço (menor primeiro)
    const ofertas = produto.ofertas.sort((a, b) => 
      parseFloat(a.preco) - parseFloat(b.preco)
    );
    
    let html = '';
    
    ofertas.forEach((oferta, index) => {
      const posicao = index + 1;
      const ehPrimeiro = posicao === 1;
      
      // Emoji baseado na posição
      let emoji = '🏪';
      if (posicao === 1) emoji = '🥇';
      else if (posicao === 2) emoji = '🥈';
      else if (posicao === 3) emoji = '🥉';
      else if (posicao === 4) emoji = '4️⃣';
      
      // Cor do botão baseado no marketplace
      let btnColor = 'bg-green-500 hover:bg-green-600 text-white';
      if (oferta.marketplace === 'Amazon') {
        btnColor = 'bg-blue-600 hover:bg-blue-700 text-white';
      } else if (oferta.marketplace === 'Mercado Livre') {
        btnColor = 'bg-yellow-400 hover:bg-yellow-500 text-gray-800';
      } else if (oferta.marketplace === 'Shopee') {
        btnColor = 'bg-orange-500 hover:bg-orange-600 text-white';
      }
      
      html += `
        <div class="bg-white rounded-lg p-4 ${ehPrimeiro ? 'border-2 border-yellow-400 shadow-md' : 'border border-gray-200'} hover:shadow-lg transition">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="${ehPrimeiro ? 'text-2xl' : 'text-xl'}">${emoji}</span>
              <div>
                <div class="text-xs text-gray-500 uppercase font-semibold">${oferta.marketplace}</div>
                <div class="${ehPrimeiro ? 'text-2xl font-bold text-green-600' : 'text-xl font-bold text-gray-800'}">
                  R$ ${formatarPreco(oferta.preco)}
                </div>
              </div>
            </div>
            <a href="${oferta.link}" 
              target="_blank" 
              rel="noopener noreferrer nofollow"
              onclick="if(typeof gtag !== 'undefined') { gtag('event', 'click_oferta_produto', {'marketplace': '${oferta.marketplace}', 'produto': '${produto.nome}', 'preco': '${oferta.preco}', 'posicao': '${posicao}'}); }"
              class="${btnColor} px-5 py-2.5 rounded-lg font-semibold transition shadow-sm hover:shadow-md flex items-center gap-2">
              Comprar
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
      `;
      
      // Frete grátis
      if (oferta.freteGratis) {
        html += `
          <div class="mt-2 text-xs text-green-600 font-semibold flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Frete Grátis
          </div>
        `;
      } else {
        html += `
          <div class="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Consulte o frete
          </div>
        `;
      }
      
      html += `</div>`;
    });
    
    container.innerHTML = html;
    console.log(`✅ ${ofertas.length} cards renderizados`);
  }
  
  /**
   * Formata preço com vírgula
   */
  function formatarPreco(preco) {
    return parseFloat(preco).toFixed(2).replace('.', ',');
  }
  
  /**
   * Atualiza o timestamp de última atualização
   */
  function atualizarTimestamp(timestamp) {
    const data = new Date(timestamp);
    const agora = new Date();
    const diffMinutos = Math.floor((agora - data) / 1000 / 60);
    
    let textoTempo;
    if (diffMinutos < 1) {
      textoTempo = 'agora mesmo';
    } else if (diffMinutos < 60) {
      textoTempo = `há ${diffMinutos} min`;
    } else if (diffMinutos < 1440) {
      const horas = Math.floor(diffMinutos / 60);
      textoTempo = `há ${horas}h`;
    } else {
      const dias = Math.floor(diffMinutos / 1440);
      textoTempo = `há ${dias}d`;
    }
    
    const dataFormatada = data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Busca o elemento de timestamp existente
    const avisoElements = document.querySelectorAll('.text-xs.text-gray-500.text-center');
    let avisoElement = null;
    
    // Procura o elemento correto (que tem "Preço" no texto)
    for (const el of avisoElements) {
      if (el.textContent.includes('Preço') || el.textContent.includes('sujeitos')) {
        avisoElement = el;
        break;
      }
    }
    
    if (avisoElement) {
      avisoElement.innerHTML = `
        <svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <span class="text-green-600 font-semibold">Preços atualizados ${textoTempo}</span>
        <span class="text-gray-400 text-xs ml-1">(${dataFormatada})</span>
      `;
      
      console.log(`🕐 Timestamp atualizado: ${textoTempo}`);
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
      
      const dataUpdate = new Date(dados.lastUpdated);
      const agora = new Date();
      const horasAtras = Math.floor((agora - dataUpdate) / 1000 / 60 / 60);
      
      console.log(`📅 Dados atualizados há ${horasAtras}h`);
      
      if (horasAtras > 48) {
        console.warn(`⚠️ Atenção: Dados com mais de 48h (${horasAtras}h)`);
      }
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Re-atualiza a cada 5 minutos (se usuário deixar aba aberta)
  setInterval(async () => {
    console.log('🔄 Verificando atualizações automáticas...');
    const dados = await carregarPrecos();
    if (dados) {
      atualizarPrecos(dados);
    }
  }, 5 * 60 * 1000);
  
})();