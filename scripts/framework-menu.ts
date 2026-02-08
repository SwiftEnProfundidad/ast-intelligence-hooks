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

const runWindsurfSessionStatusReport = async (params: {
  outFile: string;
}): Promise<void> => {
  const reportScriptPath = resolve(
    process.cwd(),
    'scripts/build-windsurf-session-status.ts'
  );

  if (!existsSync(reportScriptPath)) {
    output.write(
      '\nCould not find scripts/build-windsurf-session-status.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    [
      '--yes',
      'tsx@4.21.0',
      reportScriptPath,
      '--out',
      params.outFile,
    ],
    {
      stdio: 'inherit',
    }
  );
};

export const buildWindsurfRealSessionReportCommandArgs = (params: {
  scriptPath: string;
  statusReportFile: string;
  outFile: string;
}): string[] => {
  return [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
    '--status-report',
    params.statusReportFile,
    '--out',
    params.outFile,
  ];
};

export const buildConsumerStartupTriageCommandArgs = (params: {
  scriptPath: string;
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  repoPath?: string;
  actionlintBin?: string;
}): string[] => {
  const args = [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
    '--repo',
    params.repo,
    '--limit',
    String(params.limit),
    '--out-dir',
    params.outDir,
  ];

  if (!params.runWorkflowLint) {
    args.push('--skip-workflow-lint');
    return args;
  }

  if (params.repoPath) {
    args.push('--repo-path', params.repoPath);
  }
  if (params.actionlintBin) {
    args.push('--actionlint-bin', params.actionlintBin);
  }

  return args;
};

export const buildValidationDocsHygieneCommandArgs = (params: {
  scriptPath: string;
}): string[] => {
  return [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
  ];
};

export const buildSkillsLockCheckCommandArgs = (): string[] => {
  return [
    'run',
    'skills:lock:check',
  ];
};

const runWindsurfRealSessionReport = async (params: {
  statusReportFile: string;
  outFile: string;
}): Promise<void> => {
  const reportScriptPath = resolve(
    process.cwd(),
    'scripts/build-windsurf-real-session-report.ts'
  );

  if (!existsSync(reportScriptPath)) {
    output.write(
      '\nCould not find scripts/build-windsurf-real-session-report.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    buildWindsurfRealSessionReportCommandArgs({
      scriptPath: reportScriptPath,
      statusReportFile: params.statusReportFile,
      outFile: params.outFile,
    }),
    {
      stdio: 'inherit',
    }
  );
};

const runValidationDocsHygiene = async (): Promise<number> => {
  const scriptPath = resolve(process.cwd(), 'scripts/check-validation-docs-hygiene.ts');

  if (!existsSync(scriptPath)) {
    output.write(
      '\nCould not find scripts/check-validation-docs-hygiene.ts in current repository.\n'
    );
    return 1;
  }

  try {
    execFileSync(
      'npx',
      buildValidationDocsHygieneCommandArgs({ scriptPath }),
      {
        stdio: 'inherit',
      }
    );
    return 0;
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) {
      const status = Number((error as { status?: number }).status ?? 1);
      return Number.isFinite(status) ? status : 1;
    }
    return 1;
  }
};

const runSkillsLockCheck = async (): Promise<number> => {
  try {
    execFileSync(
      'npm',
      buildSkillsLockCheckCommandArgs(),
      {
        stdio: 'inherit',
      }
    );
    return 0;
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) {
      const status = Number((error as { status?: number }).status ?? 1);
      return Number.isFinite(status) ? status : 1;
    }
    return 1;
  }
};

const runConsumerStartupTriage = async (params: {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  repoPath?: string;
  actionlintBin?: string;
}): Promise<void> => {
  const scriptPath = resolve(process.cwd(), 'scripts/build-consumer-startup-triage.ts');

  if (!existsSync(scriptPath)) {
    output.write(
      '\nCould not find scripts/build-consumer-startup-triage.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    buildConsumerStartupTriageCommandArgs({
      scriptPath,
      repo: params.repo,
      limit: params.limit,
      outDir: params.outDir,
      runWorkflowLint: params.runWorkflowLint,
      repoPath: params.repoPath,
      actionlintBin: params.actionlintBin,
    }),
    {
      stdio: 'inherit',
    }
  );
};

