# Testing Guide - ast-intelligence-hooks

## Table of Contents

1. [Test Structure](#test-structure)
2. [Running Tests](#running-tests)
3. [Coverage](#coverage)
4. [Writing New Tests](#writing-new-tests)
5. [Integration Tests](#integration-tests)
6. [E2E Tests](#e2e-tests)

---

## Test Structure

```
ast-intelligence-hooks/
├── __tests__/              # Integration tests
│   ├── e2e/
│   │   └── fullWorkflow.spec.js
│   └── integration.test.js
├── application/__tests__/   # Application tests
├── bin/__tests__/          # CLI tests
├── domain/__tests__/       # Domain tests
├── infrastructure/
│   ├── ast/
│   │   ├── android/__tests__/
│   │   └── backend/__tests__/
│   └── mcp/__tests__/
└── tests/                  # Additional tests
    ├── guard-system.e2e.sh
    └── guard-system.integration.spec.js
```

---

## Running Tests

### All Tests

```bash
npm test
```

### Tests in Watch Mode

```bash
npm test -- --watch
```

### Tests with Coverage

```bash
npm test -- --coverage
```

### Specific Tests

```bash
# Tests from a specific file
npm test -- application/__tests__/

# Tests with pattern
npm test -- --testNamePattern="analyze"

# Integration tests
npm test -- __tests__/integration.test.js
```

### Tests in Verbose Mode

```bash
npm test -- --verbose
```

---

## Coverage

### View Coverage

```bash
npm test -- --coverage
```

This generates a report in `coverage/` with:
- `coverage/lcov-report/index.html` - Visual HTML report
- `coverage/coverage-final.json` - JSON data for CI/CD

### Coverage Goals

- **General goal**: >80%
- **Critical logic**: >95%
  - Domain entities
  - Business rules
  - Use cases
  - Core analyzers

### Verify Coverage

```bash
# View HTML report
open coverage/lcov-report/index.html

# View in terminal
npm test -- --coverage --coverageReporters=text
```

---

## Writing New Tests

### Test Structure

```javascript
describe('FeatureName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### AAA Pattern (Arrange, Act, Assert)

```javascript
it('should analyze TypeScript file', () => {
  // Arrange
  const sourceFile = createMockSourceFile({
    path: 'test.ts',
    content: 'export const test = () => {};'
  });
  const findings = [];
  
  // Act
  analyzeFile(sourceFile, findings);
  
  // Assert
  expect(findings).toHaveLength(0);
});
```

### Mocking

```javascript
// Mock function
const mockFunction = jest.fn();
mockFunction.mockReturnValue('value');

// Mock module
jest.mock('../module', () => ({
  exportedFunction: jest.fn()
}));

// Spy on existing function
const spy = jest.spyOn(object, 'method');
spy.mockReturnValue('mocked');
```

### Example: Use Case Test

```javascript
const { AnalyzeCodebaseUseCase } = require('../../application/use-cases/AnalyzeCodebaseUseCase');

describe('AnalyzeCodebaseUseCase', () => {
  let useCase;
  let mockRepository;
  let mockAnalyzer;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      load: jest.fn()
    };
    
    mockAnalyzer = {
      analyze: jest.fn().mockResolvedValue([])
    };
    
    useCase = new AnalyzeCodebaseUseCase(mockRepository, mockAnalyzer);
  });

  it('should analyze codebase and return results', async () => {
    // Arrange
    const files = ['src/**/*.ts'];
    
    // Act
    const result = await useCase.execute(files);
    
    // Assert
    expect(mockAnalyzer.analyze).toHaveBeenCalledWith(files);
    expect(result).toBeDefined();
  });
});
```

---

## Integration Tests

Integration tests verify that multiple components work together.

### Location

- `__tests__/integration.test.js` - General integration tests
- `tests/guard-system.integration.spec.js` - Guard system tests

### Example

```javascript
describe('Integration: AST Analysis Pipeline', () => {
  it('should analyze staged files and generate report', async () => {
    // Setup
    const { runASTIntelligence } = require('../infrastructure/ast/ast-intelligence');
    const testFiles = ['src/test.ts'];
    
    // Execute
    const result = await runASTIntelligence({
      files: testFiles,
      platforms: ['backend']
    });
    
    // Verify
    expect(result).toBeDefined();
    expect(result.getFindings).toBeDefined();
  });
});
```

---

## E2E Tests

End-to-end tests verify complete flows from the user perspective.

### Location

- `__tests__/e2e/fullWorkflow.spec.js` - Full workflow
- `tests/guard-system.e2e.sh` - E2E tests in bash

### Example

```javascript
describe('E2E: Full Workflow', () => {
  it('should complete full analysis workflow', async () => {
    // 1. Setup
    const { execSync } = require('child_process');
    execSync('git init');
    execSync('echo "test" > test.ts');
    execSync('git add test.ts');
    
    // 2. Execute
    const result = execSync('npm run audit', { encoding: 'utf8' });
    
    // 3. Verify
    expect(result).toContain('Analysis complete');
  });
});
```

---

## Best Practices

### 1. Independent Tests

```javascript
// ❌ Bad: Tests depend on order
let counter = 0;
it('should increment', () => {
  counter++;
  expect(counter).toBe(1);
});
it('should increment again', () => {
  counter++;
  expect(counter).toBe(2);
});

// ✅ Good: Independent tests
it('should increment', () => {
  const counter = 0;
  const result = increment(counter);
  expect(result).toBe(1);
});
```

### 2. Descriptive Names

```javascript
// ❌ Bad
it('test1', () => {});

// ✅ Good
it('should detect cross-feature imports in Android', () => {});
```

### 3. Single Main Assertion

```javascript
// ❌ Bad: Multiple assertions in one test
it('should validate everything', () => {
  expect(validateA()).toBe(true);
  expect(validateB()).toBe(true);
  expect(validateC()).toBe(true);
});

// ✅ Good: One test per concept
it('should validate A', () => {
  expect(validateA()).toBe(true);
});
it('should validate B', () => {
  expect(validateB()).toBe(true);
});
```

### 4. Setup and Cleanup

```javascript
describe('Feature', () => {
  let tempDir;
  
  beforeEach(() => {
    tempDir = createTempDir();
  });
  
  afterEach(() => {
    cleanupTempDir(tempDir);
  });
  
  // Tests...
});
```

### 5. Test Behavior, Not Implementation

```javascript
// ❌ Bad: Tests implementation
it('should call analyze() method', () => {
  const spy = jest.spyOn(analyzer, 'analyze');
  useCase.execute();
  expect(spy).toHaveBeenCalled();
});

// ✅ Good: Tests behavior
it('should return analysis results', async () => {
  const result = await useCase.execute();
  expect(result.getFindings()).toBeDefined();
});
```

---

## CI/CD Integration

Tests run automatically in CI/CD:

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: npm test -- --coverage
```

### Coverage in CI

```yaml
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

---

## Troubleshooting

### Intermittently Failing Tests

- Verify there are no global state dependencies
- Use `jest.clearAllMocks()` in `beforeEach`
- Verify tests are independent

### Slow Tests

- Use mocks instead of real implementations when possible
- Run tests in parallel (default in Jest)
- Use `--maxWorkers` to control parallelism

### Debugging Tests

```bash
# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Or use --debug
npm test -- --debug
```

---

## References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [Clean Code Testing](https://cleancoders.com/episode/clean-code-episode-11)

---

**Last updated**: 2025-01-13  
**Version**: 5.3.0
