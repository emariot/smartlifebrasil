
module.exports = function(eleventyConfig) {


  // Copia assets e data sem processar
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("data");
  eleventyConfig.addPassthroughCopy("robots.txt");
  
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