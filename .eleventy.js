module.exports = function(eleventyConfig) {
  // Copia assets e data sem processar
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("data");
  
  // Ignora arquivos desnecessários
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("node_modules");
  
  // Filtro para truncar texto (usado no line-clamp)
  eleventyConfig.addFilter("excerpt", function(content, maxLength = 150) {
    if (!content) return '';
    const stripped = content.replace(/<[^>]+>/g, '');
    return stripped.length > maxLength 
      ? stripped.substring(0, maxLength) + '...' 
      : stripped;
  });
  
  // Collection customizada: produtos por categoria
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
  
  return {
    dir: {
      input: ".",              // Usa a raiz como entrada
      output: "_site",         // HTML gerado em _site
      includes: "_includes",   // Templates em _includes
      data: "_data"           // Dados em _data
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};