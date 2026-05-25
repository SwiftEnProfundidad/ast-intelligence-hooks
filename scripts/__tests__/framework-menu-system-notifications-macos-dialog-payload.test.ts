import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBlockedDialogPayload } from '../framework-menu-system-notifications-macos-dialog-payload';
import type { PumukiCriticalNotificationEvent } from '../framework-menu-system-notifications-types';

const blockedEvent = (
  overrides: Partial<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>> = {}
): Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }> => ({
  kind: 'gate.blocked',
  stage: 'PRE_PUSH',
  totalViolations: 1,
  causeCode: 'EVIDENCE_STALE',
  ...overrides,
});

test('buildBlockedDialogPayload compone título, causa y remediación visibles', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
      causeCode: 'BACKEND_AVOID_EXPLICIT_ANY',
      causeMessage: 'Avoid explicit any in backend code.',
      remediation: 'Tipa el valor y elimina any explícito en backend.',
    }),
    repoRoot: '/tmp/demo-repo',
    env: {
      PUMUKI_PROJECT_LABEL: 'demo-repo',
    } as NodeJS.ProcessEnv,
  });

  assert.equal(payload.title, '🔴 Pumuki bloqueado · demo-repo');
  assert.match(payload.cause, /uso de ["']any["'] explícito en backend/i);
  assert.equal(payload.remediation, 'Tipa el valor y elimina any explícito en backend.');
});

test('buildBlockedDialogPayload muestra cada causa bloqueante con regla, archivo, linea y solución', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
      stage: 'PRE_COMMIT',
      totalViolations: 2,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage: 'Tracking bloqueado: RGO-1900-35 en docs/RURALGO_SEGUIMIENTO.md.',
      blockingCauses: [
        {
          code: 'SKILLS_IOS_NO_FOREGROUND_COLOR',
          ruleId: 'skills.ios.no-foreground-color',
          file: 'apps/ios/HomeView.swift',
          message: 'severity=WARN code=SKILLS_IOS_NO_FOREGROUND_COLOR file=apps/ios/HomeView.swift lines=22 message=foregroundColor is not allowed.',
          remediation: 'Usa tokens semánticos de diseño.',
        },
        {
          code: 'SDD_SESSION_INVALID',
          ruleId: 'sdd.policy.blocked',
          file: 'openspec/changes',
          message: 'La sesión SDD actual no es válida.',
          remediation: 'Refresca la sesión SDD activa.',
        },
      ],
    }),
    repoRoot: '/tmp/R_GO',
    env: {
      PUMUKI_PROJECT_LABEL: 'R_GO',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /1\. Regla: no foreground color/);
  assert.match(payload.cause, /Fichero: apps\/ios\/HomeView\.swift:22/);
  assert.match(payload.cause, /foregroundColor is not allowed/);
  assert.match(payload.cause, /Solución: Usa tokens semánticos de diseño/);
  assert.match(payload.cause, /2\. Causa bloqueante: blocked/);
  assert.match(payload.cause, /Fichero: openspec\/changes/);
  assert.equal(payload.remediation, 'Corrige las violaciones listadas y vuelve a intentar el commit.');
  assert.doesNotMatch(payload.cause, /severity=/);
  assert.doesNotMatch(payload.cause, /code=/);
  assert.doesNotMatch(payload.cause, /file=/);
  assert.doesNotMatch(payload.cause, /lines=/);
});

test('buildBlockedDialogPayload explica prefer-swift-testing en lenguaje dev concreto', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      blockingCauses: [
        {
          code: 'SKILLS_IOS_PREFER_SWIFT_TESTING',
          ruleId: 'skills.ios.prefer-swift-testing',
          file: 'apps/ios/Tests/Mac/Presentation/Features/BuyerVisibleCopyTests.spec.swift',
          line: 12,
          message: 'XCTest - Solo para proyectos legacy o UI tests',
          remediation: 'Migra este test a Swift Testing o documenta que es XCTest legacy permitido.',
        },
      ],
    }),
    repoRoot: '/tmp/R_GO',
    env: {
      PUMUKI_PROJECT_LABEL: 'R_GO',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /1\. Regla: Test XCTest legacy/);
  assert.match(payload.cause, /Fichero: apps\/ios\/Tests\/Mac\/Presentation\/Features\/BuyerVisibleCopyTests\.spec\.swift:12/);
  assert.match(payload.cause, /Falla: XCTest - Solo para proyectos legacy o UI tests/);
  assert.match(payload.cause, /Solución: Migra este test a Swift Testing/);
  assert.doesNotMatch(payload.cause, /Regla: Swift Testing/);
});

