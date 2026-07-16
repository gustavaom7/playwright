# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Playwright TypeScript test automation suite (`interview-playwright-sandbox`) exercising the public demo site https://www.saucedemo.com/. There is no application source code here — this repo only contains end-to-end tests and their supporting page objects.

## Commands

```bash
npm install                       # install dependencies (no build step needed)
npx playwright install --with-deps  # install browsers (required once, and in CI)

npx playwright test               # run the full suite headless
npx playwright test --headed      # run with a visible browser
npx playwright test --ui          # run in Playwright's UI mode
npx playwright test --debug       # step through with the inspector

npx playwright test tests/saucedemo.spec.ts        # run a single file
npx playwright test -g "3rd test"                  # run tests matching a title
npx playwright test --project=chromium              # run a specific project only

npx playwright show-report        # open the last HTML report
```

There is no lint, typecheck, or build script defined in `package.json` — `scripts` is empty.

## Architecture

- `playwright.config.ts` defines two projects with a dependency chain:
  - `setup` — matches `*.setup.ts` files only, runs first.
  - `chromium` — matches `*.spec.ts` files only, depends on `setup`, and reuses the auth state saved to `playwright/.auth/user.json` via `storageState`.
  - Mobile/branded-browser projects are present but commented out; mobile behavior is instead tested via `test.use({ viewport, userAgent })` overrides inside spec files (see `Mobile Responsiveness` describe block in `tests/saucedemo.spec.ts`).
- `tests/auth.setup.ts` is the setup project: it logs into SauceDemo as `standard_user` and writes storage state (cookies/localStorage) to `playwright/.auth/user.json`, which every `chromium`-project test then starts from (pre-authenticated). Tests that need a logged-out state must explicitly clear cookies/localStorage first (see the `locked_out_user` test in `saucedemo.spec.ts`).
- `pages/` implements a Page Object Model:
  - `pages/base.ts` — `BasePage` holds the `Page` instance and a generic `navigate(url)` helper. All page objects extend this.
  - `pages/SauceDemo.ts` — `SauceDemo extends BasePage`, encapsulating locators (by `data-test` attribute where possible) and higher-level actions/assertions (sign in, add to cart, checkout flow, price sorting, etc.) used by the specs. Add new SauceDemo interactions here rather than inlining locators in test files.
- `tests/saucedemo.spec.ts` contains two `test.describe` blocks: standard desktop flows, and a `Mobile Responsiveness` block that overrides viewport/userAgent to emulate an iPhone 12.
- `fixtures/` and `utils/` exist but are currently empty — intended locations for shared test fixtures and helper utilities respectively.
- CI (`.github/workflows/playwright.yml`) runs on push/PR to `main`/`master`: installs deps, installs browsers, runs `npx playwright test`, and uploads the HTML report as an artifact.
