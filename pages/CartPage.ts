import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './base';

export class CartPage extends BasePage {
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.itemNames = page.locator('[data-test="inventory-item-name"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
  }

  async checkItemInCart(itemName: string) {
    await expect(this.itemNames).toContainText(itemName);
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}
