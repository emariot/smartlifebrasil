import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import fetch from 'node-fetch';

// Configuração do Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8580438286:AAGZulnV2LBQEh1ByeArYCaXksbVeHephLA';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6058311984';
/**
 * Envia mensagem para o Telegram
 */
async function enviarTelegram(mensagem) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: mensagem,
        parse_mode: 'HTML'
      })
    });
    
    if (response.ok) {
      console.log('📱 Notificação enviada para o Telegram!');
    } else {
      console.log('⚠️ Falha ao enviar Telegram:', await response.text());
    }
  } catch (erro) {
    console.log('❌ Erro ao enviar Telegram:', erro.message);
  }
}

// Carrega seletores CSS de cada marketplace
const seletores = JSON.parse(
  fs.readFileSync('./seletores.json', 'utf8')
);

// Armazena todos os erros encontrados
const errosEncontrados = [];

// Função para registrar erro
function registrarErro(produto, marketplace, tipoErro, detalhes) {
  const erro = {
    timestamp: new Date().toISOString(),
    produto: produto,
    marketplace: marketplace,
    tipo: tipoErro,
    detalhes: detalhes
  };
  
  errosEncontrados.push(erro);
  console.log(`  🚨 ERRO REGISTRADO: ${tipoErro}`);
}

console.log('Configurações carregadas!');
console.log('Seletores:', Object.keys(seletores));

/**
 * Busca o preço de um produto em um marketplace
 * @param {string} linkAfiliado - URL do link de afiliado
 * @param {string} seletor - Seletor CSS do preço
 * @param {string} marketplace - Nome do marketplace
 * @param {string} produtoNome - Nome do produto
 * @returns {number|null} - Preço encontrado ou null se falhar
 */
