import { test, expect } from '../../fixtures/pages.fixture';
import { items, checkoutInfo } from '../../fixtures/test-data';

// Visual regression via Playwright's built-in toHaveScreenshot() -- no external service,
// no account, no extra dependency: it ships inside @playwright/test already used here.
//
// Scoped to Chromium only. Screenshot pixels are sensitive to font rendering and
// rasterization, which differ per browser engine, so a Firefox/WebKit baseline would just
// be more images to maintain, not more real coverage (same cost-aware reasoning already
// used for the push/PR CI matrix).
//
// Baselines are intentionally NOT committed by this change. Generating a first baseline
// without a human reviewing it would freeze whatever the page currently looks like as
// "correct" -- including any existing visual bug. See .github/workflows/visual-regression.yml
// and the README section "Visual regression" for how to generate and review the baseline
// before these tests are wired into the main push/PR run.
test.describe('Visual regression', () => {
test.skip(({ browserName }) => browserName !== 'chromium', 'Baselines are maintained for Chromium only');

test.beforeEach(async ({ inventoryPage }) => {
await inventoryPage.navigate('/inventory.html');
});

test('inventory page', { tag: '@visual' }, async ({ page, inventoryPage }) => {
await inventoryPage.waitForInventoryToLoad();
await expect(page).toHaveScreenshot('inventory.png', { fullPage: true });
});

test('inventory page sorted by price, low to high', { tag: '@visual' }, async ({ page, inventoryPage }) => {
await inventoryPage.filterByPriceLowToHigh();
await inventoryPage.waitForInventoryToLoad();
await expect(page).toHaveScreenshot('inventory-sorted-price.png', { fullPage: true });
});

test('cart with an item in it', { tag: '@visual' }, async ({ page, inventoryPage }) => {
await inventoryPage.addItemToCart(items.bikeLight);
await inventoryPage.openCart();
await expect(page).toHaveScreenshot('cart.png', { fullPage: true });
});

test('checkout step one, info form', { tag: '@visual' }, async ({ page, inventoryPage, cartPage }) => {
await inventoryPage.addItemToCart(items.bikeLight);
await inventoryPage.openCart();
await cartPage.proceedToCheckout();
await expect(page).toHaveScreenshot('checkout-step-one.png', { fullPage: true });
});

test('checkout complete', { tag: '@visual' }, async ({ page, inventoryPage, cartPage, checkoutPage }) => {
await inventoryPage.addItemToCart(items.bikeLight);
await inventoryPage.openCart();
await cartPage.proceedToCheckout();
await checkoutPage.fillCheckoutInfo(checkoutInfo.firstName, checkoutInfo.lastName, checkoutInfo.zipCode);
await checkoutPage.clickFinishButton();
await expect(page).toHaveScreenshot('checkout-complete.png', { fullPage: true });
});
});
