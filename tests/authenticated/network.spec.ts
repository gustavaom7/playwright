import { test, expect } from '../../fixtures/pages.fixture';
import { items } from '../../fixtures/test-data';

// Network-level scenarios: what the app does when requests fail or misbehave. SauceDemo has
// no API to mock, but it does depend on images and third-party font hosts, which we can break.
test.describe('Network resilience', { tag: '@network' }, () => {

  test('the inventory loads without failed asset requests or console errors', async ({ page, inventoryPage }) => {
    const failedRequests: string[] = [];
    const consoleErrors: string[] = [];
    const origin = new URL('https://www.saucedemo.com').origin;

    page.on('response', (response) => {
      // Same-origin assets only: third-party hosts are outside our control, and the HTML
      // document itself is covered by the deep-link test below (it answers 404 by design)
      const isAsset = response.request().resourceType() !== 'document';
      if (isAsset && response.url().startsWith(origin) && response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });
    page.on('console', (message) => {
      // Browsers echo the 404 of the deep-linked document (see the quirk test below) as a
      // console error; failed assets are already reported by the response listener above
      const isDocument404 = message.text().includes('status of 404');
      if (message.type() === 'error' && !isDocument404) consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await inventoryPage.navigate('/inventory.html');
    await inventoryPage.waitForInventoryToLoad();

    expect(failedRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('a deep link to /inventory.html is answered with HTTP 404 yet the app still renders', { tag: '@quirk' }, async ({ page, inventoryPage }) => {
    // Hosting quirk: the server has no route for the SPA path and relies on a 404 fallback page.
    // It is invisible to users but real for crawlers, monitors and anything that checks status codes.
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.request().resourceType() === 'document'),
      page.goto('/inventory.html'),
    ]);

    expect(response.status()).toBe(404);
    await inventoryPage.waitForInventoryToLoad();
  });

  test('the inventory stays usable when every product image fails to load', async ({ page, inventoryPage, cartPage }) => {
    await page.route('**/*', (route) =>
      route.request().resourceType() === 'image' ? route.abort() : route.continue());

    await inventoryPage.navigate('/inventory.html');
    await expect(inventoryPage.inventoryItems).toHaveCount(6);

    // Core flow is unaffected by the missing images
    await inventoryPage.addItemToCart(items.bikeLight);
    await expect(inventoryPage.cartBadge).toHaveText('1');
    await inventoryPage.openCart();
    await cartPage.checkItemInCart(items.bikeLight);
  });

  test('the shopping flow works when third-party font hosts are unreachable', async ({ page, inventoryPage, cartPage }) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());

    await inventoryPage.navigate('/inventory.html');
    await inventoryPage.addItemToCart(items.backpack);
    await inventoryPage.openCart();

    await cartPage.checkItemInCart(items.backpack);
  });

  test('a slow product image request does not block adding to the cart', async ({ page, inventoryPage }) => {
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() !== 'image') return route.continue();
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      return route.continue();
    });

    await inventoryPage.navigate('/inventory.html');
    await inventoryPage.addItemToCart(items.bikeLight);

    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

});
