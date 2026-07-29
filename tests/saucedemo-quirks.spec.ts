import { test, expect } from '../fixtures/pages.fixture';
import { users, items } from '../fixtures/test-data';

test.describe('SauceDemo automatization pt2', () => {

  test.beforeEach(async ({ inventoryPage }) => {
    // Go to Home page directly (also gives us a saucedemo.com origin to clear storage on)
    await inventoryPage.navigate('/inventory.html');
  });

  test('1st test -- problem_user sees the same broken product image for every item', async ({ page, loginPage, inventoryPage }) => {
    // Clearing cookies -- otherwise, the page is automatically signed in as standard_user
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Access Website
    await loginPage.navigate('/inventory.html');

    // Insert credentials
    await loginPage.signIn(users.problem.username, users.problem.password);

    // Click Login button
    await loginPage.clickLoginButton();

    // Known problem_user bug: every product image points to the same broken asset
    const imageSources = await inventoryPage.getProductImageSources();
    expect(new Set(imageSources).size).toBe(1);
  });

  test('2nd test -- Checkout blocks continue and reports the first empty field', async ({ inventoryPage, cartPage, checkoutPage }) => {
    // Add an item so we can reach the checkout page
    await inventoryPage.addItemToCart(items.bikeLight);
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();

    // Try to continue without filling any checkout field
    await checkoutPage.continueButton.click();

    // SauceDemo validates fields in order and reports the first missing one
    await checkoutPage.checkErrorMessage('Error: First Name is required');
  });

  test('3rd test -- error_user: removing an item from the cart silently fails', async ({ page, loginPage, inventoryPage }) => {
    // Clearing cookies -- otherwise, the page is automatically signed in as standard_user
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Access Website
    await loginPage.navigate('/inventory.html');

    // Insert credentials
    await loginPage.signIn(users.error.username, users.error.password);

    // Click Login button
    await loginPage.clickLoginButton();

    await inventoryPage.addItemToCart(items.bikeLight);
    await inventoryPage.removeItemFromCart(items.bikeLight);

    // Known error_user bug: clicking "Remove" throws a JS error and the item stays in the cart
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('4th test -- performance_glitch_user takes noticeably longer to log in', async ({ page, loginPage }) => {
    // Clearing cookies -- otherwise, the page is automatically signed in as standard_user
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Access Website
    await loginPage.navigate('/inventory.html');

    // Insert credentials
    await loginPage.signIn(users.performanceGlitch.username, users.performanceGlitch.password);

    // Measure how long the login takes to land on the inventory page
    const start = Date.now();
    await loginPage.clickLoginButton();
    await expect(page).toHaveURL('/inventory.html');
    const elapsedMs = Date.now() - start;

    // Known performance_glitch_user bug: a fixed ~5s artificial delay on login.
    // standard_user logs in well under 100ms, so 2000ms leaves a wide safety margin either way.
    expect(elapsedMs).toBeGreaterThan(2000);
  });

  test('5th test -- visual_user sees the cart icon rendered out of place', async ({ page, loginPage, inventoryPage }) => {
    // Clearing cookies -- otherwise, the page is automatically signed in as standard_user
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Access Website
    await loginPage.navigate('/inventory.html');

    // Insert credentials
    await loginPage.signIn(users.visual.username, users.visual.password);

    // Click Login button
    await loginPage.clickLoginButton();

    // Known visual_user bug: a CSS glitch shifts the cart icon away from its
    // normal top-right position (~x:1220 on a 1280px viewport). We only assert
    // it's clearly off, not the exact buggy coordinates, to avoid a brittle pixel match.
    const cartIconBox = await inventoryPage.cartIcon.boundingBox();
    expect(cartIconBox?.x).toBeLessThan(1150);
  });

});