test('buildBlockedDialogPayload usa line estructurado aunque el mensaje no incluya lines=', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
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
    }),
    repoRoot: '/tmp/R_GO',
    env: {
      PUMUKI_PROJECT_LABEL: 'R_GO',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /Fichero: apps\/ios\/Example\.swift:42/);
});

test('buildBlockedDialogPayload explica tracking bloqueado con línea accionable', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage:
        'Evidence AI gate status is BLOCKED. active_entries=line_984 tracking_source=PUMUKI-RESET-MASTER-PLAN.md',
    }),
    repoRoot: '/tmp/ast-intelligence-hooks',
    env: {
      PUMUKI_PROJECT_LABEL: 'ast-intelligence-hooks',
    } as NodeJS.ProcessEnv,
  });

  assert.equal(payload.cause, 'Tracking bloqueado en PUMUKI-RESET-MASTER-PLAN.md, línea 984.');
  assert.match(payload.remediation, /Abre el MD de tracking PUMUKI-RESET-MASTER-PLAN\.md, línea 984/);
  assert.match(payload.remediation, /única tarea activa válida/);
  assert.match(payload.remediation, /vuelve a intentar el commit/);
  assert.doesNotMatch(payload.cause, /line_984 en/);
  assert.doesNotMatch(payload.remediation, /PRE_WRITE|gate/i);
});


test('buildBlockedDialogPayload no omite causas bloqueantes aunque haya más de seis', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
      stage: 'PRE_COMMIT',
      totalViolations: 8,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      blockingCauses: Array.from({ length: 8 }, (_, index) => ({
        code: `SKILLS_FRONTEND_RULE_${index + 1}`,
        ruleId: `skills.frontend.rule-${index + 1}`,
        file: `apps/web/src/File${index + 1}.tsx`,
        message: `Violation ${index + 1}`,
        remediation: `Fix ${index + 1}`,
      })),
    }),
    repoRoot: '/tmp/R_GO',
    env: {
      PUMUKI_PROJECT_LABEL: 'R_GO',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /Causas bloqueantes: 8/);
  assert.match(payload.cause, /1\. Regla: rule 1/);
  assert.match(payload.cause, /Fichero: apps\/web\/src\/File1\.tsx/);
  assert.match(payload.cause, /6\. Regla: rule 6/);
  assert.match(payload.cause, /Fichero: apps\/web\/src\/File6\.tsx/);
  assert.match(payload.cause, /7\. Regla: rule 7/);
  assert.match(payload.cause, /8\. Regla: rule 8/);
  assert.doesNotMatch(payload.cause, /más omitidas|more omitted/i);
});

