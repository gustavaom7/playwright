import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './base';

export class CheckoutPage extends BasePage {
  readonly firstNameField: Locator;
  readonly lastNameField: Locator;
  readonly zipCodeField: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;
  readonly completeHeader: Locator;
  readonly errorMessage: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameField = page.locator('[data-test="firstName"]');
    this.lastNameField = page.locator('[data-test="lastName"]');
    this.zipCodeField = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.completeHeader = page.locator('[data-test="complete-header"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
    this.taxLabel = page.locator('[data-test="tax-label"]');
    this.totalLabel = page.locator('[data-test="total-label"]');
  }

  async fillCheckoutInfo(firstName: string, lastName: string, zipCode: string) {
    await this.firstNameField.fill(firstName);
    await this.lastNameField.fill(lastName);
    await this.zipCodeField.fill(zipCode);
    await this.continueButton.click();
  }

  async clickFinishButton() {
    await this.finishButton.click();
  }

  async clickCancelButton() {
    await this.cancelButton.click();
  }

  async getItemTotal(): Promise<number> {
    const text = await this.subtotalLabel.textContent();
    return parseFloat((text ?? '').replace('Item total: $', ''));
  }

  async getTax(): Promise<number> {
    const text = await this.taxLabel.textContent();
    return parseFloat((text ?? '').replace('Tax: $', ''));
  }

  async getTotal(): Promise<number> {
    const text = await this.totalLabel.textContent();
    return parseFloat((text ?? '').replace('Total: $', ''));
  }

  async checkOrderSuccess() {
    await expect(this.completeHeader).toContainText('Thank you for your order!');
  }

  async checkErrorMessage(expectedText: string) {
    await expect(this.errorMessage).toContainText(expectedText);
  }
}
