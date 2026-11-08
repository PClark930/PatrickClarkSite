#!/usr/bin/env node
/*
 * Prints the resume versions (scripts/versions.js) to PDF with headless
 * Chrome or Edge. Adapted from Mitch's mitchgardner.cv printer.
 *
 *   node scripts/resume-pdf.js             (the end of `npm run build`)
 *     Prints the standard version to _site/<Name>_Resume.pdf: the public copy
 *     linked from /resume/, with no private details. Also prints the federal
 *     version to a temporary file to check it. Problems are warnings here, so
 *     a deploy isn't blocked.
 *
 *   node scripts/resume-pdf.js --private   (npm run pdf)
 *     Builds a private copy of the site into _pdf/site with private/private.json
 *     (phone number and the like) and private/tailor.json if there is one, then
 *     prints every version to _pdf/. These are the PDFs to send. _pdf/ is
 *     gitignored. Any problem stops it, and a PDF with a problem isn't written.
 *
 * Every PDF is checked for:
 *   - length: two pages at most (USAJOBS rejects longer resumes)
 *   - the federal version: hours per week on every job (USAJOBS needs them)
 *   - a path from the computer that printed it (a link that became file:///...)
 *   - its title: the same on every version, so it never says "Federal"
 *
 * Set CHROME_PATH if Chrome or Edge isn't installed in a standard place.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");
const { loadVersions, root } = require("./versions.js");

const isPrivate = process.argv.includes("--private");
const inActions = Boolean(process.env.GITHUB_ACTIONS);
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

function findBrowser() {
  const pf = process.env.ProgramFiles;
  const pf86 = process.env["ProgramFiles(x86)"];
  const local = process.env.LOCALAPPDATA;
  const candidates = [
    process.env.CHROME_PATH,
    pf && path.join(pf, "Google", "Chrome", "Application", "chrome.exe"),
    pf86 && path.join(pf86, "Google", "Chrome", "Application", "chrome.exe"),
    local && path.join(local, "Google", "Chrome", "Application", "chrome.exe"),
    pf && path.join(pf, "Microsoft", "Edge", "Application", "msedge.exe"),
    pf86 && path.join(pf86, "Microsoft", "Edge", "Application", "msedge.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  return candidates.find((p) => p && fs.existsSync(p));
}

function printToPdf(browser, htmlFile, pdfFile) {
  if (!fs.existsSync(htmlFile)) throw new Error(`Missing ${htmlFile}. Did the Eleventy build run?`);
  // A throwaway profile keeps this from fighting a browser window that's already open.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "resume-pdf-"));
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${profile}`,
    "--no-pdf-header-footer", // no file path and date stamped in the margins
    "--virtual-time-budget=10000", // let the web font load before printing
    `--print-to-pdf=${pdfFile}`,
    pathToFileURL(htmlFile).href,
  ];
  if (process.env.CI) args.unshift("--no-sandbox"); // CI runners can't set up Chrome's sandbox
  if (/msedge/i.test(browser)) args.unshift("--edge-skip-compat-layer-relaunch");
  try {
    execFileSync(browser, args, { stdio: "ignore", timeout: 120000 });
  } finally {
    try {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    } catch {
      // The browser can hold the profile for a moment; a leftover temp folder is harmless.
    }
  }
  if (!fs.existsSync(pdfFile)) throw new Error(`No PDF was written for ${htmlFile}`);
}

// Chrome keeps most of a PDF inside compressed streams, so inflate them all.
function pdfTexts(pdfFile) {
  const buf = fs.readFileSync(pdfFile);
  const raw = buf.toString("latin1");
  const texts = [raw];
  const re = /stream\r?\n/g;
  let m;
  while ((m = re.exec(raw))) {
    const start = m.index + m[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) break;
    try {
      texts.push(zlib.inflateSync(buf.subarray(start, end), { finishFlush: zlib.constants.Z_SYNC_FLUSH }).toString("latin1"));
    } catch {
      // not a Flate stream (fonts, images): nothing to read
    }
    re.lastIndex = end;
  }
  return texts;
}

function pageCount(texts) {
  let pages = 0;
  for (const t of texts) {
    for (const d of t.matchAll(/<<(?:(?!>>).)*?\/Type\s*\/Pages\b(?:(?!>>).)*?>>/gs)) {
      const c = d[0].match(/\/Count\s+(\d+)/);
      if (c) pages = Math.max(pages, Number(c[1]));
    }
  }
  return pages || null;
}

// A PDF string: (literal) or <hex>, UTF-16 if it starts with a byte order mark.
function pdfString(s) {
  let bytes;
  if (s.startsWith("<")) bytes = Buffer.from(s.slice(1, -1).replace(/\s+/g, ""), "hex");
  else bytes = Buffer.from(s.slice(1, -1).replace(/\\([()\\])/g, "$1"), "latin1");
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return bytes.subarray(2).swap16().toString("utf16le");
  return bytes.toString("latin1");
}

const LOCAL_PATH = /file:\/\/|[A-Za-z]:[\\/]Users[\\/]|\/home\/[\w.-]+\/|\/Users\/[\w.-]+\//;

function checkPdf(texts, expectedTitle) {
  const problems = [];
  if (texts.some((t) => LOCAL_PATH.test(t))) {
    problems.push("has a path from this computer in it (usually a link that isn't a full https:// address)");
  }
  const title = texts.map((t) => t.match(/\/Title\s*(\((?:\\.|[^\\)])*\)|<[0-9A-Fa-f\s]*>)/)).find(Boolean);
  if (title && pdfString(title[1]) !== expectedTitle) {
    problems.push(`has the title "${pdfString(title[1])}" instead of "${expectedTitle}"`);
  }
  return problems;
}

// Everything wrong with one printed version, in plain words.
function printVersion(browser, siteDir, v, pdfFile, context) {
  printToPdf(browser, path.join(siteDir, "resume", v.slug, "index.html"), pdfFile);
  const texts = pdfTexts(pdfFile);
  const pages = pageCount(texts);
  const problems = checkPdf(texts, context.title);
  if (pages && pages > v.maxPages) {
    problems.push(`is ${pages} pages; the limit is ${v.maxPages}. Take out or shorten a bullet (or leave it out of a tailored version with "drop"); don't shrink the type`);
  }
  if (v.federal) {
    const missing = context.resume.experience.filter((j) => !String(j.hours || "").trim());
    if (missing.length) {
      problems.push(`is missing hours per week for: ${missing.map((j) => j.title).join("; ")}. USAJOBS needs them; add "hours" to those jobs in resume.json`);
    }
  }
  return { pages, problems };
}

function report(level, message) {
  if (level === "warn" && inActions) console.log(`::warning title=Resume PDF::${message}`);
  else (level === "ok" ? console.log : console.error)(message);
}

function main() {
  const site = readJson(path.join(root, "src", "_data", "site.json"));
  const resume = readJson(path.join(root, "src", "_data", "resume.json"));
  const context = { title: `${site.name}: Resume`, resume };
  const browser = findBrowser();
  if (!browser) {
    const msg = "No Chrome or Edge found, so no resume PDF was made. Set CHROME_PATH to the browser's program file.";
    if (isPrivate || process.env.CI) {
      console.error(msg);
      process.exit(1);
    }
    console.warn(msg); // a local preview build still works without one
    return;
  }

  if (!isPrivate) {
    const siteDir = path.join(root, "_site");
    const [standard, federal] = loadVersions();
    const out = path.join(siteDir, `${standard.file}.pdf`);
    const s = printVersion(browser, siteDir, standard, out, context);
    if (s.problems.length) report("warn", `${path.basename(out)} ${s.problems.join("; ")}.`);
    else report("ok", `Wrote _site/${path.basename(out)} (${s.pages} page${s.pages === 1 ? "" : "s"})`);
    // The federal one is only checked here; its real copy comes from `npm run pdf`.
    const tmp = path.join(os.tmpdir(), `resume-check-${process.pid}.pdf`);
    try {
      const f = printVersion(browser, siteDir, federal, tmp, context);
      if (f.problems.length) report("warn", `The federal PDF ${f.problems.join("; ")}.`);
    } finally {
      fs.rmSync(tmp, { force: true });
    }
    return;
  }

  const outDir = path.join(root, "_pdf");
  const siteDir = path.join(outDir, "site");
  fs.rmSync(outDir, { recursive: true, force: true });
  const eleventy = path.join(root, "node_modules", "@11ty", "eleventy", "cmd.cjs");
  execFileSync(process.execPath, [eleventy, `--output=${siteDir}`, "--quiet"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, RESUME_PRIVATE: "1" },
  });
  let ok = true;
  for (const v of loadVersions({ isPrivate: true })) {
    const out = path.join(outDir, `${v.file}.pdf`);
    const r = printVersion(browser, siteDir, v, out, context);
    if (r.problems.length) {
      fs.rmSync(out, { force: true }); // never leave a PDF that shouldn't be sent
      console.error(`NOT WRITTEN: ${v.label} (${v.file}.pdf) ${r.problems.join("; ")}.`);
      ok = false;
    } else {
      console.log(`Wrote _pdf/${v.file}.pdf (${v.label}, ${r.pages} page${r.pages === 1 ? "" : "s"})`);
    }
  }
  if (!ok) process.exit(2);
}

main();
