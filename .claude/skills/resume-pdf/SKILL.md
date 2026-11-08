---
name: resume-pdf
description: Get Patrick a resume PDF to upload or send (Indeed, USAJOBS, a job posting, an email), or a version aimed at one posting. Use when he asks for his resume as a PDF, says he's applying somewhere, or asks to tailor his resume for a job. Works from his phone.
---

# Resume PDFs

This repo is **public**. Read "THIS REPO IS PUBLIC" and "Before you publish" in `CLAUDE.md` first; they win over anything here.

## Which PDF

| He's applying through | Version | Has his phone number |
|---|---|---|
| Indeed and most job sites | Standard | Public copy: no (Indeed asks for it in its own form). Private copy: yes |
| USAJOBS or another federal job | Federal | Yes. USAJOBS requires it |
| One posting he cares about | Tailored | Yes |
| Email to a person, or a printout | Standard, private copy | Yes |

**Public copy** (standard, no phone): https://patrickclark.cv/Patrick_Clark_Resume.pdf. It updates when `dev` is merged into `main` (Mitch's step).

**Private copies** open only when signed in to GitHub as Patrick or Mitch. He can bookmark them on his phone:
- Standard: https://github.com/PClark930/PatrickClarkPrivate/releases/download/pdfs/Patrick_Clark_Resume.pdf
- Federal: https://github.com/PClark930/PatrickClarkPrivate/releases/download/pdfs/Patrick_Clark_Resume_Federal.pdf
- Tailored: the same address ending in the `file` name from tailor.json, plus `.pdf`

They're rebuilt from this repo's `dev` branch every morning, on every push to the private repo, and when he taps Run workflow (GitHub app: PatrickClarkPrivate > Actions > Resume PDFs > Run workflow). A build takes about a minute. If a build fails, the links keep the last good PDF and the run shows a red X with the reason.

## Where things go

- **Facts on his resume** (jobs, bullets, dates, hours per week, skills): `src/_data/resume.json` here, on `dev`. These are public: follow the add-document skill's rules (his facts only, his yes before committing).
- **Private details** (phone, mailing address, lines for the federal version like citizenship): `private.json` in the private repo, PClark930/PatrickClarkPrivate. Never in this repo, not even in a commit message.
- **A version for one posting**: `tailor.json` in the private repo.

A Claude session can only push to the repo it was started on. For private details or a tailored version, he needs a session on PatrickClarkPrivate; its CLAUDE.md explains the rest. Tell him that in one line rather than trying to reach it from here.

## USAJOBS rules (the federal version)

- **Two pages at most.** A longer resume makes him ineligible.
- Name, email and **phone** at the top; for every job, start and end month and year, and **hours per week**.
- Hours per week go in resume.json as `"hours"` on each job (text, like `"40"`); only the federal PDF shows them. If any job is missing hours, the federal PDF isn't made and the build says which jobs. Ask Patrick for the numbers; never guess. For Army Reserve roles, ask what he wants to show.
- Citizenship, veterans' preference or a clearance go in private.json's `federalDetails`, and only if he says so.

## Page limits

Every version is two pages at most. If a build says one is too long, take out or shorten a bullet (with `drop` in tailor.json for one posting, or ask him which bullet to cut from resume.json). Never shrink the type or margins.

## On his computer

`npm run pdf` writes every version to `_pdf/` (gitignored). It reads private.json from `../PatrickClarkPrivate` if the private repo is cloned there, otherwise from `private/private.json` (copy `private/private.example.json`; `private/` is never committed). Prefer the clone, so there's one copy of his details.

`npm run build` makes only the public standard PDF, and warns if the federal version has a problem.

## Never

- Put his phone, address, or anything from private.json into this repo.
- Invent or stretch a fact to fit a posting. Every fact comes from resume.json or from him.
- Upload or send a PDF for him. Give him the link; he submits it himself.