test('buildBlockedDialogPayload no muestra comandos npx largos en la ventana visual', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      remediation:
        'Corrige la causa bloqueante y vuelve a ejecutar: npx --yes --package pumuki@6.3.297 pumuki-pre-write',
      blockingCauses: [
        {
          code: 'SKILLS_SKILLS_IOS_GUIDELINE_IOS_DYNAMIC_TYPE_FONT_SCALING_AUTOMATICO',
          ruleId: 'skills.ios.guideline.ios.dynamic-type-font-scaling-automatico',
          file: 'apps/ios/Presentation/Views/RuralGoWordmarkView.swift',
          message:
            'severity=WARN code=SKILLS_SKILLS_IOS_GUIDELINE_IOS_DYNAMIC_TYPE_FONT_SCALING_AUTOMATICO file=apps/ios/Presentation/Views/RuralGoWordmarkView.swift lines=22 message=Dynamic Type - Font scaling automatico',
          remediation:
            'Use semantic SwiftUI text styles such as .headline/.body, Font.TextStyle, or UIFontMetrics/scaled metrics when a custom size is required.',
        },
      ],
    }),
    repoRoot: '/tmp/R_GO',
    env: {
      PUMUKI_PROJECT_LABEL: 'R_GO',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /Regla: Dynamic Type/);
  assert.match(payload.cause, /Fichero: apps\/ios\/Presentation\/Views\/RuralGoWordmarkView\.swift:22/);
  assert.match(payload.cause, /Falla: Dynamic Type: tamaño de fuente fijo sin escala dinámica/);
  assert.match(payload.cause, /Solución: Usa estilos semánticos de SwiftUI/);
  assert.equal(payload.remediation, 'Corrige las violaciones listadas y vuelve a intentar el commit.');
  assert.doesNotMatch(payload.cause, /npx --yes --package/);
  assert.doesNotMatch(payload.remediation, /npx --yes --package/);
  assert.doesNotMatch(payload.cause, /Use semantic SwiftUI/i);
  assert.doesNotMatch(payload.cause, /Font scaling automatico/i);
});

test('buildBlockedDialogPayload explica BDD feature missing sin mostrar EVIDENCE_GATE_BLOCKED ambiguo', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
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
    }),
    repoRoot: '/tmp/ast-intelligence-hooks',
    env: {
      PUMUKI_PROJECT_LABEL: 'ast-intelligence-hooks',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /escenario BDD sin fichero \.feature/);
  assert.match(payload.cause, /Fichero esperado: PARITY-IOS-001\.feature/);
  assert.match(payload.cause, /La slice referencia un escenario BDD/);
  assert.match(payload.cause, /Crea ese \.feature/);
  assert.match(payload.remediation, /Crea el fichero \.feature esperado/);
  assert.doesNotMatch(payload.cause, /EVIDENCE_GATE_BLOCKED/);
  assert.doesNotMatch(payload.cause, /generic_bdd_feature_required/);
});

test('buildBlockedDialogPayload muestra skill concreta desde causeMessage legacy sin blockingCauses', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage:
        'Evidence AI gate status is BLOCKED. Blocking causes: 1) skills.ios.prefer-swift-testing severity=ERROR file=apps/ios/Tests/Mac/Presentation/Features/BuyerAppViewModelVisibleCopyTests.spec.swift lines=9 message=XCTest - Solo para proyectos legacy o UI tests remediation=Migra este test a Swift Testing o justifica la excepción legacy.',
      remediation: 'Corrige la violación indicada y vuelve a intentar el commit.',
    }),
    repoRoot: '/tmp/R_GO',
    env: {
      PUMUKI_PROJECT_LABEL: 'R_GO',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /Regla: Test XCTest legacy/);
  assert.match(payload.cause, /Fichero: apps\/ios\/Tests\/Mac\/Presentation\/Features\/BuyerAppViewModelVisibleCopyTests\.spec\.swift:9/);
  assert.match(payload.cause, /Falla: XCTest - Solo para proyectos legacy o UI tests/);
  assert.match(payload.cause, /Solución: Migra este test a Swift Testing/);
  assert.equal(payload.remediation, 'Corrige las violaciones listadas y vuelve a intentar el commit.');
  assert.doesNotMatch(payload.cause, /EVIDENCE_GATE_BLOCKED/);
  assert.doesNotMatch(payload.cause, /Corrige la violación indicada/);
});

