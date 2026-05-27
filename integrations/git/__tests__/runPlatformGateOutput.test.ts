import assert from 'node:assert/strict';
import test from 'node:test';
import type { Finding } from '../../../core/gate/Finding';
import { printGateFindings } from '../runPlatformGateOutput';

const withCapturedStdout = (callback: () => void): ReadonlyArray<string> => {
  const chunks: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown, encoding?: unknown, cb?: unknown) => {
    chunks.push(typeof chunk === 'string' ? chunk : String(chunk));
    if (typeof encoding === 'function') {
      encoding();
    } else if (typeof cb === 'function') {
      cb();
    }
    return true;
  }) as typeof process.stdout.write;
  try {
    callback();
  } finally {
    process.stdout.write = originalWrite;
  }
  return chunks;
};

test('printGateFindings emite resumen jerárquico con next_action para códigos conocidos', () => {
  const findings: Finding[] = [
    {
      ruleId: 'sdd.policy.blocked',
      severity: 'ERROR',
      code: 'SDD_SESSION_MISSING',
      message: 'SDD session is not active.',
      filePath: 'openspec/changes',
      matchedBy: 'SddPolicy',
      source: 'sdd-policy',
    },
  ];

  const output = withCapturedStdout(() => {
    printGateFindings(findings);
  }).join('');

  assert.match(output, /\[pumuki\]\[block-summary\] primary=SDD_SESSION_MISSING/i);
  assert.match(output, /next_action=.*session --open --change=<id>/i);
  assert.match(output, /\[ERROR\] sdd\.policy\.blocked: SDD session is not active\./i);
});

test('printGateFindings usa next_action genérico cuando el código no está mapeado', () => {
  const findings: Finding[] = [
    {
      ruleId: 'custom.rule',
      severity: 'WARN',
      code: 'CUSTOM_UNKNOWN',
      message: 'custom warning',
      filePath: 'README.md',
      matchedBy: 'Custom',
      source: 'custom',
    },
  ];

  const output = withCapturedStdout(() => {
    printGateFindings(findings);
  }).join('');

  assert.match(output, /\[pumuki\]\[block-summary\] primary=CUSTOM_UNKNOWN/i);
  assert.match(output, /next_action=Corrige el bloqueante primario/i);
});

test('printGateFindings emite next_action incremental para bloqueo SOLID de frontend', () => {
  const findings: Finding[] = [
    {
      ruleId: 'skills.frontend.no-solid-violations',
      severity: 'ERROR',
      code: 'SKILLS_SKILLS_FRONTEND_NO_SOLID_VIOLATIONS',
      message: 'Verificar que NO viole SOLID.',
      filePath: 'apps/web/src/presentation/App.tsx',
      lines: 1,
      matchedBy: 'AstRule',
      source: 'skills-ir',
    },
  ];

  const output = withCapturedStdout(() => {
    printGateFindings(findings);
  }).join('');

  assert.match(output, /\[pumuki\]\[block-summary\] primary=SKILLS_SKILLS_FRONTEND_NO_SOLID_VIOLATIONS/i);
  assert.match(output, /next_action=Aplica refactor incremental: extrae 1 componente\/hook por commit/i);
});

test('printGateFindings prioriza violación AST/skills frente a repo policy con misma severidad', () => {
  const findings: Finding[] = [
    {
      ruleId: 'ai_gate.repo_policy.GITFLOW_PROTECTED_BRANCH',
      severity: 'ERROR',
      code: 'GITFLOW_PROTECTED_BRANCH',
      message: 'Direct work on protected branch "main" is not allowed.',
      matchedBy: 'RepoPolicy',
      source: 'ai_gate:repo_policy',
    },
    {
      ruleId: 'skills.backend.no-console-log',
      severity: 'ERROR',
      code: 'SKILLS_SKILLS_BACKEND_NO_CONSOLE_LOG',
      message: 'Disallow console.log in backend runtime code.',
      filePath: 'scripts/sample.ts',
      lines: 1,
      matchedBy: 'AstRule',
      source: 'skills-ir',
    },
  ];

  const output = withCapturedStdout(() => {
    printGateFindings(findings);
  }).join('');

  assert.match(output, /\[pumuki\]\[block-summary\] primary=SKILLS_SKILLS_BACKEND_NO_CONSOLE_LOG/i);
  assert.match(output, /next_action=Elimina console\.log del backend o sustitúyelo por el logger aprobado/i);
  assert.doesNotMatch(output, /\[pumuki\]\[block-summary\] primary=GITFLOW_PROTECTED_BRANCH/i);
});

