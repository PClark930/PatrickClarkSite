# PatrickClarkSite: Claude instructions

Personal website for **Patrick Clark**: his resume and, later, his work. Address: **https://patrickclark.cv** (not live yet). Patrick owns this repo and makes changes himself with Claude. **Mitch** (MitchDizzle) set it up and handles hosting and deploys; it follows the same setup as Mitch's other sites (The Cafe's site, Legacy Home Services).

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
Needs [Node.js](https://nodejs.org) 18 or newer.
- `npm install` once, then `npm start`: the site at http://localhost:8080, reloading as files change.
- `npm run build` writes the finished site to `_site/` (gitignored). That folder is what gets uploaded.

## Layout
| Path | What it is |
|---|---|
| `src/index.njk` | Home page (a placeholder for now) |
| `src/resume.njk` → `/resume/` | Resume, built entirely from `src/_data/resume.json`. Empty sections don't show |
| `src/_data/resume.json` | Resume content. Its `_examples` key shows the shape of each section |
| `src/_data/site.json` | Name, description, the live address (`url`), and `preview` |
| `src/_includes/layouts/base.njk` | The page shell: `<head>`, header and nav |
| `src/assets/css/style.css` | Styles. The current look is a plain placeholder; the design is Patrick's call |
| `src/.htaccess`, `src/robots.txt` | Server settings and search-engine rules; copied to the site as is |
| `private/` | His documents. Gitignored, never committed |

Conventions, same as Mitch's other sites:
- One file per page in `src/`, front matter needs `title` and `description`.
- Internal links are root-absolute (`/resume/`).
- CSS and JS links go through the `bust` filter (`{{ '/assets/css/style.css' | bust }}`): the server caches them for a week.
- Accessible by default: real headings in order, alt text on images, good contrast, works with "reduce motion".
- `"preview": true` in `site.json` keeps search engines away. It goes `false` at launch, with Mitch.

## Branches and deploying
- **`dev` is where work happens.** Commit there. **`main` is what goes live.**
- Check the branch before committing (`git status -sb`).
- **The site isn't live yet.** Deploying is set up (`.github/workflows/deploy.yml`, FTP to Mitch's hosting) but runs only by hand until Mitch turns it on. Don't change the workflow, the FTP secrets, or merge into `main` to publish: that's Mitch's step. When Patrick thinks the site is ready, tell him to let Mitch know.

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
