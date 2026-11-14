import js from '@eslint/js';
import appBoundaries from './scripts/eslint/app-boundaries.mjs';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'projects/**', 'shared/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { architecture: { rules: { 'app-boundaries': appBoundaries } } },
    rules: { 'architecture/app-boundaries': 'error' },
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
);
