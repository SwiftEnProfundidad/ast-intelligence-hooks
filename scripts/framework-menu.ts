import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { loadSkillsLock, type SkillsLockBundle } from '../integrations/config/skillsLock';
import { resolvePolicyForStage } from '../integrations/gate/stagePolicies';
import { runCiBackend } from '../integrations/git/ciBackend';
import { runCiFrontend } from '../integrations/git/ciFrontend';
import { runCiIOS } from '../integrations/git/ciIOS';
import { runPlatformGate } from '../integrations/git/runPlatformGate';

type MenuAction = {
  id: string;
  label: string;
  execute: () => Promise<void>;
};

type MenuStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

type MenuScope =
  | { kind: 'staged' }
  | {
      kind: 'range';
      fromRef: string;
      toRef: string;
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

const runConsumerCiArtifactsScan = async (params: {
  repo: string;
  limit: number;
  outFile: string;
}): Promise<void> => {
  const scanScriptPath = resolve(
    process.cwd(),
    'scripts/collect-consumer-ci-artifacts.ts'
  );

  if (!existsSync(scanScriptPath)) {
    output.write(
      '\nCould not find scripts/collect-consumer-ci-artifacts.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    [
      '--yes',
      'tsx@4.21.0',
      scanScriptPath,
      '--repo',
      params.repo,
      '--limit',
      String(params.limit),
      '--out',
      params.outFile,
    ],
    {
      stdio: 'inherit',
    }
  );
};

export const buildMenuGateParams = (params: {
  stage: MenuStage;
  scope: MenuScope;
  repoRoot?: string;
}) => {
  const resolved = resolvePolicyForStage(params.stage, params.repoRoot);
  return {
    policy: resolved.policy,
    policyTrace: resolved.trace,
    scope: params.scope,
  };
};

const runStaged = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'staged' },
  });
  await runAndPrintExitCode(() =>
    runPlatformGate(gateParams)
  );
};

const runRange = async (params: {
  fromRef: string;
  toRef: string;
  stage: 'PRE_PUSH' | 'CI';
}): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: params.stage,
    scope: {
      kind: 'range',
      fromRef: params.fromRef,
      toRef: params.toRef,
    },
  });

  await runAndPrintExitCode(() =>
    runPlatformGate(gateParams)
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

    const askConsumerCiScan = async (): Promise<{
      repo: string;
      limit: number;
      outFile: string;
    }> => {
      const repoPrompt = await rl.question(
        'consumer repo (owner/repo) [SwiftEnProfundidad/R_GO]: '
      );
      const limitPrompt = await rl.question('runs to inspect [20]: ');
      const outPrompt = await rl.question(
        'output path [docs/validation/consumer-ci-artifacts-report.md]: '
      );

      const repo = repoPrompt.trim() || 'SwiftEnProfundidad/R_GO';
      const limit = Number.parseInt(limitPrompt.trim() || '20', 10);
      const outFile =
        outPrompt.trim() || 'docs/validation/consumer-ci-artifacts-report.md';

      return {
        repo,
        limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
        outFile,
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
        label: 'Collect consumer CI artifacts report',
        execute: async () => {
          const scan = await askConsumerCiScan();
          await runConsumerCiArtifactsScan(scan);
        },
      },
      {
        id: '10',
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

      if (selected.id === '10') {
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
