import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './base';
import { slugifyItemName } from './InventoryPage';

export class CartPage extends BasePage {
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.itemNames = page.locator('[data-test="inventory-item-name"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  async checkItemInCart(itemName: string) {
    await expect(this.itemNames).toContainText(itemName);
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }

  async removeItemFromCart(itemName: string) {
    await this.page.locator(`[data-test="remove-${slugifyItemName(itemName)}"]`).click();
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
  }
}