async function buscarPreco(linkAfiliado, seletor, marketplace, produtoNome) {
  console.log(`  🔍 Buscando em ${marketplace}...`);
  
  const browser = await chromium.launch({ 
    headless: true
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  });
  
  const page = await context.newPage();
  
  try {
    // 1. Tenta abrir a página
    const response = await page.goto(linkAfiliado, { 
      timeout: 30000,
      waitUntil: 'domcontentloaded'
    });
    
    // Verifica status HTTP da resposta FINAL (após redirecionamentos)
    const status = response.status();
    const urlFinal = page.url();
    
    // Detecta páginas de erro comuns
    if (status === 404) {
      registrarErro(produtoNome, marketplace, 'LINK_MORTO', `HTTP 404 - Página não encontrada`);
      await browser.close();
      return null;
    }
    
    if (status >= 500) {
      registrarErro(produtoNome, marketplace, 'ERRO_SERVIDOR', `HTTP ${status} - Erro no servidor`);
      await browser.close();
      return null;
    }
    
    // Verifica se a URL final indica erro (comum em marketplaces)
    const urlsErro = [
      '/produto-nao-encontrado',
      '/pagina-nao-encontrada',
      '/error',
      '/404',
      'error=',
      'not-found'
    ];
    
    if (urlsErro.some(erro => urlFinal.toLowerCase().includes(erro))) {
      registrarErro(produtoNome, marketplace, 'LINK_MORTO', `URL final indica erro: ${urlFinal}`);
      await browser.close();
      return null;
    }
    
    // 2. Aguarda JavaScript carregar
    await page.waitForTimeout(5000);
    
    // 3. Busca o elemento do preço
    const elemento = page.locator(seletor).first();
    const count = await elemento.count();
    
    if (count === 0) {
      const urlFinalLog = page.url();
      const htmlInicio = (await page.content()).substring(0, 1500);
      registrarErro(produtoNome, marketplace, 'SELETOR_NAO_ENCONTRADO', 
        `Seletor "${seletor}" não existe. URL: ${urlFinalLog} | HTML: ${htmlInicio}`);
      await browser.close();
      return null;
    }
    
    // 4. Espera elemento estar visível
    await elemento.waitFor({ state: 'visible', timeout: 10000 });
    
    let preco;
    
    // MERCADO LIVRE: Pega inteiro + centavos separadamente
    if (marketplace === 'Mercado Livre') {
      try {
        const fractionRaw = await elemento
          .locator('.andes-money-amount__fraction')
          .textContent();

        const centsRaw = await elemento
          .locator('.andes-money-amount__cents')
          .textContent()
          .catch(() => '00');

        // Remove ponto de milhar e qualquer caractere não numérico
        const fraction = (fractionRaw || '')
          .replace(/\./g, '')
          .replace(/\D/g, '');

        const cents = (centsRaw || '00')
          .replace(/\D/g, '');

        preco = parseFloat(`${fraction}.${cents}`);

        console.log(`    ✅ R$ ${preco.toFixed(2)} (${fraction},${cents})`);

      } catch (erro) {
        registrarErro(
          produtoNome,
          marketplace,
          'ERRO_EXTRACAO_ML',
          `Não conseguiu extrair preço do Mercado Livre: ${erro.message}`
        );
        await browser.close();
        return null;
      }


    } else if (marketplace === 'Amazon') {
      try {
        const wholeElement = elemento.locator('.a-price-whole').first();
        const fractionElement = elemento.locator('.a-price-fraction').first();

        const wholeExists = await wholeElement.count();

        if (!wholeExists) {
          registrarErro(produtoNome, marketplace, 'SEM_PRECO_AMAZON', 'Elemento .a-price-whole não encontrado');
          await browser.close();
          return null;
        }

        const wholeText = await wholeElement.textContent();
        const fractionText = await fractionElement.textContent().catch(() => '00');

        const inteiro = (wholeText || '').replace(/\D/g, '');
        const centavos = (fractionText || '00').replace(/\D/g, '');

        preco = parseFloat(`${inteiro}.${centavos}`);

        console.log(`    ✅ R$ ${preco.toFixed(2)} (${inteiro},${centavos})`);

      } catch (erro) {
        registrarErro(produtoNome, marketplace, 'ERRO_EXTRACAO_AMAZON', erro.message);
        await browser.close();
        return null;
    }  
      
    } else {
      // OUTROS MARKETPLACES: Método normal
      const textoPreco = await elemento.textContent();
      
      if (!textoPreco || textoPreco.trim() === '') {
        registrarErro(produtoNome, marketplace, 'PRECO_VAZIO', 'Elemento encontrado mas sem texto');
        await browser.close();
        return null;
      }
      
      // Limpa e converte
      const textoLimpo = textoPreco.replace(/[^\d,]/g, '').replace(',', '.');
      preco = parseFloat(textoLimpo);
      
      console.log(`    ✅ R$ ${preco.toFixed(2)}`);
    }
    
    // 5. Validações de sanidade
    if (isNaN(preco)) {
      registrarErro(produtoNome, marketplace, 'PRECO_INVALIDO', `Preço inválido: ${preco}`);
      await browser.close();
      return null;
    }
    
    if (preco === 0) {
      registrarErro(produtoNome, marketplace, 'PRECO_ZERO', 'Preço extraído = R$ 0,00');
      await browser.close();
      return null;
    }
    
    if (preco < 10) {
      registrarErro(produtoNome, marketplace, 'PRECO_SUSPEITO_BAIXO', `Preço muito baixo: R$ ${preco.toFixed(2)}`);
      // Não retorna null, apenas alerta
    }
    
    if (preco > 50000) {
      registrarErro(produtoNome, marketplace, 'PRECO_SUSPEITO_ALTO', `Preço muito alto: R$ ${preco.toFixed(2)}`);
      // Não retorna null, apenas alerta
    }
    
    await browser.close();
    return preco;
    
  } catch (erro) {
    const tipoErro = erro.name === 'TimeoutError' ? 'TIMEOUT' : 'ERRO_DESCONHECIDO';
    registrarErro(produtoNome, marketplace, tipoErro, erro.message);
    
    console.log(`    ❌ ${erro.message}`);
    await browser.close();
    return null;
  }
}

console.log('\n✅ Função buscarPreco() criada!');

/**
 * Lê um arquivo .njk e extrai os dados do frontmatter
 * @param {string} caminhoArquivo - Caminho do arquivo
 * @returns {object|null} - Dados do produto ou null
 */
function lerProduto(caminhoArquivo) {
  try {
    const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
    const { data } = matter(conteudo);
    return data;
  } catch (erro) {
    console.log(`❌ Erro ao ler ${caminhoArquivo}:`, erro.message);
    return null;
  }
}

/**
 * Busca todos os arquivos .njk dentro de uma pasta (recursivo)
 * @param {string} pasta - Caminho da pasta
 * @returns {array} - Lista de caminhos dos arquivos .njk
 */
function buscarArquivosNjk(pasta) {
  let arquivos = [];
  
  const itens = fs.readdirSync(pasta);
  
  for (const item of itens) {
    const caminhoCompleto = path.join(pasta, item);
    const stat = fs.statSync(caminhoCompleto);
    
    if (stat.isDirectory()) {
      arquivos = arquivos.concat(buscarArquivosNjk(caminhoCompleto));
    } else if (item.endsWith('.njk')) {
      arquivos.push(caminhoCompleto);
    }
  }
  
  return arquivos;
}

console.log('✅ Funções de leitura criadas!');

/**
 * Função principal - Atualiza os preços de todos os produtos
 */
