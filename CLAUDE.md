# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Playwright TypeScript test automation suite (`playwright-typescript-e2e-framework`) exercising the public demo site https://www.saucedemo.com/. There is no application source code here — this repo contains end-to-end tests, their page objects, an AI-driven workflow (skills and a triage script) and k6 performance checks.

## Commands

```bash
npm install                       # install dependencies (no build step needed)
npx playwright install --with-deps  # install browsers (required once, and in CI)

npx playwright test               # run the full suite headless
npx playwright test --headed      # run with a visible browser
npx playwright test --ui          # run in Playwright's UI mode
npx playwright test --debug       # step through with the inspector

npx playwright test tests/authenticated/cart-and-checkout.spec.ts  # run a single file
npx playwright test -g "3rd test"                  # run tests matching a title
npx playwright test --project=chromium-auth         # run a specific project only
TAG=@smoke npx playwright test                       # filter by tag (env var, NOT --grep: see Architecture)
SEM_TAG=@slow npx playwright test                    # everything except a tag

npx playwright show-report        # open the last HTML report
```

Other scripts: `npm run lint`, `npm run typecheck`, `npm run triage` (bug drafts from `test-results/results.json`), `npm run triage:example` (from the committed sample) and `npm run k6:summary`. There is no build step.

## MCP

`.mcp.json` configures the official `@playwright/mcp` server (`npx @playwright/mcp@latest`), giving an MCP-compatible client (e.g. Claude Code) live control of a real browser against https://www.saucedemo.com/. It's used to explore the site interactively before writing code: navigating flows, taking accessibility snapshots, and clicking/typing to discover the `data-test` locators a new Page Object method or spec should use — the same locators the recorded actions resolve to (e.g. `page.locator('[data-test="login-button"]')`) are what end up hardcoded in `pages/*.ts`. Test generation goes through the `explore-and-generate-tests` skill (`.claude/skills/`): explore via MCP, write a page map to `docs/page-maps/`, draft the Page Object and spec, then lint, typecheck and run them. Generated code is a draft for human review; mark anything unconfirmed `test.fixme`. The `bug-report` skill turns the drafts from `scripts/triage-failures.ts` into final bug reports (see `docs/ai-workflow.md`). Session artifacts (accessibility snapshots, console logs) are written to `.playwright-mcp/`, which is gitignored.

## Architecture

- `playwright.config.ts` builds projects by *nature of scenario*, and each spec lives in the matching `tests/` subfolder (selected by `testMatch` glob):
  - `setup` — matches `*.setup.ts` only; logs in once and saves `playwright/.auth/user.json`.
  - `<browser>-public` (`tests/public/`) — anonymous scenarios (login, seeded-user bugs in `quirks.spec.ts`); empty `storageState`, so no manual cookie clearing is needed.
  - `<browser>-auth` (`tests/authenticated/`) — reuse the saved `standard_user` session, parallel.
  - `<browser>-session` (`tests/session/`) — logout; depends on `<browser>-auth` so it never races with authenticated tests.
  - `mobile-chrome` (Pixel 5) / `mobile-safari` (iPhone 12) (`tests/mobile/`) — real mobile emulation; NOT Firefox, which rejects `isMobile`.
  - `<browser>` is chromium, firefox and webkit.
  - **Tag filtering** goes through `TAG` / `SEM_TAG` env vars spread into every project except `setup`. The CLI `--grep` does not apply to dependency projects, so it would drag the whole suite along.
- `tests/auth.setup.ts` logs into SauceDemo as `standard_user` via the UI (SauceDemo has no login API) and writes the storage state that the `-auth`, `-session` and `mobile-*` projects start from.
- SauceDemo is a SPA: the route changes **before** the view renders. Locators shared across views (`inventory-item-name`) are scoped to their container (`cart-list`, `.inventory_details_container`), and reading the inventory list goes through `InventoryPage.waitForInventoryToLoad()`. An unscoped or unsynchronized read races with the route change.
- `pages/` implements a Page Object Model:
  - `pages/base.ts` — `BasePage` holds the `Page` instance and a generic `navigate(url)` helper. All page objects extend this.
  - `pages/LoginPage.ts`, `InventoryPage.ts`, `ItemDetailPage.ts`, `CartPage.ts`, `CheckoutPage.ts` — one class per screen, extending `BasePage`, encapsulating locators (by `data-test` attribute where possible) and the actions/assertions used by the specs. Register each one in `fixtures/pages.fixture.ts` and add new interactions there rather than inlining locators in test files.
- `tests/` is split by scenario nature (`public/`, `authenticated/`, `session/`, `mobile/`); titles are descriptive and tagged (`@smoke`, `@quirk`, `@slow`).
- `fixtures/` holds the page-object fixtures and test data. `utils/a11y.ts` runs axe audits (gate: `A11Y_MAX`, default 0, JSON attached to the report); `utils/budgets.ts` holds performance budgets named by intent, scaled by `TIMEOUT_FACTOR`.
- Extra tags beyond `@smoke`/`@quirk`/`@slow`: `@network`, `@a11y`, `@perf`. Sort, invalid-login and checkout-validation tests are data-driven from tables at the top of/inside their spec.
- SauceDemo serves deep links (`/inventory.html`) with HTTP 404 while still rendering the app; document requests and the matching console message are excluded from failed-request checks, and a `@quirk` test pins the behavior.
- CI: `.github/workflows/playwright.yml` runs lint, typecheck and the suite (Chromium + Chrome mobile on push/PR, every project nightly), uploads the HTML report, publishes it to GitHub Pages from `main`, triages failures into `bug-report-drafts` and can post to Slack. `visual-regression.yml` is manual. `performance.yml` runs the k6 browser test daily. Both `SLACK_WEBHOOK_URL` uses are optional.
- `scripts/triage-failures.ts` (deterministic triage) and `scripts/k6-summary.ts` share nothing with the tests; `perf/k6/thresholds.json` is the single source of the k6 limits.
