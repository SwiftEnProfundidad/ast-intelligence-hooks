import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import test from 'node:test';
import type { Finding } from '../../core/gate/Finding';
import { runPreCommitBackend } from '../../integrations/git/preCommitBackend';
import { runPrePushBackend } from '../../integrations/git/prePushBackend';
import { printGateFindings } from '../../integrations/git/runPlatformGateOutput';
import { runLifecycleCli } from '../../integrations/lifecycle/cli';
import { runLifecycleDoctor } from '../../integrations/lifecycle/doctor';
import { readLifecycleStatus } from '../../integrations/lifecycle/status';
import { runEnterpriseAiGateCheck } from '../../integrations/mcp/aiGateCheck';
import { runEnterprisePreFlightCheck } from '../../integrations/mcp/preFlightCheck';

const runFrameworkMenuCli = () =>
  spawnSync(process.execPath, ['bin/pumuki-framework.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PUMUKI_MENU_MODE: 'advanced',
      PUMUKI_MENU_UI_V2: '1',
      PUMUKI_MENU_COLOR: '0',
    },
    encoding: 'utf8',
    input: '27\n',
  });

const runLifecycleStatusCli = () =>
  spawnSync(process.execPath, ['bin/pumuki.js', 'status'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PUMUKI_MENU_COLOR: '0',
    },
    encoding: 'utf8',
  });

const runLifecycleDoctorCli = () =>
  spawnSync(process.execPath, ['bin/pumuki.js', 'doctor'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PUMUKI_MENU_COLOR: '0',
    },
    encoding: 'utf8',
  });

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toWrappedLineRegExp = (value: string): RegExp =>
  new RegExp(value.split(/\s+/).map(escapeRegExp).join('\\s+'));
const normalizeConsoleText = (value: string): string =>
  value.replace(/[│╭╮╰╯─]/g, ' ').replace(/\s+/g, ' ').trim();
const normalizeHookOutput = (value: string): string =>
  value.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');

const toYesNo = (value: boolean): 'yes' | 'no' => (value ? 'yes' : 'no');

const withCapturedStreams = async <T>(callback: () => Promise<T> | T): Promise<{
  result: T;
  stdout: string;
  stderr: string;
}> => {
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  process.stdout.write = ((chunk: unknown, encoding?: unknown, cb?: unknown) => {
    stdoutChunks.push(typeof chunk === 'string' ? chunk : String(chunk));
    if (typeof encoding === 'function') {
      encoding();
    } else if (typeof cb === 'function') {
      cb();
    }
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: unknown, encoding?: unknown, cb?: unknown) => {
    stderrChunks.push(typeof chunk === 'string' ? chunk : String(chunk));
    if (typeof encoding === 'function') {
      encoding();
    } else if (typeof cb === 'function') {
      cb();
    }
    return true;
  }) as typeof process.stderr.write;
  try {
    const result = await callback();
    return {
      result,
      stdout: stdoutChunks.join(''),
      stderr: stderrChunks.join(''),
    };
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }
};

const runPreWriteHookCli = () =>
  withCapturedStreams(async () =>
    runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE'])
  );

