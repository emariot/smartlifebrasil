module.exports = function(eleventyConfig) {


  // Copia assets e data sem processar
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("data");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("_redirects");
  eleventyConfig.addPassthroughCopy("atualiza-precos-produtos.js"); 
 
  // Ignora arquivos desnecessários
  eleventyConfig.ignores.add("README.md");
   
  // ========== FILTROS ==========

  // Filtro para criar URL absoluta
  eleventyConfig.addFilter("absoluteUrl", function(url, base) {
    try {
      // Garantir que a URL base termine em '/'
      const baseUrl = base.endsWith('/') ? base : base + '/';
      return (new URL(url, baseUrl)).toString();
    } catch (e) {
      console.error("Filtro absoluteUrl falhou: ", e);
      return base + url;
    }
  });

  // Filtro para acessar um atributo de um objeto
  eleventyConfig.addFilter("attr", function(obj, key) {
    if (obj && obj[key] !== undefined) {
      return obj[key];
    }
    return undefined;
  });
  
  // Filtro para formatar data para ISO
  eleventyConfig.addFilter("dateToISO", function(date) {
    if (!date) return '';
    return new Date(date).toISOString();
  });
  
  // Filtro para truncar texto
  eleventyConfig.addFilter("excerpt", function(content, maxLength = 150) {
    if (!content) return '';
    const stripped = content.replace(/<[^>]+>/g, '');
    return stripped.length > maxLength 
      ? stripped.substring(0, maxLength) + '...' 
      : stripped;
  });
  
  // Filtro para formatar data
  eleventyConfig.addFilter("formatDate", function(date) {
    if (!date) return '';
    const d = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('pt-BR', options);
  });
  
  // Filtro para data curta
  eleventyConfig.addFilter("shortDate", function(date) {
    if (!date) return '';
    const d = new Date(date);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('pt-BR', options);
  });
  
  // Filtro para calcular tempo de leitura
  eleventyConfig.addFilter("readingTime", function(content) {
    if (!content) return '1 min';
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min`;
  });

  // Filtro para buscar preços do JSON
  eleventyConfig.addFilter("precosDoJSON", function(produtoId) {
    try {
      const fs = require('fs');
      const path = require('path');
      const caminhoJSON = path.join(__dirname, 'precos.json');
      
      // Se o arquivo não existir, retorna null (produto novo)
      if (!fs.existsSync(caminhoJSON)) {
        return null;
      }
      
      const dados = JSON.parse(fs.readFileSync(caminhoJSON, 'utf8'));
      
      // Procura o produto pelo ID
      const produto = dados.products.find(p => p.id === produtoId);
      
      // Se produto NÃO existe no JSON, retorna null (produto novo)
      if (!produto) {
        return null;
      }
      
      // Se produto existe mas sem ofertas, retorna array vazio (todas falharam)
      return produto.ofertas || [];
      
    } catch (erro) {
      console.warn(`Aviso: Não conseguiu ler preços do JSON para ${produtoId}:`, erro.message);
      return null;
    }
  });

// ========== SHORTCODE - OFERTAS DE PRODUTO ==========

eleventyConfig.addShortcode("produtoOfertas", function(produtoUrl) {
  const fs = require('fs');
  const path = require('path');
  
  // Busca todos os produtos da collection
  const produtos = this.ctx.collections.produto || [];
  
  // Encontra o produto pela URL
  const produto = produtos.find(p => 
    p.url === produtoUrl || 
    p.url === produtoUrl + '/' || 
    p.url + '/' === produtoUrl
  );
  
  // Se não encontrou, mostra erro
  if (!produto) {
    return `<p class="text-red-500 text-sm">Produto não encontrado: ${produtoUrl}</p>`;
  }
  
  // Busca ofertas do JSON (com preços atualizados do scraper)
  let ofertas = [];
  
  try {
    const caminhoJSON = path.join(__dirname, 'precos.json');
    
    if (fs.existsSync(caminhoJSON)) {
      const dados = JSON.parse(fs.readFileSync(caminhoJSON, 'utf8'));
      const produtoJSON = dados.products.find(p => p.id === produto.fileSlug);
      
      if (produtoJSON && produtoJSON.ofertas) {
        // Usa ofertas do JSON (apenas as que o scraper conseguiu buscar)
        ofertas = produtoJSON.ofertas;
      }
    }
  } catch (erro) {
    console.warn('Aviso: Não conseguiu ler preços do JSON:', erro.message);
  }
  
  // Se não há ofertas disponíveis no JSON, não exibe nada
  if (ofertas.length === 0) {
    return `<p class="text-gray-500 text-sm italic">Nenhuma oferta disponível no momento.</p>`;
  }
  
  // Organiza ofertas por preço (menor primeiro)
  ofertas = ofertas.sort((a, b) => 
    parseFloat(a.preco) - parseFloat(b.preco)
  );
  
  // Constrói o HTML do acordeom
  let html = `
    <details class="my-4" id="ofertas-${produto.slug || 'produto'}">
      <summary class="cursor-pointer font-bold text-blue-600 hover:text-blue-800 select-none">
        Melhores Ofertas (${ofertas.length} disponíveis)
      </summary>
      <div class="mt-2 ml-4 text-sm space-y-1">
  `;
  
  // Adiciona cada oferta
  ofertas.forEach((oferta) => {
    const freteGratis = oferta.freteGratis ? ' <span class="text-green-600">Frete grátis</span>' : '';
    
    html += `
      <div>
        <a href="${oferta.link}" 
           target="_blank" 
           rel="noopener noreferrer nofollow sponsored"
           class="text-blue-600 hover:underline"
           onclick="if(typeof gtag !== 'undefined') { gtag('event', 'click_oferta', {'marketplace': '${oferta.marketplace}', 'preco': '${oferta.preco}'}); }">
          ${oferta.marketplace} - R$ ${String(oferta.preco).replace('.', ',')}
        </a>${freteGratis}
      </div>
    `;
  });
  
  html += `
      </div>
    </details>
    <p class="my-2">
      <a href="${produto.url}" 
         target="_blank"
         rel="noopener noreferrer"
         class="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
         onclick="if(typeof gtag !== 'undefined') { gtag('event', 'click_detalhes_produto', {'produto': '${produto.data.produtoNome}'}); }">
        Página do produto
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
      </a>
    </p>
  `;
  
  return html;
});

  // ========== SHORTCODE - MENOR PREÇO ==========

  eleventyConfig.addShortcode("precoMinimo", function(produtoUrl) {
    const fs = require('fs');
    const path = require('path');
    
    // Busca todos os produtos da collection
    const produtos = this.ctx.collections.produto || [];
    
    // Encontra o produto pela URL
    const produto = produtos.find(p => 
      p.url === produtoUrl || 
      p.url === produtoUrl + '/' || 
      p.url + '/' === produtoUrl
    );
    
    // Se não encontrou o produto
    if (!produto) {
      return "N/A";
    }
    
    // Busca ofertas do JSON
    let ofertas = [];
    
    try {
      const caminhoJSON = path.join(__dirname, 'precos.json');
      
      if (fs.existsSync(caminhoJSON)) {
        const dados = JSON.parse(fs.readFileSync(caminhoJSON, 'utf8'));
        const produtoJSON = dados.products.find(p => p.id === produto.fileSlug);
        
        if (produtoJSON && produtoJSON.ofertas) {
          ofertas = produtoJSON.ofertas;
        }
      }
    } catch (erro) {
      console.warn('Aviso: Não conseguiu ler preços do JSON:', erro.message);
    }
    
    // Se não há ofertas disponíveis
    if (ofertas.length === 0) {
      return "N/A";
    }
    
    // Encontra o menor preço
    const precos = ofertas.map(o => parseFloat(o.preco));
    const menorPreco = Math.min(...precos);
    
    // Retorna formatado com vírgula
    return menorPreco.toFixed(2).replace('.', ',');
  });



  // ========== COLLECTIONS - PRODUTOS ==========
  
  eleventyConfig.addCollection("produtosCasa", function(collection) {
    return collection.getFilteredByTag("produto").filter(item => {
      return item.data.categoria === "casa";
    });
  });
  
  eleventyConfig.addCollection("produtosEscritorio", function(collection) {
    return collection.getFilteredByTag("produto").filter(item => {
      return item.data.categoria === "escritorio";
    });
  });
  
  eleventyConfig.addCollection("produtosVida", function(collection) {
    return collection.getFilteredByTag("produto").filter(item => {
      return item.data.categoria === "vida";
    });
  });
  
  // ========== COLLECTIONS - BLOG ==========
  
  eleventyConfig.addCollection("blog", function(collection) {
    return collection.getFilteredByTag("post").sort((a, b) => {
      return b.date - a.date;
    });
  });
  
  eleventyConfig.addCollection("blogGuias", function(collection) {
    return collection.getFilteredByTag("post").filter(item => {
      return item.data.categoriaBlog === "guias";
    }).sort((a, b) => b.date - a.date);
  });
  
  eleventyConfig.addCollection("blogNoticias", function(collection) {
    return collection.getFilteredByTag("post").filter(item => {
      return item.data.categoriaBlog === "noticias";
    }).sort((a, b) => b.date - a.date);
  });
  
  eleventyConfig.addCollection("blogDicas", function(collection) {
    return collection.getFilteredByTag("post").filter(item => {
      return item.data.categoriaBlog === "dicas";
    }).sort((a, b) => b.date - a.date);
  });
  
  eleventyConfig.addCollection("blogReviews", function(collection) {
    return collection.getFilteredByTag("post").filter(item => {
      return item.data.categoriaBlog === "reviews";
    }).sort((a, b) => b.date - a.date);
  });
  
  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};