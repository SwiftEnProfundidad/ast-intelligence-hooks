
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';
import security from 'eslint-plugin-security';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'test/**',
      '*.js'
    ]
  },
  {
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: true,
        sourceType: 'module',
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'sonarjs': sonarjs,
      'security': security
    },
    rules: {
      'complexity': ['error', 15],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 4],
      'max-params': ['warn', 4],

      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-duplicated-branches': 'error',

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],

      'security/detect-unsafe-regex': 'error',
      'security/detect-eval-with-expression': 'error',

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all']
    }
  }
];
