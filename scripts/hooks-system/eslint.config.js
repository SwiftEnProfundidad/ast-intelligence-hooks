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
    }
];