const runConsumerCiAuthCheck = async (params: {
  repo: string;
  outFile: string;
}): Promise<void> => {
  const authCheckScriptPath = resolve(
    process.cwd(),
    'scripts/check-consumer-ci-auth.ts'
  );

  if (!existsSync(authCheckScriptPath)) {
    output.write(
      '\nCould not find scripts/check-consumer-ci-auth.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    [
      '--yes',
      'tsx@4.21.0',
      authCheckScriptPath,
      '--repo',
      params.repo,
      '--out',
      params.outFile,
    ],
    {
      stdio: 'inherit',
    }
  );
};

const runConsumerWorkflowLintScan = async (params: {
  repoPath: string;
  actionlintBin: string;
  outFile: string;
}): Promise<void> => {
  const lintScriptPath = resolve(
    process.cwd(),
    'scripts/lint-consumer-workflows.ts'
  );

  if (!existsSync(lintScriptPath)) {
    output.write(
      '\nCould not find scripts/lint-consumer-workflows.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    [
      '--yes',
      'tsx@4.21.0',
      lintScriptPath,
      '--repo-path',
      params.repoPath,
      '--actionlint-bin',
      params.actionlintBin,
      '--out',
      params.outFile,
    ],
    {
      stdio: 'inherit',
    }
  );
};

