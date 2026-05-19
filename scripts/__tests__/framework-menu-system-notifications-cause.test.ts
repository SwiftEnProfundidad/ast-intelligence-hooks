import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveBlockedCauseSummary } from '../framework-menu-system-notifications-cause';

test('resolveBlockedCauseSummary usa mapping conocido por causeCode', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
    },
    'EVIDENCE_STALE'
  );

  assert.match(result, /evidencia/i);
  assert.match(result, /desactualizada/i);
});

test('resolveBlockedCauseSummary traduce mensajes legacy conocidos', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
      causeMessage: 'Avoid explicit any in backend code.',
    },
    'GATE_BLOCKED'
  );

  assert.match(result, /"any"/i);
  assert.match(result, /backend/i);
});

test('resolveBlockedCauseSummary explica bloqueos de tracking enriquecidos', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage:
        'Evidence AI gate status is BLOCKED. active_entries=RGO-1900-01@L53, line_389 tracking_source=docs/RURALGO_SEGUIMIENTO.md',
    },
    'EVIDENCE_GATE_BLOCKED'
  );

  assert.match(result, /tracking bloqueado/i);
  assert.match(result, /RGO-1900-01/);
  assert.match(result, /docs\/RURALGO_SEGUIMIENTO\.md/);
  assert.doesNotMatch(result, /Evidence AI gate status/i);
});

test('resolveBlockedCauseSummary prioriza gaps críticos de skills sobre tracking enriquecido', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 2,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage:
        'Evidence AI gate status is BLOCKED. EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING active_entries=RGO-1900-02@L35 tracking_source=docs/RURALGO_SEGUIMIENTO.md',
    },
    'EVIDENCE_GATE_BLOCKED'
  );

  assert.match(result, /skills/i);
  assert.match(result, /crítico/i);
  assert.doesNotMatch(result, /tracking bloqueado/i);
});

test('resolveBlockedCauseSummary traduce el bloqueo umbrella de evidencia', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage: 'Evidence AI gate status is BLOCKED.',
    },
    'EVIDENCE_GATE_BLOCKED'
  );

  assert.match(result, /evidencia/i);
  assert.match(result, /gobernanza/i);
  assert.doesNotMatch(result, /Evidence AI gate status/i);
});

test('resolveBlockedCauseSummary usa fallback por stage cuando no hay detalles', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 7,
    },
    'GATE_BLOCKED'
  );

  assert.match(result, /7/);
  assert.match(result, /PRE_COMMIT/);
});

test('resolveBlockedCauseSummary traduce causas legacy de atomicidad a español', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
      causeMessage: 'Atomicity budget exceeded.',
    },
    'GATE_BLOCKED'
  );

  assert.match(result, /demasiados scopes/i);
  assert.doesNotMatch(result, /atomicity/i);
});

test('resolveBlockedCauseSummary no deja copy en inglés cuando llega un bloqueo no mapeado', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeMessage: 'AST heuristic detected console.log usage.',
    },
    'UNKNOWN_AST_RULE'
  );

  assert.match(result, /bloqueo/i);
  assert.match(result, /PRE_COMMIT/i);
  assert.doesNotMatch(result, /AST heuristic detected console\.log usage\./i);
});

test('resolveBlockedCauseSummary resume causas bloqueantes AST sin quedar tapado por tracking', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 3,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage:
        'Tracking bloqueado: RGO-1900-35 en docs/RURALGO_SEGUIMIENTO.md.',
      blockingCauses: [
        {
          code: 'SKILLS_IOS_NO_FOREGROUND_COLOR',
          ruleId: 'skills.ios.no-foreground-color',
          file: 'apps/ios/HomeView.swift',
          message: 'foregroundColor is not allowed.',
          remediation: 'Usa tokens semánticos de diseño.',
        },
        {
          code: 'SDD_SESSION_INVALID',
          ruleId: 'sdd.policy.blocked',
          file: 'openspec/changes',
          message: 'Tracking bloqueado.',
        },
      ],
    },
    'EVIDENCE_GATE_BLOCKED'
  );

  assert.match(result, /skills\.ios\.no-foreground-color/);
  assert.match(result, /apps\/ios\/HomeView\.swift/);
  assert.doesNotMatch(result, /Tracking bloqueado/);
});

test('resolveBlockedCauseSummary cuenta todas las causas restantes aunque priorice AST', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 4,
      causeCode: 'SKILLS_SKILLS_BACKEND_NO_CONSOLE_LOG',
      blockingCauses: [
        {
          code: 'SKILLS_SKILLS_BACKEND_NO_CONSOLE_LOG',
          ruleId: 'skills.backend.no-console-log',
          file: 'scripts/sample.ts',
          message: 'Disallow console.log in backend runtime code.',
        },
        {
          code: 'SKILLS_SKILLS_FRONTEND_NO_CONSOLE_LOG',
          ruleId: 'skills.frontend.no-console-log',
          file: 'apps/web/src/App.tsx',
          message: 'Disallow console.log in frontend production code.',
        },
        {
          code: 'CONTEXT_NOT_APPLIED',
          ruleId: 'governance.context.local-context-not-applied',
          file: '.pumuki/context/context.json',
          message: 'Contexto local obligatorio no aplicado.',
        },
        {
          code: 'GITFLOW_PROTECTED_BRANCH',
          ruleId: 'ai_gate.repo_policy.GITFLOW_PROTECTED_BRANCH',
          message: 'Direct work on protected branch main is not allowed.',
        },
      ],
    },
    'SKILLS_SKILLS_BACKEND_NO_CONSOLE_LOG'
  );

  assert.match(result, /skills\.backend\.no-console-log/);
  assert.match(result, /\(\+3 más\)/);
  assert.doesNotMatch(result, /\(\+1 más\)/);
});
