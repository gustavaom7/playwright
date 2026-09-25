import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';

/**
 * Accessibility violations tolerated per audited page. The baseline measured on SauceDemo is
 * zero WCAG 2.x A/AA violations, so the default gate is 0. Raise it with A11Y_MAX to keep the
 * audit as a report while the team decides what to fix (the JSON attachment is always saved).
 */
const A11Y_MAX = Number(process.env.A11Y_MAX ?? 0);

export async function auditAccessibility(page: Page, testInfo: TestInfo, label: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Full detail (nodes, help URLs) goes to the report, so a failure is actionable
  await testInfo.attach(`a11y-${label}.json`, {
    body: JSON.stringify(violations, null, 2),
    contentType: 'application/json',
  });

  const summary = violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} nodes)`).join('; ');
  expect(violations.length, `Accessibility violations on ${label}: ${summary || 'none'}`).toBeLessThanOrEqual(A11Y_MAX);
}
