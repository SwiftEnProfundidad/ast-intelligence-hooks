import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectRemoteCiDiagnostics,
  detectRemoteCiBlockers,
  type RunRemoteCiCommand,
} from '../remoteCiDiagnostics';

test('detectRemoteCiBlockers detecta bloqueo por billing lock en checks fallidos', () => {
  const blockers = detectRemoteCiBlockers([
    {
      name: 'Type Check',
      state: 'FAILURE',
      bucket: 'fail',
      description:
        'The job was not started because your account is locked due to a billing issue.',
    },
  ]);

  assert.equal(blockers.length, 1);
  assert.equal(blockers[0]?.code, 'REMOTE_CI_BILLING_LOCK');
  assert.equal(blockers[0]?.affectedChecks.includes('Type Check'), true);
});

test('detectRemoteCiBlockers detecta quota de proveedor y deduplica checks repetidos', () => {
  const blockers = detectRemoteCiBlockers([
    {
      name: 'security/snyk (swiftenprofundidad)',
      state: 'ERROR',
      bucket: 'fail',
      description: 'You have used your limit of private tests',
    },
    {
      name: 'security/snyk (swiftenprofundidad)',
      state: 'ERROR',
      bucket: 'fail',
      description: 'You have used your limit of private tests',
    },
  ]);

  assert.equal(blockers.length, 1);
  assert.equal(blockers[0]?.code, 'REMOTE_CI_PROVIDER_QUOTA');
  assert.equal(blockers[0]?.affectedChecks.length, 1);
});

test('detectRemoteCiBlockers ignora checks exitosos aunque contengan texto parecido', () => {
  const blockers = detectRemoteCiBlockers([
    {
      name: 'lint',
      state: 'SUCCESS',
      bucket: 'pass',
      description: 'billing issue resolved',
    },
  ]);

  assert.deepEqual(blockers, []);
});

test('collectRemoteCiDiagnostics devuelve skipped cuando no hay PR abierta para la rama', () => {
  const runCommand: RunRemoteCiCommand = ({ command, args }) => {
    if (command === 'gh' && args[0] === '--version') {
      return {
        exitCode: 0,
        stdout: 'gh version 2.80.0',
        stderr: '',
      };
    }
    if (command === 'gh' && args[0] === 'pr' && args[1] === 'view') {
      return {
        exitCode: 1,
        stdout: '',
        stderr: 'no pull requests found for branch "feature/no-pr"',
      };
    }
    if (command === 'git') {
      return {
        exitCode: 0,
        stdout: 'feature/no-pr\n',
        stderr: '',
      };
    }
    return {
      exitCode: 1,
      stdout: '',
      stderr: 'unexpected command',
    };
  };

  const diagnostics = collectRemoteCiDiagnostics({
    repoRoot: '/tmp/repo',
    runCommand,
    now: () => new Date('2026-03-03T12:00:00.000Z'),
  });

  assert.equal(diagnostics.status, 'skipped');
  assert.equal(diagnostics.reason, 'no_open_pr_for_branch');
  assert.equal(diagnostics.branch, 'feature/no-pr');
});

test('collectRemoteCiDiagnostics clasifica blocked cuando detecta billing lock y quota', () => {
  const runCommand: RunRemoteCiCommand = ({ command, args }) => {
    if (command === 'git') {
      return {
        exitCode: 0,
        stdout: 'feature/ci-diagnostics\n',
        stderr: '',
      };
    }
    if (command === 'gh' && args[0] === '--version') {
      return {
        exitCode: 0,
        stdout: 'gh version 2.80.0',
        stderr: '',
      };
    }
    if (command === 'gh' && args[0] === 'pr' && args[1] === 'view') {
      return {
        exitCode: 0,
        stdout: JSON.stringify({
          number: 512,
          url: 'https://github.com/org/repo/pull/512',
          headRefName: 'feature/ci-diagnostics',
        }),
        stderr: '',
      };
    }
    if (command === 'gh' && args[0] === 'pr' && args[1] === 'checks') {
      return {
        exitCode: 0,
        stdout: JSON.stringify([
          {
            name: 'Type Check',
            state: 'FAILURE',
            bucket: 'fail',
            description:
              'The job was not started because your account is locked due to a billing issue.',
          },
          {
            name: 'security/snyk (swiftenprofundidad)',
            state: 'ERROR',
            bucket: 'fail',
            description: 'You have used your limit of private tests',
          },
        ]),
        stderr: '',
      };
    }
    return {
      exitCode: 1,
      stdout: '',
      stderr: 'unexpected command',
    };
  };

  const diagnostics = collectRemoteCiDiagnostics({
    repoRoot: '/tmp/repo',
    runCommand,
    now: () => new Date('2026-03-03T12:00:00.000Z'),
  });

  assert.equal(diagnostics.status, 'blocked');
  assert.equal(diagnostics.pr?.number, 512);
  assert.equal(diagnostics.checks.total, 2);
  assert.equal(diagnostics.checks.failing, 2);
  assert.deepEqual(
    diagnostics.blockers.map((blocker) => blocker.code).sort((left, right) => left.localeCompare(right)),
    ['REMOTE_CI_BILLING_LOCK', 'REMOTE_CI_PROVIDER_QUOTA']
  );
});
