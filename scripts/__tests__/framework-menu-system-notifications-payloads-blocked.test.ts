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
  assert.match(payload.subtitle ?? '', /Test XCTest legacy/);
  assert.match(payload.subtitle ?? '', /BuyerCommerceScreensSnapshotTests\.swift:12/);
  assert.match(payload.message, /Regla: Test XCTest legacy/);
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

test('buildGateBlockedPayload resume contrato de skills incompleto en lenguaje dev', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 2,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      blockingCauses: [
        {
          code: 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING',
          ruleId: 'ai_evidence.json',
          file: '.ai_evidence.json',
          message:
            'Detected platforms missing critical skill-rule enforcement in PRE_WRITE: ios(missing_critical_rule_ids=[skills.ios.critical-test-quality]). platforms=ios rules={skills.ios.critical-test-quality}',
          remediation:
            'npx --yes --package pumuki@6.3.319 pumuki policy reconcile --strict --json && npx --yes --package pumuki@6.3.319 pumuki sdd validate --stage=PRE_WRITE --json',
        },
        {
          code: 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE',
          ruleId: 'ai_evidence.json',
          file: '.ai_evidence.json',
          message:
            'Skills contract incomplete for PRE_WRITE: EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING.',
          remediation:
            'npx --yes --package pumuki@6.3.319 pumuki policy reconcile --strict --json',
        },
      ],
    },
    'R_GO · '
  );

  assert.match(payload.subtitle ?? '', /Contrato de skills incompleto: iOS/);
  assert.match(payload.message, /Pumuki detecta iOS/);
  assert.match(payload.message, /skills\.ios\.critical-test-quality/);
  assert.match(payload.message, /bug del motor de Pumuki/);
  assert.doesNotMatch(payload.subtitle ?? '', /EVIDENCE_/);
  assert.doesNotMatch(payload.message, /EVIDENCE_/);
  assert.doesNotMatch(payload.message, /\.ai_evidence\.json/);
  assert.doesNotMatch(payload.message, /npx --yes --package/);
});

test('buildGateBlockedPayload infiere plataforma de contrato desde regla skills', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      blockingCauses: [
        {
          code: 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING',
          ruleId: 'ai_evidence.json',
          file: '.ai_evidence.json',
          message:
            'Pumuki detecta plataforma detectada, pero falta activar enforcement de skills criticas: skills.ios.critical-test-quality.',
          remediation: 'Actualiza o reconcilia el contrato de skills de Pumuki.',
        },
      ],
    },
    'R_GO · '
  );

  assert.match(payload.subtitle ?? '', /Contrato de skills incompleto: iOS/);
  assert.match(payload.message, /Pumuki detecta iOS/);
  assert.doesNotMatch(payload.message, /plataforma detectada/);
});

test('buildGateBlockedPayload muestra skill concreta aunque venga envuelta en EVIDENCE_GATE_BLOCKED', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      blockingCauses: [
        {
          code: 'EVIDENCE_GATE_BLOCKED',
          ruleId: 'ai_gate.repo_policy',
          file: '.ai_evidence.json',
          message:
            'Evidence AI gate status is BLOCKED. Blocking causes: 1) skills.ios.prefer-swift-testing severity=ERROR file=apps/ios/Tests/Mac/Presentation/Features/BuyerAppViewModelVisibleCopyTests.spec.swift lines=9 message=XCTest - Solo para proyectos legacy o UI tests remediation=Migra este test a Swift Testing o justifica la excepción legacy.',
          remediation: 'Corrige la violación indicada y vuelve a intentar el commit.',
        },
      ],
    },
    'R_GO · '
  );

  assert.match(payload.subtitle ?? '', /Skill violada: BuyerAppViewModelVisibleCopyTests\.spec\.swift:9/);
  assert.match(payload.subtitle ?? '', /Test XCTest legacy/);
  assert.match(payload.message, /Regla: Test XCTest legacy/);
  assert.match(payload.message, /Fichero: BuyerAppViewModelVisibleCopyTests\.spec\.swift:9/);
  assert.match(payload.message, /Falla: XCTest - Solo para proyectos legacy o UI tests/);
  assert.match(payload.message, /Migra este test a Swift Testing/);
  assert.doesNotMatch(payload.subtitle ?? '', /EVIDENCE_GATE_BLOCKED/);
  assert.doesNotMatch(payload.message, /\.ai_evidence\.json/);
  assert.doesNotMatch(payload.message, /Corrige la violación indicada/);
});

