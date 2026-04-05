import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import { evaluateBrownfieldHotspotFindings } from '../brownfieldHotspots';

test('evaluateBrownfieldHotspotFindings returns empty outside PRE_WRITE/PRE_COMMIT', () => {
  const findings = evaluateBrownfieldHotspotFindings({
    repoRoot: tmpdir(),
    stage: 'CI',
    facts: [],
  });
  assert.deepEqual(findings, []);
});

test('evaluateBrownfieldHotspotFindings skips when hotspots config missing', () => {
  const repo = mkdtempSync(join(tmpdir(), 'pumuki-brownfield-'));
  try {
    const facts: Fact[] = [
      { source: 'test', kind: 'FileContent', path: 'src/Foo.ts', content: 'x\n' },
    ];
    const findings = evaluateBrownfieldHotspotFindings({
      repoRoot: repo,
      stage: 'PRE_WRITE',
      facts,
    });
    assert.deepEqual(findings, []);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('evaluateBrownfieldHotspotFindings flags hotspot without refactor plan', () => {
  const repo = mkdtempSync(join(tmpdir(), 'pumuki-brownfield-'));
  try {
    mkdirSync(join(repo, 'config'), { recursive: true });
    writeFileSync(
      join(repo, 'config', 'pumuki-hotspots.json'),
      JSON.stringify({
        hotspots: [
          {
            path: 'src/Legacy.ts',
            requires_refactor_plan: true,
            refactor_plan_paths: ['docs/plans/legacy.md'],
            reason: 'legacy slice',
          },
        ],
      }),
      'utf8'
    );
    const facts: Fact[] = [
      { source: 'test', kind: 'FileContent', path: 'src/Legacy.ts', content: 'line\n'.repeat(10) },
    ];
    const findings = evaluateBrownfieldHotspotFindings({
      repoRoot: repo,
      stage: 'PRE_COMMIT',
      facts,
    });
    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.code, 'HOTSPOT_FLAGGED_FILE_WITHOUT_PLAN');
    assert.equal(findings[0]?.ruleId, 'governance.hotspot.flagged_file_without_plan');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
