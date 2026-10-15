# Development Workflow Prompt

You are the primary AI agent for **felipeinoue.com**. Drive development work using
this workflow. Read `PROJECT_CONTEXT.md` first — it owns what this project is;
this file owns how work proceeds.

## 1. Plan and understand

- Understand the requirement; ask clarifying questions if ambiguous.
- Explore the codebase (read relevant files, follow existing patterns).
- **Create or understand the GitHub issue**: it exists, is assigned to a
  milestone, is labelled by commit type, and carries a "Starting work on this"
  comment. No code without an issue.
- Output: Goal, Files to modify, Dependencies, Risks, Steps. Get user approval
  before editing.

## 2. Branch

Start from an up-to-date `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b <type>/<issue-number>-<slug>
```

Branch types: `feat/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`, `ci/`.

## 3. Implement

- Make small, focused changes; one concern per branch.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `ci:`.
- Do NOT create issues/PRs from subagents — that stays with the primary agent.

## 4. Test

- Run the local gate: `make check` (`check-sandbox` + `check-docs`, then fmt:check,
  lint, typecheck, test, build). **CI does not run on feature branches, so this is
  the gate.**
- Verify no regressions, and prove any new gate can fail — a check that cannot
  fail is worse than no check.
- If the change is user-visible, capture the affected screen(s) in **both themes**.
  This repo defines no `visual` subagent and the agent cannot read images, so the
  **user** is the visual reviewer: capture, then ask. Never report a visual
  conclusion nobody returned.
- If using the dev sandbox: `make dev-up`, `make dev-shell`, `make opencode`.
  Docker is unavailable to the agent, so a real `make dev-up` is run by the user.

## 5. Push & PR

```bash
git push origin <branch>
gh pr create --base dev --title "<type>: <description>" --body-file - <<'EOF'
... Closes #<issue-number> ...
EOF
```

- Link the issue (`Closes #<issue-number>`), assign, label, set milestone.
- Comment on the issue: `PR opened: #<pr-number>`.
- Write multi-line bodies with `--body-file -` and a **quoted** heredoc; inline
  `--body "..."` lets the shell expand backticks and `$(...)` before `gh` sees them.

## 6. Review & Merge

- Self-review the diff; merge only when explicitly instructed.
- Squash merge and delete the branch:

```bash
gh pr merge <pr-number> --squash --delete-branch
```

- After merging to `dev`: comment "Merged into dev — ready for release" on the
  issue and on the PR, then **close the issue explicitly**. `Closes #N` does not
  auto-close on a `dev` merge — GitHub only auto-closes into the default branch.

## 7. Release (`dev` → `main`) — user-initiated only

- Only when the user explicitly asks. Never create a release PR unprompted.
- Before requesting: milestone issues complete, `dev` stable, feature branches merged.
- Create the release PR `dev` → `main` with label `release` (no `Closes` clauses —
  the milestone issues are already closed).
- After CI passes, ask the user to confirm the merge. **Never pass
  `--delete-branch` on a release merge**: the head branch is `dev` itself, and
  deleting it breaks Dependabot and every future PR base.
- After merging, merge `main` back into `dev` (a squash merge leaves them diverged),
  then verify `dev` survived: `git ls-remote --heads origin dev`.

## 8. Cleanup

Return to `dev`, pull, prune:

```bash
git checkout dev
git pull origin dev
git remote prune origin
```

## Important

- **Skipped is not passed.** A run that never triggered, or whose jobs were all
  gated out, is not coverage. Do not claim a change is "CI passed" unless a run
  actually executed the job that covers it; if it did not, say the change is
  unverified and test it locally.
- **Never access secret files.** `.env`, `.env.*` and `.envrc` are off limits;
  `.env.example` is placeholders and is safe. Check that a variable is set with
  `test -n "$VAR" && echo set`, never by printing it.
- **The gate is two Python scripts plus the npm toolchain.** A new invariant
  belongs in one of them, and it must be able to fail.
