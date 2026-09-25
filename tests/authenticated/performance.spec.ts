import { test, expect } from '../../fixtures/pages.fixture';
import { BUDGETS } from '../../utils/budgets';

test.describe('Performance', { tag: '@perf' }, () => {

  test('the inventory page loads within its time budget', async ({ page, inventoryPage }, testInfo) => {
    await inventoryPage.navigate('/inventory.html');
    await inventoryPage.waitForInventoryToLoad();

    // Navigation Timing is available in every engine (unlike LCP/FCP entries)
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
        load: Math.round(nav.loadEventEnd),
      };
    });

    // Recorded in the report even when it passes, so drifts are visible before they fail
    await testInfo.attach('navigation-timing.json', {
      body: JSON.stringify({ ...timing, budgets: BUDGETS }, null, 2),
      contentType: 'application/json',
    });

    expect(timing.domContentLoaded).toBeLessThan(BUDGETS.inventoryDomReady);
    expect(timing.load).toBeLessThan(BUDGETS.inventoryFullLoad);
  });

});
