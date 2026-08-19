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
    await loginPage.checkErrorMessage('Epic sadface: Sorry, this user has been locked out.');

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

  test('Order items by name and validate both directions (A-Z and Z-A)', async ({ inventoryPage }) => {
    // Sort A-Z and validate
    await inventoryPage.filterByNameAZ();
    const namesAZ = await inventoryPage.getInventoryNames();
    const expectedAZ = [...namesAZ].sort((a, b) => a.localeCompare(b));
    expect(namesAZ).toEqual(expectedAZ);

    // Switch to Z-A and validate
    await inventoryPage.filterByNameZA();
    const namesZA = await inventoryPage.getInventoryNames();
    const expectedZA = [...expectedAZ].reverse();
    expect(namesZA).toEqual(expectedZA);
  });

  test('Open item detail page, validate its data and add to cart from there', async ({ inventoryPage, itemDetailPage }) => {
    // Capture the price shown on the listing before navigating away
    const listingPrices = await inventoryPage.getInventoryPrices();
    const listingNames = await inventoryPage.getInventoryNames();
    const bikeLightIndex = listingNames.indexOf(items.bikeLight);

    // Open the detail page for "Sauce Labs Bike Light"
    await inventoryPage.openItemDetails(items.bikeLight);

    // Validate name and price match what was shown on the listing
    await expect(itemDetailPage.itemName).toHaveText(items.bikeLight);
    const detailPrice = await itemDetailPage.getPrice();
    expect(detailPrice).toEqual(listingPrices[bikeLightIndex]);

    // Add to cart from the detail page and check the cart badge updates
    await itemDetailPage.addToCart();
    await expect(inventoryPage.cartBadge).toHaveText('1');

    // Go back to the listing
    await itemDetailPage.goBackToProducts();
    await expect(inventoryPage.sortDropdown).toBeVisible();
  });

  test('Remove an item from the cart and continue shopping', async ({ inventoryPage, cartPage }) => {
    // Add two items so removing one still leaves the cart non-empty
    await inventoryPage.addItemToCart(items.bikeLight);
    await inventoryPage.addItemToCart(items.backpack);
    await inventoryPage.openCart();

    // Remove one item and verify only the other remains
    await cartPage.removeItemFromCart(items.bikeLight);
    await expect(cartPage.itemNames).toHaveText([items.backpack]);
    await expect(inventoryPage.cartBadge).toHaveText('1');

    // "Continue Shopping" takes us back to the inventory page
    await cartPage.continueShopping();
    await expect(inventoryPage.sortDropdown).toBeVisible();
  });

  test('Checkout with multiple items shows the correct total, and cancelling preserves the cart', async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    // Add two items and reach the checkout overview step
    await inventoryPage.addItemToCart(items.bikeLight);
    await inventoryPage.addItemToCart(items.backpack);
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillCheckoutInfo(checkoutInfo.firstName, checkoutInfo.lastName, checkoutInfo.zipCode);

    // Total should equal item total + tax
    const itemTotal = await checkoutPage.getItemTotal();
    const tax = await checkoutPage.getTax();
    const total = await checkoutPage.getTotal();
    expect(total).toBeCloseTo(itemTotal + tax, 2);

    // Cancelling from the overview step drops the order but keeps the cart intact
    await checkoutPage.clickCancelButton();
    await expect(page).toHaveURL('/inventory.html');
    await expect(inventoryPage.cartBadge).toHaveText('2');
  });

  test('Reset App State clears the cart badge, and All Items returns to the inventory listing', async ({ inventoryPage }) => {
    // Add an item so the cart badge is visible
    await inventoryPage.addItemToCart(items.bikeLight);
    await expect(inventoryPage.cartBadge).toHaveText('1');

    // Reset App State clears the cart
    await inventoryPage.openBurgerMenu();
    await inventoryPage.resetAppState();
    await expect(inventoryPage.cartBadge).toBeHidden();

    // Navigate away, then use the burger menu's "All Items" link to come back
    await inventoryPage.openItemDetails(items.backpack);
    await inventoryPage.openBurgerMenu();
    await inventoryPage.goToAllItems();
    await expect(inventoryPage.sortDropdown).toBeVisible();
  });

  test('Login reports wrong password, then missing username, then missing password', async ({ page, loginPage }) => {
    // Clearing cookies -- otherwise, the page is automatically signed in
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await loginPage.navigate('/inventory.html');

    // Wrong password for a valid username
    await loginPage.signIn(users.standard.username, 'wrong_password');
    await loginPage.clickLoginButton();
    await loginPage.checkErrorMessage('Epic sadface: Username and password do not match any user in this service');

    // Empty username
    await loginPage.signIn('', '');
    await loginPage.clickLoginButton();
    await loginPage.checkErrorMessage('Epic sadface: Username is required');

    // Username filled, empty password
    await loginPage.signIn(users.standard.username, '');
    await loginPage.clickLoginButton();
    await loginPage.checkErrorMessage('Epic sadface: Password is required');
  });

  test('Checkout reports missing Last Name, then missing Zip Code, in order', async ({ inventoryPage, cartPage, checkoutPage }) => {
    // Add an item so we can reach the checkout page
    await inventoryPage.addItemToCart(items.bikeLight);
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();

    // First Name filled, Last Name missing
    await checkoutPage.firstNameField.fill(checkoutInfo.firstName);
    await checkoutPage.continueButton.click();
    await checkoutPage.checkErrorMessage('Error: Last Name is required');

    // Last Name filled, Zip Code still missing
    await checkoutPage.lastNameField.fill(checkoutInfo.lastName);
    await checkoutPage.continueButton.click();
    await checkoutPage.checkErrorMessage('Error: Postal Code is required');
  });

  test('About link and footer social links point to the correct destinations', async ({ inventoryPage }) => {
    // "About" in the burger menu points to the Sauce Labs site
    await inventoryPage.openBurgerMenu();
    await expect(inventoryPage.aboutSidebarLink).toHaveAttribute('href', 'https://saucelabs.com/');

    // Footer social links point to the right profiles (checked via href, not by
    // actually navigating -- these open in a new tab and are outside our control)
    await expect(inventoryPage.twitterLink).toHaveAttribute('href', 'https://twitter.com/saucelabs');
    await expect(inventoryPage.facebookLink).toHaveAttribute('href', 'https://www.facebook.com/saucelabs');
    await expect(inventoryPage.linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/company/sauce-labs/');
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
