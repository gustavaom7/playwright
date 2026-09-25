import { test, expect } from '../../fixtures/pages.fixture';

// Runs in the "session" projects, after every other authenticated project has finished:
// logout is the only scenario that ends a session, so it must never race with them.
test('logout returns the user to the login page', { tag: '@smoke' }, async ({ page, inventoryPage, loginPage }) => {
  await inventoryPage.navigate('/inventory.html');

  await inventoryPage.logout();

  await loginPage.checkLoginButtonVisible();
  await expect(page).toHaveURL('/');
});
