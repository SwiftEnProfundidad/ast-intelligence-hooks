module.exports = {
    bail: true,
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.spec.js'],
    collectCoverage: true,
    collectCoverageFrom: ['application/services/notification/**/*.js'],
    coverageDirectory: '.coverage',
    reporters: ['default'],
    setupFilesAfterEnv: []
};
