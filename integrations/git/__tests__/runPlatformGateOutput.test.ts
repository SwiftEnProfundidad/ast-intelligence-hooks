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
  assert.match(output, /\[pumuki\]\[block-summary\] reason_code=SDD_SESSION_MISSING/i);
  assert.match(output, /\[pumuki\]\[block-summary\] instruction=Abre una sesión SDD válida/i);
  assert.match(output, /next_action=.*session --open --change=<id>/i);
  assert.match(output, /command=.*session --open --change=<id>/i);
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
  assert.match(output, /\[pumuki\]\[block-summary\] reason_code=CUSTOM_UNKNOWN/i);
  assert.match(output, /\[pumuki\]\[block-summary\] instruction=Corrige el bloqueante primario/i);
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
  assert.match(output, /\[pumuki\]\[block-summary\] reason_code=SKILLS_SKILLS_FRONTEND_NO_SOLID_VIOLATIONS/i);
  assert.match(output, /next_action=Aplica refactor incremental: extrae 1 componente\/hook por commit/i);
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
  assert.match(output, /\[pumuki\]\[block-summary\] reason_code=EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES/i);
  assert.match(output, /\[pumuki\]\[block-summary\] instruction=Reconcilia policy\/skills en modo estricto/i);
  assert.match(output, /next_action=.*policy reconcile --strict --json/i);
  assert.match(output, /command=.*validate --stage=PRE_COMMIT --json/i);
});

test('printGateFindings usa el stage recibido para generar la remediación canónica', () => {
  const findings: Finding[] = [
    {
      ruleId: 'governance.evidence.stale',
      severity: 'ERROR',
      code: 'EVIDENCE_STALE',
      message: 'Evidence is stale.',
      filePath: '.ai_evidence.json',
      lines: 1,
      matchedBy: 'EvidenceGuard',
      source: 'evidence',
    },
  ];

  const output = withCapturedStdout(() => {
    printGateFindings(findings, { stage: 'PRE_PUSH' });
  }).join('');

  assert.match(output, /\[pumuki\]\[block-summary\] reason_code=EVIDENCE_STALE/i);
  assert.match(output, /command=.*validate --stage=PRE_PUSH --json/i);
});
