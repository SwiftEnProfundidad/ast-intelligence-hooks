# Archive (Historical AST Files)

This folder contains deprecated AST implementations kept only for historical traceability.

## Archived Files

- `ast-intelligence.ts`: previous TypeScript coordinator implementation.
- `ios-rules.js`: older iOS rule implementation.
- `kotlin-analyzer.js`: older Kotlin analyzer implementation.
- `kotlin-parser.js`: older Kotlin parser implementation.
- `swift-analyzer.js`: older Swift analyzer implementation.

## Policy

- Do not use archive files in active runtime paths.
- Do not add new dependencies or features here.
- If historical behavior must be inspected, copy findings into active docs/tests rather than reactivating archived code.
