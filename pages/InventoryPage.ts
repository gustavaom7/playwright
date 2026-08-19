import { Locator, Page } from '@playwright/test';
import { BasePage } from './base';

export function slugifyItemName(itemName: string): string {
  return itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export class InventoryPage extends BasePage {
  readonly sortDropdown: Locator;
  readonly cartIcon: Locator;
  readonly burgerMenuButton: Locator;
  readonly logoutSidebarLink: Locator;
  readonly allItemsSidebarLink: Locator;
  readonly resetAppStateSidebarLink: Locator;
  readonly aboutSidebarLink: Locator;
  readonly twitterLink: Locator;
  readonly facebookLink: Locator;
  readonly linkedinLink: Locator;
  readonly productImages: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.cartIcon = page.locator('[data-test="shopping-cart-link"]');
    this.burgerMenuButton = page.locator('#react-burger-menu-btn');
    this.logoutSidebarLink = page.locator('#logout_sidebar_link');
    this.allItemsSidebarLink = page.locator('[data-test="inventory-sidebar-link"]');
    this.resetAppStateSidebarLink = page.locator('[data-test="reset-sidebar-link"]');
    this.aboutSidebarLink = page.locator('[data-test="about-sidebar-link"]');
    this.twitterLink = page.locator('[data-test="social-twitter"]');
    this.facebookLink = page.locator('[data-test="social-facebook"]');
    this.linkedinLink = page.locator('[data-test="social-linkedin"]');
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

  async openItemDetails(itemName: string) {
    await this.page.getByText(itemName, { exact: true }).click();
  }

  async filterByPriceLowToHigh() {
    // .selectOption() interacts with type <select> elements
    await this.sortDropdown.selectOption('lohi');
  }

  async filterByNameAZ() {
    await this.sortDropdown.selectOption('az');
  }

  async filterByNameZA() {
    await this.sortDropdown.selectOption('za');
  }

  async getInventoryPrices(): Promise<number[]> {
    const priceStrings = await this.page.locator('.inventory_item_price').allTextContents();
    return priceStrings.map(price => parseFloat(price.replace('$', '')));
  }

  async getInventoryNames(): Promise<string[]> {
    return this.page.locator('.inventory_item_name').allTextContents();
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

  async goToAllItems() {
    await this.allItemsSidebarLink.click();
  }

  async resetAppState() {
    await this.resetAppStateSidebarLink.click();
  }
}
