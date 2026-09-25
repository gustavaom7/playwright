---
name: bug-report
description: Turn the automated triage drafts in bug-reports/ into final, Jira-ready bug reports with user-level reproduction steps and verified evidence. Use after `npm run triage`, or when given a failing test and asked to write the bug.
---

# Bug report

Refines the drafts produced by `scripts/triage-failures.ts` (grouped, classified, ranked) into
reports a developer can act on without asking questions.

## Inputs
- `bug-reports/BUG-*.md` drafts and `bug-reports/summary.md`
- The evidence they reference (screenshots, traces under `test-results/`)

## Steps

1. Read `summary.md` first: note the severity ranking and any "possible common root cause"
   clusters. Report a cluster once, listing the affected tests, instead of filing duplicates.
2. For each draft, **confirm it reproduces** by running the command in "Steps to reproduce".
   If it does not reproduce, say so and label the bug as flaky or environment-dependent.
3. Open the evidence (screenshot, or `npx playwright show-trace <trace.zip>`) and describe what
   is actually wrong on screen.
4. Rewrite "Steps to reproduce" as **manual, user-level steps** derived from the test body
   ("Log in as standard_user, add Sauce Labs Bike Light, click Remove, ..."), keeping the
   automation command as a secondary line.
5. Keep the triage severity unless the evidence contradicts it; if you change it, say why.
6. Write the final report to `bug-reports/final/<id>-<slug>.md` with these fields:
   Title, Type, Severity, Priority, Environment, Steps to reproduce, Expected result,
   Actual result, Evidence, Notes.

## Guardrails
- Never invent steps, expected behaviour or evidence. If something is unknown, write "unknown".
- One defect per report. Do not merge unrelated failures.
- Filing in Jira is a manual copy/paste of the final Markdown; nothing is sent automatically.
- English by default; write in Portuguese if asked.