test('printGateFindings emite next_action específico para console.log frontend', () => {
  const findings: Finding[] = [
    {
      ruleId: 'skills.frontend.no-console-log',
      severity: 'ERROR',
      code: 'SKILLS_SKILLS_FRONTEND_NO_CONSOLE_LOG',
      message: 'Disallow console.log in frontend production code.',
      filePath: 'apps/web/src/App.tsx',
      lines: 1,
      matchedBy: 'AstRule',
      source: 'skills-ir',
    },
  ];

  const output = withCapturedStdout(() => {
    printGateFindings(findings);
  }).join('');

  assert.match(output, /\[pumuki\]\[block-summary\] primary=SKILLS_SKILLS_FRONTEND_NO_CONSOLE_LOG/i);
  assert.match(output, /next_action=Elimina console\.log del frontend de producción/i);
});

test('printGateFindings emite next_action accionable para regla AST/skill no mapeada', () => {
  const findings: Finding[] = [
    {
      ruleId: 'skills.ios.guideline.ios.dynamic-type-font-scaling-automatico',
      severity: 'WARN',
      code: 'SKILLS_SKILLS_IOS_GUIDELINE_IOS_DYNAMIC_TYPE_FONT_SCALING_AUTOMATICO',
      message: 'Dynamic Type - Font scaling automatico',
      filePath: 'apps/ios/Presentation/Views/RuralGoWordmarkView.swift',
      lines: 22,
      expected_fix:
        'Usa estilos semánticos SwiftUI como .headline/.body o Font.TextStyle.',
      matchedBy: 'AstRule',
      source: 'skills-ir',
    },
  ];

  const output = withCapturedStdout(() => {
    printGateFindings(findings);
  }).join('');

  assert.match(
    output,
    /\[pumuki\]\[block-summary\] primary=SKILLS_SKILLS_IOS_GUIDELINE_IOS_DYNAMIC_TYPE_FONT_SCALING_AUTOMATICO/i
  );
  assert.match(
    output,
    /next_action=Corrige skills\.ios\.guideline\.ios\.dynamic-type-font-scaling-automatico en apps\/ios\/Presentation\/Views\/RuralGoWordmarkView\.swift:22/i
  );
  assert.match(output, /Usa estilos semánticos SwiftUI como \.headline\/\.body o Font\.TextStyle/i);
  assert.doesNotMatch(output, /Corrige el bloqueante primario/i);
});

test('printGateFindings emite next_action de reconcile cuando active_rule_ids está vacío con cambios de código', () => {
  const findings: Finding[] = [
    {
      ruleId: 'governance.rules.active-rule-coverage.empty',
      severity: 'ERROR',
      code: 'ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH',
      message: 'Active rules coverage is empty at PRE_COMMIT while code changes were detected.',
      filePath: '.ai_evidence.json',
      lines: 1,
      matchedBy: 'ActiveRulesCoverageGuard',
      source: 'rules-coverage',
    },
  ];

  const output = withCapturedStdout(() => {
    printGateFindings(findings);
  }).join('');

  assert.match(output, /\[pumuki\]\[block-summary\] primary=ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH/i);
  assert.match(output, /next_action=Reconcilia policy\/skills y reintenta PRE_COMMIT/i);
});

test('printGateFindings separa warning secundario cuando convive con un blocker primario', () => {
  const findings: Finding[] = [
    {
      ruleId: 'ai_gate.repo_policy.EVIDENCE_PREWRITE_WORKTREE_WARN',
      severity: 'WARN',
      code: 'EVIDENCE_PREWRITE_WORKTREE_WARN',
      message: 'PRE_WRITE worktree hygiene warning: pending_changes=15 (warn_threshold=15).',
      matchedBy: 'RepoPolicy',
      source: 'ai_gate:repo_policy',
    },
    {
      ruleId: 'ai_gate.repo_policy.TRACKING_CANONICAL_IN_PROGRESS_INVALID',
      severity: 'ERROR',
      code: 'TRACKING_CANONICAL_IN_PROGRESS_INVALID',
      message:
        'Canonical tracking file has 2 in-progress tasks; expected exactly 1. active_entries=PUMUKI-INC-081@L10, PUMUKI-INC-083@L11',
      matchedBy: 'RepoPolicy',
      source: 'ai_gate:repo_policy',
    },
  ];

  const output = withCapturedStdout(() => {
    printGateFindings(findings);
  }).join('');

  assert.match(output, /\[pumuki\]\[block-summary\] primary=TRACKING_CANONICAL_IN_PROGRESS_INVALID/i);
  assert.match(output, /\[pumuki\]\[warning-summary\] secondary=EVIDENCE_PREWRITE_WORKTREE_WARN/i);
  assert.match(output, /\[pumuki\]\[findings\] total=2/i);
  assert.match(output, /\n1\. \[ERROR\] ai_gate\.repo_policy\.TRACKING_CANONICAL_IN_PROGRESS_INVALID/i);
  assert.match(output, /\n2\. \[WARN\] ai_gate\.repo_policy\.EVIDENCE_PREWRITE_WORKTREE_WARN/i);
  assert.match(output, /active_entries=PUMUKI-INC-081@L10, PUMUKI-INC-083@L11/i);
});
