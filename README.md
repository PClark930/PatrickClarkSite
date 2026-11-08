# Patrick Clark: Website

Personal site for Patrick Clark: resume and work. Will live at **https://patrickclark.cv**. Eleventy (static), same setup as Mitch's other sites.

## Working on it with Claude
Open this folder in Claude Code. `CLAUDE.md` tells Claude how this repo works; you don't need to read it.

- **Adding your resume or other documents:** put the files in `private/inbox/` and tell Claude ("I added my resume"). It shows you what it plans to put on the site and asks before anything is published. `private/` is never uploaded. This repo is **public**, so originals stay on your computer.
- **Changing the site:** describe what you want. Claude makes the change and has you look at it locally before saving it.
- **A resume PDF to apply with** (Indeed, USAJOBS, one job posting): ask Claude, from your computer or your phone. The public site has a PDF without your phone number. The copies with it, a federal version for USAJOBS, and versions aimed at one posting come from your private repo (PatrickClarkPrivate), so your phone number never goes in this public one.
- **Snags along the way** go to Mitch's Website Playbook as suggestions, for Mitch to review.

## Run it locally
Needs [Node.js](https://nodejs.org) 22 or newer.
```bash
npm install
npm start
```
Open http://localhost:8080. The page reloads when a file is saved. `npm run build` writes the finished site to `_site/`.

Every build checks the resume data for typos, and `npm run build` then checks the finished pages for a phone number, a second email address, or anything from `private/`. If one finds something, the build stops and says what to fix. GitHub runs the same build on every push to `dev`.

## Going live
Work happens on `dev`; `main` is what's published. Merging `dev` into `main` puts the site on https://patrickclark.cv within a few minutes; do it when you're ready to deploy (Claude can do it for you). Until launch, search engines are asked not to list it (`"preview": true` in `src/_data/site.json`).
