module.exports = {
    bail: true,
    testEnvironment: 'node',
    // jest solo ejecuta suites spec; los archivos *.test.ts usan node:test y
    // se ejecutan mediante scripts tsx --test.
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
    coverageThreshold: {
        global: {
            statements: 0,
            branches: 0,
            functions: 0,
            lines: 0
        },
        './core/gate/conditionMatches.ts': {
            statements: 60,
            branches: 40,
            functions: 70,
            lines: 60
        },
        './core/gate/evaluateGate.ts': {
            statements: 100,
            branches: 65,
            functions: 100,
            lines: 100
        },
        './core/gate/evaluateRules.ts': {
            statements: 100,
            branches: 65,
            functions: 100,
            lines: 100
        },
        './core/rules/mergeRuleSets.ts': {
            statements: 85,
            branches: 80,
            functions: 100,
            lines: 85
        },
        './integrations/git/evaluateStagedIOS.ts': {
            statements: 85,
            branches: 55,
            functions: 100,
            lines: 85
        }
    },
    coverageDirectory: '.coverage',
    reporters: ['default'],
    setupFilesAfterEnv: []
};
