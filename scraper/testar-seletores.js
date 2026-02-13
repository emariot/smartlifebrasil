import { chromium } from 'playwright';

const testes = [
  {
    marketplace: 'Mercado Livre (COM desconto)',
    url: 'https://mercadolivre.com/sec/2nANHEh'
  },
  {
    marketplace: 'Mercado Livre (SEM desconto)',
    url: 'https://mercadolivre.com/sec/2ht7isB'
  }
];

async function testarSeletor(marketplace, url) {
  console.log(`\n🧪 Testando ${marketplace}...`);
  console.log(`   URL: ${url}`);
  
  const browser = await chromium.launch({ headless: false });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  });
  
  const page = await context.newPage();
  
  try {
    console.log('   ⏳ Carregando página...');
    await page.goto(url, { timeout: 30000 });
    await page.waitForTimeout(5000);

    console.log('   🔍 Buscando preço principal...\n');

    // 🎯 Seleciona apenas o preço principal (24px)
    const precoContainer = page.locator(
      '[data-andes-money-amount="true"][data-andes-money-amount-size="24"]'
    ).first();

    await precoContainer.waitFor({ timeout: 30000 });

    const fraction = await precoContainer
      .locator('.andes-money-amount__fraction')
      .textContent();

    const cents = await precoContainer
      .locator('.andes-money-amount__cents')
      .textContent()
      .catch(() => '00');

    const preco = parseFloat(`${fraction}.${cents}`);

    console.log(`   ✅ Preço encontrado corretamente`);
    console.log(`   💰 R$ ${preco.toFixed(2)}`);

    await page.waitForTimeout(3000);

  } catch (erro) {
    console.log(`   ❌ ERRO: ${erro.message}`);
  }
  
  await browser.close();
}

async function testarTodos() {
  console.log('🚀 Iniciando testes...\n');
  
  for (const teste of testes) {
    await testarSeletor(teste.marketplace, teste.url);
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n✅ Testes concluídos!');
}

testarTodos();
