import assert from 'node:assert/strict';
import test from 'node:test';
import type { Finding } from '../../../core/gate/Finding';
import { printGateFindings } from '../runPlatformGateOutput';

test('printGateFindings no emite logs cuando no hay findings', () => {
  const captured: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown): boolean => {
    captured.push(String(chunk).trimEnd());
    return true;
  }) as typeof process.stdout.write;

  try {
    printGateFindings([]);
  } finally {
    process.stdout.write = originalWrite;
  }

  assert.deepEqual(captured, []);
});

test('printGateFindings imprime severidad, ruleId, message y ubicación clicable', () => {
  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'R1',
      severity: 'ERROR',
      code: 'sample-1',
      message: 'Primera alerta',
      filePath: 'src/a.ts',
      lines: [42, 60],
    },
    {
      ruleId: 'R2',
      severity: 'WARN',
      code: 'sample-2',
      message: 'Segunda alerta',
      filePath: 'src/b.ts',
      lines: '17',
    },
    {
      ruleId: 'R3',
      severity: 'CRITICAL',
      code: 'sample-3',
      message: 'Tercera alerta',
    },
  ];
  const captured: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown): boolean => {
    captured.push(String(chunk).trimEnd());
    return true;
  }) as typeof process.stdout.write;

  try {
    printGateFindings(findings);
  } finally {
    process.stdout.write = originalWrite;
  }

  assert.deepEqual(captured, [
    '[ERROR] R1: Primera alerta -> src/a.ts:42',
    '[WARN] R2: Segunda alerta -> src/b.ts:17',
    '[CRITICAL] R3: Tercera alerta',
  ]);
});
