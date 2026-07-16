import { Locator, Page } from '@playwright/test';
import { BasePage } from './base';

function toAddToCartTestId(itemName: string): string {
  const slug = itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `add-to-cart-${slug}`;
}

export class InventoryPage extends BasePage {
  readonly sortDropdown: Locator;
  readonly cartIcon: Locator;
  readonly burgerMenuButton: Locator;
  readonly logoutSidebarLink: Locator;

  constructor(page: Page) {
    super(page);
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.cartIcon = page.locator('[data-test="shopping-cart-link"]');
    this.burgerMenuButton = page.locator('#react-burger-menu-btn');
    this.logoutSidebarLink = page.locator('#logout_sidebar_link');
  }

  async addItemToCart(itemName: string) {
    await this.page.locator(`[data-test="${toAddToCartTestId(itemName)}"]`).click();
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

  async openBurgerMenu() {
    await this.burgerMenuButton.click();
  }

  async logout() {
    await this.openBurgerMenu();
    await this.logoutSidebarLink.click();
  }
}
