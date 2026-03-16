import { test as setup } from '@playwright/test';
import fs from 'fs';

const authFile = 'playwright/.auth/user.json';

if (!fs.existsSync('playwright/.auth/')) {
    fs.mkdirSync('playwright/.auth/', { recursive: true });
}

setup('authenticate', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await page.getByPlaceholder('Username').fill('standard_user');
  await page.getByPlaceholder('Password').fill('secret_sauce');
  await page.getByRole('button', { name: 'Login' }).click();

  // Await page
  await page.waitForURL('https://www.saucedemo.com/inventory.html');

  // Save Cookies and Storage
  await page.context().storageState({ path: authFile });
});