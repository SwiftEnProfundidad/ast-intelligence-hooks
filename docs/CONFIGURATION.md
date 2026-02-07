# Configuration (v2.x)

## Project rule overrides

Create a project-level rules file in one of these locations:

- `.pumuki/rules.ts`
- `pumuki.rules.ts`

Example:

```ts
import type { ProjectRulesConfig } from './integrations/config/projectRules';

const config: ProjectRulesConfig = {
  allowOverrideLocked: false,
  rules: [
    {
      id: 'ios.no-print',
      description: 'Disallow print() usage in iOS code.',
      severity: 'CRITICAL',
      scope: { include: ['**/*.swift'] },
      when: { kind: 'FileContent', contains: ['print('] },
      then: {
        kind: 'Finding',
        message: 'print() usage is not allowed.',
        code: 'IOS_NO_PRINT',
      },
    },
  ],
};

export default config;
```

## Override rules of engagement

You can:

- Add new rules.
- Update unlocked rules.
- Raise severity for locked baseline rules.

You cannot (unless `allowOverrideLocked: true`):

- Downgrade locked baseline rules.
- Remove locked baseline rules.
- Replace locked baseline conditions/consequences.

## Stage policies

Defined in `integrations/gate/stagePolicies.ts`:

- `PRE_COMMIT`: block `CRITICAL`, warn from `ERROR`
- `PRE_PUSH`: block `ERROR`, warn from `WARN`
- `CI`: block `ERROR`, warn from `WARN`

## Heuristic pilot flag

Enable semantic heuristic rules:

```bash
PUMUKI_ENABLE_AST_HEURISTICS=true
```

When enabled, stage-based heuristic severity maturity applies via `applyHeuristicSeverityForStage`.

## Rule packs

Version map lives in `core/rules/presets/rulePackVersions.ts`.

Documentation:

- `docs/rule-packs/README.md`
- `docs/rule-packs/ios.md`
- `docs/rule-packs/backend.md`
- `docs/rule-packs/frontend.md`
- `docs/rule-packs/android.md`
- `docs/rule-packs/heuristics.md`

## Evidence contract

Configuration outcomes are reflected in `.ai_evidence.json`:

- active `platforms`
- loaded `rulesets`
- `snapshot` outcome
- `ledger` continuity

Schema reference: `docs/evidence-v2.1.md`.
