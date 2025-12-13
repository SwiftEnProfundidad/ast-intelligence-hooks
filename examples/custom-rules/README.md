# Example: Custom Rules

This example shows how to add custom rules to `ast-intelligence-hooks`.

## Option 1: Extend Existing Analyzers

### Backend (TypeScript/NestJS)

Create `custom-analyzers/my-backend-analyzer.js`:

```javascript
const { pushFinding, mapToLevel } = require('@pumuki/ast-intelligence-hooks/infrastructure/ast/ast-core');

function analyzeCustomPattern(sourceFile) {
  const findings = [];
  
  // Example: Detect console.log usage in production
  sourceFile.getDescendantsOfKind('CallExpression').forEach(callExpr => {
    const expression = callExpr.getExpression();
    
    if (expression.getText() === 'console.log') {
      pushFinding(
        'custom.backend.no_console_log',
        'high',
        sourceFile,
        callExpr,
        '🚨 console.log() detected. Use logger service in production.',
        findings
      );
    }
  });
  
  return findings;
}

module.exports = { analyzeCustomPattern };
```

### Frontend (React/Next.js)

Create `custom-analyzers/my-frontend-analyzer.js`:

```javascript
const { pushFinding } = require('@pumuki/ast-intelligence-hooks/infrastructure/ast/ast-core');

function analyzeReactComponent(sourceFile) {
  const findings = [];
  
  // Example: Detect components without PropTypes or TypeScript
  const components = sourceFile.getDescendantsOfKind('FunctionDeclaration');
  
  components.forEach(comp => {
    const props = comp.getParameters()[0];
    if (props && !props.getType()) {
      pushFinding(
        'custom.frontend.no_prop_types',
        'medium',
        sourceFile,
        comp,
        '⚠️ Component missing prop types. Add PropTypes or TypeScript types.',
        findings
      );
    }
  });
  
  return findings;
}

module.exports = { analyzeReactComponent };
```

## Option 2: Create Completely New Analyzer

Create `custom-analyzers/my-custom-platform-analyzer.js`:

```javascript
const fs = require('fs');
const path = require('path');
const { pushFinding } = require('@pumuki/ast-intelligence-hooks/infrastructure/ast/ast-core');

function runMyCustomPlatformIntelligence(files, config = {}) {
  const findings = [];
  
  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Your custom analysis logic here
    // Example: Search for specific patterns
    
    if (content.includes('TODO: FIXME')) {
      pushFinding(
        'custom.general.todo_fixme',
        'low',
        { getFilePath: () => filePath },
        null,
        '💡 TODO/FIXME comment found. Consider resolving before merging.',
        findings
      );
    }
  });
  
  return findings;
}

module.exports = { runMyCustomPlatformIntelligence };
```

## Option 3: Customize Quality Gates

Create `custom-rules/CustomCommitBlockingRules.js`:

```javascript
const { CommitBlockingRules } = require('@pumuki/ast-intelligence-hooks');

class CustomCommitBlockingRules extends CommitBlockingRules {
  shouldBlockCommit(auditResult) {
    // Custom blocking logic
    
    const criticalCount = auditResult.getCriticalFindings().length;
    const highCount = auditResult.getFindings().filter(f => 
      f.getSeverity() === 'high'
    ).length;
    
    // Block if there are more than 5 critical
    if (criticalCount > 5) {
      return true;
    }
    
    // Block if there are more than 10 high
    if (highCount > 10) {
      return true;
    }
    
    // Block if there are specific security violations
    const securityViolations = auditResult.getFindings().filter(f =>
      f.getRule().includes('security') || f.getRule().includes('password')
    );
    
    if (securityViolations.length > 0) {
      return true;
    }
    
    return false;
  }
}

module.exports = CustomCommitBlockingRules;
```

## Integrate Custom Rules

### In your analysis code

```javascript
const { runASTIntelligence } = require('@pumuki/ast-intelligence-hooks');
const { analyzeCustomPattern } = require('./custom-analyzers/my-backend-analyzer');

async function runCustomAnalysis() {
  // Execute standard analysis
  const standardResult = await runASTIntelligence({
    files: ['src/**/*.ts'],
    platforms: ['backend']
  });
  
  // Execute custom analysis
  const customFindings = [];
  // ... your logic to execute analyzeCustomPattern
  
  // Combine results
  const allFindings = [
    ...standardResult.getFindings(),
    ...customFindings
  ];
  
  return allFindings;
}
```

## Configure Custom Rules

Add to `config/language-guard.json`:

```json
{
  "backend": {
    "rules": {
      "custom.backend.no_console_log": {
        "severity": "high",
        "enabled": true,
        "description": "Detect console.log() usage"
      }
    }
  },
  "frontend": {
    "rules": {
      "custom.frontend.no_prop_types": {
        "severity": "medium",
        "enabled": true,
        "description": "Components should have prop types"
      }
    }
  }
}
```

## Testing

```javascript
const { analyzeCustomPattern } = require('./custom-analyzers/my-backend-analyzer');
const { createProject } = require('ts-morph');

describe('Custom Analyzer', () => {
  it('should detect console.log', () => {
    const project = createProject();
    const sourceFile = project.createSourceFile('test.ts', 'console.log("test");');
    
    const findings = analyzeCustomPattern(sourceFile);
    
    expect(findings).toHaveLength(1);
    expect(findings[0].getRule()).toBe('custom.backend.no_console_log');
  });
});
```

## Notes

- Custom rules should follow the same structure as standard rules
- Use `pushFinding()` to add violations consistently
- Document your custom rules
- Consider contributing useful rules to the main project
