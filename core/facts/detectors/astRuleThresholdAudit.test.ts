import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const detectorFiles = [
  'core/facts/detectors/text/ios.ts',
  'core/facts/detectors/text/android.ts',
  'core/facts/detectors/typescript/index.ts',
  'core/facts/detectors/security/securityCredentials.ts',
];

const forbiddenDecisionThresholds = [
  /typeDeclarations\.length\s*<\s*\d+/,
  /conformingTypes\.length\s*<\s*\d+/,
  /trim\(\)\.length\s*>=\s*\d+/,
  /relatedNodes\.length\s*<\s*\d+/,
  /typedCaseCount\s*>=\s*\d+/,
  /caseNodes\.length\s*<\s*\d+/,
  /branchNodes\.length\s*<\s*\d+/,
  /slice\(0,\s*\d+\)/,
];

test('detectores AST estructurales no usan umbrales internos para decidir skills', () => {
  const violations = detectorFiles.flatMap((filePath) => {
    const content = readFileSync(join(process.cwd(), filePath), 'utf8');
    return forbiddenDecisionThresholds
      .filter((pattern) => pattern.test(content))
      .map((pattern) => `${filePath}: ${pattern.source}`);
  });

  assert.deepEqual(violations, []);
});
