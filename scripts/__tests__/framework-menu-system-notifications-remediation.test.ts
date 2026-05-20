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

test('resolveBlockedRemediation prioriza tracking sobre comandos genéricos de reconcile', () => {
  const result = resolveBlockedRemediation(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage:
        'Evidence AI gate status is BLOCKED. active_entries=RGO-1900-01@L53 tracking_source=docs/RURALGO_SEGUIMIENTO.md',
      remediation:
        'npx --yes --package pumuki@6.3.124 pumuki policy reconcile --strict --json && npx --yes --package pumuki@6.3.124 pumuki sdd validate --stage=PRE_WRITE --json',
    },
    'EVIDENCE_GATE_BLOCKED'
  );

  assert.match(result, /tracking/i);
  assert.match(result, /tarea activa/i);
  assert.doesNotMatch(result, /policy reconcile/i);
  assert.doesNotMatch(result, /sdd validate/i);
});

test('resolveBlockedRemediation no muestra comandos genéricos para el bloqueo umbrella de evidencia', () => {
  const result = resolveBlockedRemediation(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage: 'Evidence AI gate status is BLOCKED.',
      remediation:
        'npx --yes --package pumuki@6.3.124 pumuki policy reconcile --strict --json && npx --yes --package pumuki@6.3.124 pumuki sdd validate --stage=PRE_WRITE --json',
    },
    'EVIDENCE_GATE_BLOCKED'
  );

  assert.match(result, /status\/doctor/i);
  assert.doesNotMatch(result, /policy reconcile/i);
});

test('resolveBlockedRemediation explica tracking bloqueado con fichero y línea cuando existen', () => {
  const result = resolveBlockedRemediation(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage:
        'Evidence AI gate status is BLOCKED. active_entries=line_984 tracking_source=PUMUKI-RESET-MASTER-PLAN.md',
    },
    'EVIDENCE_GATE_BLOCKED'
  );

  assert.match(result, /Abre el MD de tracking PUMUKI-RESET-MASTER-PLAN\.md, línea 984/i);
  assert.match(result, /única tarea activa válida/i);
  assert.match(result, /estados activos duplicados o inválidos/i);
  assert.match(result, /vuelve a intentar el commit/i);
  assert.doesNotMatch(result, /gate/i);
  assert.doesNotMatch(result, /PRE_WRITE/i);
});

test('resolveBlockedRemediation conserva explicación genérica si tracking no trae fichero ni línea', () => {
  const result = resolveBlockedRemediation(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage: 'TRACKING_CANONICAL_IN_PROGRESS_INVALID',
    },
    'EVIDENCE_GATE_BLOCKED'
  );

  assert.match(result, /MD de tracking/i);
  assert.match(result, /vuelve a intentar el commit/i);
});


test('resolveBlockedRemediation no sustituye SDD_SESSION_MISSING por comando genérico pre-write', () => {
  const result = resolveBlockedRemediation(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'SDD_SESSION_MISSING',
      causeMessage: 'No hay sesión SDD activa.',
      remediation:
        'Corrige la causa bloqueante y vuelve a ejecutar: npx --yes --package pumuki@6.3.308 pumuki-pre-write',
    },
    'SDD_SESSION_MISSING'
  );

  assert.match(result, /Abre `openspec\/changes\/`/);
  assert.match(result, /session --open --change=<id>/);
  assert.match(result, /copia la carpeta de tu tarea/);
  assert.match(result, /por ejemplo `rgo-1900-35`/);
  assert.match(result, /openspec\/changes/i);
  assert.match(result, /vuelve a intentar el commit/i);
  assert.match(result, /PRE_WRITE automáticamente/i);
  assert.doesNotMatch(result, /Agente IA: STOP/i);
  assert.doesNotMatch(result, /reejecuta PRE_WRITE/i);
  assert.doesNotMatch(result, /pumuki-pre-write/i);
  assert.doesNotMatch(result, /npx --yes --package/i);
});

test('resolveBlockedRemediation detecta SDD_SESSION_MISSING aunque venga tapado por EVIDENCE_GATE_BLOCKED', () => {
  const result = resolveBlockedRemediation(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage: 'EVIDENCE_GATE_BLOCKED: SDD_SESSION_MISSING. No hay sesión SDD activa.',
      remediation:
        'Corrige la causa bloqueante y vuelve a ejecutar: npx --yes --package pumuki@6.3.308 pumuki-pre-write',
    },
    'EVIDENCE_GATE_BLOCKED'
  );

  assert.match(result, /Abre `openspec\/changes\/`/);
  assert.match(result, /vuelve a intentar el commit/i);
  assert.doesNotMatch(result, /reejecuta PRE_WRITE/i);
  assert.doesNotMatch(result, /pumuki-pre-write/i);
});

test('resolveBlockedRemediation no muestra git add masivo para aviso de higiene de worktree', () => {
  const result = resolveBlockedRemediation(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      blockingCauses: [
        {
          code: 'EVIDENCE_PREWRITE_WORKTREE_WARN',
          ruleId: 'ai_gate.repo_policy.EVIDENCE_PREWRITE_WORKTREE_WARN',
          file: '.ai_evidence.json',
          message:
            'PRE_WRITE worktree hygiene warning: pending_changes=20 (warn_threshold=12). Consider smaller staged/unstaged batches.',
          remediation:
            'git add -- "apps/ios/Documentation/Features/Authentication.feature" "apps/ios/Domain/Features/BuyerCommerce/BuyerCommerceModels.swift"',
        },
      ],
    },
    'EVIDENCE_GATE_BLOCKED'
  );

  assert.match(result, /slice atómico/i);
  assert.match(result, /stash nombrado/i);
  assert.doesNotMatch(result, /git add/i);
  assert.doesNotMatch(result, /BuyerCommerceModels/i);
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
