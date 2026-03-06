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
