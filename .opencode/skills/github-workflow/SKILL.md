---
name: github-workflow
description: Git branching, commits, issues, PRs, and GitHub workflow conventions
metadata:
  workflow: git-flow, conventional-commits
---

## GitHub Workflow Rules

### Scope

This skill is the command cookbook. The authority for *policy* — branch model,
milestones, what closes an issue, the release procedure — is
`.opencode/instructions/workflow.md`. When the two disagree, `workflow.md`
wins; fix this file rather than following it.

### End-to-End Tracking

Every change is tracked on GitHub: **issue → branch → PR → merge**.

1. **Create an issue** before writing any code (assigned + labeled + milestone)
2. **Create a branch** from `dev` that implements exactly that issue
3. **Open a PR** linked to the issue (`Closes #N`, assigned + labeled)
4. **Comment at every milestone** (issue created, PR opened, merged)
5. **Merge** only when explicitly instructed, then comment and close the issue

### Label Mapping

Match the label to the commit type:

| Commit type | GitHub label |
|-------------|--------------|
| `feat`      | `enhancement` |
| `fix`       | `bug` |
| `chore`     | `chore` |
| `refactor`  | `refactor` |
| `docs`      | `documentation` |
| `test`      | `test` |
| `ci`        | `ci` |

Create the label if it does not exist yet:

```bash
gh label create <name> --color <hex> --description "<description>"
```

### Branch Naming

Use the format: `<type>/<issue-number>-<slug>`

| Type | Use Case | Example |
|------|----------|---------|
| `feat` | New features | `feat/42-document-chunking` |
| `fix` | Bug fixes | `fix/17-auth-token-expiry` |
| `refactor` | Code refactoring | `refactor/31-search-service` |
| `docs` | Documentation | `docs/15-api-reference` |
| `test` | Adding tests | `test/19-document-upload` |
| `chore` | Tooling/maintenance | `chore/13-ci-workflow` |
| `ci` | CI/CD changes | `ci/14-faster-builds` |

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]

[optional footer]
```

Examples:
- `feat: add document chunking endpoint`
- `fix: resolve auth token expiry issue`
- `refactor: extract search logic into service`
- `docs: update API reference`
- `test: add unit tests for document service`

### Writing bodies

Never inline a multi-line body into `--body "..."`. The shell expands backticks
and `$(...)` before `gh` sees the text, so fenced code blocks and command
examples mangle or execute. Write the body with `--body-file -` and a quoted
heredoc instead:

```bash
gh issue create --title "fix: ..." \
  --body-file - --label bug <<'EOF'
## Problem

`make check` fails when ... — $(this) stays literal inside a quoted heredoc.
EOF
```

Applies to `gh issue create`, `gh pr create`, `gh issue comment`, and
`gh pr comment`.

### Issues

```bash
# Create an issue (before any branch or code)
gh issue create \
  --title "<type>: <short description>" \
  --body "<problem statement / acceptance criteria>" \
  --label "<label per mapping table>" \
  --assignee <your-github-username> \
  --milestone "<milestone-name>"

# Assign to a milestone before work begins
gh issue edit <issue-number> --milestone "<milestone-name>"

# Comment on an issue at each milestone
gh issue comment <issue-number> --body "Starting work on this — Milestone: <milestone-name>"
gh issue comment <issue-number> --body "PR opened: #<pr-number>"
gh issue comment <issue-number> --body "Merged into dev — ready for release"

# Close it after the feature PR merges to dev (Closes #N links only)
gh issue close <issue-number>
```

### Pull Requests

```bash
# Open a PR linked to its issue
gh pr create \
  --title "<type>: <description>" \
  --body "<template>" \
  --label "<label per mapping table>" \
  --assignee <your-github-username> \
  --base dev

# Comment on the PR
gh pr comment <pr-number> --body "Merged into dev — thanks!"

# Edit an existing PR (assignee/labels/milestone)
gh pr edit <pr-number> --add-assignee <your-github-username> --add-label "<label per mapping table>"
gh pr edit <pr-number> --milestone "<milestone-name>"

# Check CI status before merging
gh pr checks <pr-number> --watch

# Merge a FEATURE branch only
gh pr merge <pr-number> --squash --delete-branch
```

### PR Rules

- NEVER push directly to `dev` or `main`
- Always work in feature branches
- One feature per PR — never bundle unrelated changes
- `--delete-branch` is for feature branches only. A release PR's head is `dev`
  itself, so `gh pr merge ... --delete-branch` on it deletes the integration
  branch and breaks everything that targets `dev`. Never delete `dev` or `main`.
- Never add `--delete-branch` to a release merge — see `workflow.md` step 7.
- Run tests before opening a PR
- Link related issues with `Closes #N` — this links and cross-references only; it
  does **not** close the issue on a `dev` merge, so close it explicitly.
- Do NOT merge PRs unless explicitly instructed

### Issue References

Reference issues in commits and PRs:
- `fix: resolve timeout (#42)`
- `Closes #42`
- `Fixes #42`

Because feature PRs merge into `dev`, not the default branch, `Closes #N` does
not auto-close the issue. Close it with `gh issue close <issue-number>` after
the merge to `dev`.
