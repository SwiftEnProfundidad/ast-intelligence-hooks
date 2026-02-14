# Multi-Platform Example

This example shows how to use `ast-intelligence-hooks` in a monorepo with multiple platforms (Backend, Frontend, iOS, Android).

## Project Structure

```
monorepo/
├── apps/
│   ├── backend/          # NestJS
│   │   └── src/
│   ├── frontend/         # Next.js
│   │   └── app/
│   ├── ios/              # Swift/SwiftUI
│   │   └── MyApp/
│   └── android/          # Kotlin/Compose
│       └── app/
├── package.json
└── .cursor/
    └── mcp.json
```

## Configuration

### 1. Install at monorepo root

```bash
npm install --save-dev pumuki-ast-hooks
npm run install-hooks
```

### 2. Configure exclusions

Create `config/ast-exclusions.json`:

```json
{
  "patterns": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "**/Pods/**",
    "**/DerivedData/**"
  ]
}
```

### 3. System will automatically detect platforms

The installer automatically detects:
- Backend: Looks for `nest-cli.json`, `tsconfig.json`
- Frontend: Looks for `next.config.js`, `app/**/page.tsx`
- iOS: Looks for `*.swift`, `*.xcodeproj`
- Android: Looks for `*.kt`, `*.gradle.kts`

## Usage

```bash
# Full analysis of all platforms
npm run audit

# Backend only analysis
ast-hooks analyze --platform backend

# Frontend only analysis
ast-hooks analyze --platform frontend
```

## View Violations by Platform

```bash
# View all violations
npm run violations:list

# View backend only
npm run violations:list | grep "backend\."

# View frontend only
npm run violations:list | grep "frontend\."
```

## Notes

- System analyzes all platforms automatically
- You can configure platform-specific exclusions
- Pre-commit hooks validate all detected platforms