test('buildGateBlockedPayload muestra skill concreta desde causeMessage legacy sin blockingCauses', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage:
        'Evidence AI gate status is BLOCKED. Blocking causes: 1) skills.ios.prefer-swift-testing severity=ERROR file=apps/ios/Tests/Mac/Presentation/Features/BuyerAppViewModelVisibleCopyTests.spec.swift lines=9 message=XCTest - Solo para proyectos legacy o UI tests remediation=Migra este test a Swift Testing o justifica la excepción legacy.',
      remediation: 'Corrige la violación indicada y vuelve a intentar el commit.',
    },
    'R_GO · '
  );

  assert.match(payload.subtitle ?? '', /Skill violada: BuyerAppViewModelVisibleCopyTests\.spec\.swift:9/);
  assert.match(payload.subtitle ?? '', /Test XCTest legacy/);
  assert.match(payload.message, /Regla: Test XCTest legacy/);
  assert.match(payload.message, /Fichero: BuyerAppViewModelVisibleCopyTests\.spec\.swift:9/);
  assert.match(payload.message, /Falla: XCTest - Solo para proyectos legacy o UI tests/);
  assert.match(payload.message, /Migra este test a Swift Testing/);
  assert.doesNotMatch(payload.subtitle ?? '', /EVIDENCE_GATE_BLOCKED/);
  assert.doesNotMatch(payload.message, /Corrige la violación indicada/);
});

test('buildGateBlockedPayload traduce Dynamic Type a lenguaje dev en banner', () => {
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
          file: '.ai_evidence.json',
          message:
            'Evidence AI gate status is BLOCKED. Blocking causes: 1) skills.ios.guideline.ios.dynamic-type-font-scaling-automa-tico severity=WARN code=SKILLS_SKILLS_IOS_GUIDELINE_IOS_DYNAMIC_TYPE_FONT_SCALING_AUTOMA_TICO file=apps/ios/Presentation/Views/OnboardingCarouselView.swift lines=50,163 message=Dynamic Type - Font scaling automático remediation=Use semantic SwiftUI text styles such as .headline/.body, Font.TextStyle, or UIFontMetrics/scaled metrics when a custom size is required.',
          remediation: 'Corrige la violación indicada y vuelve a intentar el commit.',
        },
      ],
    },
    'R_GO · '
  );

  assert.match(payload.subtitle ?? '', /Skill violada: OnboardingCarouselView\.swift:50,163/);
  assert.match(payload.subtitle ?? '', /Dynamic Type/);
  assert.match(payload.message, /Regla: Dynamic Type/);
  assert.match(payload.message, /Falla: Dynamic Type: tamaño de fuente fijo sin escala dinámica/);
  assert.match(payload.message, /Solución: Usa estilos semánticos de SwiftUI/);
  assert.doesNotMatch(payload.message, /dynamic type font scaling automa tico/i);
  assert.doesNotMatch(payload.message, /Use semantic SwiftUI/i);
});

test('buildGateBlockedPayload extrae fichero y mensaje del primer segmento cuando hay varias skills anidadas', () => {
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
          file: '.ai_evidence.json',
          message:
            'Evidence AI gate status is BLOCKED. Blocking causes: 1) skills.backend.no-empty-catch severity=CRITICAL code=SKILLS_SKILLS_BACKEND_NO_EMPTY_CATCH file=apps/backend/src/admin/repositories/reporting/notification.repository.ts lines=63 message=Disallow empty catch blocks in backend runtime code. || 2) skills.ios.guideline.ios-swiftui-expert.use-relative-layout-over-hard-coded-constants severity=WARN file=apps/ios/View.swift lines=22 message=Use relative layout over hard-coded constants remediation=Move layout numbers into named constants.',
          remediation:
            'Corrige la causa bloqueante y vuelve a ejecutar: npx --yes --package pumuki@6.3.338 pumuki-pre-write.',
        },
      ],
    },
    'R_GO · '
  );

  assert.match(payload.subtitle ?? '', /Skill violada: notification\.repository\.ts:63/);
  assert.match(payload.subtitle ?? '', /no empty catch/);
  assert.match(payload.message, /Fichero: notification\.repository\.ts:63/);
  assert.match(payload.message, /Falla: Disallow empty catch blocks in backend runtime code/);
  assert.doesNotMatch(payload.message, /\.ai_evidence\.json/);
  assert.doesNotMatch(payload.message, /severity=CRITICAL/);
  assert.doesNotMatch(payload.message, /npx --yes --package/);
});

test('buildGateBlockedPayload usa line estructurado aunque el mensaje no incluya lines=', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      blockingCauses: [
        {
          code: 'SKILLS_IOS_EXAMPLE',
          ruleId: 'skills.ios.example-rule',
          file: 'apps/ios/Example.swift',
          line: 42,
          message: 'Example rule failed.',
          remediation: 'Corrige Example.swift.',
        },
      ],
    },
    'R_GO · '
  );

  assert.match(payload.subtitle ?? '', /Example\.swift:42/);
  assert.match(payload.message, /Fichero: Example\.swift:42/);
});
