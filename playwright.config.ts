import { defineConfig, devices } from '@playwright/test';

const AUTH_FILE = 'playwright/.auth/user.json';

/**
 * Tag filter, applied PER PROJECT. The CLI `--grep` does not apply to dependency projects,
 * so asking for a tag would still drag the whole suite along. Use env vars instead:
 *   TAG=@smoke npx playwright test          only tests tagged @smoke
 *   SEM_TAG=@slow npx playwright test       everything except @slow
 */
const byTag = {
  ...(process.env.TAG ? { grep: new RegExp(process.env.TAG) } : {}),
  ...(process.env.SEM_TAG ? { grepInvert: new RegExp(process.env.SEM_TAG) } : {}),
};

const desktopBrowsers = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
] as const;

/**
 * Per desktop browser, one project per nature of scenario:
 *   <browser>-public   anonymous scenarios (login, seeded-user bugs); no session
 *   <browser>-auth     reuse the saved standard_user session, run in parallel
 *   <browser>-session  logout, which ends a session, so it runs after -auth has finished
 */
const desktopProjects = desktopBrowsers.flatMap(({ name, device }) => [
  {
    name: `${name}-public`,
    testMatch: '**/public/**/*.spec.ts',
    use: { ...device, storageState: { cookies: [], origins: [] } },
    ...byTag,
  },
  {
    name: `${name}-auth`,
    testMatch: '**/authenticated/**/*.spec.ts',
    dependencies: ['setup'],
    use: { ...device, storageState: AUTH_FILE },
    ...byTag,
  },
  {
    name: `${name}-session`,
    testMatch: '**/session/**/*.spec.ts',
    dependencies: [`${name}-auth`],
    use: { ...device, storageState: AUTH_FILE },
    ...byTag,
  },
]);

/**
 * Mobile is a project of its own (not test.use overrides inside a spec): Firefox does not
 * support isMobile, so mobile runs on real Chromium (Pixel 5) and WebKit (iPhone 12) engines.
 */
const mobileProjects = [
  { name: 'mobile-chrome', device: devices['Pixel 5'] },
  { name: 'mobile-safari', device: devices['iPhone 12'] },
].map(({ name, device }) => ({
  name,
  testMatch: '**/mobile/**/*.spec.ts',
  dependencies: ['setup'],
  use: { ...device, storageState: AUTH_FILE },
  ...byTag,
}));

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // CI: inline annotations on the PR plus the HTML report that gets published to GitHub Pages
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: 'on-first-retry',
  },

  projects: [
    // Logs in once and saves the session that every "-auth", "-session" and "mobile-*" project reuses
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    ...desktopProjects,
    ...mobileProjects,
  ],
});
