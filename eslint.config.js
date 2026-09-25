const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');
const playwright = require('eslint-plugin-playwright');

module.exports = [
  {
    ignores: ['playwright-report/**', 'test-results/**', 'node_modules/**'],
  },
  {
    files: ['eslint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: js.configs.recommended.rules,
  },
  {
    // k6 scripts run in k6's own JS runtime (ES modules, __ENV, open), not in Node
    files: ['perf/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: { __ENV: 'readonly', open: 'readonly' },
    },
    rules: js.configs.recommended.rules,
  },
  js.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: config.files ?? ['**/*.ts'],
  })),
  {
    files: ['**/*.ts'],
    rules: {
      // TypeScript already checks this; avoids false positives on TS-only globals.
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Our page-object assertion helpers (checkErrorMessage, checkItemInCart, ...)
      // call expect() internally, so the rule can't see it without this pattern.
      'playwright/expect-expect': ['warn', { assertFunctionPatterns: ['^check'] }],
    },
  },
];
