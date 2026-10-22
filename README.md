# Patrick Clark: Website

Personal site for Patrick Clark: resume and work. Will live at **https://patrickclark.cv**. Eleventy (static), same setup as Mitch's other sites.

## Working on it with Claude
Open this folder in Claude Code. `CLAUDE.md` tells Claude how this repo works; you don't need to read it.

- **Adding your resume or other documents:** put the files in `private/inbox/` and tell Claude ("I added my resume"). It shows you what it plans to put on the site and asks before anything is published. `private/` is never uploaded. This repo is **public**, so originals stay on your computer.
- **Changing the site:** describe what you want. Claude makes the change and has you look at it locally before saving it.
- **Snags along the way** go to Mitch's Website Playbook as suggestions, for Mitch to review.

## Run it locally
Needs [Node.js](https://nodejs.org) 18 or newer.
```bash
npm install
npm start
```
Open http://localhost:8080. The page reloads when a file is saved. `npm run build` writes the finished site to `_site/`.

## Going live
Not live yet. Work happens on `dev`; `main` is what will be published. Hosting and deploys are set up by Mitch (`.github/workflows/deploy.yml`) and switched on when there's something to show.
