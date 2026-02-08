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

## Skills Contracts and Enforcement Inputs

Repository-level contracts for deterministic skills enforcement:

- `skills.sources.json`
- `skills.lock.json`
- `skills.policy.json`

Typed contract, compiler, and loader/validator modules:

- `integrations/config/skillsLock.ts`
- `integrations/config/skillsPolicy.ts`

Current enforcement scope:

- deterministic schema validation + hashing for lock/policy contracts
- curated template compilation (`skills.sources.json` -> `skills.lock.json`)
- stage-aware policy resolution via `resolvePolicyForStage`
- additive skills-derived rules merged through the shared gate runner
- evidence traceability for active skills bundles and policy source/hash in `.ai_evidence.json`

Ownership model:

- Contracts are repository artifacts and must be committed.
- CI and team members must evaluate the same committed contract files.
- User-home skill sources (`~/.codex/**`) are not runtime inputs for CI gate decisions.

Compile/check commands:

```bash
npm run skills:compile
npm run skills:lock:check
```

CI guardrail:

- `.github/workflows/ci.yml` includes `Skills Lock Freshness` and fails when committed lock is stale.

Migration guide:

- `docs/skills-repo-enforcement-migration.md`

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
