# Rule Packs

This folder documents the baseline Rule Packs used by the v2.x deterministic gate flow.

## Baseline doctrine

- `engineering-baseline.md` defines locked enterprise methodology and SOLID coverage.

## Current versions

- `iosEnterpriseRuleSet@1.0.0`
- `rulesgold.mdc@1.0.0`
- `rulesbackend.mdc@1.0.0`
- `backendRuleSet@1.0.0`
- `frontendRuleSet@1.0.0`
- `androidRuleSet@1.0.0`
- `astHeuristicsRuleSet@0.5.0` (enabled only when `PUMUKI_ENABLE_AST_HEURISTICS` is true)

## Skills bundles (locked compiler templates)

- `ios-guidelines@1.0.0`
- `ios-concurrency-guidelines@1.0.0`
- `ios-swiftui-expert-guidelines@1.0.0`
- `backend-guidelines@1.0.0`
- `frontend-guidelines@1.0.0`
- `android-guidelines@1.0.0`

## Evidence linkage

Each execution writes loaded Rule Packs to `.ai_evidence.json` in `rulesets[]` with:

- `platform`
- `bundle` (name + version)
- `hash` (content hash used for traceability)

## Override model

Project-level overrides are loaded from:

- `.pumuki/rules.ts`
- `pumuki.rules.ts`

Locked baseline rules remain locked unless:

- `allowOverrideLocked: true`

Example:

```ts
import type { ProjectRulesConfig } from './integrations/config/projectRules';

const config: ProjectRulesConfig = {
  allowOverrideLocked: false,
  rules: [],
};

export default config;
```
