import { test, expect } from '../../fixtures/pages.fixture';
import { users } from '../../fixtures/test-data';

// Runs in the "public" projects: no storageState, so every test starts logged out.
test.describe('Login', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate('/');
  });

  test('standard_user signs in and lands on the inventory page', { tag: '@smoke' }, async ({ page, loginPage }) => {
    await loginPage.login(users.standard);

    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('locked_out_user sees the locked-out error message', { tag: '@smoke' }, async ({ loginPage }) => {
    await loginPage.login(users.lockedOut);

    await loginPage.checkErrorMessage('Epic sadface: Sorry, this user has been locked out.');
  });

  const invalidCredentials = [
    { title: 'wrong password', username: users.standard.username, password: 'wrong_password',
      error: 'Epic sadface: Username and password do not match any user in this service' },
    { title: 'unknown username', username: 'not_a_user', password: users.standard.password,
      error: 'Epic sadface: Username and password do not match any user in this service' },
    { title: 'username with different letter case', username: 'STANDARD_USER', password: users.standard.password,
      error: 'Epic sadface: Username and password do not match any user in this service' },
    { title: 'SQL-injection-style username', username: "' OR 1=1 --", password: users.standard.password,
      error: 'Epic sadface: Username and password do not match any user in this service' },
    { title: 'empty username and password', username: '', password: '',
      error: 'Epic sadface: Username is required' },
    { title: 'empty username only', username: '', password: users.standard.password,
      error: 'Epic sadface: Username is required' },
    { title: 'empty password only', username: users.standard.username, password: '',
      error: 'Epic sadface: Password is required' },
  ];

  for (const { title, username, password, error } of invalidCredentials) {
    test(`rejects ${title} with the right error message`, async ({ page, loginPage }) => {
      await loginPage.login({ username, password });

      await loginPage.checkErrorMessage(error);
      await expect(page).not.toHaveURL(/inventory\.html/);
    });
  }

});
