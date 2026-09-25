import { Locator, Page } from '@playwright/test';
import { BasePage } from './base';

export class ItemDetailPage extends BasePage {
  readonly itemName: Locator;
  readonly itemDesc: Locator;
  readonly itemPrice: Locator;
  readonly addToCartButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    // Scoped to the detail container for the same reason as CartPage.itemNames
    const details = page.locator('.inventory_details_container');
    this.itemName = details.locator('[data-test="inventory-item-name"]');
    this.itemDesc = details.locator('[data-test="inventory-item-desc"]');
    this.itemPrice = details.locator('[data-test="inventory-item-price"]');
    this.addToCartButton = page.locator('[data-test="add-to-cart"]');
    this.backButton = page.locator('[data-test="back-to-products"]');
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async getPrice(): Promise<number> {
    const priceText = await this.itemPrice.textContent();
    return parseFloat((priceText ?? '').replace('$', ''));
  }

  async goBackToProducts() {
    await this.backButton.click();
  }
}
