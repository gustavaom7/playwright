# 🧪 Advanced Quality Architecture - Playwright & MCP

![Playwright Tests](https://github.com/gustavaom7/playwright/actions/workflows/playwright.yml/badge.svg?branch=main)
[![Quality](https://img.shields.io/badge/Quality-Assurance-orange)](https://github.com/gustavaom7/playwright)
[![MCP](https://img.shields.io/badge/MCP-Playwright-blueviolet)](https://github.com/gustavaom7/playwright/blob/main/.mcp.json)

Professional E2E automation suite developed with **Playwright** and **TypeScript** against [saucedemo.com](https://www.saucedemo.com/), extended with **Model Context Protocol (MCP)** integration for AI-assisted, locator-accurate test authoring.

---

## 🚀 Key Features & Engineering Patterns

### 🖥️ UI Automation (E2E)
* **Page Object Model (POM):** one class per screen (`LoginPage`, `InventoryPage`, `CartPage`, `CheckoutPage`, `ItemDetailPage`), all extending a shared `BasePage`.
* **Session Reuse:** `auth.setup.ts` logs in once and persists storage state (`playwright/.auth/user.json`), so every spec starts pre-authenticated instead of repeating the UI login flow.
* **Fixture-driven composition:** `pages.fixture.ts` extends Playwright's `test` with one fixture per page object; `test-data.ts` centralizes user accounts, products, and checkout data.
* **Cross-browser coverage:** desktop scenarios run against **Chromium, Firefox, and WebKit**.
* **Projects by scenario nature:** `public` (anonymous), `auth` (shared session, parallel), `session` (logout, runs after `auth`) and `mobile-*` (Pixel 5 / iPhone 12 on real Chromium/WebKit engines).
* **Tag filtering per project:** `TAG=@smoke` / `SEM_TAG=@slow` env vars, since `--grep` does not filter dependency projects.
* **Known-bug regression suite:** `tests/public/quirks.spec.ts` pins down real SauceDemo bugs tied to specific seeded users (`problem_user`, `error_user`, `performance_glitch_user`, `visual_user`).

### 🔬 Beyond Happy-Path E2E
* **Network resilience (`page.route`):** product images aborted, slow image responses and unreachable third-party font hosts — the core shopping flow must keep working. Also asserts zero failed asset requests and zero console errors on load.
* **Accessibility (axe-core):** WCAG 2.x A/AA audit of login, login-error, inventory, cart and checkout. Full violation detail is attached to the report as JSON. Baseline is 0 violations, so the gate defaults to 0; relax it with `A11Y_MAX=<n>`.
* **Data-driven scenarios:** invalid-credential, checkout-validation and sort-order cases are tables of data driving one test body each (7 login cases, 4 checkout cases, 4 sort orders).
* **Performance budgets:** Navigation Timing of the inventory page against budgets named by intent (`utils/budgets.ts`), scalable with `TIMEOUT_FACTOR` for slower environments. Timings are attached to the report even when passing.

### 🤖 AI-Assisted Exploration (MCP)
* **Model Context Protocol integration:** `.mcp.json` wires up the official `@playwright/mcp` server, giving an MCP-compatible client (e.g. Claude Code) live control of a real browser against saucedemo.com.
* **Locator discovery workflow:** flows are explored interactively — navigating, taking accessibility snapshots, clicking/typing — to find the exact `[data-test="..."]` locator a new Page Object method should use, instead of guessing selectors blind.
* **Human-in-the-loop authoring:** MCP drives discovery, not code generation — the resulting page-object methods and test code are still written deliberately from what the session reveals.

### ⚙️ DevOps & CI/CD
* **GitHub Actions:** lint, typecheck, and the full cross-browser regression suite run on every push/PR.
* **Dependency caching:** Playwright browser binaries are cached by version to speed up runs.
* **Live report on GitHub Pages:** the HTML report of the latest `main` run is published at https://gustavaom7.github.io/playwright/ (requires Pages source set to *GitHub Actions*).
* **Cost-aware matrix:** push/PR run Chromium + Chrome mobile for a fast signal; a nightly schedule (and manual dispatch) runs every browser and mobile project.
* **Automated Reporting:** HTML report uploaded as a build artifact on every run, even on failure.

---

## 🏗️ Project Structure

```text
playwright/
├── .github/workflows/        # CI/CD pipeline (playwright.yml)
├── .mcp.json                 # Playwright MCP server config
├── pages/                    # Page Object Model
│   ├── base.ts                  # Shared navigate() helper
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   └── ItemDetailPage.ts
├── fixtures/
│   ├── pages.fixture.ts      # Injects page objects as Playwright fixtures
│   └── test-data.ts          # Shared users, products, checkout data
├── tests/
│   ├── auth.setup.ts             # Logs in once, persists storage state
│   ├── public/                   # Anonymous: login, seeded-user bugs (quirks)
│   ├── authenticated/            # Catalog, cart, checkout (shared session)
│   ├── session/                  # Logout, runs after the authenticated projects
│   └── mobile/                   # Pixel 5 / iPhone 12 flows
├── utils/
│   ├── a11y.ts                  # axe audit helper (A11Y_MAX gate + JSON attachment)
│   └── budgets.ts               # Performance budgets, scaled by TIMEOUT_FACTOR
├── playwright.config.ts       # Projects: setup -> {browser}-public / -auth / -session, mobile-*
└── package.json                # Scripts and dependencies
```

## 🚦 Local Execution

1. **Installation**

```bash
npm install
npx playwright install --with-deps
```

2. **Running Tests**

**Full suite, headless (all browsers):** `npx playwright test`

**Headed mode:** `npx playwright test --headed`

**Interactive UI mode:** `npx playwright test --ui`

**Single project:** `npx playwright test --project=chromium-auth`

**By tag:** `TAG=@smoke npx playwright test` (tags: `@smoke`, `@quirk`, `@slow`, `@network`, `@a11y`, `@perf`)

**Skip slow tests:** `SEM_TAG=@slow npx playwright test`

**Single file:** `npx playwright test tests/authenticated/cart-and-checkout.spec.ts`

**Lint:** `npm run lint`

**Typecheck:** `npm run typecheck`

**Open last HTML report:** `npx playwright show-report`

3. **Exploring with MCP**

`.mcp.json` already configures the `@playwright/mcp` server — any MCP-compatible client (Claude Code, etc.) can drive a live browser against saucedemo.com to explore flows and discover `data-test` locators before a test is ever written.

## 📊 CI/CD Workflow

The automation runs on **Ubuntu-latest** via **GitHub Actions**:

**Trigger:** every push/PR to `main`/`master`.

**Execution:** `npm ci` → lint → typecheck → install/cache Playwright browsers → `npm test` across Chromium, Firefox, and WebKit.

**Artifacts:** uploads the Playwright HTML report for review, even if tests fail.

## 👤 Author

**Gustavo Mesquita** - QA Engineer

- [LinkedIn](https://www.linkedin.com/in/qa-gustavo-mesquita/)
- [GitHub](https://github.com/gustavaom7)

_Developed with automation and AI-assisted exploration via MCP._

---

## ⚠️ Known Limitations (what does NOT work, and why)

* **No API login.** SauceDemo has no authentication endpoint, so the session is built through the UI once in `auth.setup.ts`. Login-via-API is deliberately not used.
* **No API/network mocking of business data.** The app is a static SPA with no backend calls, so network tests break assets (images, fonts) rather than mocking responses.
* **Deep links answer HTTP 404.** `GET /inventory.html` returns 404 and relies on a fallback page to render the app. A `@quirk` test pins this; tests that check status codes of documents must account for it.
* **The route changes before the view renders.** Assertions right after navigation can race with the render. Locators shared across views are scoped to their container and list reads wait for the inventory first.
* **`--grep` does not filter dependency projects.** Use the `TAG` / `SEM_TAG` environment variables.
* **Firefox has no mobile emulation** (`isMobile` is unsupported), so mobile runs on Chromium (Pixel 5) and WebKit (iPhone 12).
* **Quirk tests pass while the bug exists.** `tests/public/quirks.spec.ts` pins documented SauceDemo bugs; a failing quirk test means the site fixed something, not that the suite broke.
* **Visual regression is not covered** — a baseline generated without review would freeze the current bugs as "correct".
