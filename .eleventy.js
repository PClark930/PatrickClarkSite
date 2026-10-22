const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  // Eleventy won't pick up a dotfile from a glob, so map it explicitly.
  eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess" });

  // A resume date as words: "2024-03" -> "Mar 2024", "2024" -> "2024",
  // empty -> "Present". Read in UTC so a bare month never slips a day back.
  eleventyConfig.addFilter("monthYear", (d) => {
    if (!d) return "Present";
    const s = String(d);
    if (/^\d{4}$/.test(s)) return s;
    return new Date(`${s.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      year: "numeric",
    });
  });

  // Cache busting: a content hash on CSS/JS URLs, same as The Cafe's site.
  // Required because .htaccess caches CSS and JS for a week.
  const hashCache = new Map();
  eleventyConfig.addFilter("bust", (url) => {
    if (!url || typeof url !== "string") return url;
    if (hashCache.has(url)) return hashCache.get(url);
    const file = path.join(__dirname, "src", url.replace(/^\//, ""));
    let out = url;
    try {
      const hash = crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 8);
      out = `${url}?v=${hash}`;
    } catch (err) {
      console.warn(`[bust] could not hash ${file}`);
    }
    hashCache.set(url, out);
    return out;
  });
  // Dev server rebuilds would otherwise keep serving the first hash.
  eleventyConfig.on("eleventy.before", () => hashCache.clear());

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
