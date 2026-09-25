// k6 browser test: measures real page-load metrics (Core Web Vitals) of the SauceDemo login
// and inventory flow in headless Chromium, and fails the run if a threshold is breached.
//
//   k6 run perf/k6/inventory-browser.js --summary-export=perf/k6/summary.json
//
// Thresholds live in thresholds.json so the CI summary/Slack step uses the very same limits.
// Deliberately small (1 VU, 5 iterations): SauceDemo is a public demo site, not a load target.
import { browser } from 'k6/browser';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://www.saucedemo.com';
// Public demo credentials, published on the SauceDemo login page itself
const USER = __ENV.SAUCE_USER || 'standard_user';
const PASSWORD = __ENV.SAUCE_PASSWORD || 'secret_sauce';

const LIMITS = JSON.parse(open('./thresholds.json'));

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 5,
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    ...Object.fromEntries(
      Object.entries(LIMITS).map(([metric, { stat, max }]) => [metric, [`${stat}<${max}`]]),
    ),
    checks: ['rate==1'],
  },
};

export default async function () {
  const page = await browser.newPage();
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    await page.locator('[data-test="username"]').fill(USER);
    await page.locator('[data-test="password"]').fill(PASSWORD);
    await page.locator('[data-test="login-button"]').click();
    await page.waitForSelector('[data-test="inventory-container"]');

    const products = await page.locator('[data-test="inventory-item"]').count();
    check(products, { 'inventory lists products after login': (n) => n > 0 });
  } finally {
    await page.close();
  }
}
