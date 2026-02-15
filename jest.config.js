module.exports = {
    bail: true,
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.spec.ts'],
    transform: {
        '^.+\\.tsx?$': 'babel-jest'
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/legacy/'],
    modulePathIgnorePatterns: ['<rootDir>/.ast-intelligence/'],
    collectCoverage: true,
    collectCoverageFrom: [
        'core/**/*.ts',
        'integrations/**/*.ts',
        '!**/__tests__/**',
        '!**/*.test.ts',
        '!**/*.spec.ts'
    ],
    coverageDirectory: '.coverage',
    reporters: ['default'],
    setupFilesAfterEnv: []
};
