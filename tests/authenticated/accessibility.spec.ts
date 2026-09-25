import { test } from '../../fixtures/pages.fixture';
import { items } from '../../fixtures/test-data';
import { auditAccessibility } from '../../utils/a11y';

// WCAG 2.x A/AA audit with axe on each step of the main flow. Gate is A11Y_MAX (default 0).
test.describe('Accessibility', { tag: '@a11y' }, () => {

  test('inventory, cart and checkout pages have no WCAG A/AA violations', async ({ inventoryPage, cartPage, checkoutPage, page }, testInfo) => {
    await inventoryPage.navigate('/inventory.html');
    await inventoryPage.waitForInventoryToLoad();
    await auditAccessibility(page, testInfo, 'inventory');

    await inventoryPage.addItemToCart(items.bikeLight);
    await inventoryPage.openCart();
    await cartPage.checkItemInCart(items.bikeLight);
    await auditAccessibility(page, testInfo, 'cart');

    await cartPage.proceedToCheckout();
    await checkoutPage.firstNameField.waitFor();
    await auditAccessibility(page, testInfo, 'checkout');
  });

});
