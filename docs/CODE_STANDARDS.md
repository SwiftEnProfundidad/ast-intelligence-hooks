# Code Standards - ast-intelligence-hooks

## Table of Contents

1. [Code Style](#code-style)
2. [ESLint Configuration](#eslint-configuration)
3. [TypeScript](#typescript)
4. [Code Conventions](#code-conventions)
5. [Pre-commit Hooks](#pre-commit-hooks)

---

## Code Style

### JavaScript/TypeScript

The project follows these conventions:

- **Indentation**: 2 spaces
- **Quotes**: Single quotes (`'`) for strings
- **Semicolons**: Always use semicolons
- **Trailing commas**: Use in multi-line objects and arrays
- **Max line length**: 100 characters (soft, preferably 80)

### Example

```javascript
const example = {
  name: 'test',
  value: 42,
  items: ['a', 'b', 'c'],
};

function doSomething(param1, param2) {
  if (param1 > param2) {
    return param1;
  }
  return param2;
}
```

---

## ESLint Configuration

### Current Configuration

The project uses ESLint 9+ with flat configuration.

**File**: `eslint.config.js`

### Main Rules

- **Error**: Problems that break functionality
- **Warn**: Style issues and best practices
- **Off**: Disabled rules (with justification)

### Run ESLint

```bash
# Full linter
npm run lint

# Hooks only
npm run lint:hooks

# Auto fix
npm run lint -- --fix
```

### Add New Rules

Edit `eslint.config.js`:

```javascript
rules: {
  'new-rule-name': 'error',
  'another-rule': 'warn',
}
```

---

## TypeScript

### Configuration

**File**: `tsconfig.json`

### Enabled Features

- **Strict mode**: Enabled
- **No implicit any**: Enabled
- **Strict null checks**: Enabled
- **No unused locals**: Enabled
- **No unused parameters**: Enabled

### Type Checking

```bash
# Verify types
npm run typecheck

# Or using tsc directly
npx tsc --noEmit
```

### TypeScript Conventions

- **Interfaces**: For objects and data structures
- **Types**: For unions, intersections, and complex types
- **Enums**: Only when absolutely necessary

```typescript
// ✅ Good: Interface for object
interface User {
  id: string;
  name: string;
}

// ✅ Good: Type for union
type Status = 'active' | 'inactive' | 'pending';

// ❌ Avoid: Enum (prefer union types)
enum Status {
  Active,
  Inactive,
}
```

---

## Code Conventions

### Naming

#### Variables and Functions

- **camelCase** for variables and functions
- Descriptive and self-documenting names
- Avoid abbreviations (except common conventions like `id`, `url`)

```javascript
// ✅ Good
const userName = 'John';
function calculateTotalPrice(items) {}

// ❌ Bad
const un = 'John';
function calc(items) {}
```

#### Classes

- **PascalCase** for classes
- Noun names that describe what it is

```javascript
// ✅ Good
class UserRepository {}
class AuditResult {}

// ❌ Bad
class userRepository {}
class audit {}
```

#### Constants

- **UPPER_SNAKE_CASE** for global constants
- **camelCase** for local constants

```javascript
// ✅ Good
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;

// For local constants
const defaultConfig = { timeout: 5000 };
```

### Files

- **kebab-case** for file names
- Extensions: `.js` for JavaScript, `.ts` for TypeScript

```javascript
// ✅ Good
user-repository.js
audit-result.ts
feature-first-analyzer.js

// ❌ Bad
UserRepository.js
auditResult.ts
FeatureFirstAnalyzer.js
```

### File Structure

```javascript
// 1. External imports
const fs = require('fs');
const path = require('path');

// 2. Internal imports
const { Finding } = require('../domain/entities/Finding');
const { analyzeBackend } = require('../infrastructure/ast/backend');

// 3. Constants
const MAX_SIZE = 1024;

// 4. Helper functions
function helperFunction() {}

// 5. Main class/export
class MainClass {
  constructor() {}
  
  publicMethod() {}
  
  privateMethod() {}
}

// 6. Exports
module.exports = { MainClass };
```

---

## Clean Code Principles

### 1. Single Responsibility

```javascript
// ❌ Bad: Multiple responsibilities
class UserService {
  getUser(id) {}
  saveUser(user) {}
  sendEmail(user) {}
  generateReport() {}
}

// ✅ Good: Single responsibility
class UserRepository {
  getUser(id) {}
  saveUser(user) {}
}

class EmailService {
  sendEmail(user) {}
}

class ReportGenerator {
  generateReport() {}
}
```

### 2. Small Functions

```javascript
// ❌ Bad: Very long function
function processOrder(order) {
  // 50+ lines of code...
}

// ✅ Good: Small focused functions
function processOrder(order) {
  validateOrder(order);
  calculateTotal(order);
  applyDiscount(order);
  saveOrder(order);
  notifyUser(order);
}
```

### 3. Early Returns

```javascript
// ❌ Bad: Nested ifs
function process(data) {
  if (data) {
    if (data.valid) {
      if (data.value) {
        return processValue(data.value);
      }
    }
  }
  return null;
}

// ✅ Good: Early returns
function process(data) {
  if (!data) return null;
  if (!data.valid) return null;
  if (!data.value) return null;
  
  return processValue(data.value);
}
```

### 4. Avoid Magic Numbers

```javascript
// ❌ Bad: Magic numbers
if (user.age > 65) {
  applySeniorDiscount(user);
}

// ✅ Good: Named constants
const SENIOR_AGE_THRESHOLD = 65;
if (user.age > SENIOR_AGE_THRESHOLD) {
  applySeniorDiscount(user);
}
```

### 5. Self-descriptive Names

```javascript
// ❌ Bad: Vague names
function calc(a, b) {
  return a * b * 1.19;
}

// ✅ Good: Descriptive names
function calculateTotalWithTax(price, quantity) {
  const TAX_RATE = 1.19;
  return price * quantity * TAX_RATE;
}
```

---

## Pre-commit Hooks

### Configuration

Pre-commit hooks automatically run:

1. **ESLint**: Code validation
2. **Type checking**: TypeScript type verification
3. **Tests**: Quick execution of relevant tests

### Bypass (Emergencies Only)

```bash
GIT_BYPASS_HOOK=1 git commit -m "emergency fix"
```

⚠️ **Warning**: Only use in real emergencies.

---

## Comments

### When to Comment

- **DON'T comment obvious code**: Code should be self-descriptive
- **DO comment**: Complex logic, design decisions, temporary hacks

```javascript
// ❌ Bad: Unnecessary comment
// Increment the counter
counter++;

// ✅ Good: Self-descriptive code
counter++;

// ✅ Good: Useful comment for complex logic
// We use Floyd-Warshall algorithm to find shortest path
// because we need to consider multiple possible routes
const shortestPath = floydWarshall(graph);
```

### Comment Format

```javascript
// Single line comment

/**
 * JSDoc comment for public functions/classes
 * @param {string} name - User name
 * @returns {boolean} Whether the user is valid
 */
function validateUser(name) {
  // Implementation
}
```

---

## Git Commits

### Commit Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, semicolons, etc.
- `refactor`: Refactoring
- `test`: Tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(ast): add iOS SourceKitten integration

fix(backend): resolve circular dependency detection

docs(readme): update installation instructions

refactor(domain): simplify AuditResult entity
```

---

## References

- [Clean Code by Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Last updated**: 2025-01-13  
**Version**: 5.3.0
