import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveBlockedRemediation } from '../framework-menu-system-notifications-remediation';

test('resolveBlockedRemediation usa remediation explícita cuando viene traducible', () => {
  const result = resolveBlockedRemediation(
    {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
      remediation: 'Run git push --set-upstream origin <branch> to continue.',
    },
    'PRE_PUSH_UPSTREAM_MISSING'
  );

  assert.match(result, /set-upstream/);
  assert.match(result, /PRE_PUSH/i);
});

test('resolveBlockedRemediation usa fallback conocido por causeCode', () => {
  const result = resolveBlockedRemediation(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
    },
    'EVIDENCE_CHAIN_INVALID'
  );

  assert.match(result, /cadena/i);
  assert.match(result, /evidencia/i);
});

test('resolveBlockedRemediation cae a fallback genérico cuando no conoce el bloqueo', () => {
  const result = resolveBlockedRemediation(
    {
      kind: 'gate.blocked',
      stage: 'CI',
      totalViolations: 1,
    },
    'UNKNOWN_BLOCK'
  );

  assert.match(result, /corrige/i);
});

test('resolveBlockedRemediation cae a fallback en español ante remediación inglesa no mapeada', () => {
  const result = resolveBlockedRemediation(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      remediation: 'Fix the blocking rule and rerun the gate.',
    },
    'UNKNOWN_AST_RULE'
  );

  assert.match(result, /corrige/i);
  assert.match(result, /vuelve a ejecutar/i);
  assert.doesNotMatch(result, /fix the blocking rule/i);
});
