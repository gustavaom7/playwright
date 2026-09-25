import { test, expect } from '../../fixtures/pages.fixture';
import { items, checkoutInfo } from '../../fixtures/test-data';

// Runs in the "mobile-*" projects (Pixel 5 on Chromium, iPhone 12 on WebKit).
test.describe('Mobile responsiveness', () => {

  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.navigate('/inventory.html');
  });

  test('the burger menu is available', async ({ inventoryPage }) => {
    await expect(inventoryPage.burgerMenuButton).toBeVisible();
  });

  test('logout works from the burger menu', async ({ inventoryPage, loginPage }) => {
    // SauceDemo logout is client-side, so it does not affect other parallel sessions
    await inventoryPage.logout();

    await loginPage.checkLoginButtonVisible();
  });

  test('checkout completes on a mobile viewport', { tag: '@smoke' }, async ({ inventoryPage, cartPage, checkoutPage }) => {
    await inventoryPage.addItemToCart(items.bikeLight);
    await inventoryPage.openCart();
    await cartPage.checkItemInCart(items.bikeLight);
    await cartPage.proceedToCheckout();

    await checkoutPage.fillCheckoutInfo(checkoutInfo.firstName, checkoutInfo.lastName, checkoutInfo.zipCode);
    await checkoutPage.clickFinishButton();

    await checkoutPage.checkOrderSuccess();
  });

});
