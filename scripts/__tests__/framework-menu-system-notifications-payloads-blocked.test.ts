import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGateBlockedPayload } from '../framework-menu-system-notifications-payloads-blocked';

test('buildGateBlockedPayload construye payload para gate BLOCK', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 7,
    },
    ''
  );

  assert.match(payload.title, /pumuki/i);
  assert.match(payload.title, /bloqueado/i);
  assert.match(payload.subtitle ?? '', /pre_commit|pre-commit/i);
  assert.match(payload.subtitle ?? '', /7/);
  assert.match(payload.message, /^solución:/i);
  assert.equal(payload.soundName, 'Basso');
});

test('buildGateBlockedPayload incluye proyecto en subtítulo cuando hay prefijo', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'EVIDENCE_STALE',
    },
    'SAAS:APP_SUPERMERCADOS · '
  );

  assert.match(payload.subtitle ?? '', /SAAS:APP_SUPERMERCADOS/);
  assert.match(payload.subtitle ?? '', /PRE_COMMIT/);
});

test('buildGateBlockedPayload muestra causa y solución coherentes para tracking bloqueado', () => {
  const payload = buildGateBlockedPayload(
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
    'R_GO · '
  );

  assert.match(payload.subtitle ?? '', /R_GO/);
  assert.match(payload.subtitle ?? '', /Tracking bloqueado/i);
  assert.match(payload.message, /tracking/i);
  assert.doesNotMatch(payload.message, /policy reconcile/i);
});

test('buildGateBlockedPayload prioriza primera skill con fichero, linea, violacion y solucion', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 2,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      blockingCauses: [
        {
          code: 'SKILLS_IOS_PREFER_SWIFT_TESTING',
          ruleId: 'skills.ios.prefer-swift-testing',
          file: 'apps/ios/Tests/Mac/Presentation/Features/BuyerCommerceScreensSnapshotTests.swift',
          message:
            'severity=WARN code=SKILLS_IOS_PREFER_SWIFT_TESTING file=apps/ios/Tests/Mac/Presentation/Features/BuyerCommerceScreensSnapshotTests.swift lines=12 message=XCTest - Solo para proyectos legacy o UI tests',
          remediation: 'Migra el test a Swift Testing o justifica explicitamente la excepcion UI/legacy.',
        },
        {
          code: 'SDD_SESSION_INVALID',
          ruleId: 'sdd.policy.blocked',
          file: 'openspec/changes',
          message: 'La sesión SDD actual no es válida.',
          remediation: 'Refresca la sesión SDD activa.',
        },
      ],
    },
    'R_GO · '
  );

  assert.match(payload.subtitle ?? '', /Skill violada: BuyerCommerceScreensSnapshotTests\.swift:12/);
  assert.match(payload.subtitle ?? '', /Swift Testing/);
  assert.match(payload.subtitle ?? '', /BuyerCommerceScreensSnapshotTests\.swift:12/);
  assert.match(payload.message, /Regla: Swift Testing/);
  assert.match(payload.message, /Fichero: BuyerCommerceScreensSnapshotTests\.swift:12/);
  assert.match(payload.message, /Falla: XCTest - Solo para proyectos legacy o UI tests/);
  assert.doesNotMatch(payload.message, /Viola:/);
  assert.match(payload.message, /Solución: Migra el test a Swift Testing/);
  assert.doesNotMatch(payload.message, /skills\.ios\.prefer-swift-testing/);
});

test('buildGateBlockedPayload resume Golden Flow con solucion especifica', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'GOLDEN_FLOW_VERIFY_EVIDENCE_MISSING',
      causeMessage: 'Golden Flow bloqueado.',
      remediation: 'Corrige la causa bloqueante.',
      blockingCauses: [
        {
          code: 'GOLDEN_FLOW_VERIFY_EVIDENCE_MISSING',
          ruleId: 'generic_golden_flow_verify_required',
          file: '.pumuki/artifacts/pumuki-evidence-v1.json',
          message: 'missing=[verify.status=passed]',
          remediation:
            'Si el test/build ya pasó, informa a Pumuki del resultado real con: npx pumuki sdd evidence --scenario-id=rgo-1900 --test-command="<comando XCTest/build ejecutado>" --test-status=passed. Después haz un commit atómico del slice.',
        },
      ],
    },
    'ast-intelligence-hooks · '
  );

  assert.match(payload.subtitle ?? '', /Violación del ciclo TDD/);
  assert.match(payload.message, /informa a Pumuki del resultado real/);
  assert.match(payload.message, /pumuki sdd evidence/);
  assert.match(payload.message, /commit atómico/);
  assert.doesNotMatch(payload.message, /Corrige las violaciones listadas/);
  assert.doesNotMatch(payload.message, /reejecuta el gate/);
});

test('buildGateBlockedPayload explica RED en lenguaje dev si falta esa fase TDD', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'GOLDEN_FLOW_RED_EVIDENCE_MISSING',
      blockingCauses: [
        {
          code: 'GOLDEN_FLOW_RED_EVIDENCE_MISSING',
          ruleId: 'generic_golden_flow_red_required',
          file: '.pumuki/artifacts/pumuki-evidence-v1.json',
          message: 'missing=[red.status=failed]',
          remediation: 'Registra RED failed.',
        },
      ],
    },
    'ast-intelligence-hooks · '
  );

  assert.match(payload.subtitle ?? '', /Violación del ciclo TDD/);
  assert.match(payload.message, /Implementa la fase RED antes de continuar/);
  assert.match(payload.message, /RED, GREEN, REFACTOR/);
  assert.doesNotMatch(payload.message, /evidencia|VERIFY|gate/i);
});

test('buildGateBlockedPayload explica BDD feature missing sin usar umbrella EVIDENCE_GATE_BLOCKED', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      blockingCauses: [
        {
          code: 'EVIDENCE_GATE_BLOCKED',
          ruleId: 'ai_gate.repo_policy',
          message:
            'Evidence AI gate status is BLOCKED. Blocking causes: 1) generic_bdd_feature_required severity=ERROR code=TDD_BDD_SCENARIO_FILE_MISSING file=PARITY-IOS-001.feature message=Slice PARITY-IOS-001 references missing feature file PARITY-IOS-001.feature.',
          remediation: 'Corrige la violación indicada y vuelve a intentar el commit.',
        },
      ],
    },
    'ast-intelligence-hooks · '
  );

  assert.match(payload.subtitle ?? '', /BDD sin fichero \.feature: PARITY-IOS-001\.feature/);
  assert.match(payload.message, /Falta el fichero PARITY-IOS-001\.feature/);
  assert.match(payload.message, /Crea ese \.feature/);
  assert.doesNotMatch(payload.subtitle ?? '', /EVIDENCE_GATE_BLOCKED/);
  assert.doesNotMatch(payload.message, /generic_bdd_feature_required/);
});
