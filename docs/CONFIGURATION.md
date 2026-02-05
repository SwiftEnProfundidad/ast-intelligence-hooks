# Configuration

## Project rule overrides
Create a project-level rules file in one of these locations:

- `.pumuki/rules.ts`
- `pumuki.rules.ts`

The file should export a configuration object:

```ts
import type { ProjectRulesConfig } from './integrations/config/projectRules';

const config: ProjectRulesConfig = {
  rules: [
    {
      id: 'ios.no-print',
      description: 'Disallow print() usage in iOS code.',
      severity: 'CRITICAL',
      when: { kind: 'FileContent', contains: ['print('] },
      then: { kind: 'Finding', message: 'print() usage is not allowed.', code: 'IOS_NO_PRINT' },
    },
  ],
};

export default config;
```

## What you can override
- Add new rules.
- Redefine unlocked rules (description, conditions, consequences, severity).
- Raise severity on locked baseline rules.

## What you cannot override
- Locked baseline rules cannot be removed.
- Locked baseline rules cannot be downgraded.
- Locked baseline rules keep their original conditions and consequences.

## Scope hints
Use `scope.include` and `scope.exclude` to narrow rule applicability:

```ts
const config = {
  rules: [
    {
      id: 'ios.no-print',
      description: 'Disallow print() usage in iOS code.',
      severity: 'ERROR',
      scope: { include: ['**/*.swift'], exclude: ['**/Legacy/**'] },
      when: { kind: 'FileContent', contains: ['print('] },
      then: { kind: 'Finding', message: 'print() usage is not allowed.', code: 'IOS_NO_PRINT' },
    },
  ],
};
```