test('buildBlockedDialogPayload explica contrato de skills incompleto sin códigos EVIDENCE', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
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
    }),
    repoRoot: '/tmp/R_GO',
    env: {
      PUMUKI_PROJECT_LABEL: 'R_GO',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /contrato de skills incompleto/);
  assert.match(payload.cause, /Plataforma: iOS/);
  assert.match(payload.cause, /skills\.ios\.critical-test-quality/);
  assert.doesNotMatch(payload.cause, /Causas bloqueantes: 2/);
  assert.match(payload.cause, /bug del motor de Pumuki/);
  assert.equal(
    payload.remediation,
    'Corrige el contrato de skills indicado arriba y vuelve a intentar el commit.'
  );
  assert.doesNotMatch(payload.cause, /EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING/);
  assert.doesNotMatch(payload.cause, /EVIDENCE_SKILLS_CONTRACT_INCOMPLETE/);
  assert.doesNotMatch(payload.cause, /\.ai_evidence\.json/);
  assert.doesNotMatch(payload.cause, /npx --yes --package/);
});

test('buildBlockedDialogPayload infiere plataforma desde regla skills si el contrato no trae platforms', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
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
    }),
    repoRoot: '/tmp/R_GO',
    env: {
      PUMUKI_PROJECT_LABEL: 'R_GO',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /Plataforma: iOS/);
  assert.doesNotMatch(payload.cause, /Plataforma: plataforma detectada/);
  assert.equal(payload.remediation, 'Corrige el contrato de skills indicado arriba y vuelve a intentar el commit.');
});

test('buildBlockedDialogPayload muestra skills iOS con separador, linea, evidencia y solucion especifica', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
      stage: 'PRE_COMMIT',
      totalViolations: 2,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      blockingCauses: [
        {
          code: 'SKILLS_IOS_PREFER_SWIFT_TESTING',
          ruleId: 'skills.ios.prefer-swift-testing',
          file: 'apps/ios/Tests/Mac/Presentation/Features/BuyerCommerceScreensSnapshotTests.swift',
          message:
            'severity=WARN code=SKILLS_IOS_PREFER_SWIFT_TESTING file=apps/ios/Tests/Mac/Presentation/Features/BuyerCommerceScreensSnapshotTests.swift lines=12 message=XCTest - Solo para proyectos legacy o UI tests snippet=final class BuyerCommerceScreensSnapshotTests: XCTestCase',
          remediation: 'Migra el test a Swift Testing o justifica explicitamente la excepcion UI/legacy.',
        },
        {
          code: 'SKILLS_IOS_TEST_QUALITY_INCOMPLETE',
          ruleId: 'governance.skills.ios-test-quality.incomplete',
          file: '.ai_evidence.json',
          message:
            'iOS test quality enforcement incomplete at PRE_COMMIT: apps/ios/Tests/Mac/Presentation/Features/BuyerCommerceScreensSnapshotTests.swift[missing=[makeSUT(), trackForMemoryLeaks()]]',
          remediation: 'Añade makeSUT() y trackForMemoryLeaks() al test afectado.',
        },
      ],
    }),
    repoRoot: '/tmp/R_GO',
    env: {
      PUMUKI_PROJECT_LABEL: 'R_GO',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /1\. Regla: Test XCTest legacy/);
  assert.match(payload.cause, /Fichero: apps\/ios\/Tests\/Mac\/Presentation\/Features\/BuyerCommerceScreensSnapshotTests\.swift:12/);
  assert.match(payload.cause, /Evidencia: final class BuyerCommerceScreensSnapshotTests: XCTestCase/);
  assert.match(payload.cause, /Solución: Migra el test a Swift Testing/);
  assert.match(payload.cause, /\n\n2\. Regla: incomplete/);
  assert.match(payload.cause, /Evidencia: Falta: \[makeSUT\(\), trackForMemoryLeaks\(\)\]/);
  assert.match(payload.cause, /Solución: Añade makeSUT\(\) y trackForMemoryLeaks\(\)/);
});

