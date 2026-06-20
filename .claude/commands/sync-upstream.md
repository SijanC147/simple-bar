---
description: Sync fork to upstream losslessly — rebase fork-only commits onto upstream, drop already-merged commits, protect local-only/secret files, force-push fork, prune redundant branches/worktrees.
argument-hint: "[upstream/branch, default: upstream/master]"
allowed-tools: Bash, Read, Edit, Write, AskUserQuestion
---

# Sync fork to upstream — preserve fork mods, clean state

Goal: pull ALL upstream changes into local `master`, keep every fork-only modification, drop our commits that upstream already merged (they're now redundant), protect local-only and secret files, push the synced history to the **fork only**, and prune stale/redundant branches + worktrees. End on a clean, fully-synced `master`.

Resolve `<up>` from `$ARGUMENTS` (default `upstream/master`). The fork remote is `origin`.

## Hard rules
- **Push to the FORK (`origin`) ONLY. NEVER push to upstream.** Upstream changes only via PRs the user submits manually.
- **Fork is PUBLIC** → never commit or push secrets. Files carrying secrets must stay gitignored+untracked or skip-worktree; verify before every push.
- **Preserve all fork-only commits.** Never drop a commit unless its patch-id is already upstream (a merged twin).
- On a real conflict, reconcile so BOTH intents survive; never discard a side wholesale. If unresolvable, STOP and ask.
- Force-push is expected here (rebase rewrites history) but ONLY to `origin`, via refspec `git push origin +master`.

## Procedure

1. **Snapshot** (parallel):
   - `git fetch upstream --prune` and `git fetch origin --prune`
   - `git remote -v`; `git for-each-ref --format='%(refname:short) -> %(upstream:short) [%(upstream:track)]' refs/heads`
   - `git worktree list`
   - `git rev-list --left-right --count <up>...master` (left=upstream-only/behind, right=ours/ahead)
   - `git ls-files -v | grep '^S'` (skip-worktree = local-only-protected files)
   - `git status -sb`

2. **Classify our commits.** `git log --oneline <up>..master`. For each, decide:
   - **Merged twin** — same change already upstream (match by commit message, confirm with `git show <c> | git patch-id --stable`). These are redundant; the rebase auto-drops them.
   - **Fork-only** — not upstream (private-icon hook, custom commands, dev configs, etc.). These MUST survive.
   List both sets in the report so the user can sanity-check before the rewrite.

3. **Protect local-only + secret files** (so rebase can't clobber or leak them):
   - Back up every skip-worktree file and every gitignored-but-present sensitive file to `/tmp` (e.g. `cp .mcp.json /tmp/`, `cp lib/private-icons.js /tmp/`).
   - For each **skip-worktree** file: `git update-index --no-skip-worktree <f>`, then `git checkout -- <f>` to restore the committed version. (Upstream may lack the file or differ; skip-worktree otherwise makes rebase refuse with "would be overwritten".)
   - For dirty tracked files not meant to ship: stash or `git checkout --` them once backed up. Goal: clean tree (`git status` clean) before rebasing.

4. **Rebase.** `git rebase <up> master`.
   - Default rebase drops commits whose patch-id is already upstream — expect the merged twins to be skipped/dropped automatically.
   - On conflict: open each `<<<<<<<` file, merge both intents, `git add`, `git rebase --continue`. The private-icon hook lives at the edges of `lib/app-icons.js` (import line + trailing `Object.assign(apps, privateApps)`) — keep both edges and take upstream's body. Never abort to "make it go away".

5. **Restore local-only files** from `/tmp`:
   - `cp /tmp/<f> <path>` for each, then re-arm `git update-index --skip-worktree <f>` on files that use that mechanism.
   - Confirm secret/gitignored files are still ignored (`git check-ignore <f>`) and NOT staged.

6. **Verify before push:**
   - Hook intact: `grep -n "privateApps\|private-icons" lib/app-icons.js`.
   - `git rev-list --left-right --count <up>...master` → behind MUST be 0; ahead = number of fork-only commits.
   - No secrets staged/tracked: `git ls-files | grep -i mcp` should not list secret files; scan the diff if unsure.
   - `npm run lint`.

7. **Push to fork only:** `git push origin +master` (force; rebase rewrote history). Confirm the printed remote URL is the fork, not upstream.

8. **Clean up redundant branches + worktrees:**
   - A local/fork feature branch fully contained in `<up>` (`git rev-list <up>..<branch>` empty → its PR merged) is redundant: `git branch -D <branch>` and `git push origin --delete <branch>`. Confirm with the user before deleting any branch that is NOT fully merged.
   - `git worktree prune`; `git worktree list` → remove any stale/unused worktree (`git worktree remove <path>`). Keep the main worktree.

9. **Report:** commits dropped (merged twins) vs replayed (fork-only), every conflict + resolution, branches/worktrees deleted, final divergence (behind 0 / ahead N), and confirmation that the fork — not upstream — received the push and no secrets leaked.
