import { test, expect } from '@playwright/test';
import { SauceDemo } from '../pages/SauceDemo';

test.describe('SauceDemo automatization', () => {
  
  test('1st test -- Navigate to [https://www.saucedemo.com/]', async ({ page }) => {
    const sauceDemo = new SauceDemo(page);

    // 1. Access the website
    await sauceDemo.navigate('https://www.saucedemo.com/');

    // 2. Check if Login button is visible
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();

  });

  test('2nd test -- Attempt to sign in with username locked_out_user and verify the correct error message is displayed', async ({ page }) => {
    const sauceDemo = new SauceDemo(page);

    // 1. Access the website
    await sauceDemo.navigate('https://www.saucedemo.com/');

    // 2. Insert credentials
    await sauceDemo.signIn('locked_out_user', 'secret_sauce');

    // 3. Click Login button
    await sauceDemo.clickLoginButton();

    // 3. Check error message
    await sauceDemo.checkErrorMessage();

  });

  test('3rd test -- Search for "Sauce Labs Bike Light" and add it to the cart; verify it appears in the cart with the correct name', async ({ page }) => {
    const sauceDemo = new SauceDemo(page);

    // 1. Access the website
    await sauceDemo.navigate('https://www.saucedemo.com/');

    // 2. Insert credentials -- succcess 
    await sauceDemo.signIn('standard_user', 'secret_sauce');

    // 3. Click Login button
    await sauceDemo.clickLoginButton();

    // 4. Add "Sauce Labs Bike Light" to the cart
    await sauceDemo.addSauceLabsBikeLightToCart();

    // 5. Open Cart
      await sauceDemo.openShoppingCart();

    // 6. Check if Bike Light is there
      await sauceDemo.checkShoppingCartItem('Sauce Labs Bike Light');

  });
  
  test('4th test -- Proceed to checkout and verify the order was completed', async ({ page }) => {
    const sauceDemo = new SauceDemo(page);

    // 1. Access the website
    await sauceDemo.navigate('https://www.saucedemo.com/');

    // 2. Insert credentials -- succcess 
    await sauceDemo.signIn('standard_user', 'secret_sauce');

    // 3. Click Login button
    await sauceDemo.clickLoginButton();

    // 4. Add "Sauce Labs Bike Light" to the cart
    await sauceDemo.addSauceLabsBikeLightToCart();

    // 5. Open Cart
      await sauceDemo.openShoppingCart();

    // 6. Check if Bike Light is there
      await sauceDemo.checkShoppingCartItem('Sauce Labs Bike Light');

    // 7. Proceed to checkout
    await sauceDemo.clickCheckoutButton();

    // 8. Fill checkout form
    await sauceDemo.fillCheckoutData('Gustavo', 'Mesquita', '37191018');

    // 9. Finish
    await sauceDemo.clickFinishButton();

    // 10. Check success
    await sauceDemo.checkOrderSuccess();

  });


});