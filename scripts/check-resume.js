/*
 * Checks src/_data/resume.json before the site is built.
 *
 * The resume page shows only the fields it knows, so a typo there doesn't
 * break anything: the content just goes missing from the page without a word.
 * "highlight" instead of "highlights" drops a job's bullets, and an end date
 * of "Present" prints "Invalid Date". This turns those slips into a build
 * error that says what to fix.
 *
 * .eleventy.js runs it before every build, so `npm start` and `npm run build`
 * both stop on a problem. It also runs on its own:
 *   node scripts/check-resume.js
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "_data", "resume.json");

// What each part of resume.json may hold. Matches the `_examples` key in
// resume.json and what src/resume.njk shows. Keys starting with "_" are notes
// and are skipped.
const TEXT = "text";
const DATE = "date";
const LIST = "list";
const shape = {
  headline: TEXT,
  location: TEXT,
  email: TEXT,
  summary: TEXT,
  links: { label: TEXT, url: TEXT },
  // hours: hours per week, printed only on the federal PDF (USAJOBS asks for it).
  experience: { title: TEXT, company: TEXT, location: TEXT, start: DATE, end: DATE, hours: TEXT, highlights: LIST },
  education: { school: TEXT, credential: TEXT, end: DATE },
  certifications: { name: TEXT, issuer: TEXT, date: DATE },
  skills: { group: TEXT, items: LIST },
};
// Fields an entry can't go without.
const required = {
  links: ["label", "url"],
  experience: ["title", "start"],
  education: ["credential"],
  certifications: ["name"],
  skills: ["group", "items"],
};

const DATE_FORMAT = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

// Edit distance, to suggest the field that was probably meant.
function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = row[j];
      row[j] = next;
    }
  }
  return row[b.length];
}

// Other names people often use for a field.
const aliases = {
  experience: { role: "title", position: "title", job: "title", employer: "company", organization: "company", unit: "company", city: "location", from: "start", to: "end", hoursperweek: "hours", hours_per_week: "hours", bullets: "highlights", duties: "highlights", description: "highlights" },
  education: { degree: "credential", program: "credential", institution: "school", university: "school", date: "end", year: "end", graduated: "end" },
  certifications: { title: "name", organization: "issuer", issued: "date", year: "date" },
  skills: { name: "group", category: "group", list: "items", skills: "items" },
  links: { name: "label", title: "label", href: "url", link: "url" },
};

function unknownField(where, section, key, known) {
  const k = key.toLowerCase();
  let guess = (aliases[section] || {})[k];
  if (!guess) {
    const best = known.map((f) => ({ f, d: distance(k, f) })).sort((x, y) => x.d - y.d)[0];
    if (best && best.d <= Math.max(1, Math.floor(k.length / 3))) guess = best.f;
  }
  const hint = guess ? ` Did you mean "${guess}"?` : ` Known fields: ${known.join(", ")}.`;
  return `${where}: unknown field "${key}", so the page would leave it out.${hint}`;
}

function checkDate(where, key, value, problems) {
  const s = String(value);
  if (s === "") return;
  if (/^(present|current|now|ongoing)$/i.test(s.trim())) {
    problems.push(`${where}: ${key} is "${s}". Leave it as "" for something current; the page shows "Present".`);
  } else if (!DATE_FORMAT.test(s)) {
    problems.push(`${where}: ${key} "${s}" isn't a date the page can show. Use "YYYY-MM" (like "2023-04") or "YYYY".`);
  }
}

// "2023-04" -> [2023, 4]; "2023" -> [2023, null].
function parts(d) {
  const [y, m] = String(d).split("-");
  return [Number(y), m ? Number(m) : null];
}

function checkEntry(section, entry, index, problems) {
  const fields = shape[section];
  const label = entry && typeof entry === "object" ? entry.title || entry.name || entry.credential || entry.group || entry.label : "";
  const where = `${section} ${index + 1}${label ? ` ("${label}")` : ""}`;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    problems.push(`${where}: should be { ... } with fields like ${Object.keys(fields).join(", ")}.`);
    return;
  }
  for (const [key, value] of Object.entries(entry)) {
    if (key.startsWith("_")) continue;
    const kind = fields[key];
    if (!kind) {
      problems.push(unknownField(where, section, key, Object.keys(fields)));
    } else if (kind === LIST) {
      if (!Array.isArray(value)) {
        problems.push(`${where}: ${key} should be a list in [ ], one item per line.`);
      } else if (value.some((v) => typeof v !== "string" || !v.trim())) {
        problems.push(`${where}: ${key} has an empty item or one that isn't text in quotes.`);
      }
    } else if (kind === DATE) {
      if (typeof value !== "string" && typeof value !== "number") {
        problems.push(`${where}: ${key} should be a date in quotes, like "2023-04".`);
      } else {
        checkDate(where, key, value, problems);
      }
    } else if (typeof value !== "string") {
      problems.push(`${where}: ${key} should be text in quotes.`);
    }
  }
  for (const key of required[section] || []) {
    const v = entry[key];
    if (v === undefined || v === null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length)) {
      problems.push(`${where}: ${key} is missing or empty.`);
    }
  }
  if (section === "links" && typeof entry.url === "string" && entry.url && !/^(https?:\/\/|mailto:)/.test(entry.url)) {
    problems.push(`${where}: url should start with https://.`);
  }
  if (section === "experience" && DATE_FORMAT.test(String(entry.start)) && DATE_FORMAT.test(String(entry.end))) {
    const [sy, sm] = parts(entry.start);
    const [ey, em] = parts(entry.end);
    if (sy > ey || (sy === ey && sm && em && sm > em)) {
      problems.push(`${where}: ends (${entry.end}) before it starts (${entry.start}).`);
    }
  }
}

// Returns a list of problems in plain words; an empty list means it's fine.
function checkResume(resume) {
  const problems = [];
  if (!resume || typeof resume !== "object" || Array.isArray(resume)) {
    return ["resume.json should be one { ... } object."];
  }
  for (const [key, value] of Object.entries(resume)) {
    if (key.startsWith("_")) continue;
    const kind = shape[key];
    if (!kind) {
      problems.push(unknownField("resume.json", "", key, Object.keys(shape)));
    } else if (kind === TEXT) {
      if (typeof value !== "string") problems.push(`resume.json: ${key} should be text in quotes ("" if empty).`);
    } else if (!Array.isArray(value)) {
      problems.push(`resume.json: ${key} should be a list in [ ] ([] if empty).`);
    } else {
      value.forEach((entry, i) => checkEntry(key, entry, i, problems));
    }
  }
  if (typeof resume.email === "string" && resume.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.email)) {
    problems.push(`resume.json: email "${resume.email}" doesn't look like an email address.`);
  }
  return problems;
}

function readResume() {
  const raw = fs.readFileSync(file, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Usually a missing comma or quote, or a comma after the last item.
    throw new Error(`src/_data/resume.json isn't valid JSON (${err.message}). Look for a missing comma or quote, or a comma after the last item in a list.`);
  }
}

// Throws one error listing every problem, for .eleventy.js.
function assertResume() {
  const problems = checkResume(readResume());
  if (problems.length) {
    const n = problems.length;
    throw new Error(
      `src/_data/resume.json has ${n} problem${n === 1 ? "" : "s"}, so the site wasn't built:\n` +
        problems.map((p) => `  - ${p}`).join("\n")
    );
  }
}

module.exports = { checkResume, assertResume };

if (require.main === module) {
  try {
    assertResume();
    console.log("resume.json: OK");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