async function atualizarPrecos() {
  console.log('\n🚀 Iniciando scraper de preços...\n');
  
  const resultados = {
    lastUpdated: new Date().toISOString(),
    products: []
  };
  
  const arquivos = buscarArquivosNjk('../produtos');
  
  console.log(`📦 Encontrados ${arquivos.length} produtos\n`);
  
  for (const arquivo of arquivos) {
    const dados = lerProduto(arquivo);
    
    if (!dados || !dados.ofertas) {
      console.log(`⚠️  Pulando ${arquivo} (sem dados ou ofertas)`);
      continue;
    }
    
    console.log(`\n📱 ${dados.produtoNome}`);
    
    const ofertasAtualizadas = [];
    
    for (const oferta of dados.ofertas) {
      const seletor = seletores[oferta.marketplace];
      
      if (!seletor) {
        console.log(`  ⚠️  ${oferta.marketplace}: sem seletor configurado - pulando`);
        continue; // Simplesmente pula, não adiciona ao JSON
      }
      
      // Busca o preço atual!
      const precoNovo = await buscarPreco(
        oferta.link, 
        seletor, 
        oferta.marketplace,
        dados.produtoNome
      );

      // SÓ ADICIONA SE CONSEGUIU BUSCAR O PREÇO
      if (precoNovo !== null) {
        ofertasAtualizadas.push({
          ...oferta,
          preco: precoNovo
        });
        console.log(`    ✅ Oferta adicionada ao JSON`);
      } else {
        console.log(`    🚫 Oferta REMOVIDA do JSON (erro ao buscar preço)`);
      }
      
      await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
    }
    
    resultados.products.push({
      id: path.basename(arquivo, '.njk'),
      nome: dados.produtoNome,
      ofertas: ofertasAtualizadas
    });
  }
  
  // Salva JSON
  const caminhoJson = '../precos.json';
  fs.writeFileSync(
    caminhoJson, 
    JSON.stringify(resultados, null, 2)
  );
  
  console.log('\n✅ precos.json gerado com sucesso!');
  console.log(`📄 Localização: ${path.resolve(caminhoJson)}`);
  console.log(`📊 Total de produtos: ${resultados.products.length}`);
  console.log(`🕐 Última atualização: ${resultados.lastUpdated}`);

  // Gera relatório de erros
  if (errosEncontrados.length > 0) {
    const relatorio = {
      timestamp: new Date().toISOString(),
      totalErros: errosEncontrados.length,
      erros: errosEncontrados,
      resumo: {}
    };
    
    errosEncontrados.forEach(erro => {
      if (!relatorio.resumo[erro.tipo]) {
        relatorio.resumo[erro.tipo] = 0;
      }
      relatorio.resumo[erro.tipo]++;
    });
    
    const caminhoRelatorio = '../relatorio-erros.json';
    fs.writeFileSync(
      caminhoRelatorio,
      JSON.stringify(relatorio, null, 2)
    );
    
    console.log('\n🚨 ATENÇÃO: Erros encontrados!');
    console.log(`📄 Relatório: ${path.resolve(caminhoRelatorio)}`);
    console.log(`❌ Total de erros: ${errosEncontrados.length}`);
    console.log('\n📊 Resumo por tipo:');
    Object.entries(relatorio.resumo).forEach(([tipo, count]) => {
      console.log(`   ${tipo}: ${count}`);
    });
  } else {
    console.log('\n✅ Nenhum erro encontrado!');
  }

  // Envia notificação no Telegram
  if (errosEncontrados.length > 0) {
    let mensagem = `🚨 <b>Scraper - Erros Encontrados</b>\n\n`;
    mensagem += `❌ Total: ${errosEncontrados.length} erros\n\n`;
    
    // Agrupa erros por tipo
    const resumo = {};
    errosEncontrados.forEach(erro => {
      if (!resumo[erro.tipo]) resumo[erro.tipo] = [];
      resumo[erro.tipo].push(erro);
    });
    
    // Lista cada tipo de erro com os produtos afetados
    Object.entries(resumo).forEach(([tipo, erros]) => {
      mensagem += `📌 <b>${tipo}</b> (${erros.length}):\n`;
      
      erros.forEach(erro => {
        const produtoAbrev = erro.produto.substring(0, 30); // Limita nome
        mensagem += `  • ${erro.marketplace} - ${produtoAbrev}\n`;
      });
      
      mensagem += `\n`;
    });
    
    mensagem += `🕐 ${new Date().toLocaleString('pt-BR')}\n`;
    mensagem += `📄 Veja detalhes em relatorio-erros.json`;
    
    await enviarTelegram(mensagem);
    
  } else {
    // Notificação de sucesso
    const mensagem = `✅ <b>Scraper Executado</b>\n\n` +
                     `📊 ${resultados.products.length} produtos atualizados\n` +
                     `✅ Nenhum erro encontrado\n\n` +
                     `🕐 ${new Date().toLocaleString('pt-BR')}`;
    
    await enviarTelegram(mensagem);
  }
}

atualizarPrecos();