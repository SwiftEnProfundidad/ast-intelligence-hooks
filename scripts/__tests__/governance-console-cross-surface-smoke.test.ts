import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import test from 'node:test';
import { readLifecycleStatus } from '../../integrations/lifecycle/status';
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

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toYesNo = (value: boolean): 'yes' | 'no' => (value ? 'yes' : 'no');

test('governance console mantiene contrato cruzado entre menu, cli y mcp', () => {
  const lifecycleStatus = readLifecycleStatus({ cwd: process.cwd() });
  const preWriteEffective = lifecycleStatus.governanceObservation.pre_write_effective;
  assert.ok(preWriteEffective);

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
  assert.match(menuCli.stdout, new RegExp(escapeRegExp(expectedInstruction)));

  const statusCli = runLifecycleStatusCli();
  assert.equal(
    statusCli.status,
    0,
    `lifecycle status smoke must exit 0\nstdout:\n${statusCli.stdout}\nstderr:\n${statusCli.stderr}`,
  );
  assert.match(statusCli.stdout, new RegExp(escapeRegExp(expectedPreWriteLine)));
  assert.match(statusCli.stdout, new RegExp(escapeRegExp(expectedReason)));
  assert.match(statusCli.stdout, new RegExp(escapeRegExp(expectedInstruction)));
});
