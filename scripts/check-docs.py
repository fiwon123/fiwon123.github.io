#!/usr/bin/env python3
"""Checks for the project-identity documents.

`PROJECT_CONTEXT.md` is the source of truth for what this project is, and
`AGENTS.md` is the working guide. Both are read by agents and humans, both state
some of the same facts (assignee, branch model, gate, CI triggers), and nothing
compares them — so a fact edited in one file silently contradicts the other, and
the reader has no way to tell which is current.

Worse, `PROJECT_CONTEXT.md` began as a copy of a template: if a field is never
filled in, the file still reads as complete while carrying `<project-name>` where
the name belongs. Nobody notices, because nothing points at the gap.

So two rules, both failable:

1. no template placeholder survives an unfilled field, and
2. every fact the two files share states the same thing.

Run directly (`python3 scripts/check-docs.py`) or via `make check-docs`.
Standard library only.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

CONTEXT = ROOT / "PROJECT_CONTEXT.md"
AGENTS = ROOT / "AGENTS.md"
WORKFLOW = ROOT / "WORKFLOW_PROMPT.md"

IDENTITY = (CONTEXT, WORKFLOW)

failures: list[str] = []
skips: list[str] = []

# The identity fields the template carries, and the section shape of each
# document: a file that lost half its content still parses, so its shape is
# asserted here. A heading present but gutted is what these catch.
FORBIDDEN_PLACEHOLDERS = (
    "<project-name>",
    "<one-liner>",
    "<github-repo-url>",
    "<backend-directory>",
    "<frontend-directory>",
    "<your-project>",
    "<done>",
    "<in-progress>",
    "<next-task>",
    "<following-task>",
)

CONTEXT_SECTIONS = (
    "## Identity",
    "## Problem",
    "## Goal",
    "## Stack",
    "## Architecture",
    "## Design Decisions",
    "## Topology",
    "## Directory Layout",
    "## Key Commands",
    "## Status",
    "## Backlog",
    "## Notes",
)

WORKFLOW_SECTIONS = (
    "## 1. Plan and understand",
    "## 2. Branch",
    "## 3. Implement",
    "## 4. Test",
    "## 5. Push & PR",
    "## 6. Review & Merge",
    "## 7. Release (`dev` → `main`) — user-initiated only",
    "## 8. Cleanup",
)

# Facts both files state, each located explicitly in each file. The patterns are
# per-file because the two documents are written for different readers: AGENTS.md
# uses a conventions bullet, PROJECT_CONTEXT.md a notes bullet. Requiring the
# label in both means deleting it from one is caught too.
#
# Values are compared through a fixed vocabulary (branch names, workflow files,
# gate commands) rather than by raw text, so the two files can phrase the same
# fact differently without tripping the check — only a real disagreement fails.
BRANCHES = ("main", "dev")
WORKFLOWS = ("ci.yml", "pages.yml")
COMMANDS = ("make check", "make check-sandbox", "make check-docs", "npm run check")


def bullet_pattern(label: str) -> str:
    """A `- **Label**: …` bullet, including indented continuation lines.

    A line-only pattern sees half the fact: `pages.yml` sat on the wrapped second
    line of the CI bullet, so the check compared {ci.yml} against {ci.yml,
    pages.yml} and reported drift that was not there.
    """
    return rf"(?m)^- \*\*{re.escape(label)}\*\*: [^\n]*(?:\n[ \t]+\S[^\n]*)*"


FACTS: tuple[tuple[str, str, str], ...] = (
    (
        "assignee",
        r"(?m)^- \*\*Assignee\*\*: `([^`]+)`",
        r"(?m)^- \*\*`ASSIGNEE`\*\* is `([^`]+)`",
    ),
    (
        "branch model",
        bullet_pattern("Branch model"),
        bullet_pattern("Two-tier branches"),
    ),
    (
        "local gate",
        bullet_pattern("Local gate"),
        bullet_pattern("Check (gate)"),
    ),
    (
        "CI triggers",
        bullet_pattern("CI"),
        bullet_pattern("CI triggers"),
    ),
)


def read(path: Path) -> str | None:
    if not path.exists():
        skips.append(f"{path.relative_to(ROOT)} not found")
        return None
    return path.read_text(encoding="utf-8")


def check(name: str, ok: bool, detail: str = "") -> None:
    print(f"{'ok  ' if ok else 'FAIL'}  {name}{f' — {detail}' if detail and not ok else ''}")
    if not ok:
        failures.append(f"{name}: {detail}")


def strip_fences(text: str) -> str:
    """Drop fenced code blocks: command examples are full of legitimate <…>."""
    out: list[str] = []
    fenced = False
    for line in text.splitlines():
        if line.lstrip().startswith("```"):
            fenced = not fenced
            out.append("")
            continue
        out.append("" if fenced else line)
    return "\n".join(out)


def unfilled_fields(text: str) -> list[str]:
    """Bullet lines whose value is still an angle-bracket placeholder."""
    return [
        match.group(0).strip()
        for match in re.finditer(r"(?m)^- \*\*[^*]+\*\*: <[^<>]+>\s*$", strip_fences(text))
    ]


def branches_in(text: str) -> set[str]:
    return {branch for branch in BRANCHES if re.search(rf"`{branch}`", text)}


def workflows_in(text: str) -> set[str]:
    return {name for name in WORKFLOWS if name in text}


def commands_in(text: str) -> set[str]:
    # Backticked, and not a prefix of a longer command: `make check` must not be
    # satisfied by `make check-sandbox`.
    return {
        command
        for command in COMMANDS
        if re.search(rf"`{re.escape(command)}`(?![-\w])", text)
    }


def ci_value(block: str) -> str:
    """The workflow files *and* the branches they trigger on.

    Comparing filenames alone leaves half the fact unguarded: `pages.yml` could
    keep its name while the branch it deploys from silently changed, and the two
    files would still look in agreement.
    """
    return f"{','.join(sorted(workflows_in(block)))} -> {','.join(sorted(branches_in(block)))}"


context = read(CONTEXT)
agents = read(AGENTS)
workflow = read(WORKFLOW)

# --- placeholders -------------------------------------------------------------

for path, text in ((CONTEXT, context), (WORKFLOW, workflow)):
    if text is None:
        continue
    relative = path.relative_to(ROOT)
    stray = [marker for marker in FORBIDDEN_PLACEHOLDERS if marker in text]
    check(f"{relative} carries no template placeholder", not stray, f"still unfilled: {', '.join(stray)}")
    unfilled = unfilled_fields(text)
    check(
        f"{relative} has no unfilled field",
        not unfilled,
        f"a copied template field was never filled in: {'; '.join(unfilled)}",
    )

# --- shape --------------------------------------------------------------------

for path, text, sections in (
    (CONTEXT, context, CONTEXT_SECTIONS),
    (WORKFLOW, workflow, WORKFLOW_SECTIONS),
):
    if text is None:
        continue
    relative = path.relative_to(ROOT)
    missing = [section for section in sections if section not in text]
    check(f"{relative} keeps every section", not missing, f"missing: {', '.join(missing)}")
    check(
        f"{relative} is not a stub",
        len(text.splitlines()) >= 40,
        f"{len(text.splitlines())} lines — a heading present but gutted reads as done",
    )

if workflow is not None:
    check(
        "WORKFLOW_PROMPT.md keeps the skipped-is-not-passed rule",
        "Skipped is not passed" in workflow,
        "a run that executed nothing reads as green; the rule has to be stated",
    )

# --- agreement ----------------------------------------------------------------

if agents is not None and context is not None:
    for label, agents_pattern, context_pattern in FACTS:
        in_agents = re.search(agents_pattern, agents)
        in_context = re.search(context_pattern, context)
        check(
            f"both files state the {label}",
            in_agents is not None and in_context is not None,
            "missing from "
            + (
                "both files"
                if in_agents is None and in_context is None
                else "AGENTS.md"
                if in_agents is None
                else "PROJECT_CONTEXT.md"
            ),
        )
        if in_agents is None or in_context is None:
            continue

        if label == "assignee":
            left = in_agents.group(1).strip()
            right = in_context.group(1).strip()
        else:
            # Compare through a vocabulary, and require each side to name
            # something — two bullets that both name nothing agree trivially.
            if label == "branch model":
                extract, noun = branches_in, "branches"
            elif label == "local gate":
                extract, noun = commands_in, "commands"
            else:
                left, right = ci_value(in_agents.group(0)), ci_value(in_context.group(0))
                check(
                    f"the {label} names a workflow and a branch in both files",
                    bool(workflows_in(in_agents.group(0)))
                    and bool(branches_in(in_agents.group(0)))
                    and bool(workflows_in(in_context.group(0)))
                    and bool(branches_in(in_context.group(0))),
                    "a CI line that names no workflow or no branch documents nothing",
                )
                check(
                    f"the {label} agrees",
                    left == right,
                    f"AGENTS.md says '{left}', PROJECT_CONTEXT.md says '{right}'",
                )
                continue

            left = ", ".join(sorted(extract(in_agents.group(0))))
            right = ", ".join(sorted(extract(in_context.group(0))))
            check(
                f"the {label} names the {noun} in both files",
                bool(left) and bool(right),
                f"a {label} line that names no {noun} documents nothing",
            )

        check(
            f"the {label} agrees",
            left == right,
            f"AGENTS.md says '{left}', PROJECT_CONTEXT.md says '{right}'",
        )

if skips:
    print("\nskipped: " + "; ".join(skips))

if failures:
    print(f"\n{len(failures)} docs check(s) failed:")
    for failure in failures:
        print(f"  - {failure}")
    sys.exit(1)

print("\nall docs checks passed")
