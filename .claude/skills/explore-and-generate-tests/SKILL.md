---
name: explore-and-generate-tests
description: Explore a page or flow of the app under test with the Playwright MCP server, write a page map, then generate a draft Page Object and spec that follow this repo's conventions. Use when asked to cover a new page, flow or feature.
---

# Explore and generate tests

Turns a live exploration of the app into reviewed, conventional test code. The AI does the
legwork (mapping and drafting); a human decides what gets merged.

## Inputs
- The page or flow to cover (a URL or a plain description). Default target: https://www.saucedemo.com

## Steps

1. **Explore with the Playwright MCP server** (configured in `.mcp.json`). Navigate the flow,
   take accessibility snapshots, and interact (click, type) to observe real behaviour, including
   error states and edge cases. Prefer `data-test` attributes as locators.
2. **Write a page map** to `docs/page-maps/<page>.md`: a table of elements (name, locator, role,
   purpose), the flows observed, and the states/errors seen. Only record what you actually observed.
3. **Generate the Page Object** in `pages/<Name>Page.ts`, extending `BasePage`. Register it as a
   fixture in `fixtures/pages.fixture.ts` and put shared data in `fixtures/test-data.ts`.
4. **Generate the spec** in the matching `tests/` folder (`public/`, `authenticated/`, `session/`
   or `mobile/`), following the repo conventions:
   - descriptive titles and tags (`@smoke`, `@a11y`, `@perf`, `@network`, ...)
   - table-driven cases when only the data changes
   - web-first assertions; never `waitForTimeout`
   - SPA rule: scope locators shared across views to their container (see `CLAUDE.md`)
5. **Verify before reporting**: `npm run lint && npm run typecheck`, then run the new spec on
   `chromium-auth` and `mobile-chrome`. Fix what fails. If a behaviour cannot be confirmed,
   mark the test `test.fixme` with the reason instead of guessing.
6. **Report**: list the files created, what is covered, and what you are unsure about.

## Guardrails
- Only the demo site above. Never real products, never real credentials in code.
- Do not modify existing tests unless asked. Do not commit: generated code is a draft
  until a human reviews it.
- Do not invent behaviour. If the page did not show it, the test does not assert it.
