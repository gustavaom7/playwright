import { test, expect } from '../../fixtures/pages.fixture';
import { users, items, checkoutInfo } from '../../fixtures/test-data';

// Each test pins down a documented SauceDemo bug tied to a seeded user, so they PASS while
// the bug exists. If SauceDemo ever fixes one, the matching test failing is the signal.
test.describe('Known bugs of seeded users', { tag: '@quirk' }, () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate('/');
  });

  test('problem_user sees the same broken product image for every item', async ({ loginPage, inventoryPage }) => {
    await loginPage.login(users.problem);

    const imageSources = await inventoryPage.getProductImageSources();
    expect(new Set(imageSources).size).toBe(1);
  });

  test('error_user: removing an item from the cart silently fails', async ({ loginPage, inventoryPage }) => {
    await loginPage.login(users.error);

    await inventoryPage.addItemToCart(items.bikeLight);
    await inventoryPage.removeItemFromCart(items.bikeLight);

    // Clicking "Remove" throws a JS error and the item stays in the cart
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('error_user: changing the sort order shows an error and does not reorder the products', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.login(users.error);
    const namesBefore = await inventoryPage.getInventoryNames();

    // The alert is raised synchronously by the change handler, so once selectOption
    // returns we know the sort attempt has been processed
    let alertMessage = '';
    page.once('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.dismiss();
    });
    await inventoryPage.filterByNameZA();

    expect(alertMessage).toContain('Sorting is broken!');
    expect(await inventoryPage.getInventoryNames()).toEqual(namesBefore);
  });

  test('problem_user can never complete checkout because Last Name never registers', async ({ loginPage, inventoryPage, cartPage, checkoutPage }) => {
    await loginPage.login(users.problem);

    await inventoryPage.addItemToCart(items.bikeLight);
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();

    // The Last Name field silently ignores keystrokes, so Continue reports it missing
    await checkoutPage.fillCheckoutInfo(checkoutInfo.firstName, checkoutInfo.lastName, checkoutInfo.zipCode);
    await checkoutPage.checkErrorMessage('Error: Last Name is required');
  });

  test('visual_user sees the cart icon rendered out of place', async ({ loginPage, inventoryPage }) => {
    // Reference position from standard_user in the same browser and viewport, so the
    // check does not depend on absolute pixel coordinates
    await loginPage.login(users.standard);
    await inventoryPage.waitForInventoryToLoad();
    const standardBox = await inventoryPage.cartIcon.boundingBox();
    await inventoryPage.logout();

    await loginPage.login(users.visual);
    await inventoryPage.waitForInventoryToLoad();
    const visualBox = await inventoryPage.cartIcon.boundingBox();

    // A CSS glitch shifts the icon away from its normal top-right position
    expect(visualBox?.x).toBeLessThan((standardBox?.x ?? 0) - 50);
  });

  test('performance_glitch_user takes noticeably longer to log in than standard_user', { tag: '@slow' }, async ({ loginPage, inventoryPage }) => {
    // The glitch is a fixed ~5s delay on rendering the inventory, longer than the default 5s timeout
    const LOGIN_TIMEOUT = 15_000;
    const timedLogin = async (user: { username: string; password: string }) => {
      const start = Date.now();
      await loginPage.login(user);
      // The route changes right away; the glitch delays the inventory list from rendering
      await inventoryPage.waitForInventoryToLoad(LOGIN_TIMEOUT);
      return Date.now() - start;
    };

    const standardMs = await timedLogin(users.standard);
    await inventoryPage.logout();
    const glitchMs = await timedLogin(users.performanceGlitch);

    // Comparing against a baseline taken in the same run cancels out a slow network/runner
    expect(glitchMs).toBeGreaterThan(standardMs + 2000);
  });

});
