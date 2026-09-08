# interview-playwright-sandbox

[![Playwright Tests](https://github.com/gustavaom7/playwright/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/gustavaom7/playwright/actions/workflows/playwright.yml)

Playwright + TypeScript end-to-end test suite exercising the public demo site [saucedemo.com](https://www.saucedemo.com/). There is no application source code here — this repo only contains tests, page objects, and the tooling around them.

## Getting started

```bash
npm install                          # install dependencies
npx playwright install --with-deps   # install browsers (once, and in CI)

npx playwright test                  # run the full suite headless
npx playwright test --headed         # run with a visible browser
npx playwright test --ui             # Playwright's UI mode
npx playwright test --project=chromium  # run a single browser project

npm run lint                         # eslint
npm run typecheck                    # tsc --noEmit
npx playwright show-report           # open the last HTML report
```

## Architecture

- **`playwright.config.ts`** defines a dependency chain of projects:
  - `setup` — runs `*.setup.ts` files first.
  - `chromium`, `firefox`, `webkit` — run `*.spec.ts` files, each depending on `setup` and starting from the storage state it produces (pre-authenticated).
- **`tests/auth.setup.ts`** logs into SauceDemo as `standard_user` once and saves cookies/localStorage to `playwright/.auth/user.json`, which every spec project reuses. Tests that need a logged-out state (e.g. `locked_out_user`) clear cookies/localStorage explicitly before navigating.
- **`pages/`** — a Page Object Model, one class per screen, all extending `BasePage` (`pages/base.ts`) for a shared `navigate(url)` helper:
  - `LoginPage`, `InventoryPage`, `CartPage`, `CheckoutPage`, `ItemDetailPage`.
  - Locators prefer the site's `[data-test="..."]` attributes. New interactions belong in these classes, not inlined into specs.
- **`fixtures/`**
  - `pages.fixture.ts` — extends Playwright's `test` with one fixture per page object (`loginPage`, `inventoryPage`, `cartPage`, `checkoutPage`, `itemDetailPage`), so specs just destructure what they need.
  - `test-data.ts` — shared constants: the six SauceDemo user accounts, product names, checkout form data.
- **`utils/`** — currently empty, reserved for shared helpers.

## Tests

- **`tests/saucedemo.spec.ts`** (16 tests) — standard desktop flows: login (success, locked-out, field validation), search/add-to-cart, checkout (happy path, multi-item totals, cancel, field validation), sorting (price and name, both directions), item detail page, removing cart items, Reset App State / All Items navigation, footer/About links, and logout — plus a `Mobile Responsiveness` block emulating an iPhone 12 for the burger menu, logout, and checkout.
- **`tests/saucedemo-quirks.spec.ts`** (7 tests) — documents known SauceDemo bugs tied to specific seeded users: `problem_user` (broken product images, checkout Last Name never registers), `error_user` (removing a cart item silently fails, sort order doesn't actually change), `performance_glitch_user` (slow login), `visual_user` (misplaced cart icon).

All spec tests run against **Chromium, Firefox, and WebKit**.

## CI/CD

`.github/workflows/playwright.yml` runs on every push/PR to `main`/`master`: installs dependencies, lints, typechecks, installs (and caches) Playwright browsers, runs the full suite (`npm test`), and uploads the HTML report as a build artifact. The badge at the top of this file reflects the latest run on `main`.

## MCP

`.mcp.json` configures the official `@playwright/mcp` server, giving an MCP-compatible client (e.g. Claude Code) live control of a real browser against saucedemo.com. It's used to explore the site interactively before writing code — navigating flows, taking accessibility snapshots, and clicking/typing to discover the `data-test` locators a new page-object method or spec should use. It doesn't generate test files by itself; the resulting code is still written by hand from what the session reveals. Session artifacts (snapshots, console logs) land in `.playwright-mcp/`, which is gitignored.
