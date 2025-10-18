module.exports = function(eleventyConfig) {
  // Copia assets e data sem processar
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("data");
  
  // Ignora o README
  eleventyConfig.ignores.add("README.md");
  
  return {
    dir: {
      input: ".",              // Usa a raiz como entrada
      output: "_site",         // HTML gerado em _site
      includes: "_includes",   // Templates em _includes
    },
    templateFormats: ["njk", "html"],
    htmlTemplateEngine: "njk"
  };
};