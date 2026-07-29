import { Locator, Page } from '@playwright/test';
import { BasePage } from './base';

function slugifyItemName(itemName: string): string {
  return itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export class InventoryPage extends BasePage {
  readonly sortDropdown: Locator;
  readonly cartIcon: Locator;
  readonly burgerMenuButton: Locator;
  readonly logoutSidebarLink: Locator;
  readonly productImages: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.cartIcon = page.locator('[data-test="shopping-cart-link"]');
    this.burgerMenuButton = page.locator('#react-burger-menu-btn');
    this.logoutSidebarLink = page.locator('#logout_sidebar_link');
    this.productImages = page.locator('.inventory_item_img img');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
  }

  async addItemToCart(itemName: string) {
    await this.page.locator(`[data-test="add-to-cart-${slugifyItemName(itemName)}"]`).click();
  }

  async removeItemFromCart(itemName: string) {
    await this.page.locator(`[data-test="remove-${slugifyItemName(itemName)}"]`).click();
  }

  async openCart() {
    await this.cartIcon.click();
  }

  async filterByPriceLowToHigh() {
    // .selectOption() interacts with type <select> elements
    await this.sortDropdown.selectOption('lohi');
  }

  async getInventoryPrices(): Promise<number[]> {
    const priceStrings = await this.page.locator('.inventory_item_price').allTextContents();
    return priceStrings.map(price => parseFloat(price.replace('$', '')));
  }

  async getProductImageSources(): Promise<(string | null)[]> {
    return this.productImages.evaluateAll(imgs => imgs.map(img => img.getAttribute('src')));
  }

  async openBurgerMenu() {
    await this.burgerMenuButton.click();
  }

  async logout() {
    await this.openBurgerMenu();
    await this.logoutSidebarLink.click();
  }
}
