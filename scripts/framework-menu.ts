import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { loadSkillsLock, type SkillsLockBundle } from '../integrations/config/skillsLock';
import { policyForCI, policyForPreCommit, policyForPrePush } from '../integrations/gate/stagePolicies';
import { runCiBackend } from '../integrations/git/ciBackend';
import { runCiFrontend } from '../integrations/git/ciFrontend';
import { runCiIOS } from '../integrations/git/ciIOS';
import { runPlatformGate } from '../integrations/git/runPlatformGate';

type MenuAction = {
  id: string;
  label: string;
  execute: () => Promise<void>;
};

const runGit = (args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
};

const resolveDefaultRangeFrom = (): string => {
  try {
    return runGit(['rev-parse', '@{u}']);
  } catch {
    return 'HEAD~1';
  }
};

const runAndPrintExitCode = async (run: () => Promise<number>): Promise<void> => {
  const code = await run();
  output.write(`\nExit code: ${code}\n`);
};

const runStaged = async (): Promise<void> => {
  await runAndPrintExitCode(() =>
    runPlatformGate({
      policy: policyForPreCommit(),
      scope: { kind: 'staged' },
    })
  );
};

const runRange = async (params: {
  fromRef: string;
  toRef: string;
  stage: 'PRE_PUSH' | 'CI';
}): Promise<void> => {
  const policy = params.stage === 'CI' ? policyForCI() : policyForPrePush();
  await runAndPrintExitCode(() =>
    runPlatformGate({
      policy,
      scope: {
        kind: 'range',
        fromRef: params.fromRef,
        toRef: params.toRef,
      },
    })
  );
};

const printEvidence = (): void => {
  const evidencePath = resolve(process.cwd(), '.ai_evidence.json');
  if (!existsSync(evidencePath)) {
    output.write('\n.ai_evidence.json not found in repository root.\n');
    return;
  }
  output.write('\n');
  output.write(readFileSync(evidencePath, 'utf8'));
  output.write('\n');
};

export const formatActiveSkillsBundles = (
  bundles: ReadonlyArray<Pick<SkillsLockBundle, 'name' | 'version' | 'hash'>>
): string => {
  if (bundles.length === 0) {
    return 'No active skills bundles found. Run `npm run skills:compile` to generate skills.lock.json.';
  }

  const lines = [...bundles]
    .sort((left, right) => {
      const byName = left.name.localeCompare(right.name);
      if (byName !== 0) {
        return byName;
      }
      return left.version.localeCompare(right.version);
    })
    .map((bundle) => `- ${bundle.name}@${bundle.version} hash=${bundle.hash}`);

  return ['Active skills bundles:', ...lines].join('\n');
};

const printActiveSkillsBundles = (): void => {
  const lock = loadSkillsLock(process.cwd());
  const rendered = formatActiveSkillsBundles(lock?.bundles ?? []);
  output.write(`\n${rendered}\n`);
};

const menu = async (): Promise<void> => {
  const rl = createInterface({ input, output });

  try {
    const askRange = async (): Promise<{ fromRef: string; toRef: string }> => {
      const fromDefault = resolveDefaultRangeFrom();
      const fromPrompt = await rl.question(`fromRef [${fromDefault}]: `);
      const toPrompt = await rl.question('toRef [HEAD]: ');
      return {
        fromRef: fromPrompt.trim() || fromDefault,
        toRef: toPrompt.trim() || 'HEAD',
      };
    };

    const actions: MenuAction[] = [
      {
        id: '1',
        label: 'Evaluate staged changes (PRE_COMMIT policy)',
        execute: runStaged,
      },
      {
        id: '2',
        label: 'Evaluate commit range (PRE_PUSH policy)',
        execute: async () => {
          const range = await askRange();
          await runRange({ ...range, stage: 'PRE_PUSH' });
        },
      },
      {
        id: '3',
        label: 'Evaluate commit range (CI policy)',
        execute: async () => {
          const range = await askRange();
          await runRange({ ...range, stage: 'CI' });
        },
      },
      {
        id: '4',
        label: 'Run iOS CI gate',
        execute: async () => runAndPrintExitCode(runCiIOS),
      },
      {
        id: '5',
        label: 'Run Backend CI gate',
        execute: async () => runAndPrintExitCode(runCiBackend),
      },
      {
        id: '6',
        label: 'Run Frontend CI gate',
        execute: async () => runAndPrintExitCode(runCiFrontend),
      },
      {
        id: '7',
        label: 'Show active skills bundles (version + hash)',
        execute: async () => {
          printActiveSkillsBundles();
        },
      },
      {
        id: '8',
        label: 'Read current .ai_evidence.json',
        execute: async () => {
          printEvidence();
        },
      },
      {
        id: '9',
        label: 'Exit',
        execute: async () => {},
      },
    ];

    while (true) {
      output.write('\nPumuki Framework Menu\n');
      for (const action of actions) {
        output.write(`${action.id}. ${action.label}\n`);
      }

      const option = (await rl.question('\nSelect option: ')).trim();
      const selected = actions.find((action) => action.id === option);

      if (!selected) {
        output.write('Invalid option.\n');
        continue;
      }

      if (selected.id === '9') {
        break;
      }

      try {
        await selected.execute();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unexpected menu execution error.';
        output.write(`Error: ${message}\n`);
      }
    }
  } finally {
    rl.close();
  }
};

export const runFrameworkMenu = async (): Promise<void> => {
  await menu();
};
