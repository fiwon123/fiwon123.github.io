## Standard Iteration Workflow

Every code change follows this workflow. No exceptions.

Every change is tracked end-to-end on GitHub: **issue → branch → PR → merge**, with
the issue and PR assigned, labeled, linked, and commented at each milestone.

### GitHub conventions (apply to every step)

- **Assignee**: set `ASSIGNEE` in your project's `AGENTS.md` to your GitHub handle; use `--assignee $ASSIGNEE` (or substitute that handle) in the GitHub CLI commands below
- **Labels**: match the commit type (see table below)
- **Milestones**: every issue must be assigned to a milestone (see "Milestone conventions" below)
- **Comments**: post at every milestone (see "Comment milestones" below)
- **Linking**: every PR references its issue (`Closes #N`), and branch names include the issue number
- **Multi-line bodies**: write issue/PR/comment bodies with `--body-file -` and a quoted heredoc, never inline `--body "..."` (see below)

### Writing issue and PR bodies

Write multi-line bodies with `--body-file -` and a **quoted** heredoc; never pass
them inline to `--body "..."`. In an inline body the shell expands backticks and
`$(...)` _before_ `gh` sees the text, so fenced code blocks, `Closes #N`, and
command examples silently mangle or execute. A quoted `<<'EOF'` heredoc passes
the text through literally.

```bash
gh issue create \
  --title "<type>: <short description>" \
  --body-file - \
  --label "<label>" --assignee "$ASSIGNEE" --milestone "<milestone-name>" <<'EOF'
## Problem

`make check` fails when ... — backticks and $(command) stay literal here.
EOF
```

The same applies to `gh pr create`, `gh issue comment`, and `gh pr comment`.

### Linking conventions (mandatory)

Every change must be traceable end-to-end:

| From   | To        | How                                                                  |
| ------ | --------- | -------------------------------------------------------------------- |
| Branch | Issue     | Branch name includes issue number: `feat/42-skill-timeout`           |
| PR     | Issue     | `Closes #<issue-number>` in PR body — links only; see the note below |
| PR     | Milestone | `gh pr edit <pr-number> --milestone "<milestone-name>"`              |
| Issue  | Milestone | `gh issue edit <issue-number> --milestone "<milestone-name>"`        |
| Commit | Issue     | Conventional commit with issue context                               |

No orphaned branches, PRs, or issues. Every piece of work is linked.

> **`Closes #N` does not close the issue on a `dev` merge.** GitHub auto-closes
> a linked issue only when the PR merges into the repository's _default_ branch,
> which is `main`. Feature PRs merge into `dev`, so `Closes #N` gives you the
> cross-reference and nothing more. The issue is closed explicitly in step 6
> with `gh issue close`.

### Label mapping (commit type → GitHub label)

| Commit type | GitHub label    |
| ----------- | --------------- |
| `feat`      | `enhancement`   |
| `fix`       | `bug`           |
| `chore`     | `chore`         |
| `refactor`  | `refactor`      |
| `docs`      | `documentation` |
| `test`      | `test`          |
| `ci`        | `ci`            |

> If the label does not exist on the repo, create it first:
> `gh label create <name> --color <hex> --description "<description>"`

### Milestone conventions

- Every issue MUST be assigned to a milestone before work begins
- Milestones represent releases or sprint iterations
- Use `gh issue edit <issue-number> --milestone "<milestone-name>"`
- When creating issues, assign to the current active milestone
- Track milestone progress on the GitHub Milestones page

### Comment milestones

Post these comments automatically — no user prompting required:

