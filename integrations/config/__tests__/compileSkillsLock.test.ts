import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import {
  checkSkillsLockStatus,
  compileSkillsLock,
  writeSkillsLock,
} from '../compileSkillsLock';
import {
  createSkillsLockDeterministicHash,
  isSkillsLockV1,
  parseSkillsLock,
} from '../skillsLock';

const FIXTURE_ROOT = resolve(__dirname, 'fixtures', 'skills-compiler');

const prepareFixtureRepo = (): string => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'pumuki-skills-compiler-'));
  cpSync(FIXTURE_ROOT, tempRoot, { recursive: true });
  return tempRoot;
};

test('compiles lock from curated templates and validates schema', () => {
  const repoRoot = prepareFixtureRepo();

  try {
    const lock = compileSkillsLock({
      repoRoot,
      manifestFile: 'skills.sources.json',
      generatedAt: '2026-02-07T22:00:00.000Z',
    });

    assert.equal(isSkillsLockV1(lock), true);
    assert.equal(lock.bundles.length, 3);
    assert.deepEqual(
      lock.bundles.map((bundle) => bundle.name),
      ['backend-guidelines', 'frontend-guidelines', 'ios-guidelines']
    );

    const iosBundle = lock.bundles.find((bundle) => bundle.name === 'ios-guidelines');
    assert.ok(iosBundle);
    assert.equal(iosBundle.rules.some((rule) => rule.id === 'skills.ios.no-force-try'), true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('produces deterministic lock hash regardless of bundle order in manifest', () => {
  const repoRoot = prepareFixtureRepo();

  try {
    const generatedAt = '2026-02-07T22:15:00.000Z';

    const lockA = compileSkillsLock({
      repoRoot,
      manifestFile: 'skills.sources.json',
      generatedAt,
    });

    const lockB = compileSkillsLock({
      repoRoot,
      manifestFile: 'skills.sources.reversed.json',
      generatedAt,
    });

    const hashA = createSkillsLockDeterministicHash(lockA);
    const hashB = createSkillsLockDeterministicHash(lockB);
    assert.equal(hashA, hashB);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('writes lock file and reports fresh status when up to date', () => {
  const repoRoot = prepareFixtureRepo();

  try {
    const lock = compileSkillsLock({
      repoRoot,
      manifestFile: 'skills.sources.json',
      generatedAt: '2026-02-07T22:30:00.000Z',
    });

    const outputPath = writeSkillsLock(lock, {
      repoRoot,
      outputFile: 'skills.lock.json',
    });

    const raw = readFileSync(outputPath, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    assert.ok(parseSkillsLock(parsed));

    const status = checkSkillsLockStatus({
      repoRoot,
      manifestFile: 'skills.sources.json',
      lockFile: 'skills.lock.json',
    });

    assert.equal(status.status, 'fresh');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('reports stale status when source skills change', () => {
  const repoRoot = prepareFixtureRepo();

  try {
    const lock = compileSkillsLock({
      repoRoot,
      manifestFile: 'skills.sources.json',
      generatedAt: '2026-02-07T22:45:00.000Z',
    });

    writeSkillsLock(lock, {
      repoRoot,
      outputFile: 'skills.lock.json',
    });

    const iosSkillPath = join(repoRoot, 'skills', 'ios', 'SKILL.md');
    writeFileSync(
      iosSkillPath,
      `${readFileSync(iosSkillPath, 'utf8')}\nAdditional force-try guidance update.\n`,
      'utf8'
    );

    const status = checkSkillsLockStatus({
      repoRoot,
      manifestFile: 'skills.sources.json',
      lockFile: 'skills.lock.json',
    });

    assert.equal(status.status, 'stale');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('reports missing and invalid states for lock check', () => {
  const repoRoot = prepareFixtureRepo();

  try {
    const missing = checkSkillsLockStatus({
      repoRoot,
      manifestFile: 'skills.sources.json',
      lockFile: 'skills.lock.json',
    });
    assert.equal(missing.status, 'missing');

    writeFileSync(join(repoRoot, 'skills.lock.json'), '{invalid json', 'utf8');

    const invalid = checkSkillsLockStatus({
      repoRoot,
      manifestFile: 'skills.sources.json',
      lockFile: 'skills.lock.json',
    });
    assert.equal(invalid.status, 'invalid');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
