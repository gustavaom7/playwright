import { devices } from '@playwright/test';
import { test, expect } from '../fixtures/pages.fixture';
import { users, items, checkoutInfo } from '../fixtures/test-data';

test.describe('SauceDemo automatization', () => {

  test.beforeEach(async ({ inventoryPage }) => {
    // Go to Home page directly
    await inventoryPage.navigate('/inventory.html');
  });

  test('1st test -- Attempt to sign in with username locked_out_user and verify the correct error message is displayed', async ({ page, loginPage }) => {
    // Clearing cookies -- otherwise, the page is automatically signed in
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Access Website
    await loginPage.navigate('/inventory.html');

    // Insert credentials
    await loginPage.signIn(users.lockedOut.username, users.lockedOut.password);

    // Click Login button
    await loginPage.clickLoginButton();

    // Check error message
    await loginPage.checkErrorMessage();

  });

  test('2nd test -- Search for "Sauce Labs Bike Light" and add it to the cart; verify it appears in the cart with the correct name', async ({ inventoryPage, cartPage }) => {
    // Add "Sauce Labs Bike Light" to the cart
    await inventoryPage.addItemToCart(items.bikeLight);

    // Open Cart
    await inventoryPage.openCart();

    // Check if Bike Light is there
    await cartPage.checkItemInCart(items.bikeLight);

  });

  test('3rd test -- Proceed to checkout and verify the order was completed', async ({ inventoryPage, cartPage, checkoutPage }) => {
    // Add "Sauce Labs Bike Light" to the cart
    await inventoryPage.addItemToCart(items.bikeLight);

    // Open Cart
    await inventoryPage.openCart();

    // Check if Bike Light is there
    await cartPage.checkItemInCart(items.bikeLight);

    // Proceed to checkout
    await cartPage.proceedToCheckout();

    // Fill checkout form
    await checkoutPage.fillCheckoutInfo(checkoutInfo.firstName, checkoutInfo.lastName, checkoutInfo.zipCode);

    // Finish
    await checkoutPage.clickFinishButton();

    // Check success
    await checkoutPage.checkOrderSuccess();

  });

  test('4th test -- Order items by price and validate it', async ({ inventoryPage }) => {
    // Filter the page
    await inventoryPage.filterByPriceLowToHigh();

    // Get the prices shown and store it into a variable
    const pricesUI = await inventoryPage.getInventoryPrices();

    // Creating a new, independent and ordered array containing the numbers collected previouly
    const expectedOrder = [...pricesUI].sort((a, b) => a - b);

    // Check if the returned order (priceUI) matches the template (expectedOrder)
    expect(pricesUI).toEqual(expectedOrder);

  });

});

test.describe('Mobile Responsiveness', () => {
  // Forcing this block run as an iPhone 12
  // (defaultBrowserType is omitted so the block keeps running on the chromium project)
  const { defaultBrowserType, ...iPhone12 } = devices['iPhone 12'];
  test.use({ ...iPhone12 });

  test.beforeEach(async ({ inventoryPage }) => {
    // Go to Home page directly
    await inventoryPage.navigate('/inventory.html');
  });

  test('5th test -- Check burger menu on mobile', async ({ inventoryPage }) => {
    // Check burger menu exhibition
    await expect(inventoryPage.burgerMenuButton).toBeVisible();
  });

  test ('6th test -- Logout using burger menu', async ({ inventoryPage, loginPage }) => {
    // Open burger menu and log out
    await inventoryPage.logout();

    // Check if sign in screen is shown -- check Login button existency
    await loginPage.checkLoginButtonVisible();

  });

  test('7th test -- Checkout on mobile version', async ({ inventoryPage, cartPage, checkoutPage }) => {
    // Add "Sauce Labs Bike Light" to the cart
    await inventoryPage.addItemToCart(items.bikeLight);

    // Open Cart
    await inventoryPage.openCart();

    // Check if Bike Light is there
    await cartPage.checkItemInCart(items.bikeLight);

    // Proceed to checkout
    await cartPage.proceedToCheckout();

    // Fill checkout form
    await checkoutPage.fillCheckoutInfo(checkoutInfo.firstName, checkoutInfo.lastName, checkoutInfo.zipCode);

    // Finish
    await checkoutPage.clickFinishButton();

    // Check success
    await checkoutPage.checkOrderSuccess();
  })

});
