import { test, expect } from '@playwright/test';
import { SauceDemo } from '../pages/SauceDemo';

test.describe('SauceDemo automatization', () => {

  test.beforeEach(async ({ page }) => {
    const sauceDemo = new SauceDemo(page);
    // Go to Home page directly
    await sauceDemo.navigate('https://www.saucedemo.com/inventory.html');
  });

  test('1st test -- Attempt to sign in with username locked_out_user and verify the correct error message is displayed', async ({ page }) => {
    const sauceDemo = new SauceDemo(page);

    // Clearing cookies -- otherwise, the page is automatically signed in
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Access Website
    await sauceDemo.navigate('https://www.saucedemo.com/inventory.html');

    // Insert credentials
    await sauceDemo.signIn('locked_out_user', 'secret_sauce');

    // Click Login button
    await sauceDemo.clickLoginButton();

    // Check error message
    await sauceDemo.checkErrorMessage();

  });

  test('2nd test -- Search for "Sauce Labs Bike Light" and add it to the cart; verify it appears in the cart with the correct name', async ({ page }) => {
    const sauceDemo = new SauceDemo(page);

    // Add "Sauce Labs Bike Light" to the cart
    await sauceDemo.addSauceLabsBikeLightToCart();

    // Open Cart
      await sauceDemo.openShoppingCart();

    // Check if Bike Light is there
      await sauceDemo.checkShoppingCartItem('Sauce Labs Bike Light');

  });
  
  test('3rd test -- Proceed to checkout and verify the order was completed', async ({ page }) => {
    const sauceDemo = new SauceDemo(page);

    // Add "Sauce Labs Bike Light" to the cart
    await sauceDemo.addSauceLabsBikeLightToCart();

    // Open Cart
      await sauceDemo.openShoppingCart();

    // Check if Bike Light is there
      await sauceDemo.checkShoppingCartItem('Sauce Labs Bike Light');

    // Proceed to checkout
    await sauceDemo.clickCheckoutButton();

    // Fill checkout form
    await sauceDemo.fillCheckoutData('Gustavo', 'Mesquita', '37191018');

    // Finish
    await sauceDemo.clickFinishButton();

    // Check success
    await sauceDemo.checkOrderSuccess();

  });

  test('4th test -- Order items by price and validate it', async ({page }) => {
    const sauceDemo = new SauceDemo(page);

    // Filter the page
    await sauceDemo.filterByPriceLowToHigh();

    // Get the prices shown and store it into a variable
    const pricesUI = await sauceDemo.getInventoryPrices();

    // Creating a new, independent and ordered array containing the numbers collected previouly
    const expectedOrder = [...pricesUI].sort((a,b) => a-b);

    // Check if the returned order (priceUI) matches the template (expectedOrder)
    expect(pricesUI).toEqual(expectedOrder);

  });


});