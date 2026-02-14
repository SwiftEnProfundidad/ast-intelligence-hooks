# AST Intelligence (Legacy Modular Layer)

## Scope

This directory contains the legacy AST-based analyzers that preceded the deterministic v2 evaluator flow.

These files are preserved for compatibility and historical reference. Active deterministic evaluation now lives in `core/*` and `integrations/*`.

## Directory Layout

```text
legacy/scripts/hooks-system/infrastructure/ast/
├── ast-core.js
├── ast-intelligence.js
├── swift-parser.js
├── android/ast-android.js
├── backend/ast-backend.js
├── frontend/ast-frontend.js
├── ios/ast-ios.js
├── archive/
└── tests/
```

## Module Responsibilities

- `ast-core.js`
  - Shared utilities, severity mapping, and common helpers.
- `ast-intelligence.js`
  - Legacy orchestration entry point across platform analyzers.
- `backend/ast-backend.js`
  - Backend/NestJS/Node/TypeScript legacy checks.
- `frontend/ast-frontend.js`
  - Frontend/React/Next.js/TypeScript legacy checks.
- `android/ast-android.js`
  - Android/Kotlin/Compose legacy checks.
- `ios/ast-ios.js`
  - iOS/Swift/SwiftUI legacy checks.

## Operational Guidance

- Do not introduce new product logic in this legacy layer.
- Prefer deterministic rule packs and stage runners in `integrations/git/*`.
- Keep this area stable unless a compatibility fix is required.

## Development Notes

If a legacy fix is required:
1. Apply the minimum change in the platform module.
2. Validate behavior with focused tests.
3. Avoid broad refactors in this directory.

## Debugging Example

```bash
DEBUG_AST=1 node -e "
const { runBackendIntelligence } = require('./legacy/scripts/hooks-system/infrastructure/ast/backend/ast-backend');
console.log(typeof runBackendIntelligence);
"
```
