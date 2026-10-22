---
name: playbook-suggest
description: Write up a snag hit while building this site as a suggestion for Mitch's Website Playbook. Use when something cost real time, failed silently, or a rule would have prevented it, or when Patrick asks to add something to the playbook.
---

# Suggest a playbook entry

The Website Playbook (https://github.com/MitchDizzle/WebsitePlaybook) is **Mitch's**. Anything from Patrick, or from you working for him, is a **suggestion**: it goes in its own file under `suggestions/`, clearly marked as not Mitch's and not reviewed, and Mitch decides whether it becomes part of the playbook. Read the playbook's own `CLAUDE.md` and `suggestions/README.md` first; they win over this file.

## Is it worth one?
Yes: something that would bite the next site too (a hosting quirk, a build gotcha, a browser behaviour, a tool's limit, a step that's easy to get wrong) and that you can explain with what actually happened.
No: a typo, a one-off mistake, taste, or something the playbook already says (check its `README.md` and `suggestions/` first; if it's already there as a suggestion, add a "Seen again" line to that file instead of a new one).

## Steps
1. **Tell Patrick** in one line what you'd suggest and why. Write it only if he agrees.
2. **Get the playbook** at `../WebsitePlaybook`, as in "Check it out at the start of every session" in `CLAUDE.md`. No access: skip to "No access" below.
3. **Branch:** `git -C ../WebsitePlaybook switch main && git -C ../WebsitePlaybook pull`, then `git -C ../WebsitePlaybook switch -c suggest/patrick-<short-topic>`.
4. **Write** `suggestions/<yyyy-mm-dd>-<short-topic>.md` from the template in `suggestions/README.md`: `suggested_by: Patrick Clark`, `project: PatrickClarkSite`, `status: unreviewed`. Facts only: what happened, what fixed it, the rule you'd suggest, links to sources. Nothing private from Patrick's documents.
5. **Add only that file.** Don't touch the playbook's entries, its `README.md`, or anything else.
6. **Commit and push the branch** (`git push -u origin suggest/patrick-<short-topic>`), never `main`. Tell Patrick it's waiting for Mitch, and give him the link GitHub prints to open a pull request if he wants to.

## No access
Write the same file into `private/playbook-suggestions/` here (gitignored, so it stays on his computer) and tell Patrick to send it to Mitch.
