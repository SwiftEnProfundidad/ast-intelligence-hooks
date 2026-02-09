import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { loadSkillsLock, type SkillsLockBundle } from '../integrations/config/skillsLock';
import { resolvePolicyForStage } from '../integrations/gate/stagePolicies';
import { runCiBackend } from '../integrations/git/ciBackend';
import { runCiFrontend } from '../integrations/git/ciFrontend';
import { runCiIOS } from '../integrations/git/ciIOS';
import { runPlatformGate } from '../integrations/git/runPlatformGate';
import { createFrameworkMenuPrompts } from './framework-menu-prompts';
import {
  printEvidence,
  resolveDefaultRangeFrom,
  runAdapterReadiness,
  runAdapterRealSessionReport,
  runAdapterSessionStatusReport,
  runAndPrintExitCode,
  runConsumerCiArtifactsScan,
  runConsumerCiAuthCheck,
  runConsumerStartupTriage,
  runConsumerStartupUnblockStatus,
  runConsumerSupportBundle,
  runConsumerSupportTicketDraft,
  runConsumerWorkflowLintScan,
  runMockConsumerAbReport,
  runPhase5BlockersReadiness,
  runPhase5ExecutionClosure,
  runPhase5ExecutionClosureStatus,
  runPhase5ExternalHandoff,
  runSkillsLockCheck,
  runValidationArtifactsCleanup,
  runValidationDocsHygiene,
} from './framework-menu-runners';

export * from './framework-menu-builders';

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

const runStaged = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'staged' },
  });

  await runAndPrintExitCode(() => runPlatformGate(gateParams));
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

  await runAndPrintExitCode(() => runPlatformGate(gateParams));
};

const menu = async (): Promise<void> => {
  const rl = createInterface({ input, output });

  try {
    const prompts = createFrameworkMenuPrompts(rl);

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
          const range = await prompts.askRange(resolveDefaultRangeFrom());
          await runRange({ ...range, stage: 'PRE_PUSH' });
        },
      },
      {
        id: '3',
        label: 'Evaluate commit range (CI policy)',
        execute: async () => {
          const range = await prompts.askRange(resolveDefaultRangeFrom());
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
        label: 'Build adapter session status report (optional diagnostics)',
        execute: async () => {
          const report = await prompts.askAdapterSessionStatusReport();
          await runAdapterSessionStatusReport(report);
        },
      },
      {
        id: '10',
        label: 'Collect consumer CI artifacts report',
        execute: async () => {
          const scan = await prompts.askConsumerCiScan();
          await runConsumerCiArtifactsScan(scan);
        },
      },
      {
        id: '11',
        label: 'Run consumer CI auth check report',
        execute: async () => {
          const check = await prompts.askConsumerCiAuthCheck();
          await runConsumerCiAuthCheck(check);
        },
      },
      {
        id: '12',
        label: 'Run consumer workflow lint report',
        execute: async () => {
          const lint = await prompts.askConsumerWorkflowLint();
          await runConsumerWorkflowLintScan(lint);
        },
      },
      {
        id: '13',
        label: 'Build consumer startup-failure support bundle',
        execute: async () => {
          const bundle = await prompts.askConsumerSupportBundle();
          await runConsumerSupportBundle(bundle);
        },
      },
      {
        id: '14',
        label: 'Build consumer support ticket draft',
        execute: async () => {
          const draft = await prompts.askConsumerSupportTicketDraft();
          await runConsumerSupportTicketDraft(draft);
        },
      },
      {
        id: '15',
        label: 'Build consumer startup-unblock status report',
        execute: async () => {
          const status = await prompts.askConsumerStartupUnblockStatus();
          await runConsumerStartupUnblockStatus(status);
        },
      },
      {
        id: '16',
        label: 'Build adapter real-session report (optional diagnostics)',
        execute: async () => {
          const report = await prompts.askAdapterRealSessionReport();
          await runAdapterRealSessionReport(report);
        },
      },
      {
        id: '17',
        label: 'Run docs/validation hygiene check',
        execute: async () => runAndPrintExitCode(runValidationDocsHygiene),
      },
      {
        id: '18',
        label: 'Run skills lock freshness check',
        execute: async () => runAndPrintExitCode(runSkillsLockCheck),
      },
      {
        id: '19',
        label: 'Run consumer startup triage bundle',
        execute: async () => {
          const triage = await prompts.askConsumerStartupTriage();
          await runConsumerStartupTriage(triage);
        },
      },
      {
        id: '20',
        label: 'Build mock consumer A/B validation report',
        execute: async () => {
          const report = await prompts.askMockConsumerAbReport();
          await runMockConsumerAbReport(report);
        },
      },
      {
        id: '21',
        label: 'Build phase5 blockers readiness report',
        execute: async () => {
          const report = await prompts.askPhase5BlockersReadiness();
          await runPhase5BlockersReadiness(report);
        },
      },
      {
        id: '22',
        label: 'Build adapter readiness report',
        execute: async () => {
          const report = await prompts.askAdapterReadiness();
          await runAdapterReadiness(report);
        },
      },
      {
        id: '23',
        label: 'Build phase5 execution closure status report',
        execute: async () => {
          const report = await prompts.askPhase5ExecutionClosureStatus();
          await runPhase5ExecutionClosureStatus(report);
        },
      },
      {
        id: '24',
        label: 'Run phase5 execution closure (one-shot orchestration)',
        execute: async () => {
          const params = await prompts.askPhase5ExecutionClosure();
          await runPhase5ExecutionClosure(params);
        },
      },
      {
        id: '25',
        label: 'Build phase5 external handoff report',
        execute: async () => {
          const params = await prompts.askPhase5ExternalHandoff();
          await runPhase5ExternalHandoff(params);
        },
      },
      {
        id: '26',
        label: 'Clean local validation artifacts',
        execute: async () => {
          const params = await prompts.askValidationArtifactsCleanup();
          await runAndPrintExitCode(() => runValidationArtifactsCleanup(params));
        },
      },
      {
        id: '27',
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

      if (selected.id === '27') {
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
