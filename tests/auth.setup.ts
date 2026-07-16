import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import { users } from '../fixtures/test-data';

const authFile = 'playwright/.auth/user.json';

if (!fs.existsSync('playwright/.auth/')) {
    fs.mkdirSync('playwright/.auth/', { recursive: true });
}

setup('authenticate', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Username').fill(users.standard.username);
  await page.getByPlaceholder('Password').fill(users.standard.password);
  await page.getByRole('button', { name: 'Login' }).click();

  // Confirm login actually succeeded before persisting storage state
  await expect(page).toHaveURL('/inventory.html');

  // Save Cookies and Storage
  await page.context().storageState({ path: authFile });
});