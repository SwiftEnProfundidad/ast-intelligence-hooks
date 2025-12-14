# Dependencies - ast-intelligence-hooks

## Table of Contents

1. [Summary](#summary)
2. [Runtime Dependencies](#runtime-dependencies)
3. [Development Dependencies](#development-dependencies)
4. [Optional Tools](#optional-tools)
5. [System Requirements](#system-requirements)
6. [Platform Compatibility](#platform-compatibility)
7. [Version Management](#version-management)

---

## Summary

| Type | Count | Minimum Version |
|------|-------|-----------------|
| **Runtime Dependencies** | 2 | - |
| **Dev Dependencies** | 4 | - |
| **Optional** | 2 | - |
| **Node.js** | - | ≥18.0.0 |
| **npm** | - | ≥9.0.0 |

---

## Runtime Dependencies

### glob ^10.0.0

**Description**: Library for searching files using glob patterns.

**Usage in project:**
- File search by platform (`.ts`, `.tsx`, `.swift`, `.kt`)
- Find configuration files
- Directory structure analysis

**Usage location:**
- `infrastructure/ast/android/ast-android.js`
- `infrastructure/ast/ios/ast-ios.js`
- Multiple AST analyzers

**Alternatives considered:**
- `fast-glob`: Faster but requires async/await
- `minimatch`: Only matching, no file search

**Reason for choice:**
- Simple synchronous API
- Widely used and maintained
- Compatible with Node.js 18+

---

### ts-morph ^21.0.0

**Description**: Library for manipulating and analyzing TypeScript/JavaScript code using AST.

**Usage in project:**
- Static analysis of TypeScript/JavaScript code
- Architectural pattern detection (Clean Architecture, DDD)
- Import and dependency validation
- Decorator analysis (NestJS, Next.js)

**Usage location:**
- `infrastructure/ast/ast-intelligence.js`
- `infrastructure/ast/backend/ast-backend.js`
- `infrastructure/ast/frontend/ast-frontend.js`
- `infrastructure/ast/common/ast-common.js`

**Features used:**
- `Project` and `SourceFile` for parsing code
- `SyntaxKind` to identify node types
- `getDescendantsOfKind()` to search for patterns
- `getClassDeclarations()`, `getInterfaceDeclarations()`, etc.

**Alternatives considered:**
- `@typescript-eslint/parser`: Only parsing, no manipulation
- `babel-parser`: Doesn't support all TypeScript features
- `recast`: More complex for static analysis

**Reason for choice:**
- Rich and expressive API
- Full TypeScript support
- Easy AST navigation
- Active maintenance

**Important note:**
This is the most critical dependency in the project. Without it, AST analysis for Backend and Frontend would not work.

---

## Development Dependencies

### eslint ^9.12.0

**Description**: Linter for JavaScript/TypeScript that detects code and style problems.

**Usage in project:**
- Code validation in `application/`, `bin/`
- Prevention of common errors
- Maintenance of code standards

**Configuration:**
- `eslint.config.js` in project root
- Custom rules for Clean Architecture
- Integrated with npm scripts (`npm run lint`)

**Related scripts:**
```bash
npm run lint          # Full lint
npm run lint:hooks    # Lint hooks only
```

---

### jest ^30.2.0

**Description**: Testing framework for JavaScript.

**Usage in project:**
- Unit tests in `__tests__/` and `*.spec.js`
- Integration tests in `tests/`
- E2E tests in `__tests__/e2e/`

**Configuration:**
- `jest.config.js` in root
- Coverage configured
- Tests in `--runInBand` mode to avoid conflicts

**Related scripts:**
```bash
npm test              # Run all tests
```

**Coverage goal:** >80% (95% for critical logic)

---

### typescript ^5.3.0

**Description**: Typed superset of JavaScript.

**Usage in project:**
- Type checking of `.ts` files
- Type definitions for TypeScript hooks
- Type validation without compilation

**Configuration:**
- `tsconfig.json` in root
- Type checking only (no compilation)
- Strict mode enabled

**Related scripts:**
```bash
npm run typecheck     # Verify types
npm run build:ts      # Type check (alias)
```

**Note:**
The project is mainly JavaScript, but some hooks use TypeScript for type safety.

---

### @types/node ^20.10.0

**Description**: Type definitions for Node.js.

**Usage in project:**
- Type definitions for Node.js APIs
- IntelliSense in TypeScript files
- Type safety when using native APIs (fs, path, etc.)

---

## Optional Tools

### SourceKitten (iOS)

**Description**: Command-line tool to interact with SourceKit (Swift parser).

**Usage:**
- Advanced AST analysis of Swift code
- SwiftUI-specific pattern detection
- iOS architecture analysis

**Installation:**
```bash
# macOS
brew install sourcekitten

# or via Swift Package Manager
swift package install sourcekitten
```

**Usage location:**
- `infrastructure/ast/ios/ast-ios.js`
- Only used if available on the system
- Fallback to regex-based analysis if not available

**Note:**
The project works without SourceKitten, but with reduced functionality for advanced iOS analysis.

---

### Detekt (Android)

**Description**: Static code analyzer for Kotlin.

**Usage:**
- Static analysis of Kotlin code
- Code smell detection
- Style rule validation

**Installation:**
```bash
# via Homebrew (macOS)
brew install detekt

# or download from GitHub Releases
# https://github.com/detekt/detekt/releases
```

**Usage location:**
- `infrastructure/ast/android/ast-android.js`
- `infrastructure/ast/android/detekt-runner.js`
- Only used if available
- Fallback to regex-based analysis if not available

**Note:**
The project works without Detekt, but with reduced functionality for advanced Android analysis.

---

### GitHub CLI (`gh`)

**Description**: Command-line tool for GitHub.

**Usage:**
- Automatically create Pull Requests
- Merge PRs from command line
- Clean up merged remote branches

**Installation:**
```bash
# macOS
brew install gh

# Linux (Ubuntu/Debian)
sudo apt install gh

# Windows
winget install GitHub.cli
```

**Usage location:**
- `infrastructure/mcp/ast-intelligence-automation.js`
- Only used by Git Flow MCP server
- Not critical for basic functionality

**Note:**
Required only if using `auto_complete_gitflow` with automatic PR creation.

---

## System Requirements

### Node.js ≥18.0.0

**Reason:**
- Node.js 18 introduced modern ES module APIs
- Better native async/await support
- Improved performance
- Native `fetch` support (though not used in this project)

**Verification:**
```bash
node --version  # Must be >= 18.0.0
```

**Note:** Node.js 20 LTS is recommended for better support and stability.

---

### npm ≥9.0.0

**Reason:**
- Better dependency resolution
- Improved workspace support
- Better peer dependency handling

**Verification:**
```bash
npm --version  # Must be >= 9.0.0
```

**Alternative:** You can use `yarn` or `pnpm`, but it's not officially tested.

---

### Git

**Description**: Version control system.

**Usage:**
- Pre-commit hooks
- Staged file analysis
- Git Flow automation
- Repository operations

**Verification:**
```bash
git --version
```

**Note:** Git is critical for hooks functionality. Without Git, the main functionality doesn't work.

---

## Platform Compatibility

### macOS

**Status:** ✅ Fully supported

**Notes:**
- All functionalities available
- SourceKitten works natively
- macOS notifications supported
- Recommended for development

---

### Linux

**Status:** ⚠️ Partially supported

**Limitations:**
- Some bash scripts may require adjustments
- macOS notifications not available (fallback to logs)
- SourceKitten requires additional configuration

**Tested distributions:**
- Ubuntu 20.04+
- Debian 11+
- Fedora 35+

**Note:** It's recommended to use Node.js 18+ installed via `nvm` or `fnm`.

---

### Windows

**Status:** ❌ Not officially tested

**Requirements:**
- Windows 10/11
- WSL2 (recommended) or Git Bash
- Node.js installed natively or in WSL

**Known limitations:**
- Bash scripts require WSL or Git Bash
- Paths may need normalization
- Notifications not available

**Recommendation:** Use WSL2 for better compatibility.

---

## Version Management

### Semver

The project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Incompatible API changes
- **MINOR**: New backward-compatible features
- **PATCH**: Backward-compatible bug fixes

### Update Policy

**Runtime Dependencies:**
- Updated only in MINOR or MAJOR releases
- Thoroughly tested before updating
- Backward compatibility maintained when possible

**Dev Dependencies:**
- Can be updated in any release
- Updated regularly to maintain security

**Optional:**
- Don't affect project versioning
- Minimum recommended versions documented

### Update Dependencies

```bash
# Check for outdated dependencies
npm outdated

# Update minor and patch dependencies
npm update

# Update major dependencies (requires testing)
npm install glob@latest ts-morph@latest

# Verify everything works after updating
npm test
npm run lint
npm run typecheck
```

### Security Audit

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Fix with breaking changes (requires testing)
npm audit fix --force
```

---

## Dependencies Diagram

```mermaid
graph TD
    Root[ast-intelligence-hooks] --> Runtime[Runtime Dependencies]
    Root --> Dev[Dev Dependencies]
    Root --> Optional[Optional]
    
    Runtime --> Glob[glob ^10.0.0]
    Runtime --> TSMorph[ts-morph ^21.0.0]
    
    Dev --> ESLint[eslint ^9.12.0]
    Dev --> Jest[jest ^30.2.0]
    Dev --> TS[typescript ^5.3.0]
    Dev --> TypesNode[@types/node ^20.10.0]
    
    Optional --> SourceKitten[SourceKitten<br/>iOS Analysis]
    Optional --> Detekt[Detekt<br/>Android Analysis]
    Optional --> GitHubCLI[GitHub CLI<br/>Git Flow]
    
    TSMorph --> TypeScriptAST[TypeScript AST]
    Glob --> FileSearch[File Search]
    
    style Runtime fill:#90EE90
    style Dev fill:#FFE4B5
    style Optional fill:#D3D3D3
```

---

## Compatibility Matrix

| Dependency | Node 18 | Node 20 | Node 22 | npm 9 | npm 10 |
|------------|---------|---------|---------|-------|--------|
| glob ^10.0.0 | ✅ | ✅ | ✅ | ✅ | ✅ |
| ts-morph ^21.0.0 | ✅ | ✅ | ✅ | ✅ | ✅ |
| eslint ^9.12.0 | ✅ | ✅ | ✅ | ✅ | ✅ |
| jest ^30.2.0 | ✅ | ✅ | ✅ | ✅ | ✅ |
| typescript ^5.3.0 | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Dependency Problem Resolution

### Error: "Cannot find module"

**Cause:** Dependencies not installed.

**Solution:**
```bash
npm install
```

---

### Error: "Module version mismatch"

**Cause:** Incompatible Node.js version.

**Solution:**
```bash
# Verify Node.js version
node --version  # Must be >= 18.0.0

# Use nvm to change version
nvm install 20
nvm use 20
```

---

### Error: "Peer dependency warnings"

**Cause:** Incompatible peer dependency versions.

**Solution:**
```bash
# Install peer dependencies explicitly
npm install --save-peer <package>

# Or ignore warnings if they don't affect functionality
npm install --legacy-peer-deps
```

---

### ts-morph cannot find types

**Cause:** TypeScript not installed or incorrectly configured.

**Solution:**
```bash
# Install TypeScript
npm install --save-dev typescript

# Verify tsconfig.json exists
ls tsconfig.json

# Run type check
npm run typecheck
```

---

## References

- [Node.js Releases](https://nodejs.org/en/about/releases/)
- [npm Documentation](https://docs.npmjs.com/)
- [ts-morph Documentation](https://ts-morph.com/)
- [glob Documentation](https://github.com/isaacs/node-glob)
- [Semantic Versioning](https://semver.org/)

---

**Last updated**: 2025-01-13  
**Project version**: 5.3.0
