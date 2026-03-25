import { test, expect } from '@playwright/test';
import { Locator, Page } from '@playwright/test';
import { BasePage } from './base';

export class SauceDemo extends BasePage {
  readonly loginButton: Locator;
  readonly ErrorMessageElement: Locator;
  readonly SauceLabsBikeLightToCartAddToCartButton: Locator;
  readonly shoppingCartButton: Locator;
  readonly CheckoutButton: Locator;
  readonly firstNameField: Locator;
  readonly lastNameField: Locator;
  readonly zipCodeField: Locator;
  readonly FinishButton: Locator;
  readonly continueButton: Locator;
  readonly sortButton: Locator;
  
    // Map selectors
  constructor(page: Page) {
    super(page);
    //Locators
    this.loginButton = page.locator('[data-test="login-button"]');
    this.ErrorMessageElement = page.getByText('Epic sadface: Sorry, this user has been locked out.');
    this.SauceLabsBikeLightToCartAddToCartButton = page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]');
    this.shoppingCartButton = page.locator('[data-test="shopping-cart-link"]');
    this.CheckoutButton = page.locator('[data-test="checkout"]');
    this.firstNameField = page.locator('[data-test="firstName"]');
    this.lastNameField = page.locator('[data-test="lastName"]');
    this.zipCodeField = page.locator('[data-test="postalCode"]');
    this.FinishButton = page.locator('[data-test="finish"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.sortButton = page.locator('[data-test="product-sort-container"]');
  }

  // Functions
  async signIn(username: string, password:string) {
    await this.page.getByPlaceholder('Username').fill(username);
    await this.page.getByPlaceholder('Password').fill(password);
  }

  async clickLoginButton(){
    await this.loginButton.click();
  }
  

  async checkErrorMessage(){
        await expect(this.ErrorMessageElement).toBeVisible();
  }

  async addSauceLabsBikeLightToCart(){
        await this.SauceLabsBikeLightToCartAddToCartButton.click();
  }

  async openShoppingCart(){
        await this.shoppingCartButton.click();
  }

  async checkShoppingCartItem(itemName:string){
    await expect(this.page.locator('[data-test="inventory-item-name"]')).toContainText(itemName)
  }

  async clickCheckoutButton(){
    await this.CheckoutButton.click();
  }

  async fillCheckoutData(firstName:string, lastName:string, zipCode: string){
    await this.firstNameField.fill(firstName);
    await this.lastNameField.fill(lastName);
    await this.zipCodeField.fill(zipCode);

    await this.continueButton.click();
  }

  async clickFinishButton(){
    await this.FinishButton.click();
  }

  async checkOrderSuccess(){
    await expect(this.page.locator('[data-test="complete-header"]')).toContainText('Thank you for your order!')
  }

  async filterByPriceLowToHigh() {
    // .selectOption() command interacts with type <select> elements
  await this.page.locator('[data-test="product-sort-container"]').selectOption('lohi');
}

  async getInventoryPrices() {
  // Get text from all prices
  const priceStrings = await this.page.locator('.inventory_item_price').allTextContents();
  
  // Convert string array in numbers
  return priceStrings.map(priceStrings => {
    return parseFloat(priceStrings.replace('$', ''));
  });
}

}