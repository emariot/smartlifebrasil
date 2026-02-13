import { chromium } from 'playwright';

const linkAmazon = 'https://amzn.to/4oBIj94'; // Cole o link da Amazon

(async () => {
  const browser = await chromium.launch({ headless: false }); // Vai abrir!
  const page = await browser.newPage();
  
  await page.goto(linkAmazon);
  await page.waitForTimeout(5000);
  
  // Tenta todos os seletores
  const seletores = [
    ".a-price[data-a-color='price'] .a-offscreen",
    ".a-price .a-offscreen",
    ".a-price-whole"
  ];
  
  for (const sel of seletores) {
    const count = await page.locator(sel).count();
    console.log(`Seletor "${sel}": ${count} elementos`);
    
    if (count > 0) {
      const texto = await page.locator(sel).first().textContent();
      console.log(`  Texto: "${texto}"`);
    }
  }
  
  await page.waitForTimeout(10000); // Aguarda você ver
  await browser.close();
})();