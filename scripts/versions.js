/*
 * The resume versions, shared by .eleventy.js and scripts/resume-pdf.js.
 *
 *   standard  /resume/pdf/       the everyday PDF (Indeed and most applications)
 *   federal   /resume/federal/   for USAJOBS: adds hours per week to every job
 *   tailored  /resume/tailored/  private builds only, from private/tailor.json
 *
 * Every version is two pages at most (USAJOBS rejects anything longer).
 *
 * Private details (private.json, and tailor.json for one posting) are read
 * only in private builds (`npm run pdf`, which sets RESUME_PRIVATE); the
 * public site never has them. They come from the first of these that has a
 * private.json:
 *   - RESUME_PRIVATE_DIR, if set
 *   - ../PatrickClarkPrivate, Patrick's private repo cloned next to this one
 *     (its workflow lays the two repos out the same way)
 *   - private/ in this repo, which is never committed
 * See private/private.example.json and private/tailor.example.json.
 */
const fs = require("fs");
const path = require("path");
const { checkResume } = require("./check-resume.js");

const root = path.join(__dirname, "..");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

function findPrivateDir() {
  const dirs = [process.env.RESUME_PRIVATE_DIR, path.join(root, "..", "PatrickClarkPrivate"), path.join(root, "private")];
  return dirs.find((d) => d && fs.existsSync(path.join(d, "private.json"))) || path.join(root, "private");
}

// email: shown on the private PDFs only (Patrick keeps it off the public site).
// supervisors: { "<job title exactly as in resume.json>": "Name, phone; may contact: Yes" },
// printed under that job on the federal version only.
// details: lines under the contact details on every private PDF (like a clearance);
// federalDetails: lines added on the federal version only.
const PRIVATE_FIELDS = ["phone", "email", "address", "details", "federalDetails", "supervisors"];
const TAILOR_FIELDS = ["base", "file", "headline", "summary", "skills", "drop"];

function unknownKeys(obj, allowed, where) {
  return Object.keys(obj)
    .filter((k) => !k.startsWith("_") && !allowed.includes(k))
    .map((k) => `${where}: unknown field "${k}". Known fields: ${allowed.join(", ")}.`);
}

const shown = (name) => path.relative(root, path.join(findPrivateDir(), name)).split(path.sep).join("/");

function fail(file, problems) {
  if (!problems.length) return;
  throw new Error(`${shown(file)} has ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n` + problems.map((p) => `  - ${p}`).join("\n"));
}

function readPrivateFile(name) {
  const file = path.join(findPrivateDir(), name);
  if (!fs.existsSync(file)) return null;
  try {
    return readJson(file);
  } catch (err) {
    throw new Error(`${shown(name)} isn't valid JSON (${err.message}). Look for a missing comma or quote.`);
  }
}

// Phone number and the like, for private builds only.
function loadPrivate() {
  const p = readPrivateFile("private.json");
  if (!p) {
    throw new Error("No private.json found. Clone the private repo next to this one (../PatrickClarkPrivate), or copy private/private.example.json to private/private.json and fill it in.");
  }
  const problems = unknownKeys(p, PRIVATE_FIELDS, "private.json");
  for (const k of ["phone", "email", "address"]) {
    if (p[k] !== undefined && typeof p[k] !== "string") problems.push(`private.json: ${k} should be text in quotes.`);
  }
  if (typeof p.email === "string" && p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
    problems.push(`private.json: email "${p.email}" doesn't look like an email address.`);
  }
  if (p.supervisors !== undefined) {
    if (!p.supervisors || typeof p.supervisors !== "object" || Array.isArray(p.supervisors)) {
      problems.push('private.json: supervisors should be { "Job title": "Name, phone; may contact: Yes" }.');
    } else {
      // A title that matches no job would leave its supervisor off without a word.
      const titles = new Set((readJson(path.join(root, "src", "_data", "resume.json")).experience || []).map((j) => j.title));
      for (const [title, line] of Object.entries(p.supervisors)) {
        if (title.startsWith("_")) continue;
        if (!titles.has(title)) problems.push(`private.json: supervisors "${title}" doesn't match any job title in resume.json exactly.`);
        if (typeof line !== "string" || !line.trim()) problems.push(`private.json: supervisors "${title}" should be a line of text in quotes.`);
      }
    }
  }
  if (typeof p.phone === "string" && p.phone && !/^[\d\s().+-]{7,}$/.test(p.phone)) {
    problems.push("private.json: phone should be just the number, like (913) 555-0100.");
  }
  for (const k of ["details", "federalDetails"]) {
    if (p[k] !== undefined && (!Array.isArray(p[k]) || p[k].some((d) => typeof d !== "string" || !d.trim()))) {
      problems.push(`private.json: ${k} should be a list of lines in quotes.`);
    }
  }
  fail("private.json", problems);
  return p;
}

// A version aimed at one job posting, for private builds only.
function loadTailor(resume, bases) {
  const t = readPrivateFile("tailor.json");
  if (!t) return null;
  const problems = unknownKeys(t, TAILOR_FIELDS, "tailor.json");
  if (t.base !== undefined && !bases.some((b) => b.id === t.base)) {
    problems.push(`tailor.json: base "${t.base}" isn't a version. Use ${bases.map((b) => `"${b.id}"`).join(" or ")}.`);
  }
  for (const k of ["file", "headline", "summary"]) {
    if (t[k] !== undefined && typeof t[k] !== "string") problems.push(`tailor.json: ${k} should be text in quotes.`);
  }
  if (typeof t.file === "string" && t.file && !/^[A-Za-z0-9_-]+$/.test(t.file)) {
    problems.push("tailor.json: file should be a name without spaces or an extension, like Patrick_Clark_Resume_City.");
  }
  if (t.skills !== undefined) {
    problems.push(...checkResume({ skills: t.skills }).map((p) => p.replace(/^resume\.json/, "tailor.json")));
  }
  if (t.drop !== undefined) {
    const bullets = new Set((resume.experience || []).flatMap((j) => j.highlights || []));
    if (!Array.isArray(t.drop)) problems.push("tailor.json: drop should be a list of bullets copied exactly from resume.json.");
    else for (const d of t.drop) {
      // A drop that matches nothing would leave the bullet in without a word.
      if (!bullets.has(d)) problems.push(`tailor.json: drop "${String(d).slice(0, 60)}..." doesn't match any bullet in resume.json exactly.`);
    }
  }
  fail("tailor.json", problems);
  return t;
}

function loadVersions({ isPrivate = false } = {}) {
  const site = readJson(path.join(root, "src", "_data", "site.json"));
  const resume = readJson(path.join(root, "src", "_data", "resume.json"));
  const file = `${site.name.replace(/[^A-Za-z0-9]+/g, "_")}_Resume`;
  const versions = [
    { id: "standard", slug: "pdf", label: "Standard", file, maxPages: 2 },
    { id: "federal", slug: "federal", label: "Federal", file: `${file}_Federal`, maxPages: 2, federal: true },
  ];
  const t = isPrivate ? loadTailor(resume, versions) : null;
  if (t) {
    const base = versions.find((v) => v.id === t.base) || versions[0];
    versions.push({
      ...base,
      id: "tailored",
      slug: "tailored",
      label: "Tailored",
      file: t.file || `${base.file}_Tailored`,
      headline: t.headline,
      summary: t.summary,
      skills: t.skills,
      drop: t.drop,
      tailored: true,
    });
  }
  return versions;
}

module.exports = { loadVersions, loadPrivate, root };
