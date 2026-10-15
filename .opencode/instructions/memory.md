# Agent Memory System

Persistent, local-only memory so work continues across chat sessions.

## Location

```
.opencode/memory/
├── global.md          # Major memory: issues, milestones, current task, decisions
├── lessons.md         # Durable lessons: reusable, cross-session takeaways
├── current.md         # Minor memory: this session's context + progress
└── archive/           # Rotating history of the last 3 interactions
    ├── interaction-1.md   # most recent
    ├── interaction-2.md
    └── interaction-3.md   # oldest
```

The whole `.opencode/memory/` directory is gitignored — it is local to this
machine and is never committed or pushed.

## The four tiers

Keep each fact in exactly one tier, or it drifts between them:

- **`global.md`** — *tracked work*: active issues, milestones, the current task,
  and the decisions that affect what to do next. Changes constantly.
- **`lessons.md`** — *durable lessons*: reusable, cross-session takeaways — a
  footgun that cost time, the command that actually works, the reason a design
  decision was made. Slow-moving, capped, and worth re-reading.
- **`current.md`** — *this session*: what was just done, what is next, and
  anything the user must confirm. Trimmed at every session end.
- **`archive/`** — *history*: the last three session summaries. Read-only.

## When to read

- **At the start of every session**: read `global.md` then `current.md` to
  restore context. Say what you resumed ("Resuming: <task>").
- Before starting a new task, check `global.md` → Active Issues so you never
  create a duplicate issue or re-do finished work.
- Before starting work in a domain `lessons.md` covers, read the relevant
  lessons so a solved problem is not solved twice.

## When to update

- **`current.md`**: continuously — after each step, add what was done, what
  changed, what's next, and anything the user must confirm.
- **`global.md`**: at meaningful milestones — issue created, PR opened, merged,
  task completed, decision made. Keep it the single source of truth for tracked
  work.
- **`lessons.md`**: whenever a session produces a durable, reusable lesson — a
  footgun, a working command, or the rationale behind a decision — that a future
  session would otherwise rediscover the hard way. Only durable lessons go here;
  a running log of what happened belongs in `current.md`.
- **At session end**: write a summary to `archive/interaction-N.md` (next
  number, 1 = most recent), rotate out the oldest so only **3** archive files
  remain, then trim `current.md` down to the essentials for the next session.

## Bounded offload

The tiers stay useful only if they stay small, so offload downward instead of
letting any one tier grow:

- when `global.md` approaches its cap, move the *durable lessons* it has
  accumulated into `lessons.md` and keep only the tracked work in `global.md`;
- when `lessons.md` approaches its cap, merge duplicates and drop lessons the
  codebase or workflow now enforces — a rule that is codified is no longer a
  lesson, it is the default;
- never let a lesson live in two tiers. If it moved, delete it from the old one.

## Format rules

- `global.md` ≤ ~200 lines; `lessons.md` ≤ ~100 lines; `current.md` ≤ ~100
  lines; archive files ≤ ~50 lines each.
- When adding new entries, remove or compress old ones — do not let the files
  grow unbounded.
- Keep timestamps (`YYYY-MM-DD`) on entries that change over time.
- Track GitHub work per the workflow in `.opencode/instructions/workflow.md`:
  every issue assigned, labeled by type, linked to a branch and PR, assigned a
  milestone, and commented at each milestone.

## Golden rule

If a new session starts and `current.md` exists but is empty, that is
intentional — check `global.md` for the active task and `archive/` for what
happened before. If both are empty, ask the user what to work on next.
