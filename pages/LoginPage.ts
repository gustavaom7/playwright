import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './base';

export class LoginPage extends BasePage {
  readonly usernameField: Locator;
  readonly passwordField: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameField = page.getByPlaceholder('Username');
    this.passwordField = page.getByPlaceholder('Password');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.getByText('Epic sadface: Sorry, this user has been locked out.');
  }

  async signIn(username: string, password: string) {
    await this.usernameField.fill(username);
    await this.passwordField.fill(password);
  }

  async clickLoginButton() {
    await this.loginButton.click();
  }

  async checkErrorMessage() {
    await expect(this.errorMessage).toBeVisible();
  }

  async checkLoginButtonVisible() {
    await expect(this.loginButton).toBeVisible();
  }
}
