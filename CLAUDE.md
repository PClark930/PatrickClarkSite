# PatrickClarkSite: Claude instructions

Personal website for **Patrick Clark**: his resume and, later, his work. Address: **https://patrickclark.cv**, published from `main`. Patrick owns this repo and makes changes himself with Claude. **Mitch** (MitchDizzle) set it up and handles hosting and deploys; it follows the same setup as Mitch's other sites (The Cafe's site, Legacy Home Services).

Built with **Eleventy 3 + Nunjucks**, static, no server.

## Who you're working with
Patrick is the person typing. Assume he isn't a web developer unless he shows otherwise.
- **Plain words.** No jargon without a one-line explanation. Say what changed on the site, not which files.
- **Show, then commit.** After a change, have him look at it at http://localhost:8080 (`npm start`) before committing.
- **Short report at the end of a task:** what changed, anything he must do, anything you need from him.
- Ask only when truly blocked, or for anything in "Before you publish" below.

## THIS REPO IS PUBLIC
Anyone can read every file and every past version, and **deleting something later does not remove it from git history.** Treat every commit as published.
- Never commit his original documents, anything in `private/`, passwords, keys or tokens.
- Before committing anything that came from his documents, follow "Before you publish".

## Documents (resume, work files)
Patrick puts his files in **`private/inbox/`** (resume as PDF or Word, reviews, write-ups, certificates, work samples). `private/` is gitignored and never leaves his computer. When he says he's added something, or asks you to use a document, use the `add-document` skill (`.claude/skills/add-document/SKILL.md`). In short:
1. Read the file. Pull out only what belongs on a public site.
2. Resume facts go into `src/_data/resume.json`, which `/resume/` and the home page are built from. Other kinds of work (projects, writing, samples) get their own page or section: **ask him how he wants it shown** before building it.
3. Move the original to `private/documents/` so the inbox shows what's still waiting.

### Before you publish (ask Patrick, every time)
List for him, in plain words, what will appear on the site from the document, and **get a yes before committing**. Leave these out unless he says otherwise:
- **Contact details beyond city/state and one email:** phone number, home address, personal email he hasn't chosen to show.
- **Anything an employer would consider private:** client or customer names, internal project or system names, revenue and other figures, anything under an NDA or marked confidential.
- **Other people's details:** references, managers' names, coworkers.
- **Dates of birth, ID numbers, salary, reasons for leaving a job.**

Never invent or embellish. Tighten the wording, but every fact (title, date, number, result) must come from his documents or from him. If something's unclear, ask.

