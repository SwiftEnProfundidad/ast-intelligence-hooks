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

  assert.match(payload.cause, /1\. Regla: skills\.ios\.no-foreground-color/);
  assert.match(payload.cause, /Fichero: apps\/ios\/HomeView\.swift:22/);
  assert.match(payload.cause, /foregroundColor is not allowed/);
  assert.match(payload.cause, /Solución: Usa tokens semánticos de diseño/);
  assert.match(payload.cause, /2\. Regla: sdd\.policy\.blocked/);
  assert.match(payload.cause, /Fichero: openspec\/changes/);
  assert.equal(payload.remediation, 'Corrige las violaciones listadas y vuelve a intentar el commit.');
  assert.doesNotMatch(payload.cause, /severity=/);
  assert.doesNotMatch(payload.cause, /code=/);
  assert.doesNotMatch(payload.cause, /file=/);
  assert.doesNotMatch(payload.cause, /lines=/);
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
  assert.match(payload.cause, /1\. Regla: skills\.frontend\.rule-1/);
  assert.match(payload.cause, /Fichero: apps\/web\/src\/File1\.tsx/);
  assert.match(payload.cause, /6\. Regla: skills\.frontend\.rule-6/);
  assert.match(payload.cause, /Fichero: apps\/web\/src\/File6\.tsx/);
  assert.match(payload.cause, /7\. Regla: skills\.frontend\.rule-7/);
  assert.match(payload.cause, /8\. Regla: skills\.frontend\.rule-8/);
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

  assert.match(payload.cause, /Regla: skills\.ios\.guideline\.ios\.dynamic-type-font-scaling-automatico/);
  assert.match(payload.cause, /Fichero: apps\/ios\/Presentation\/Views\/RuralGoWordmarkView\.swift:22/);
  assert.match(payload.cause, /Viola: Dynamic Type - Font scaling automatico/);
  assert.match(payload.cause, /Solución: Use semantic SwiftUI text styles/);
  assert.equal(payload.remediation, 'Corrige las violaciones listadas y vuelve a intentar el commit.');
  assert.doesNotMatch(payload.cause, /npx --yes --package/);
  assert.doesNotMatch(payload.remediation, /npx --yes --package/);
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

  assert.match(payload.cause, /1\. Regla: skills\.ios\.prefer-swift-testing/);
  assert.match(payload.cause, /Fichero: apps\/ios\/Tests\/Mac\/Presentation\/Features\/BuyerCommerceScreensSnapshotTests\.swift:12/);
  assert.match(payload.cause, /Evidencia: final class BuyerCommerceScreensSnapshotTests: XCTestCase/);
  assert.match(payload.cause, /Solución: Migra el test a Swift Testing/);
  assert.match(payload.cause, /\n\n2\. Regla: governance\.skills\.ios-test-quality\.incomplete/);
  assert.match(payload.cause, /Evidencia: Falta: \[makeSUT\(\), trackForMemoryLeaks\(\)\]/);
  assert.match(payload.cause, /Solución: Añade makeSUT\(\) y trackForMemoryLeaks\(\)/);
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
  assert.match(payload.remediation, /Agente IA: STOP/i);
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
