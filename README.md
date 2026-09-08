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
* **Cross-browser coverage:** the full spec suite runs against **Chromium, Firefox, and WebKit**.
* **Mobile emulation:** viewport/userAgent overrides emulate an iPhone 12 for responsive flows.
* **Known-bug regression suite:** a dedicated `saucedemo-quirks.spec.ts` pins down real SauceDemo bugs tied to specific seeded users (`problem_user`, `error_user`, `performance_glitch_user`, `visual_user`).

### 🤖 AI-Assisted Exploration (MCP)
* **Model Context Protocol integration:** `.mcp.json` wires up the official `@playwright/mcp` server, giving an MCP-compatible client (e.g. Claude Code) live control of a real browser against saucedemo.com.
* **Locator discovery workflow:** flows are explored interactively — navigating, taking accessibility snapshots, clicking/typing — to find the exact `[data-test="..."]` locator a new Page Object method should use, instead of guessing selectors blind.
* **Human-in-the-loop authoring:** MCP drives discovery, not code generation — the resulting page-object methods and test code are still written deliberately from what the session reveals.

### ⚙️ DevOps & CI/CD
* **GitHub Actions:** lint, typecheck, and the full cross-browser regression suite run on every push/PR.
* **Dependency caching:** Playwright browser binaries are cached by version to speed up runs.
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
│   ├── saucedemo.spec.ts         # Core + mobile E2E flows
│   └── saucedemo-quirks.spec.ts  # Known SauceDemo bugs per seeded user
├── utils/                     # Reserved for shared helpers
├── playwright.config.ts       # Projects: setup -> chromium / firefox / webkit
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

**Single browser:** `npx playwright test --project=chromium`

**Single file:** `npx playwright test tests/saucedemo.spec.ts`

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
