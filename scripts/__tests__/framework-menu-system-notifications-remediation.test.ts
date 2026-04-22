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

  assert.match(result, /configura upstream/i);
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

test('resolveBlockedRemediation traduce remediaciones legacy en inglés a una salida accionable en español', () => {
  const result = resolveBlockedRemediation(
    {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
      remediation: 'Split the change into smaller commits.',
    },
    'GIT_ATOMICITY_TOO_MANY_SCOPES'
  );

  assert.match(result, /divide el cambio/i);
  assert.doesNotMatch(result, /split the change/i);
});

test('resolveBlockedRemediation compacta el banner sin cortar palabras por la mitad', () => {
  const result = resolveBlockedRemediation(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      remediation: 'Cómo solucionarlo: Refresca la evidencia del repositorio y vuelve a validar PRE_WRITE y PRE_PUSH con la sesión SDD correcta para esta rama.',
    },
    'EVIDENCE_STALE',
    { variant: 'banner' }
  );

  assert.ok(result.length <= 120);
  assert.doesNotMatch(result, /sesió…|correc…|ram…/i);
});