const hookBlockingFindings: Finding[] = [
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

const runBlockedHookStage = (stage: 'PRE_COMMIT' | 'PRE_PUSH') =>
  withCapturedStreams(async () => {
    const runner = stage === 'PRE_COMMIT' ? runPreCommitBackend : runPrePushBackend;
    return runner({
      notifyAuditSummaryFromEvidence: () => {},
      notifyGateBlocked: () => {},
      runPlatformGate: async () => {
        printGateFindings(hookBlockingFindings);
        return 1;
      },
      resolveUpstreamRef: () => 'origin/develop',
      resolveUpstreamTrackingRef: () => 'origin/develop',
      resolveCurrentBranchRef: () => 'refactor/s2c-governance-hook-smoke',
      resolveAheadBehindFromRef: () => ({ ahead: 0, behind: 0 }),
      readPrePushStdin: () => '',
      scheduleHookGateProgressReminder: () => () => {},
      ensureRuntimeArtifactsIgnored: () => {},
    });
  });

test('governance console mantiene contrato cruzado entre menu, status, doctor, mcp y hooks', async () => {
  const lifecycleStatus = readLifecycleStatus({ cwd: process.cwd() });
  const lifecycleDoctor = runLifecycleDoctor({ cwd: process.cwd() });
  const preWriteEffective = lifecycleStatus.governanceObservation.pre_write_effective;
  assert.ok(preWriteEffective);
  assert.deepEqual(
    lifecycleDoctor.governanceObservation.pre_write_effective,
    preWriteEffective,
  );
  assert.equal(
    lifecycleDoctor.governanceNextAction.reason_code,
    lifecycleStatus.governanceNextAction.reason_code,
  );
  assert.equal(
    lifecycleDoctor.governanceNextAction.instruction,
    lifecycleStatus.governanceNextAction.instruction,
  );

  const preFlight = runEnterprisePreFlightCheck({
    repoRoot: process.cwd(),
    stage: 'PRE_WRITE',
  });

  assert.equal(preFlight.result.prewrite_effective.mode, preWriteEffective.mode);
  assert.equal(preFlight.result.prewrite_effective.source, preWriteEffective.source);
  assert.equal(preFlight.result.prewrite_effective.blocking, preWriteEffective.blocking);
  assert.equal(preFlight.result.prewrite_effective.strict_policy, preWriteEffective.strict_policy);
  assert.equal(typeof preFlight.result.reason_code, 'string');
  assert.equal(preFlight.result.reason_code.length > 0, true);
  assert.equal(typeof preFlight.result.instruction, 'string');
  assert.equal(preFlight.result.instruction.length > 0, true);
  assert.equal(typeof preFlight.result.next_action.kind, 'string');
  assert.equal(typeof preFlight.result.next_action.message, 'string');
  assert.equal(preFlight.result.next_action.message.length > 0, true);

  const aiGateCheck = runEnterpriseAiGateCheck({
    repoRoot: process.cwd(),
    stage: 'PRE_WRITE',
  });
  assert.equal(aiGateCheck.tool, 'ai_gate_check');
  assert.equal(aiGateCheck.result.prewrite_effective.mode, preWriteEffective.mode);
  assert.equal(aiGateCheck.result.prewrite_effective.source, preWriteEffective.source);
  assert.equal(aiGateCheck.result.prewrite_effective.blocking, preWriteEffective.blocking);
  assert.equal(
    aiGateCheck.result.prewrite_effective.strict_policy,
    preWriteEffective.strict_policy,
  );
  assert.equal(typeof aiGateCheck.result.reason_code, 'string');
  assert.equal(aiGateCheck.result.reason_code.length > 0, true);
  assert.equal(typeof aiGateCheck.result.instruction, 'string');
  assert.equal(aiGateCheck.result.instruction.length > 0, true);
  assert.equal(typeof aiGateCheck.result.next_action.kind, 'string');
  assert.equal(typeof aiGateCheck.result.next_action.message, 'string');
  assert.equal(aiGateCheck.result.next_action.message.length > 0, true);

  const expectedPreWriteLine =
    `Pre-write: mode=${preWriteEffective.mode} ` +
    `blocking=${toYesNo(preWriteEffective.blocking)} ` +
    `strict_policy=${toYesNo(preWriteEffective.strict_policy)} ` +
    `source=${preWriteEffective.source}`;
  const expectedReason = `reason=${lifecycleStatus.governanceNextAction.reason_code}`;
  const expectedInstruction = `Instruction: ${lifecycleStatus.governanceNextAction.instruction}`;

  const menuCli = runFrameworkMenuCli();
  assert.equal(
    menuCli.status,
    0,
    `framework menu smoke must exit 0\nstdout:\n${menuCli.stdout}\nstderr:\n${menuCli.stderr}`,
  );
  assert.match(menuCli.stdout, new RegExp(escapeRegExp(expectedPreWriteLine)));
  assert.match(menuCli.stdout, new RegExp(escapeRegExp(expectedReason)));
  assert.equal(
    normalizeConsoleText(menuCli.stdout).includes(expectedInstruction),
    true,
  );

  const statusCli = runLifecycleStatusCli();
  assert.equal(
    statusCli.status,
    0,
    `lifecycle status smoke must exit 0\nstdout:\n${statusCli.stdout}\nstderr:\n${statusCli.stderr}`,
  );
  assert.match(statusCli.stdout, new RegExp(escapeRegExp(expectedPreWriteLine)));
  assert.match(statusCli.stdout, new RegExp(escapeRegExp(expectedReason)));
  assert.match(statusCli.stdout, toWrappedLineRegExp(expectedInstruction));

  const doctorCli = runLifecycleDoctorCli();
  assert.match(doctorCli.stdout, new RegExp(escapeRegExp(expectedPreWriteLine)));
  assert.match(doctorCli.stdout, new RegExp(escapeRegExp(expectedReason)));
  assert.match(doctorCli.stdout, toWrappedLineRegExp(expectedInstruction));

  const preWriteHook = await runPreWriteHookCli();
  const preWriteHookOutput = normalizeHookOutput(`${preWriteHook.stdout}\n${preWriteHook.stderr}`);
  const expectedPreWriteHookLine =
    `[pumuki][sdd] prewrite_effective: mode=${preWriteEffective.mode} ` +
    `source=${preWriteEffective.source} ` +
    `blocking=${toYesNo(preWriteEffective.blocking)} ` +
    `strict_policy=${toYesNo(preWriteEffective.strict_policy)}`;
  const expectedPreWriteHookReason =
    `[pumuki][ai-gate] reason_code=${aiGateCheck.result.reason_code}`;
  const expectedPreWriteHookInstruction =
    `[pumuki][ai-gate] instruction=${aiGateCheck.result.instruction}`;
  assert.match(preWriteHookOutput, new RegExp(escapeRegExp(expectedPreWriteHookLine)));
  assert.match(preWriteHookOutput, new RegExp(escapeRegExp(expectedPreWriteHookReason)));
  assert.match(preWriteHookOutput, new RegExp(escapeRegExp(expectedPreWriteHookInstruction)));
  assert.match(
    preWriteHookOutput,
    /message: .*pumuki-pre-write/
  );

  const expectedHookPrimary =
    '[pumuki][block-summary] primary=SDD_SESSION_MISSING severity=ERROR rule=sdd.policy.blocked';
  const expectedHookNextAction =
    '[pumuki][block-summary] next_action=npx --yes --package pumuki@latest pumuki sdd session --open --change=<id>';

  const preCommitHook = await runBlockedHookStage('PRE_COMMIT');
  const preCommitHookOutput = `${preCommitHook.stdout}\n${preCommitHook.stderr}`;
  assert.equal(preCommitHook.result, 1);
  assert.match(
    preCommitHookOutput,
    /\[pumuki\]\[hook-gate\] stage=PRE_COMMIT decision=PENDING status=STARTED/
  );
  assert.match(preCommitHookOutput, new RegExp(escapeRegExp(expectedHookPrimary)));
  assert.match(preCommitHookOutput, new RegExp(escapeRegExp(expectedHookNextAction)));

  const prePushHook = await runBlockedHookStage('PRE_PUSH');
  const prePushHookOutput = `${prePushHook.stdout}\n${prePushHook.stderr}`;
  assert.equal(prePushHook.result, 1);
  assert.match(
    prePushHookOutput,
    /\[pumuki\]\[hook-gate\] stage=PRE_PUSH decision=PENDING status=STARTED/
  );
  assert.match(prePushHookOutput, new RegExp(escapeRegExp(expectedHookPrimary)));
  assert.match(prePushHookOutput, new RegExp(escapeRegExp(expectedHookNextAction)));
});