## Run it
Needs [Node.js](https://nodejs.org) 22 or newer.
- `npm install` once, then `npm start`: the site at http://localhost:8080, reloading as files change.
- `npm run build` writes the finished site to `_site/` (gitignored), including the public resume PDF. That folder is what gets uploaded.
- `npm run pdf` writes every resume PDF with his private details to `_pdf/` (gitignored). See "Resume PDFs".
- The PDFs need Chrome or Edge installed (set `CHROME_PATH` if it's somewhere unusual).

## Resume PDFs
When Patrick wants his resume as a PDF, is applying somewhere (Indeed, USAJOBS), or wants a version for one posting, use the `resume-pdf` skill (`.claude/skills/resume-pdf/SKILL.md`). In short:
- Three versions, each two pages at most: **standard**, **federal** (USAJOBS: adds hours per week, needs his phone) and **tailored** (one posting).
- The public site has only the standard one, without his phone. The copies with his phone are built by his private repo, **PClark930/PatrickClarkPrivate**, which holds his private details (`private.json`) and any tailored version (`tailor.json`). Neither file ever goes in this repo.
- Facts stay in `src/_data/resume.json`; a tailored version can reword the headline, summary and skills and leave bullets out, but never adds a fact.

### Checks
Two checks stop the build with a message saying what to fix. Fix what they point at; don't loosen a check to get past it.
- **resume.json** (`scripts/check-resume.js`), before every build, `npm start` included: unknown fields (a typo like `"highlight"` would quietly drop a job's bullets), dates the page can't show (`"Present"`, `"April 2023"`), and missing titles or names. If `npm start` stops as soon as it starts, resume.json is already broken: read the message, fix the file, start again.
- **The resume PDFs** (`scripts/resume-pdf.js`): over two pages, a federal version missing hours per week, a path from the printing computer, or a version name in the PDF's title. `npm run build` only warns, so the site still deploys; `npm run pdf` doesn't write a PDF with a problem.
- **The finished site** (`scripts/check-site.js`), at the end of `npm run build`: phone numbers, any email address except resume.json's `email`, paths from someone's computer (`C:\Users\...`), and copies of files from `private/`. It says where it found something, never what. If Patrick wants something there on purpose (a phone number, a second email), that's a change to the check: tell him to ask Mitch.

GitHub runs the same build on every push to `dev` and every pull request (`.github/workflows/check.yml`). A red X on a commit means it failed; the log under the Actions tab says why.

## Layout
| Path | What it is |
|---|---|
| `src/index.njk` | Home page (a placeholder for now) |
| `src/resume.njk` → `/resume/` | Resume, built entirely from `src/_data/resume.json`. Empty sections don't show |
| `src/resume-print.njk` → `/resume/pdf/`, `/resume/federal/` | The pages the PDFs are printed from (not linked, not indexed). Their style is `src/_includes/css/resume-print.css` |
| `src/_data/resume.json` | Resume content. Its `_examples` key shows the shape of each section |
| `src/_data/site.json` | Name, description, the live address (`url`), and `preview` |
| `src/_includes/layouts/base.njk` | The page shell: `<head>`, header and nav |
| `src/assets/css/style.css` | Styles. The current look is a plain placeholder; the design is Patrick's call |
| `src/.htaccess`, `src/robots.txt` | Server settings and search-engine rules; copied to the site as is |
| `private/` | His documents. Gitignored, never committed, except the two `*.example.json` files that show the format of private.json and tailor.json |
| `scripts/` | The build checks (see "Checks" above), the resume versions (`versions.js`) and the PDF printer (`resume-pdf.js`) |
| `.github/workflows/` | `check.yml` builds every push to `dev` and every pull request. `deploy.yml` uploads the site (Mitch's) |

Conventions, same as Mitch's other sites:
- One file per page in `src/`, front matter needs `title` and `description`.
- Internal links are root-absolute (`/resume/`).
- CSS and JS links go through the `bust` filter (`{{ '/assets/css/style.css' | bust }}`): the server caches them for a week.
- Accessible by default: real headings in order, alt text on images, good contrast, works with "reduce motion".
- `"preview": true` in `site.json` keeps search engines away. It goes `false` at launch, with Mitch.

## Branches and deploying
- **`dev` is where work happens.** Commit there. **`main` is what goes live.**
- Check the branch before committing (`git status -sb`).
- **Merging into `main` publishes the site.** `.github/workflows/deploy.yml` builds it, uploads it to Mitch's hosting over FTP, then checks that the live pages load. A red X on that run means look at https://patrickclark.cv right away.
- Merging into `main` is Mitch's step: don't merge or push to `main`, and don't change the workflows, `src/.htaccess`, or the FTP secrets. When Patrick wants a change published, tell him to let Mitch know.
- Until launch, `"preview": true` in `site.json` keeps search engines from listing the site even though it's online.

## The Website Playbook
Mitch keeps a playbook of how he builds small websites and what went wrong before: **https://github.com/MitchDizzle/WebsitePlaybook**. It's private; Patrick is a collaborator on it.

### Check it out at the start of every session
Before any site work, make sure an up-to-date copy sits next to this repo at `../WebsitePlaybook`:
1. **Not there:** `git clone https://github.com/MitchDizzle/WebsitePlaybook.git ../WebsitePlaybook`
2. **There:** `git -C ../WebsitePlaybook status -sb` first.
   - On `main` with nothing changed: `git -C ../WebsitePlaybook pull --ff-only`.
   - On a `suggest/…` branch or with changes: a suggestion is in progress. Leave it alone and read the playbook from `main` with `git -C ../WebsitePlaybook show origin/main:<file>` after a `git -C ../WebsitePlaybook fetch`.
3. **Clone or fetch fails** ("repository not found", 403, a sign-in prompt that doesn't work): Patrick's access isn't working yet. The usual cause is a **collaborator invite he hasn't accepted**: have him open https://github.com/MitchDizzle/WebsitePlaybook/invitations signed in as PClark930 and accept. If it still fails, carry on without the playbook and tell him to check with Mitch. Don't block his work on it.

Then read the playbook's `CLAUDE.md` (whose words are whose) and `README.md` (the list of entries).

### Using it
- **Read the relevant entry** before building something it covers. Follow it unless Patrick wants otherwise.
- **Entries in its `suggestions/` folder are unreviewed** (including Patrick's own): a lead to check, not a rule.
- **Don't copy its text into this repo.** The playbook is private and this repo is public: link to it or apply it, don't paste it.
- **When you hit a real snag** (something that cost time, failed silently, or a rule that would have saved the trouble), write it up as a **suggestion** with the `playbook-suggest` skill. Suggestions are Patrick's and yours, not Mitch's: they go only in the playbook's `suggestions/` folder, on their own branch, for Mitch to review. Never edit the playbook's own entries or push to its `main`.
