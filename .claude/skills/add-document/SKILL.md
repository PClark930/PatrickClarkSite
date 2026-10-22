---
name: add-document
description: Take a document Patrick added (resume, work file, certificate, review) from private/inbox/ and put what he approves onto the site. Use when he says he added or uploaded a file, or asks to update the site from his resume or another document.
---

# Add a document to the site

This repo is **public** and git keeps every past version. Read "Documents" and "Before you publish" in `CLAUDE.md` first; they win over anything here.

## Steps

1. **Find it.** List `private/inbox/` (create `inbox/` and `documents/` if they're missing: they aren't in git). If it's empty, ask Patrick where the file is and have him put it there (a file elsewhere on his computer is fine to read, but it should end up in `private/`). Several files: take them one at a time unless he says otherwise.
2. **Read it.** PDF, Word, images or text. If you can't read it (a scan you can't make out, a locked PDF), say so; never guess at the contents.
3. **Sort what's in it** into three lists:
   - **For the site:** what a stranger hiring him should see.
   - **Held back by default:** everything under "Before you publish" in `CLAUDE.md` (phone, home address, employer-private details, other people, personal IDs and pay).
   - **Unclear:** anything you're not sure he'd want public, or facts that conflict with what's already on the site.
4. **Show Patrick** the three lists in plain words, short. For a resume, show the changes against what's already in `resume.json` (new job, changed dates, removed lines), not the whole thing. Ask about the unclear items. **Wait for his yes.**
5. **Write it in.**
   - Resume facts → `src/_data/resume.json`, in the shape its `_examples` key shows. Newest job first. Dates `"YYYY-MM"` or `"YYYY"`; empty `end` means current.
   - Keep his facts exact. Tighten wording into short lines that start with a verb; never add a number, result or skill he didn't give.
   - Anything that isn't resume data (a project, a write-up, samples): ask him how it should appear before building a page for it.
   - Images he approves for the site go in `src/assets/img/`, resized for the web, with alt text. Strip location data (EXIF) from photos.
6. **Check it.** `npm start`, have him look at http://localhost:8080/resume/ (or the new page). Fix what he points out.
7. **File the original.** Move it from `private/inbox/` to `private/documents/`. If a newer resume replaces an older one, keep both; prefix the old one's name with its date.
8. **Commit on `dev`** with a message saying what was added, e.g. "Resume: add 2025 role at …". Check `git status` first: nothing under `private/` should be staged. Push only if he asks.

## Never
- Commit an original document, or text pasted whole from one.
- Publish something from "held back" or "unclear" without his explicit yes for that item.
- Make up or "improve" facts.
