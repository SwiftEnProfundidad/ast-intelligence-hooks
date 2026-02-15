const tseslint = require('typescript-eslint');

module.exports = [
    {
        files: ['**/*.js'],
        ignores: ['node_modules/**', 'dist/**'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'script'
        },
        rules: {
            'no-empty': ['error', { allowEmptyCatch: false }]
        }
    },
    ...tseslint.configs.strict.map((config) => ({
        ...config,
        files: ['**/*.ts'],
        ignores: ['node_modules/**', 'dist/**', '**/__tests__/**', '**/*.test.ts', '**/*.spec.ts'],
    })),
    {
        files: ['**/*.ts'],
        ignores: ['node_modules/**', 'dist/**', '**/__tests__/**', '**/*.test.ts', '**/*.spec.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-empty-function': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
            'no-empty': ['error', { allowEmptyCatch: false }],
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'prefer-const': 'error',
            'no-var': 'error',
            'eqeqeq': ['error', 'always'],
        }
    }
];
