---
description: Pull + merge upstream/remote updates into the local branch, preserving ALL remote and local work when resolving conflicts.
argument-hint: "[remote/branch, default: origin/master]"
allowed-tools: Bash, Read, Edit, Write, AskUserQuestion
---

# Sync upstream/remote into local — lossless merge

Goal: integrate all incoming commits from `$ARGUMENTS` (default `origin/master`) into the current local branch **without losing any remote OR local work**, including uncommitted/untracked changes. When a conflict can't be auto-resolved, STOP and ask the user — never discard either side.

## Hard rules
- **Never** run `git reset --hard`, `git checkout -- <file>`, `git clean -f`, or `git branch -D` to make a conflict "go away". Preserve both sides.
- **Never** force-push as part of a sync.
- If a destructive git command is blocked by a safety hook, do NOT try to bypass it — find a non-destructive equivalent or ask the user.
- Untracked local files that collide with incoming committed files are real work — surface them, don't silently overwrite.

## Procedure

1. **Snapshot state.** Run in parallel:
   - `git remote -v`
   - `git fetch --all --prune`
   - `git status`
   - `git rev-list --count <target>..HEAD` (local ahead) and `git rev-list --count HEAD..<target>` (behind)
   - `git log --oneline HEAD..<target>` and `git diff --name-only HEAD <target>`
   Resolve `<target>` from `$ARGUMENTS` or default `origin/master`.

2. **Decide merge strategy from divergence:**
   - behind>0, ahead=0, clean tree → fast-forward (`git pull --ff-only`).
   - behind>0, ahead>0 → true merge (`git merge` / `git pull --no-rebase`); expect conflicts.
   - ahead=0, behind=0 → already up to date; report and stop.

3. **Protect the working tree first.** If tracked files are modified OR untracked files exist:
   - `git stash push -u -m "pre-sync-<date>"` to get a clean tree before FF/merge.
   - Note: untracked files in the stash live at `stash@{0}^3`; inspect with `git show "stash@{0}^3:<path>"`.

4. **Integrate.** Run the chosen FF/merge. Then `git stash pop`.

5. **Resolve collisions losslessly:**
   - **Untracked-vs-incoming same path** (stash pop "already exists, no checkout"): compare both versions
     (`diff <disk> <(git show HEAD:<path>)`). Then ASK the user which wins, offering: keep local, keep incoming, or **keep both** (rename one to `<name>-alt.<ext>`, unregistered). Default to asking — both are real work.
     - To apply "keep both": move incoming aside (`mv <path> /tmp/x`), pop/restore local, rename local to `<name>-alt`, restore incoming.
   - **Tracked merge conflicts** (`<<<<<<<` markers): open each file, reconcile so BOTH intents survive; never delete a side wholesale. Re-`git add` resolved files.
   - Identical additions on both sides auto-resolve — verify no duplicate entries (e.g. grep the symbol).

6. **Verify.** `git status` clean (or conflicts resolved), then run the project's lint/test (`npm run lint` here) to confirm the merge didn't break anything.

7. **Report:** commits pulled, files merged, every conflict and how it was resolved, and any files deliberately left untracked (e.g. `*-alt.*`). Confirm nothing was discarded.

Do NOT auto-commit merge resolutions beyond what the merge itself creates, and do NOT push, unless the user asks.