| #   | Milestone            | Target | Template                                                   |
| --- | -------------------- | ------ | ---------------------------------------------------------- |
| 1   | Issue created        | issue  | `Starting work on this — Milestone: <milestone-name>`      |
| 2   | PR opened            | issue  | `PR opened: #<pr-number>`                                  |
| 3   | PR opened            | PR     | Summary of changes + `Closes #<issue-number>`              |
| 4   | Merged to dev        | issue  | `Merged into dev — ready for release`                      |
| 5   | Merged to dev        | PR     | `Merged into dev — thanks!`                                |
| 6   | Merged to dev        | issue  | **Close it** — `gh issue close <issue-number>`, see step 6 |
| 7   | dev → main PR opened | issue  | `Release PR opened: #<pr-number>`                          |
| 8   | CI passed            | issue  | `CI passed — ready to merge to main`                       |
| 9   | Merged to main       | issue  | `Released in <commit-sha>`                                 |
| 10  | Merged to main       | PR     | `Released — thanks!`                                       |

### 1. Plan

- Understand the requirement; ask clarifying questions if ambiguous
- Explore the codebase (read relevant files, follow existing patterns)
- **Create the GitHub issue** (before any branch or code):
  ```bash
  gh issue create \
    --title "<type>: <short description>" \
    --body "<problem statement / acceptance criteria>" \
    --label "<label per mapping table>" \
    --assignee <your-github-username> \
    --milestone "<milestone-name>"
  ```
- **Comment on the issue**: `gh issue comment <issue-number> --body "Starting work on this — Milestone: <milestone-name>"`
- Output: Goal, Files to modify, Dependencies, Risks, Steps
- Get user approval before proceeding to implementation

### 2. Branch

- Always start from an up-to-date `dev`:
  ```bash
  git checkout dev
  git pull origin dev
  git checkout -b <type>/<issue-number>-<slug>
  ```
- Branch types: `feat/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`, `ci/`
- Examples: `feat/42-skill-timeout`, `fix/17-voice-io-error`, `refactor/31-schema-validation`
- The branch implements the issue created in step 1 (or multiple related issues)

### PR scope

- Each branch should implement related changes (one or more related issues).
- PRs CAN merge multiple related issues (e.g., two bugs in the same module).
- Do NOT bundle unrelated changes into a single branch/PR.
- If additional issues are discovered while implementing, create a separate issue and branch.
- Tests for the features being implemented belong in the same PR.

### 3. Implement

- Make changes in small, focused commits
- Each commit:
  ```bash
  git add <files>
  git commit -m "<type>: <description>"
  ```
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `ci:`
- Include a body for non-trivial changes (what and why)
- Do NOT create issues/PRs from subagents — that responsibility stays with the primary agent

### 4. Test (local only — CI does not run on feature branches)

- Run all checks: `make check` (or project-specific commands in AGENTS.md)
- Verify no regressions before pushing
- If the change is user-visible and the project defines a `visual` subagent,
  capture the affected screen(s) and have the `visual` subagent review them — in
  both themes. A page can be visually broken (clipped text, overflowing
  container, contrast failure, a dark theme that only works in light) while every
  test is green. See `testing.md` → "Visual checks" for the cadence and which
  artifact the change needs.
- CI only validates on `dev` → `main` PRs — local testing is your gate

### 5. Push & PR (feature branch → dev)

```bash
git push origin <branch>
gh pr create \
  --title "<type>: <description>" \
  --body "<template>" \
  --label "<label per mapping table>" \
  --assignee <your-github-username> \
  --base dev
```

- Fill out the PR template completely (`.github/pull_request_template.md`)
- Link the issue created in step 1: `Closes #<issue-number>`
- **Comment on the issue**: `gh issue comment <issue-number> --body "PR opened: #<pr-number>"`
- Work only in feature branches — never push directly to `dev` or `main`

### 6. Review & Merge (feature branch → dev)

- Self-review the diff for bugs, security, and regressions
- Only merge when explicitly instructed
- Prefer squash merge, then delete the branch:
  ```bash
  gh pr merge <pr-number> --squash --delete-branch
  ```
