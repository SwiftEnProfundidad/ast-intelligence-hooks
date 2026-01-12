module.exports = {
    bail: true,
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.spec.js', '**/__tests__/**/*.spec.js'],
    transform: {},
    modulePathIgnorePatterns: ['<rootDir>/.ast-intelligence/'],
    collectCoverage: true,
    collectCoverageFrom: ['application/services/notification/**/*.js'],
    coverageDirectory: '.coverage',
    reporters: ['default'],
    setupFilesAfterEnv: []
};
