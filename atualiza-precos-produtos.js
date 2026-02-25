// atualiza-precos-produtos.js - VERSÃO 3.0
// Corrigido para lidar com container ausente quando produto não tem ofertas

(function() {
  'use strict';
  
  console.log('🔄 Script de atualização de preços v3.0 carregado');
  
  async function carregarPrecos() {
    try {
      const response = await fetch('https://raw.githubusercontent.com/emariot/smartlifebrasil/dados/precos.json?t=' + Date.now());
      
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
  
  function atualizarPrecos(dados) {
    if (!dados || !dados.products) return;
    
    const urlPath = window.location.pathname;
    const produtoId = urlPath.split('/').filter(Boolean).pop();
    
    console.log('📄 Produto atual:', produtoId);
    
    const produto = dados.products.find(p => p.id === produtoId);

    // Remove spinner sempre ao final
    const spinner = document.getElementById('ofertas-spinner');
    const ofertasContainer = document.getElementById('ofertas-container');

    if (!produto) {
      console.log('ℹ️ Produto não encontrado no JSON');
      if (spinner) spinner.remove();
      if (ofertasContainer) ofertasContainer.classList.remove('hidden');
      return;
    }
    
    console.log('✅ Produto encontrado:', produto.nome);
    console.log(`📊 Ofertas disponíveis no JSON: ${produto.ofertas.length}`);

    // Tenta encontrar o container de ofertas existente
    let container = null;
    const containers = document.querySelectorAll('.space-y-3');
    for (const cont of containers) {
      const parent = cont.parentElement;
      if (parent && parent.className.includes('bg-gradient')) {
        container = cont;
        break;
      }
    }

    // Se não há ofertas no JSON
    if (produto.ofertas.length === 0) {
      if (spinner) spinner.remove();
      if (container) {
        container.parentElement.outerHTML = mensagemIndisponivel();
      } else {
        const titulo = document.querySelector('h1');
        if (titulo) {
          const div = document.createElement('div');
          div.innerHTML = mensagemIndisponivel();
          titulo.parentElement.insertBefore(div.firstElementChild, titulo.nextSibling);
        }
      }
      console.log('⚠️ Produto sem ofertas - mostrando mensagem');
      return;
    }

    // Há ofertas no JSON
    if (container) {
      reconstruirCards(container, produto);
    } else {
      const titulo = document.querySelector('h1');
      if (titulo) {
        const blocoCompleto = document.createElement('div');
        blocoCompleto.className = 'bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 shadow-sm mt-2';
        blocoCompleto.innerHTML = `
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 class="text-xl font-bold text-gray-800">Melhores Ofertas</h3>
          </div>
          <div class="space-y-3"></div>
          <div class="mt-4 text-xs text-gray-500 text-center flex items-center justify-center gap-1">
            Preço atualizado hoje, <span class="whitespace-nowrap">sujeitos a variação conforme o marketplace.</span>
          </div>
        `;
        titulo.parentElement.insertBefore(blocoCompleto, titulo.nextSibling);
        container = blocoCompleto.querySelector('.space-y-3');
        reconstruirCards(container, produto);
      }
    }

    // Remove spinner e exibe container
    if (spinner) spinner.remove();
    if (ofertasContainer) ofertasContainer.classList.remove('hidden');

    atualizarTimestamp(dados.lastUpdated);
    console.log('✅ Cards de ofertas reconstruídos com sucesso');
  }

  function mensagemIndisponivel() {
    return `
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
  
  function reconstruirCards(container, produto) {
    const ofertas = produto.ofertas.sort((a, b) => parseFloat(a.preco) - parseFloat(b.preco));
    let html = '';
    
    ofertas.forEach((oferta, index) => {
      const posicao = index + 1;
      const ehPrimeiro = posicao === 1;
      
      let emoji = '🏪';
      if (posicao === 1) emoji = '🥇';
      else if (posicao === 2) emoji = '🥈';
      else if (posicao === 3) emoji = '🥉';
      else if (posicao === 4) emoji = '4️⃣';
      
      let btnColor = 'bg-green-500 hover:bg-green-600 text-white';
      if (oferta.marketplace === 'Amazon') btnColor = 'bg-blue-600 hover:bg-blue-700 text-white';
      else if (oferta.marketplace === 'Mercado Livre') btnColor = 'bg-yellow-400 hover:bg-yellow-500 text-gray-800';
      else if (oferta.marketplace === 'Shopee') btnColor = 'bg-orange-500 hover:bg-orange-600 text-white';
      
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
          ${oferta.freteGratis ? `
          <div class="mt-2 text-xs text-green-600 font-semibold flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Frete Grátis
          </div>` : `
          <div class="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Consulte o frete
          </div>`}
        </div>
      `;
    });
    
    container.innerHTML = html;
    console.log(`✅ ${ofertas.length} cards renderizados`);
  }
  
  function formatarPreco(preco) {
    return parseFloat(preco).toFixed(2).replace('.', ',');
  }
  
  function atualizarTimestamp(timestamp) {
    const data = new Date(timestamp);
    const agora = new Date();
    const diffMinutos = Math.floor((agora - data) / 1000 / 60);
    
    let textoTempo;
    if (diffMinutos < 1) textoTempo = 'agora mesmo';
    else if (diffMinutos < 60) textoTempo = `há ${diffMinutos} min`;
    else if (diffMinutos < 1440) textoTempo = `há ${Math.floor(diffMinutos / 60)}h`;
    else textoTempo = `há ${Math.floor(diffMinutos / 1440)}d`;
    
    const dataFormatada = data.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    
    const avisoElements = document.querySelectorAll('.text-xs.text-gray-500.text-center');
    for (const el of avisoElements) {
      if (el.textContent.includes('Preço') || el.textContent.includes('sujeitos')) {
        el.innerHTML = `
          <svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <span class="text-green-600 font-semibold">Preços atualizados ${textoTempo}</span>
          <span class="text-gray-400 text-xs ml-1">(${dataFormatada})</span>
        `;
        break;
      }
    }
  }
  
  async function init() {
    console.log('🚀 Iniciando atualização de preços...');
    const dados = await carregarPrecos();
    if (dados) {
      atualizarPrecos(dados);
      const horasAtras = Math.floor((new Date() - new Date(dados.lastUpdated)) / 1000 / 60 / 60);
      console.log(`📅 Dados atualizados há ${horasAtras}h`);
      if (horasAtras > 48) console.warn(`⚠️ Atenção: Dados com mais de 48h (${horasAtras}h)`);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  setInterval(async () => {
    const dados = await carregarPrecos();
    if (dados) atualizarPrecos(dados);
  }, 5 * 60 * 1000);
  
})();