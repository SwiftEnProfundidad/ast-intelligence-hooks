# Basic Example - Minimal Usage

This example shows how to use `ast-intelligence-hooks` in a simple project.

## Requirements

- Node.js ≥18.0.0
- npm ≥9.0.0
- Git

## Steps

### 1. Install the library

```bash
npm install --save-dev @pumuki/ast-intelligence-hooks
```

### 2. Configure hooks

```bash
npm run install-hooks
```

### 3. Create test code

```bash
# Create a simple TypeScript file
mkdir -p src
cat > src/app.ts << 'EOF'
export class App {
  constructor() {}
  
  public run() {
    console.log('Hello, World!');
  }
}
EOF
```

### 4. Make commit

```bash
git init
git add .
git commit -m "feat: initial commit"
```

Hooks will run automatically and validate your code.

### 5. View results

If there are violations, you'll see a report. If everything is OK, the commit will complete.

## Next Steps

- See [multi-platform example](../multi-platform/) for more complex projects
- See [custom-rules example](../custom-rules/) to add custom rules
