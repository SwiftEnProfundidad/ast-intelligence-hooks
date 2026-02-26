import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  buildHotspotsSaasIngestionPayloadFromLocalSignals,
  type BuildHotspotsSaasIngestionPayloadFromLocalParams,
} from '../saasIngestionBuilder';
import { getCurrentPumukiVersion } from '../packageInfo';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const createGitRepo = (): string => {
  const repo = join(tmpdir(), `pumuki-saas-builder-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(repo, { recursive: true });
  runGit(repo, ['init', '-b', 'main']);
  runGit(repo, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repo, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repo, '.gitignore'), 'node_modules/\n', 'utf8');
  writeFileSync(join(repo, 'README.md'), '# fixture\n', 'utf8');
  runGit(repo, ['add', '.']);
  runGit(repo, ['commit', '-m', 'chore: fixture']);
  return repo;
};

const baseParams = (repoRoot: string): BuildHotspotsSaasIngestionPayloadFromLocalParams => ({
  repoRoot,
  tenantId: 'tenant-local',
  repositoryId: 'repo-local',
  topN: 3,
  sinceDays: 365,
});

test('buildHotspotsSaasIngestionPayloadFromLocalSignals compone payload desde señales locales', () => {
  const repo = createGitRepo();
  try {
    mkdirSync(join(repo, 'src'), { recursive: true });
    writeFileSync(join(repo, 'src', 'core.ts'), 'export const core = 1;\n', 'utf8');
    runGit(repo, ['add', 'src/core.ts']);
    runGit(repo, ['commit', '-m', 'feat: add churn fixture']);

    writeFileSync(
      join(repo, '.ai_evidence.json'),
      JSON.stringify(
        {
          version: '2.1',
          snapshot: {
            tdd_bdd: {
              status: 'passed',
              scope: {
                in_scope: true,
                is_new_feature: true,
                is_complex_change: false,
                reasons: [],
                metrics: {
                  changed_files: 1,
                  estimated_loc: 10,
                  critical_path_files: 0,
                  public_interface_files: 1,
                },
              },
              evidence: {
                path: '.pumuki/artifacts/pumuki-evidence-v1.json',
                state: 'valid',
                version: '1',
                slices_total: 1,
                slices_valid: 1,
                slices_invalid: 0,
                integrity_ok: true,
                errors: [],
              },
              waiver: {
                applied: false,
              },
            },
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const payload = buildHotspotsSaasIngestionPayloadFromLocalSignals(baseParams(repo));
    assert.equal(payload.version, '1');
    assert.equal(payload.tenant_id, 'tenant-local');
    assert.equal(payload.repository.repository_id, 'repo-local');
    assert.equal(payload.source.producer, 'pumuki');
    assert.equal(payload.source.producer_version, getCurrentPumukiVersion());
    assert.equal(payload.source.mode, 'local');
    assert.equal(payload.hotspots.top_n, 3);
    assert.equal(payload.hotspots.since_days, 365);
    assert.equal(payload.compliance?.tdd_bdd?.status, 'passed');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('buildHotspotsSaasIngestionPayloadFromLocalSignals permite overrides explícitos', () => {
  const repo = createGitRepo();
  try {
    const payload = buildHotspotsSaasIngestionPayloadFromLocalSignals({
      ...baseParams(repo),
      sourceMode: 'ci',
      producerVersion: '9.9.9',
      repositoryName: 'custom-repo',
      repositoryDefaultBranch: 'develop',
    });

    assert.equal(payload.repository.name, 'custom-repo');
    assert.equal(payload.repository.default_branch, 'develop');
    assert.equal(payload.source.mode, 'ci');
    assert.equal(payload.source.producer_version, '9.9.9');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
