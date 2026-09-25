import { test, expect } from '../../fixtures/pages.fixture';
import { items } from '../../fixtures/test-data';
import type { InventoryPage } from '../../pages/InventoryPage';

// Each case reads one column of the listing and knows how to order it, so the test body has no branching
function sortCase<T>(
  title: string,
  option: 'az' | 'za' | 'lohi' | 'hilo',
  read: (page: InventoryPage) => Promise<T[]>,
  compare: (a: T, b: T) => number,
  direction: 1 | -1,
) {
  const check = async (page: InventoryPage) => {
    const shown = await read(page);
    // An independent, sorted copy is the template the UI order must match
    const expected = [...shown].sort((a, b) => direction * compare(a, b));
    expect(shown).toEqual(expected);
  };
  return { title, option, check };
}
const byName = (a: string, b: string) => a.localeCompare(b);
const byPrice = (a: number, b: number) => a - b;
const names = (page: InventoryPage) => page.getInventoryNames();
const prices = (page: InventoryPage) => page.getInventoryPrices();

const sortCases = [
  sortCase('name A-Z', 'az', names, byName, 1),
  sortCase('name Z-A', 'za', names, byName, -1),
  sortCase('price low to high', 'lohi', prices, byPrice, 1),
  sortCase('price high to low', 'hilo', prices, byPrice, -1),
];

// Runs in the "auth" projects: starts logged in as standard_user via the saved storageState.
test.describe('Catalog', () => {

  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.navigate('/inventory.html');
  });

  for (const { title, option, check } of sortCases) {
    test(`items can be sorted by ${title}`, async ({ inventoryPage }) => {
      await inventoryPage.sortBy(option);

      await check(inventoryPage);
    });
  }

  test('item detail page matches the listing and can add to cart', async ({ inventoryPage, itemDetailPage }) => {
    // Capture the listing data before navigating away
    const listingPrices = await inventoryPage.getInventoryPrices();
    const listingNames = await inventoryPage.getInventoryNames();
    const bikeLightIndex = listingNames.indexOf(items.bikeLight);

    await inventoryPage.openItemDetails(items.bikeLight);

    await expect(itemDetailPage.itemName).toHaveText(items.bikeLight);
    expect(await itemDetailPage.getPrice()).toEqual(listingPrices[bikeLightIndex]);

    await itemDetailPage.addToCart();
    await expect(inventoryPage.cartBadge).toHaveText('1');

    await itemDetailPage.goBackToProducts();
    await expect(inventoryPage.sortDropdown).toBeVisible();
  });

  test('Reset App State clears the cart badge, and All Items returns to the listing', async ({ inventoryPage }) => {
    await inventoryPage.addItemToCart(items.bikeLight);
    await expect(inventoryPage.cartBadge).toHaveText('1');

    await inventoryPage.openBurgerMenu();
    await inventoryPage.resetAppState();
    await expect(inventoryPage.cartBadge).toBeHidden();

    // Navigate away, then use the burger menu's "All Items" link to come back
    await inventoryPage.openItemDetails(items.backpack);
    await inventoryPage.openBurgerMenu();
    await inventoryPage.goToAllItems();
    await expect(inventoryPage.sortDropdown).toBeVisible();
  });

  test('About link and footer social links point to the correct destinations', async ({ inventoryPage }) => {
    await inventoryPage.openBurgerMenu();
    await expect(inventoryPage.aboutSidebarLink).toHaveAttribute('href', 'https://saucelabs.com/');

    // Checked via href, not by navigating: these open in a new tab outside our control
    await expect(inventoryPage.xLink).toHaveAttribute('href', 'https://x.com/saucelabs');
    await expect(inventoryPage.facebookLink).toHaveAttribute('href', 'https://www.facebook.com/saucelabs');
    await expect(inventoryPage.linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/company/sauce-labs/');
  });

});
