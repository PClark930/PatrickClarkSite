/*
 * Scans the finished site in _site/ for details that shouldn't be public.
 * Runs at the end of `npm run build`, so a deploy stops before anything is
 * uploaded. Scrapers copy contact details off a public page within days, and
 * hiding them in the page code doesn't help, so this reads the files as they
 * will be served.
 *
 * Stops the build on:
 *   - a phone number, or a tel: link
 *   - an email address other than the one in resume.json's "email"
 *   - a path from someone's computer (C:\Users\..., /Users/..., file://)
 *   - a copy of a file from private/ (checked when private/ is on this computer)
 *
 * It reports where it found something but never prints what it found: on a
 * public repo the GitHub Actions log is public too.
 *
 *   node scripts/check-site.js
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const siteDir = path.join(root, "_site");
const privateDir = path.join(root, "private");

const TEXT_FILES = /\.(html?|css|m?js|txt|xml|json|svg|webmanifest|md)$|(^|[\\/])\.htaccess$/i;

const checks = [
  {
    what: "a phone number",
    re: /(?<![\w.$])(?:\+?1[\s.-]?)?(?:\(\d{3}\)\s?|\d{3}[\s.-])\d{3}[\s.-]\d{4}(?![\w])/g,
  },
  { what: "a tel: link", re: /tel:\s*[+\d(]/gi },
  {
    what: "an email address that isn't resume.json's",
    re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g,
    // Image names like logo@2x.png look like addresses.
    skip: (m, allowed) => allowed.has(m.toLowerCase()) || /\.(png|jpe?g|webp|avif|gif|svg|ico|css|js)$/i.test(m),
  },
  { what: "a path from someone's computer", re: /\b[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s"'<>]+|(?<![\w.:-])\/Users\/[\w.-]+\/|file:\/\//gi },
];

// Undo the usual ways of hiding an address in page code (&#64; %40 and so on).
function decode(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&commat;/gi, "@")
    .replace(/&period;/gi, ".")
    .replace(/%40/g, "@");
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}

const hash = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function allowedEmails() {
  try {
    const resume = JSON.parse(fs.readFileSync(path.join(root, "src", "_data", "resume.json"), "utf8"));
    return new Set(resume.email ? [String(resume.email).toLowerCase()] : []);
  } catch {
    return new Set(); // check-resume.js reports a broken resume.json
  }
}

function main() {
  const files = walk(siteDir);
  if (!files.length) {
    console.error("Site check: _site/ is empty. Run `npm run build` first.");
    process.exit(1);
  }
  const allowed = allowedEmails();
  const found = new Set(); // one line per file, line and kind

  for (const file of files) {
    if (!TEXT_FILES.test(file)) continue;
    const text = decode(fs.readFileSync(file, "utf8"));
    const rel = path.relative(root, file).split(path.sep).join("/");
    for (const { what, re, skip } of checks) {
      for (const m of text.matchAll(re)) {
        if (skip && skip(m[0], allowed)) continue;
        const line = text.slice(0, m.index).split("\n").length;
        found.add(`${rel}:${line}: ${what}`);
      }
    }
  }

  // Patrick's original documents live in private/ and must never be uploaded.
  const originals = new Map(
    walk(privateDir)
      .filter((f) => path.basename(f) !== "README.md" && !f.endsWith(".example.json"))
      .map((f) => [hash(f), path.relative(root, f).split(path.sep).join("/")])
  );
  if (originals.size) {
    for (const file of files) {
      const from = originals.get(hash(file));
      if (from) found.add(`${path.relative(root, file).split(path.sep).join("/")}: a copy of ${from}`);
    }
  }

  const problems = [...found];
  if (problems.length) {
    console.error(
      `Site check: found ${problems.length} thing${problems.length === 1 ? "" : "s"} that shouldn't be on a public site:\n` +
        problems.map((p) => `  - ${p}`).join("\n") +
        "\nTake it out of the page or data it came from. The one email the site may show is resume.json's \"email\"." +
        "\nIf it belongs on the site on purpose, scripts/check-site.js needs a change: ask Mitch."
    );
    process.exit(1);
  }
  console.log(`Site check: ${files.length} files, nothing private found.`);
}

main();
