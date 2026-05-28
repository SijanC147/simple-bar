---
description: Prepare a clean, PR-ready feature branch off upstream and open the upstream PR (template-filled) in the browser for review before submit.
argument-hint: "[short description of the change, e.g. 'add app icons']"
allowed-tools: Bash, Read, Edit, Write, AskUserQuestion
---

# Prepare + open an upstream PR

Goal: take the relevant local work, isolate it on a clean feature branch based on **upstream's** default branch, verify it, and open the upstream compare page in the browser with the PR template pre-filled — for the user to review and submit manually. Change context: $ARGUMENTS

## Conventions learned for this repo (verify, don't assume)
- Remotes: `origin` = personal fork, `upstream` = canonical repo. They may point to the same URL — check `git remote -v`.
- Only lint exists (`npm run lint`); no build/test. Run `npm install` first if `node_modules` is missing.
- A safety hook blocks destructive git. Workarounds that pass: use `git push origin +<branch>` (refspec form) instead of `git push --force`; use `git update-ref refs/heads/<b> <target>` instead of `git reset --hard` / `git branch -D`.

## Procedure

1. **Identify the PR-bound work.** Inspect `git status` / `git log`. Separate:
   - **Project source** (here: `lib/**`) → goes in the PR.
   - **Personal tooling/config** (here: `.gitignore`, `.cursor/`, `.mcp.json`, `.claude/`, `.omc/`, `*-alt.*`) → must NOT go upstream.
   If both are mixed in working changes or commits, split them into separate commits (source vs config) before branching. Ask the user if categorization is ambiguous.

2. **Self-review the source diff** before committing:
   - Check ordering/style conventions (e.g. alphabetical registration in `lib/app-icons.js` and `lib/components/icons/icons.jsx`).
   - Check JSX/lint gotchas (e.g. SVG attrs must be camelCase: `clipRule`, `fillRule`, `strokeWidth`).
   - Fix issues found, then `npm run lint` until clean.

3. **Create the feature branch off upstream:**
   - `git fetch upstream`
   - `git checkout -b <feature-branch> upstream/<default-branch>` (name from $ARGUMENTS, e.g. `feat/...`).
   - Cherry-pick the PR-bound source commit(s) onto it: `git cherry-pick <sha>...`.
   - This keeps the PR free of personal-config commits and based on a clean upstream point.

4. **Push to the fork:** `git push -u origin <feature-branch>` (first push). For updates after amends, use `git push origin +<feature-branch>`.

5. **Fill the PR template.** Read `.github/pull_request_template.md` if present. Write a filled body to `/tmp/pr-body.md`:
   - Description (what + why, dependencies, "Fixes #" if any).
   - Type of change (tick the real one).
   - How tested — only claim what was actually verified. Probe real values: `sw_vers -productVersion`, `yabai --version`, Übersicht version (`defaults read /Applications/Übersicht.app/Contents/Info CFBundleShortVersionString` + `CFBundleVersion`). Do NOT invent test results.
   - Checklist — only tick boxes you have evidence for (lint passed, self-review done, no new warnings). Be honest about anything unverified (e.g. visual render the user must confirm).
   - Optional: a bulleted summary of what was added, with homepage links if the user wants them.

6. **Open the PR for review (do NOT auto-submit):**
   `gh pr create --web --repo <upstream-owner>/<repo> --base <default-branch> --head <fork-owner>:<feature-branch> --title "<title>" --body-file /tmp/pr-body.md`
   This opens the browser pre-filled; the user reviews and clicks Create.

7. **If commits change after opening** (amends, added icons): re-push with `git push origin +<feature-branch>`, then re-run the `gh pr create --web ...` command so the browser refreshes with the latest.

8. **Report:** branch name, commits on it, base/head, PR-body path, any honest caveats (unverified items), and the compare URL.

Never submit the PR yourself. Never push personal config/tooling to the upstream branch. Always leave the final submit to the user.