test('buildBlockedDialogPayload traduce reglas SwiftUI frecuentes a lenguaje dev y evita spanglish principal', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
      stage: 'PRE_COMMIT',
      totalViolations: 4,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      blockingCauses: [
        {
          code: 'SKILLS_IOS_ACTION_HANDLERS',
          ruleId: 'skills.ios.guideline.ios-swiftui-expert.action-handlers-should-reference-methods-not-contain-inline-logic',
          file: 'apps/ios/Presentation/Debug/DebugMenuView.swift',
          message: 'Action handlers should reference methods, not contain inline logic',
          remediation: 'Extract the action body to a named method or view model command and reference that method from Button.',
        },
        {
          code: 'SKILLS_IOS_FOREACH_STABLE_ID',
          ruleId: 'skills.ios.guideline.ios-swiftui-expert.ensure-foreach-uses-stable-identity-see-references-list-patterns-md',
          file: 'apps/ios/Presentation/Features/BuyerCommerce/BuyerCommerceScreens.swift',
          message: 'Ensure ForEach uses stable identity (see references/list-patterns.md)',
          remediation: 'Use Identifiable models or an explicit stable domain identifier such as id: \\.id.',
        },
        {
          code: 'SKILLS_IOS_LAZY_STACK',
          ruleId: 'skills.ios.guideline.ios-swiftui-expert.use-lazyvstack-lazyhstack-for-large-lists',
          file: 'apps/ios/Presentation/Features/BuyerCommerce/BuyerCommerceScreens.swift',
          message: 'LazyVStack/LazyHStack - Para listas grandes',
          remediation: 'Replace VStack/HStack under ScrollView with LazyVStack/LazyHStack when rendering collection rows.',
        },
        {
          code: 'SKILLS_BACKEND_NO_EMPTY_CATCH',
          ruleId: 'skills.backend.no-empty-catch',
          file: 'apps/backend/src/admin/repositories/reporting/notification.repository.ts',
          message: 'Disallow empty catch blocks in backend runtime code.',
          remediation: 'Corrige la violación indicada y vuelve a intentar el commit.',
        },
      ],
    }),
    repoRoot: '/tmp/R_GO',
    env: {
      PUMUKI_PROJECT_LABEL: 'R_GO',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /Regla: handlers SwiftUI sin lógica inline/);
  assert.match(payload.cause, /Falla: El handler contiene lógica inline/);
  assert.match(payload.cause, /Solución: Extrae la acción a un método con nombre/);
  assert.match(payload.cause, /Regla: identidad estable en ForEach/);
  assert.match(payload.cause, /Solución: Usa modelos Identifiable/);
  assert.match(payload.cause, /Regla: LazyVStack\/LazyHStack para listas grandes/);
  assert.match(payload.cause, /Solución: Sustituye VStack\/HStack/);
  assert.match(payload.cause, /Regla: catch vacío/);
  assert.match(payload.cause, /Falla: Catch vacío en código backend runtime/);
  assert.doesNotMatch(payload.cause, /Viola:/);
  assert.doesNotMatch(payload.cause, /action-handlers-should-reference-methods-not-contain-inline-logic/);
  assert.doesNotMatch(payload.cause, /ensure-foreach-uses-stable-identity/);
});

test('buildBlockedDialogPayload muestra remediación SDD accionable en vez de repetir pumuki-pre-write', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'SDD_SESSION_MISSING',
      causeMessage: 'No hay sesión SDD activa.',
      remediation:
        'Corrige la causa bloqueante y vuelve a ejecutar: npx --yes --package pumuki@6.3.308 pumuki-pre-write',
    }),
    repoRoot: '/tmp/stack-my-architecture',
    env: {
      PUMUKI_PROJECT_LABEL: 'stack-my-architecture',
    } as NodeJS.ProcessEnv,
  });

  assert.equal(payload.title, '🔴 Pumuki bloqueado · stack-my-architecture');
  assert.equal(payload.cause, 'No hay sesión SDD activa.');
  assert.match(payload.remediation, /session --open --change=<id>/);
  assert.match(payload.remediation, /openspec\/changes/i);
  assert.match(payload.remediation, /vuelve a intentar el commit/i);
  assert.match(payload.remediation, /PRE_WRITE automáticamente/i);
  assert.doesNotMatch(payload.remediation, /Agente IA: STOP/i);
  assert.doesNotMatch(payload.remediation, /reejecuta PRE_WRITE/i);
  assert.doesNotMatch(payload.remediation, /pumuki-pre-write/i);
  assert.doesNotMatch(payload.remediation, /npx --yes --package/i);
});

