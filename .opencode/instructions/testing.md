## Testing Requirements

### General

- Tests are mandatory for new features and bug fixes
- Write tests before or alongside implementation
- Mock external services when possible — never call third-party production APIs in tests
- Aim for critical path coverage, not 100% line coverage

### Gates and baselines

A gate is only worth having if it can fail.

- **Do not fix pre-existing failures inside an unrelated PR.** If the suite (or
  `make check`) is already red when you start, your change is not the cause and
  the fix is not the change you set out to make. Say so, and either fix it
  forward on its own issue/branch or record it as a baseline below. Bundling an
  unrelated repair into your PR makes "is my change correct?" unanswerable from
  the diff.
- **Record a known-failing baseline.** When you inherit a red suite, write down
  which tests fail and why (a tracked issue, a TODO, the failing assertion) so
  the next person does not re-investigate the same failures. A baseline turns
  "the suite is red, I don't know why" into "these N are known-red".
- **A gate that cannot fail is worse than no gate.** A test target that collects
  zero tests, a CI job that always skips, or an assertion with no possible
  failure manufactures false confidence: it reads green and proves nothing. If a
  gate reports success without executing anything, treat it as **unverified**,
  not as passed — a skipped run is not a passed run.

### Prerequisites / Services

- If integration tests require external services (e.g., Postgres, Redis, message queues), start them before running the full suite (e.g., `docker compose up -d`).
- If services are optional for unit tests, document which commands run unit-only vs. integration suites in your project's `AGENTS.md`/`Makefile`.
- Prefer running unit tests in isolation; keep integration tests opt-in or clearly labeled.

### Backend (when applicable)

- **Framework**: pytest (Python) or equivalent
- **Location**: `backend/tests/`
- **Run**: `<backend-test-command>`

#### Test Structure

```
backend/tests/
├── conftest.py          # Shared fixtures
├── test_<module>.py     # Module-specific tests
```

#### Conventions

- Test files: `test_<module>.py`
- Test functions: `test_<description>`
- Use fixtures from `conftest.py`
- Mock external services with `unittest.mock` or equivalent

#### Destructive tests must assert the target database

A test that truncates, drops, or rewrites tables acts on whatever
`DATABASE_URL` points at. Guard it:

- before any destructive operation, assert the connected database's _name_
  matches the test database (e.g. `SELECT current_database()` equals
  `<project>_test`) and abort otherwise;
- never point the destructive suite at a connection string that production also
  uses without that assertion in front of it;
- prefer a dedicated test database whose name cannot be confused for the real
  one.

This is the difference between a mistyped environment variable failing a run and
it wiping a real database.

### Frontend (when applicable)

- **Framework**: Vitest or Jest
- **Location**: `frontend/src/**/*.test.ts(x)`
- **Run**: `<frontend-test-command>`

#### Test Structure

```
frontend/src/
├── components/
│   └── Component.test.tsx
├── pages/
│   └── Page.test.tsx
├── services/
│   └── api.test.ts
└── hooks/
    └── useHook.test.tsx
```

#### Conventions

- Test files: `<module>.test.ts(x)`
- Test functions: `it('should <description>')`
- Mock API calls with `vi.mock()` or `jest.mock()`
- Use `@testing-library/react` for component tests

### Linting

```bash
# Backend (when applicable)
<backend-lint-command>

# Frontend (when applicable)
<frontend-lint-command>
```

### Before Committing

1. Run backend tests (when applicable): `<backend-test-command>`
2. Run frontend lint (when applicable): `<frontend-lint-command>`
3. Run frontend build (when applicable): `<frontend-build-command>`
4. Verify no regressions

## Visual checks

Numbers are not enough to tell you a page is right. Markup can be valid, a
stylesheet correct, a test green, and the rendered page still visually broken —
clipped text, an overflowing container, a contrast failure, a dark theme that
only works in light.

Looking is a real step, but the main agent may have no image input at all, so
if your project defines a **`visual` subagent** (as in the templates), delegate it
to that agent. (This reference repo does not define a `visual` subagent.) The rule is: **the main agent
captures, the `visual` subagent looks, the main agent acts on the findings.**
Never report a visual conclusion the `visual` subagent has not actually
returned; if a review fails or is rate-limited, say the state is unverified and
retry in a smaller batch rather than carrying the claim forward.

### README screenshots are not visual QA

Do not confuse the two. **Visual QA** captures are throwaway: taken while you
work, looked at, then discarded — they answer "is this change correct?". **README
screenshots** are committed artifacts: a curated, seeded tour a reader sees
before running anything, captured by `make screenshots` into `docs/screenshots/`.
Keep the README set small, seeded, labelled, and current, and regenerate it when
the UI changes. The harness and its fail-loud guards live in
`docs/screenshots/README.md`.

### Cadence: targeted while you work, full once at the end

Do **not** run the full audit for every change. It covers every route, and
nearly all of them are routes the change did not touch. Verifying one button
does not require photographing the whole app.

| When               | What                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **While you work** | Targeted: only the affected screen(s), at the viewport that matters, in **both themes**. This is the iteration loop. |
| **Before the PR**  | The full scripted audit, once, as the regression net.                                                                |

The expensive thing runs once per feature, not once per edit. If a targeted
capture shows a problem, fix it and re-capture **the same targeted set** — do
not escalate to the full audit to check one button.

### Which artifact the change needs

Not every change needs every artifact. Choose by what the change _is_:

| The change is…                                                                                       | Take                                 | Why                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Layout, colour, copy, spacing, typography, a static state                                            | **screenshot**                       | A still shows it completely.                                                                                                        |
| Anything temporal — transition, hover reveal, menu open, toast, streaming response, scroll behaviour | **screenshot + video**               | A still genuinely _cannot_ show motion. This is the one case where a screenshot is insufficient rather than merely less convenient. |
| A long page, or a sequence that would otherwise be many frames                                       | **screenshot + GIF**                 | One file instead of N.                                                                                                              |
| Motion reviewed for smoothness or timing                                                             | **video** (GIF if a summary will do) | Video is the precise artifact, the GIF the cheap one.                                                                               |

**Why the GIF is not a nicety.** The Read tool renders images, GIFs, and PDFs
— it does **not** render WebM. Motion recorded only as video is unreviewable,
so pack a sequence into a GIF before review: **one GIF is one attachment**, and
that is the difference between a review that completes and one that is
cancelled by a rate limit. Use the GIF to review motion; keep the stills to
read fine text.

### Why two layers

A scripted audit is the objective layer: contrast ratios, page errors, overflow,
unlabelled controls. It is deterministic and it is a real CI signal. The visual
read is the semantic layer: is this page actually usable and correct-looking?
It catches what no signal encodes. A pixel diff is deliberately not a gate —
captures vary by a sub-pixel band across machines, so a baseline is only
comparable against the machine that produced it; a mismatch is a reason to look,
not a red X.

### Rules

- **Both themes, every time.** A change verified only in light mode is unverified.
- **Re-capture after fixing.** A fix is not verified until it has been looked at again.
- Report what you _see_. If you have not looked, say so.
