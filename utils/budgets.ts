/**
 * Performance budgets named by INTENT, not by number: two budgets that are equal today may
 * diverge tomorrow. TIMEOUT_FACTOR scales all of them to run against a slower environment
 * without touching the code (e.g. TIMEOUT_FACTOR=2 npx playwright test).
 */
const FACTOR = Number(process.env.TIMEOUT_FACTOR ?? 1);
const ms = (value: number) => Math.round(value * FACTOR);

export const BUDGETS = {
  // Measured locally at ~0.4s; generous on purpose so a slow CI runner does not flake
  inventoryDomReady: ms(3_000),
  inventoryFullLoad: ms(5_000),
} as const;