test('buildBlockedDialogPayload muestra aviso de worktree sin git add masivo ni texto de violaciones', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
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
    }),
    repoRoot: '/tmp/R_GO',
    env: {
      PUMUKI_PROJECT_LABEL: 'R_GO',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /Aviso: higiene de worktree PRE_WRITE/);
  assert.match(payload.cause, /Alcance: repo\/worktree/);
  assert.match(payload.cause, /pending_changes=20/);
  assert.match(payload.cause, /slice atómico/);
  assert.match(payload.remediation, /stash nombrado/);
  assert.doesNotMatch(payload.cause, /Regla:/);
  assert.doesNotMatch(payload.cause, /git add --/);
  assert.doesNotMatch(payload.remediation, /violaciones listadas/);
});

test('buildBlockedDialogPayload muestra Golden Flow sin campos tecnicos ni solucion generica', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'GOLDEN_FLOW_VERIFY_EVIDENCE_MISSING',
      blockingCauses: [
        {
          code: 'GOLDEN_FLOW_VERIFY_EVIDENCE_MISSING',
          ruleId: 'generic_golden_flow_verify_required',
          file: '.pumuki/artifacts/pumuki-evidence-v1.json',
          message:
            'message=Falta fase VERIFY passed en la evidencia Golden Flow. missing=[verify.status=passed] snippet=RED failed -> GREEN passed -> REFACTOR passed -> VERIFY missing',
          remediation:
            'Si el test/build ya pasó, informa a Pumuki del resultado real con: npx pumuki sdd evidence --scenario-id=rgo-1900 --test-command="<comando XCTest/build ejecutado>" --test-status=passed. Después haz un commit atómico del slice.',
        },
      ],
    }),
    repoRoot: '/tmp/ast-intelligence-hooks',
    env: {
      PUMUKI_PROJECT_LABEL: 'ast-intelligence-hooks',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /Causa bloqueante: Violación del ciclo TDD/);
  assert.match(payload.cause, /Registro TDD: \.pumuki\/artifacts\/pumuki-evidence-v1\.json/);
  assert.match(payload.cause, /Falta: tests finales en verde sin ejecutar antes del commit/);
  assert.equal(
    payload.remediation,
    'Si el test/build ya pasó, informa a Pumuki del resultado real con: npx pumuki sdd evidence --scenario-id=rgo-1900 --test-command="<comando XCTest/build ejecutado>" --test-status=passed. Después haz un commit atómico del slice.'
  );
  assert.match(payload.remediation, /informa a Pumuki del resultado real/);
  assert.match(payload.remediation, /pumuki sdd evidence/);
  assert.doesNotMatch(payload.cause, /Solución:/);
  assert.doesNotMatch(payload.cause, /Esperado:/);
  assert.doesNotMatch(payload.cause, /Falta: Falta:/);
  assert.doesNotMatch(payload.cause, /missing=/);
  assert.doesNotMatch(payload.cause, /snippet=/);
  assert.doesNotMatch(payload.remediation, /violaciones listadas/);
  assert.doesNotMatch(payload.remediation, /reejecuta el gate/);
});

test('buildBlockedDialogPayload explica fase RED del ciclo TDD en lenguaje dev', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
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
    }),
    repoRoot: '/tmp/ast-intelligence-hooks',
    env: {
      PUMUKI_PROJECT_LABEL: 'ast-intelligence-hooks',
    } as NodeJS.ProcessEnv,
  });

  assert.match(payload.cause, /Causa bloqueante: Violación del ciclo TDD/);
  assert.match(payload.cause, /Falta: fase RED del ciclo TDD sin implementar/);
  assert.equal(
    payload.remediation,
    'Implementa la fase RED antes de continuar. Las fases del ciclo TDD (RED, GREEN, REFACTOR) deben completarse para desbloquear.'
  );
  assert.doesNotMatch(payload.cause, /Solución:/);
  assert.doesNotMatch(payload.remediation, /evidencia|VERIFY|gate/i);
});
