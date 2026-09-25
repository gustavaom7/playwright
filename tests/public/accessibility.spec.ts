import { test, expect } from '../../fixtures/pages.fixture';
import { users } from '../../fixtures/test-data';
import { auditAccessibility } from '../../utils/a11y';

test.describe('Accessibility (logged out)', { tag: '@a11y' }, () => {

  test('the login page and its error state have no WCAG A/AA violations', async ({ page, loginPage }, testInfo) => {
    await loginPage.navigate('/');
    await auditAccessibility(page, testInfo, 'login');

    // The error state renders new content, so it is audited separately
    await loginPage.login({ username: users.standard.username, password: '' });
    await expect(loginPage.errorMessage).toBeVisible();
    await auditAccessibility(page, testInfo, 'login-error');
  });

});
