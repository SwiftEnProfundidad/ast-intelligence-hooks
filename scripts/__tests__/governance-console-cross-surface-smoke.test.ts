import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import test from 'node:test';
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

const toYesNo = (value: boolean): 'yes' | 'no' => (value ? 'yes' : 'no');

test('governance console mantiene contrato cruzado entre menu, status, doctor y mcp', () => {
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
  assert.equal(
    doctorCli.status,
    0,
    `lifecycle doctor smoke must exit 0\nstdout:\n${doctorCli.stdout}\nstderr:\n${doctorCli.stderr}`,
  );
  assert.match(doctorCli.stdout, new RegExp(escapeRegExp(expectedPreWriteLine)));
  assert.match(doctorCli.stdout, new RegExp(escapeRegExp(expectedReason)));
  assert.match(doctorCli.stdout, toWrappedLineRegExp(expectedInstruction));
});
