import js from '@eslint/js';
import noUnsanitized from 'eslint-plugin-no-unsanitized';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    plugins: { 'no-unsanitized': noUnsanitized },
    rules: {
      'no-unsanitized/property': 'error',
    },
  },
  {
    files: ['scripts/**/*.js', 'scripts/**/*.mjs', 'e2e/scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
);
