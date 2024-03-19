module.exports = function(eleventyConfig) {

  eleventyConfig.addPassthroughCopy({"src/styles/": "styles/"})
  eleventyConfig.addPassthroughCopy({"src/assets/": "assets/"})
  
  eleventyConfig.addPassthroughCopy({"src/other/robot.txt": "/robot.txt"})

  // eleventyConfig.addPassthroughCopy({"src/_includes/components/styles/": "styles/components/"})
  
  eleventyConfig.addPassthroughCopy({"src/admin/": "admin/"})

  return {
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',

    dir: {
      input: 'src',
      output: './public',
    }
  };
};