const runConsumerSupportBundle = async (params: {
  repo: string;
  limit: number;
  outFile: string;
}): Promise<void> => {
  const bundleScriptPath = resolve(
    process.cwd(),
    'scripts/build-consumer-startup-failure-support-bundle.ts'
  );

  if (!existsSync(bundleScriptPath)) {
    output.write(
      '\nCould not find scripts/build-consumer-startup-failure-support-bundle.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    [
      '--yes',
      'tsx@4.21.0',
      bundleScriptPath,
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

const runConsumerSupportTicketDraft = async (params: {
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
  outFile: string;
}): Promise<void> => {
  const draftScriptPath = resolve(
    process.cwd(),
    'scripts/build-consumer-support-ticket-draft.ts'
  );

  if (!existsSync(draftScriptPath)) {
    output.write(
      '\nCould not find scripts/build-consumer-support-ticket-draft.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    [
      '--yes',
      'tsx@4.21.0',
      draftScriptPath,
      '--repo',
      params.repo,
      '--support-bundle',
      params.supportBundleFile,
      '--auth-report',
      params.authReportFile,
      '--out',
      params.outFile,
    ],
    {
      stdio: 'inherit',
    }
  );
};

const runConsumerStartupUnblockStatus = async (params: {
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
  workflowLintReportFile: string;
  outFile: string;
}): Promise<void> => {
  const statusScriptPath = resolve(
    process.cwd(),
    'scripts/build-consumer-startup-unblock-status.ts'
  );

  if (!existsSync(statusScriptPath)) {
    output.write(
      '\nCould not find scripts/build-consumer-startup-unblock-status.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    [
      '--yes',
      'tsx@4.21.0',
      statusScriptPath,
      '--repo',
      params.repo,
      '--support-bundle',
      params.supportBundleFile,
      '--auth-report',
      params.authReportFile,
      '--workflow-lint-report',
      params.workflowLintReportFile,
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
        'consumer repo (owner/repo) [owner/repo]: '
      );
      const limitPrompt = await rl.question('runs to inspect [20]: ');
      const outPrompt = await rl.question(
        'output path [docs/validation/consumer-ci-artifacts-report.md]: '
      );

      const repo = repoPrompt.trim() || 'owner/repo';
      const limit = Number.parseInt(limitPrompt.trim() || '20', 10);
      const outFile =
        outPrompt.trim() || 'docs/validation/consumer-ci-artifacts-report.md';

      return {
        repo,
        limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
        outFile,
      };
    };

    const askWindsurfSessionStatusReport = async (): Promise<{
      outFile: string;
    }> => {
      const outPrompt = await rl.question(
        'output path [docs/validation/windsurf-session-status.md]: '
      );

      return {
        outFile: outPrompt.trim() || 'docs/validation/windsurf-session-status.md',
      };
    };

    const askWindsurfRealSessionReport = async (): Promise<{
      statusReportFile: string;
      outFile: string;
    }> => {
      const statusPrompt = await rl.question(
        'status report path [docs/validation/windsurf-session-status.md]: '
      );
      const outPrompt = await rl.question(
        'output path [docs/validation/windsurf-real-session-report.md]: '
      );

      return {
        statusReportFile:
          statusPrompt.trim() || 'docs/validation/windsurf-session-status.md',
        outFile: outPrompt.trim() || 'docs/validation/windsurf-real-session-report.md',
      };
    };

    const askConsumerWorkflowLint = async (): Promise<{
      repoPath: string;
      actionlintBin: string;
      outFile: string;
    }> => {
      const repoPathPrompt = await rl.question(
        'consumer repo path [/Users/juancarlosmerlosalbarracin/Developer/Projects/R_GO]: '
      );
      const actionlintBinPrompt = await rl.question(
        'actionlint binary [/tmp/actionlint-bin/actionlint]: '
      );
      const outPrompt = await rl.question(
        'output path [docs/validation/consumer-workflow-lint-report.md]: '
      );

      return {
        repoPath:
          repoPathPrompt.trim() ||
          '/Users/juancarlosmerlosalbarracin/Developer/Projects/R_GO',
        actionlintBin: actionlintBinPrompt.trim() || '/tmp/actionlint-bin/actionlint',
        outFile: outPrompt.trim() || 'docs/validation/consumer-workflow-lint-report.md',
      };
    };

    const askConsumerCiAuthCheck = async (): Promise<{
      repo: string;
      outFile: string;
    }> => {
      const repoPrompt = await rl.question(
        'consumer repo (owner/repo) [owner/repo]: '
      );
      const outPrompt = await rl.question(
        'output path [docs/validation/consumer-ci-auth-check.md]: '
      );

      return {
        repo: repoPrompt.trim() || 'owner/repo',
        outFile: outPrompt.trim() || 'docs/validation/consumer-ci-auth-check.md',
      };
    };

    const askConsumerSupportBundle = async (): Promise<{
      repo: string;
      limit: number;
      outFile: string;
    }> => {
      const repoPrompt = await rl.question(
        'consumer repo (owner/repo) [owner/repo]: '
      );
      const limitPrompt = await rl.question('runs to inspect [20]: ');
      const outPrompt = await rl.question(
        'output path [docs/validation/consumer-startup-failure-support-bundle.md]: '
      );

      const repo = repoPrompt.trim() || 'owner/repo';
      const limit = Number.parseInt(limitPrompt.trim() || '20', 10);
      const outFile =
        outPrompt.trim() || 'docs/validation/consumer-startup-failure-support-bundle.md';

      return {
        repo,
        limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
        outFile,
      };
    };

    const askConsumerSupportTicketDraft = async (): Promise<{
      repo: string;
      supportBundleFile: string;
      authReportFile: string;
      outFile: string;
    }> => {
      const repoPrompt = await rl.question(
        'consumer repo (owner/repo) [owner/repo]: '
      );
      const supportBundlePrompt = await rl.question(
        'support bundle path [docs/validation/consumer-startup-failure-support-bundle.md]: '
      );
      const authReportPrompt = await rl.question(
        'auth report path [docs/validation/consumer-ci-auth-check.md]: '
      );
      const outPrompt = await rl.question(
        'output path [docs/validation/consumer-support-ticket-draft.md]: '
      );

      return {
        repo: repoPrompt.trim() || 'owner/repo',
        supportBundleFile:
          supportBundlePrompt.trim() ||
          'docs/validation/consumer-startup-failure-support-bundle.md',
        authReportFile:
          authReportPrompt.trim() || 'docs/validation/consumer-ci-auth-check.md',
        outFile: outPrompt.trim() || 'docs/validation/consumer-support-ticket-draft.md',
      };
    };

    const askConsumerStartupUnblockStatus = async (): Promise<{
      repo: string;
      supportBundleFile: string;
      authReportFile: string;
      workflowLintReportFile: string;
      outFile: string;
    }> => {
      const repoPrompt = await rl.question(
        'consumer repo (owner/repo) [owner/repo]: '
      );
      const supportBundlePrompt = await rl.question(
        'support bundle path [docs/validation/consumer-startup-failure-support-bundle.md]: '
      );
      const authReportPrompt = await rl.question(
        'auth report path [docs/validation/consumer-ci-auth-check.md]: '
      );
      const workflowLintPrompt = await rl.question(
        'workflow lint report path [docs/validation/consumer-workflow-lint-report.md]: '
      );
      const outPrompt = await rl.question(
        'output path [docs/validation/consumer-startup-unblock-status.md]: '
      );

      return {
        repo: repoPrompt.trim() || 'owner/repo',
        supportBundleFile:
          supportBundlePrompt.trim() ||
          'docs/validation/consumer-startup-failure-support-bundle.md',
        authReportFile:
          authReportPrompt.trim() || 'docs/validation/consumer-ci-auth-check.md',
        workflowLintReportFile:
          workflowLintPrompt.trim() || 'docs/validation/consumer-workflow-lint-report.md',
        outFile: outPrompt.trim() || 'docs/validation/consumer-startup-unblock-status.md',
      };
    };

    const askConsumerStartupTriage = async (): Promise<{
      repo: string;
      limit: number;
      outDir: string;
      runWorkflowLint: boolean;
      repoPath?: string;
      actionlintBin?: string;
    }> => {
      const repoPrompt = await rl.question(
        'consumer repo (owner/repo) [owner/repo]: '
      );
      const limitPrompt = await rl.question('runs to inspect [20]: ');
      const outDirPrompt = await rl.question(
        'output directory [docs/validation]: '
      );
      const workflowLintPrompt = await rl.question(
        'include workflow lint? [no]: '
      );

      const runWorkflowLint = workflowLintPrompt.trim().toLowerCase().startsWith('y');

      if (!runWorkflowLint) {
        return {
          repo: repoPrompt.trim() || 'owner/repo',
          limit: Number.parseInt(limitPrompt.trim() || '20', 10) || 20,
          outDir: outDirPrompt.trim() || 'docs/validation',
          runWorkflowLint: false,
        };
      }

      const repoPathPrompt = await rl.question(
        'consumer repo path [/Users/juancarlosmerlosalbarracin/Developer/Projects/R_GO]: '
      );
      const actionlintBinPrompt = await rl.question(
        'actionlint binary [/tmp/actionlint-bin/actionlint]: '
      );

      return {
        repo: repoPrompt.trim() || 'owner/repo',
        limit: Number.parseInt(limitPrompt.trim() || '20', 10) || 20,
        outDir: outDirPrompt.trim() || 'docs/validation',
        runWorkflowLint: true,
        repoPath:
          repoPathPrompt.trim() ||
          '/Users/juancarlosmerlosalbarracin/Developer/Projects/R_GO',
        actionlintBin: actionlintBinPrompt.trim() || '/tmp/actionlint-bin/actionlint',
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
        label: 'Build Windsurf session status report',
        execute: async () => {
          const report = await askWindsurfSessionStatusReport();
          await runWindsurfSessionStatusReport(report);
        },
      },
      {
        id: '10',
        label: 'Collect consumer CI artifacts report',
        execute: async () => {
          const scan = await askConsumerCiScan();
          await runConsumerCiArtifactsScan(scan);
        },
      },
      {
        id: '11',
        label: 'Run consumer CI auth check report',
        execute: async () => {
          const check = await askConsumerCiAuthCheck();
          await runConsumerCiAuthCheck(check);
        },
      },
      {
        id: '12',
        label: 'Run consumer workflow lint report',
        execute: async () => {
          const lint = await askConsumerWorkflowLint();
          await runConsumerWorkflowLintScan(lint);
        },
      },
      {
        id: '13',
        label: 'Build consumer startup-failure support bundle',
        execute: async () => {
          const bundle = await askConsumerSupportBundle();
          await runConsumerSupportBundle(bundle);
        },
      },
      {
        id: '14',
        label: 'Build consumer support ticket draft',
        execute: async () => {
          const draft = await askConsumerSupportTicketDraft();
          await runConsumerSupportTicketDraft(draft);
        },
      },
      {
        id: '15',
        label: 'Build consumer startup-unblock status report',
        execute: async () => {
          const status = await askConsumerStartupUnblockStatus();
          await runConsumerStartupUnblockStatus(status);
        },
      },
      {
        id: '16',
        label: 'Build Windsurf real-session report',
        execute: async () => {
          const report = await askWindsurfRealSessionReport();
          await runWindsurfRealSessionReport(report);
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
          const triage = await askConsumerStartupTriage();
          await runConsumerStartupTriage(triage);
        },
      },
      {
        id: '20',
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

      if (selected.id === '20') {
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