- After merging to `dev`:
  - **Comment on the issue**: `gh issue comment <issue-number> --body "Merged into dev — ready for release"`
  - **Comment on the PR**: `gh pr comment <pr-number> --body "Merged into dev — thanks!"`
  - **Close the issue**: `gh issue close <issue-number>`
    - Required, not optional. `Closes #N` in a PR body closes an issue only when
      the PR merges into the repository's **default** branch, which is `main`
      here. A feature PR merges into `dev`, so its `Closes #N` links the issue
      and closes nothing. Without this step issues stay open forever.
    - Closing here rather than at release keeps the milestone tracker live —
      GitHub computes milestone progress from closed issues — and keeps step 7's
      "all milestone issues are complete" check satisfiable before release. If
      issues only closed during the release merge, that check could never be
      verified in advance.
- **Always return to dev after merge**:
  ```bash
  git checkout dev
  git pull origin dev
  ```
- If a PR/branch is not necessary, close it with a comment explaining why

### 7. Release merge (dev → main) — User-initiated only

- **Do NOT automatically create release PRs or merge to main**
- The user must explicitly ask: "Can we merge dev to main?" or "Put this in production"
- Before requesting, verify that:
  - All milestone issues are complete
  - `dev` branch is stable (no failing tests, no regressions)
  - All feature branches for this milestone have been merged
- When user requests release:
  ```bash
  git checkout dev
  git pull origin dev
  git push origin dev
  gh pr create \
    --title "release: <milestone-name>" \
    --body "Release PR for milestone: <milestone-name>" \
    --label "release" \
    --base main
  ```
- CI runs automatically on this PR
- **This PR closes no issues.** Every issue in the milestone was closed when its
  PR merged to `dev` (step 6), so `Closes #N` here would be a no-op at best.
  If an issue turns out to still be open at release time, close it explicitly
  rather than adding a `Closes` clause to this PR — the milestone check in the
  step above is what should have caught it.
- **Comment on the issue**: `gh issue comment <issue-number> --body "Release PR opened: #<pr-number>"`
- After CI passes:
  - **Comment on the issue**: `gh issue comment <issue-number> --body "CI passed — ready to merge to main"`
- **Ask user to confirm merge**: "CI passed. Ready to merge dev to main?"
- Only merge after user confirms:

  ```bash
  gh pr merge <pr-number> --squash
  ```

  **Never add `--delete-branch` to a release merge.** The release PR's head
  branch is `dev` itself, so `--delete-branch` deletes the integration branch
  from the remote — which breaks Dependabot (`target-branch: dev`), any
  lockfile-upgrade automation that fetches `origin/dev`, and every future PR's
  base. `--delete-branch` belongs to step 6, for feature branches only.

- After merging:
  - **Comment on the issue**: `gh issue comment <issue-number> --body "Released in <commit-sha>"`
  - **Comment on the PR**: `gh pr comment <pr-number> --body "Released — thanks!"`
- **Merge `main` back into `dev`** — a squash merge leaves `dev` and `main`
  diverged at the old merge-base, so the _next_ release PR would re-list every
  file from this one:
  ```bash
  git checkout dev
  git pull origin dev
  git merge origin/main -m "Merge remote-tracking branch 'origin/main' into dev"
  git push origin dev
  ```
- **Verify `dev` survived** — an empty output means the integration branch is
  gone and everything that targets it is broken:
  ```bash
  git ls-remote --heads origin dev   # must print a line
  ```
- **Always return to dev after release merge**:
  ```bash
  git checkout dev
  git pull origin dev
  ```

### 8. Cleanup

```bash
git checkout dev
git pull origin dev
git remote prune origin
```

- **Always end on `dev`** — this is the working branch with the latest integrated features
- Verify clean state: only `dev` remains locally and on the remote
  ```bash
  git ls-remote --heads origin dev   # must print a line — empty means dev is gone
  ```

### Environment Notes

- Backend: use the repository's package manager (uv, pip, poetry, npm, etc.)
- Frontend: use the repository's package manager (npm, yarn, pnpm)
- `gh` CLI is authenticated; in a containerized project, credentials come from `GH_TOKEN`/`GITHUB_TOKEN` forwarded at runtime, so they are never baked into the image
- Never access secret files (`.env`, etc.) without explicit permission
