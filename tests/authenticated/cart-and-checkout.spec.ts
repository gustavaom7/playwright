import { test, expect } from '../../fixtures/pages.fixture';
import { items, checkoutInfo } from '../../fixtures/test-data';

test.describe('Cart and checkout', () => {

  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.navigate('/inventory.html');
  });

  test('an item added from the inventory appears in the cart', { tag: '@smoke' }, async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addItemToCart(items.bikeLight);
    await inventoryPage.openCart();

    await cartPage.checkItemInCart(items.bikeLight);
  });

  test('checkout completes the order', { tag: '@smoke' }, async ({ inventoryPage, cartPage, checkoutPage }) => {
    await inventoryPage.addItemToCart(items.bikeLight);
    await inventoryPage.openCart();
    await cartPage.checkItemInCart(items.bikeLight);
    await cartPage.proceedToCheckout();

    await checkoutPage.fillCheckoutInfo(checkoutInfo.firstName, checkoutInfo.lastName, checkoutInfo.zipCode);
    await checkoutPage.clickFinishButton();

    await checkoutPage.checkOrderSuccess();
  });

  test('removing an item keeps the others, and Continue Shopping returns to the inventory', async ({ inventoryPage, cartPage }) => {
    // Two items so removing one still leaves the cart non-empty
    await inventoryPage.addItemToCart(items.bikeLight);
    await inventoryPage.addItemToCart(items.backpack);
    await inventoryPage.openCart();

    await cartPage.removeItemFromCart(items.bikeLight);
    await expect(cartPage.itemNames).toHaveText([items.backpack]);
    await expect(inventoryPage.cartBadge).toHaveText('1');

    await cartPage.continueShopping();
    await expect(inventoryPage.sortDropdown).toBeVisible();
  });

  test('checkout total equals item total plus tax, and cancelling preserves the cart', async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    await inventoryPage.addItemToCart(items.bikeLight);
    await inventoryPage.addItemToCart(items.backpack);
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillCheckoutInfo(checkoutInfo.firstName, checkoutInfo.lastName, checkoutInfo.zipCode);

    const itemTotal = await checkoutPage.getItemTotal();
    const tax = await checkoutPage.getTax();
    const total = await checkoutPage.getTotal();
    expect(total).toBeCloseTo(itemTotal + tax, 2);

    // Cancelling from the overview drops the order but keeps the cart intact
    await checkoutPage.clickCancelButton();
    await expect(page).toHaveURL('/inventory.html');
    await expect(inventoryPage.cartBadge).toHaveText('2');
  });

  const missingFieldCases = [
    { title: 'First Name', firstName: '', lastName: checkoutInfo.lastName, zipCode: checkoutInfo.zipCode, error: 'Error: First Name is required' },
    { title: 'Last Name', firstName: checkoutInfo.firstName, lastName: '', zipCode: checkoutInfo.zipCode, error: 'Error: Last Name is required' },
    { title: 'Postal Code', firstName: checkoutInfo.firstName, lastName: checkoutInfo.lastName, zipCode: '', error: 'Error: Postal Code is required' },
    // SauceDemo validates in order and reports only the first missing field
    { title: 'every field (reports First Name first)', firstName: '', lastName: '', zipCode: '', error: 'Error: First Name is required' },
  ];

  for (const { title, firstName, lastName, zipCode, error } of missingFieldCases) {
    test(`checkout blocks Continue when ${title} is missing`, async ({ page, inventoryPage, cartPage, checkoutPage }) => {
      await inventoryPage.addItemToCart(items.bikeLight);
      await inventoryPage.openCart();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillCheckoutInfo(firstName, lastName, zipCode);

      await checkoutPage.checkErrorMessage(error);
      await expect(page).toHaveURL(/checkout-step-one\.html/);
    });
  }

});
