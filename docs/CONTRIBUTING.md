# Contributing to ast-intelligence-hooks

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)
8. [Code Standards](#code-standards)

---

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

---

## Getting Started

### Prerequisites

- Node.js ≥18.0.0
- npm ≥9.0.0
- Git
- GitHub account

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/ast-intelligence-hooks.git
cd ast-intelligence-hooks
git remote add upstream https://github.com/SwiftEnProfundidad/ast-intelligence-hooks.git
```

---

## Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run typecheck
```

---

## Making Changes

### Branch Strategy

- Create a new branch from `main` for each feature/fix
- Use descriptive branch names:
  - `feat/description` - New features
  - `fix/description` - Bug fixes
  - `docs/description` - Documentation
  - `refactor/description` - Code refactoring
  - `test/description` - Test additions/changes

```bash
# Create and switch to new branch
git checkout -b feat/my-new-feature

# Make your changes...
# Test your changes...

# Commit with descriptive message
git commit -m "feat: add my new feature"
```

---

## Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(installer): add Git repository detection
fix(analyzer): resolve false positive in SOLID checks
docs(readme): update installation instructions
```

---

## Pull Request Process

### Before Submitting

1. **Update your branch:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests:**
   ```bash
   npm test
   npm run lint
   npm run typecheck
   ```

3. **Update documentation:**
   - Update relevant docs if you changed functionality
   - Update CHANGELOG.md if needed

### PR Requirements

- ✅ All tests pass
- ✅ Code follows project standards
- ✅ Documentation updated
- ✅ Commits follow conventional commits format
- ✅ PR description clearly explains changes
- ✅ No merge conflicts with main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No warnings generated
- [ ] Tests pass locally
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.spec.js

# Run with coverage
npm test -- --coverage
```

### Writing Tests

- Write tests for new features
- Ensure tests cover edge cases
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

---

## Code Standards

### General Principles

- Follow Clean Architecture principles
- Apply SOLID principles
- Write self-documenting code (minimal comments)
- Use meaningful variable/function names
- Keep functions small and focused

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow ESLint rules (run `npm run lint`)
- Prefer `const` over `let`
- Use early returns to avoid deep nesting
- Handle errors appropriately

### Documentation

- Update relevant `.md` files
- Keep code examples up to date
- Document breaking changes clearly

---

## Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, a maintainer will merge your PR
4. Thank you for your contribution! 🎉

---

## Questions?

- Open an issue for questions or discussions
- Check existing issues before creating new ones
- Be patient and respectful with maintainers

---

**Thank you for contributing to ast-intelligence-hooks!** 🚀

