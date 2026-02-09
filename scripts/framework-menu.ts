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

const DEFAULT_ACTIONLINT_BIN = '/tmp/actionlint-bin/actionlint';
const DEFAULT_CONSUMER_REPO_PATH =
  process.env.PUMUKI_CONSUMER_REPO_PATH?.trim() || '/path/to/consumer-repo';

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

const runAdapterSessionStatusReport = async (params: {
  outFile: string;
}): Promise<void> => {
  const reportScriptPath = resolve(
    process.cwd(),
    'scripts/build-adapter-session-status.ts'
  );

  if (!existsSync(reportScriptPath)) {
    output.write(
      '\nCould not find scripts/build-adapter-session-status.ts in current repository.\n'
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

export const buildAdapterRealSessionReportCommandArgs = (params: {
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

export const buildCleanValidationArtifactsCommandArgs = (params: {
  scriptPath: string;
  dryRun: boolean;
}): string[] => {
  const args = [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
  ];

  if (params.dryRun) {
    args.push('--dry-run');
  }

  return args;
};

export const buildPhase5BlockersReadinessCommandArgs = (params: {
  scriptPath: string;
  adapterReportFile: string;
  consumerTriageReportFile: string;
  outFile: string;
}): string[] => {
  return [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
    '--adapter-report',
    params.adapterReportFile,
    '--consumer-triage-report',
    params.consumerTriageReportFile,
    '--out',
    params.outFile,
  ];
};

export const buildPhase5ExecutionClosureStatusCommandArgs = (params: {
  scriptPath: string;
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  adapterReadinessReportFile: string;
  outFile: string;
  requireAdapterReadiness: boolean;
}): string[] => {
  const args = [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
    '--phase5-blockers-report',
    params.phase5BlockersReportFile,
    '--consumer-unblock-report',
    params.consumerUnblockReportFile,
    '--adapter-readiness-report',
    params.adapterReadinessReportFile,
    '--out',
    params.outFile,
  ];

  if (params.requireAdapterReadiness) {
    args.push('--require-adapter-readiness');
  }

  return args;
};

export const buildPhase5ExecutionClosureCommandArgs = (params: {
  scriptPath: string;
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  includeAuthPreflight: boolean;
  repoPath?: string;
  actionlintBin?: string;
  includeAdapter: boolean;
  requireAdapterReadiness: boolean;
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
  } else {
    if (params.repoPath) {
      args.push('--repo-path', params.repoPath);
    }
    if (params.actionlintBin) {
      args.push('--actionlint-bin', params.actionlintBin);
    }
  }

  if (!params.includeAuthPreflight) {
    args.push('--skip-auth-preflight');
  }

  if (!params.includeAdapter) {
    args.push('--skip-adapter');
  }

  if (params.requireAdapterReadiness) {
    args.push('--require-adapter-readiness');
  }

  return args;
};

export const buildAdapterReadinessCommandArgs = (params: {
  scriptPath: string;
  adapterReportFile: string;
  outFile: string;
}): string[] => {
  return [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
    '--adapter-report',
    params.adapterReportFile,
    '--out',
    params.outFile,
  ];
};

export const buildSkillsLockCheckCommandArgs = (): string[] => {
  return [
    'run',
    'skills:lock:check',
  ];
};

const runAdapterRealSessionReport = async (params: {
  statusReportFile: string;
  outFile: string;
}): Promise<void> => {
  const reportScriptPath = resolve(
    process.cwd(),
    'scripts/build-adapter-real-session-report.ts'
  );

  if (!existsSync(reportScriptPath)) {
    output.write(
      '\nCould not find scripts/build-adapter-real-session-report.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    buildAdapterRealSessionReportCommandArgs({
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

const runValidationArtifactsCleanup = async (params: {
  dryRun: boolean;
}): Promise<number> => {
  const scriptPath = resolve(process.cwd(), 'scripts/clean-validation-artifacts.ts');

  if (!existsSync(scriptPath)) {
    output.write(
      '\nCould not find scripts/clean-validation-artifacts.ts in current repository.\n'
    );
    return 1;
  }

  try {
    execFileSync(
      'npx',
      buildCleanValidationArtifactsCommandArgs({
        scriptPath,
        dryRun: params.dryRun,
      }),
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

const runPhase5BlockersReadiness = async (params: {
  adapterReportFile: string;
  consumerTriageReportFile: string;
  outFile: string;
}): Promise<void> => {
  const scriptPath = resolve(
    process.cwd(),
    'scripts/build-phase5-blockers-readiness.ts'
  );

  if (!existsSync(scriptPath)) {
    output.write(
      '\nCould not find scripts/build-phase5-blockers-readiness.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    buildPhase5BlockersReadinessCommandArgs({
      scriptPath,
      adapterReportFile: params.adapterReportFile,
      consumerTriageReportFile: params.consumerTriageReportFile,
      outFile: params.outFile,
    }),
    {
      stdio: 'inherit',
    }
  );
};

const runPhase5ExecutionClosureStatus = async (params: {
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  adapterReadinessReportFile: string;
  outFile: string;
  requireAdapterReadiness: boolean;
}): Promise<void> => {
  const scriptPath = resolve(
    process.cwd(),
    'scripts/build-phase5-execution-closure-status.ts'
  );

  if (!existsSync(scriptPath)) {
    output.write(
      '\nCould not find scripts/build-phase5-execution-closure-status.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    buildPhase5ExecutionClosureStatusCommandArgs({
      scriptPath,
      phase5BlockersReportFile: params.phase5BlockersReportFile,
      consumerUnblockReportFile: params.consumerUnblockReportFile,
      adapterReadinessReportFile: params.adapterReadinessReportFile,
      outFile: params.outFile,
      requireAdapterReadiness: params.requireAdapterReadiness,
    }),
    {
      stdio: 'inherit',
    }
  );
};

const runAdapterReadiness = async (params: {
  adapterReportFile: string;
  outFile: string;
}): Promise<void> => {
  const scriptPath = resolve(
    process.cwd(),
    'scripts/build-adapter-readiness.ts'
  );

  if (!existsSync(scriptPath)) {
    output.write(
      '\nCould not find scripts/build-adapter-readiness.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    buildAdapterReadinessCommandArgs({
      scriptPath,
      adapterReportFile: params.adapterReportFile,
      outFile: params.outFile,
    }),
    {
      stdio: 'inherit',
    }
  );
};

const runPhase5ExecutionClosure = async (params: {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  includeAuthPreflight: boolean;
  repoPath?: string;
  actionlintBin?: string;
  includeAdapter: boolean;
  requireAdapterReadiness: boolean;
}): Promise<void> => {
  const scriptPath = resolve(
    process.cwd(),
    'scripts/run-phase5-execution-closure.ts'
  );

  if (!existsSync(scriptPath)) {
    output.write(
      '\nCould not find scripts/run-phase5-execution-closure.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    buildPhase5ExecutionClosureCommandArgs({
      scriptPath,
      repo: params.repo,
      limit: params.limit,
      outDir: params.outDir,
      runWorkflowLint: params.runWorkflowLint,
      includeAuthPreflight: params.includeAuthPreflight,
      repoPath: params.repoPath,
      actionlintBin: params.actionlintBin,
      includeAdapter: params.includeAdapter,
      requireAdapterReadiness: params.requireAdapterReadiness,
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
        'output path [.audit-reports/consumer-triage/consumer-ci-artifacts-report.md]: '
      );

      const repo = repoPrompt.trim() || 'owner/repo';
      const limit = Number.parseInt(limitPrompt.trim() || '20', 10);
      const outFile =
        outPrompt.trim() || '.audit-reports/consumer-triage/consumer-ci-artifacts-report.md';

      return {
        repo,
        limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
        outFile,
      };
    };

    const askAdapterSessionStatusReport = async (): Promise<{
      outFile: string;
    }> => {
      const outPrompt = await rl.question(
        'output path [.audit-reports/adapter/adapter-session-status.md]: '
      );

      return {
        outFile: outPrompt.trim() || '.audit-reports/adapter/adapter-session-status.md',
      };
    };

    const askAdapterRealSessionReport = async (): Promise<{
      statusReportFile: string;
      outFile: string;
    }> => {
      const statusPrompt = await rl.question(
        'status report path [.audit-reports/adapter/adapter-session-status.md]: '
      );
      const outPrompt = await rl.question(
        'output path [.audit-reports/adapter/adapter-real-session-report.md]: '
      );

      return {
        statusReportFile:
          statusPrompt.trim() || '.audit-reports/adapter/adapter-session-status.md',
        outFile: outPrompt.trim() || '.audit-reports/adapter/adapter-real-session-report.md',
      };
    };

    const askConsumerWorkflowLint = async (): Promise<{
      repoPath: string;
      actionlintBin: string;
      outFile: string;
    }> => {
      const repoPathPrompt = await rl.question(
        `consumer repo path [${DEFAULT_CONSUMER_REPO_PATH}]: `
      );
      const actionlintBinPrompt = await rl.question(
        `actionlint binary [${DEFAULT_ACTIONLINT_BIN}]: `
      );
      const outPrompt = await rl.question(
        'output path [.audit-reports/consumer-triage/consumer-workflow-lint-report.md]: '
      );

      return {
        repoPath: repoPathPrompt.trim() || DEFAULT_CONSUMER_REPO_PATH,
        actionlintBin: actionlintBinPrompt.trim() || DEFAULT_ACTIONLINT_BIN,
        outFile: outPrompt.trim() || '.audit-reports/consumer-triage/consumer-workflow-lint-report.md',
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
        'output path [.audit-reports/consumer-triage/consumer-ci-auth-check.md]: '
      );

      return {
        repo: repoPrompt.trim() || 'owner/repo',
        outFile: outPrompt.trim() || '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
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
        'output path [.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md]: '
      );

      const repo = repoPrompt.trim() || 'owner/repo';
      const limit = Number.parseInt(limitPrompt.trim() || '20', 10);
      const outFile =
        outPrompt.trim() || '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md';

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
        'support bundle path [.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md]: '
      );
      const authReportPrompt = await rl.question(
        'auth report path [.audit-reports/consumer-triage/consumer-ci-auth-check.md]: '
      );
      const outPrompt = await rl.question(
        'output path [.audit-reports/consumer-triage/consumer-support-ticket-draft.md]: '
      );

      return {
        repo: repoPrompt.trim() || 'owner/repo',
        supportBundleFile:
          supportBundlePrompt.trim() ||
          '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md',
        authReportFile:
          authReportPrompt.trim() || '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
        outFile: outPrompt.trim() || '.audit-reports/consumer-triage/consumer-support-ticket-draft.md',
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
        'support bundle path [.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md]: '
      );
      const authReportPrompt = await rl.question(
        'auth report path [.audit-reports/consumer-triage/consumer-ci-auth-check.md]: '
      );
      const workflowLintPrompt = await rl.question(
        'workflow lint report path [.audit-reports/consumer-triage/consumer-workflow-lint-report.md]: '
      );
      const outPrompt = await rl.question(
        'output path [.audit-reports/consumer-triage/consumer-startup-unblock-status.md]: '
      );

      return {
        repo: repoPrompt.trim() || 'owner/repo',
        supportBundleFile:
          supportBundlePrompt.trim() ||
          '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md',
        authReportFile:
          authReportPrompt.trim() || '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
        workflowLintReportFile:
          workflowLintPrompt.trim() || '.audit-reports/consumer-triage/consumer-workflow-lint-report.md',
        outFile: outPrompt.trim() || '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
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
        'output directory [.audit-reports/consumer-triage]: '
      );
      const workflowLintPrompt = await rl.question(
        'include workflow lint? [no]: '
      );

      const runWorkflowLint = workflowLintPrompt.trim().toLowerCase().startsWith('y');

      if (!runWorkflowLint) {
        return {
          repo: repoPrompt.trim() || 'owner/repo',
          limit: Number.parseInt(limitPrompt.trim() || '20', 10) || 20,
          outDir: outDirPrompt.trim() || '.audit-reports/consumer-triage',
          runWorkflowLint: false,
        };
      }

      const repoPathPrompt = await rl.question(
        `consumer repo path [${DEFAULT_CONSUMER_REPO_PATH}]: `
      );
      const actionlintBinPrompt = await rl.question(
        `actionlint binary [${DEFAULT_ACTIONLINT_BIN}]: `
      );

      return {
        repo: repoPrompt.trim() || 'owner/repo',
        limit: Number.parseInt(limitPrompt.trim() || '20', 10) || 20,
        outDir: outDirPrompt.trim() || '.audit-reports/consumer-triage',
        runWorkflowLint: true,
        repoPath: repoPathPrompt.trim() || DEFAULT_CONSUMER_REPO_PATH,
        actionlintBin: actionlintBinPrompt.trim() || DEFAULT_ACTIONLINT_BIN,
      };
    };

    const askPhase5BlockersReadiness = async (): Promise<{
      adapterReportFile: string;
      consumerTriageReportFile: string;
      outFile: string;
    }> => {
      const adapterPrompt = await rl.question(
        'adapter report path [.audit-reports/adapter/adapter-real-session-report.md]: '
      );
      const consumerPrompt = await rl.question(
        'consumer triage report path [.audit-reports/consumer-triage/consumer-startup-triage-report.md]: '
      );
      const outPrompt = await rl.question(
        'output path [.audit-reports/phase5/phase5-blockers-readiness.md]: '
      );

      return {
        adapterReportFile:
          adapterPrompt.trim() || '.audit-reports/adapter/adapter-real-session-report.md',
        consumerTriageReportFile:
          consumerPrompt.trim() || '.audit-reports/consumer-triage/consumer-startup-triage-report.md',
        outFile: outPrompt.trim() || '.audit-reports/phase5/phase5-blockers-readiness.md',
      };
    };

    const askAdapterReadiness = async (): Promise<{
      adapterReportFile: string;
      outFile: string;
    }> => {
      const adapterPrompt = await rl.question(
        'adapter report path [.audit-reports/adapter/adapter-real-session-report.md]: '
      );
      const outPrompt = await rl.question(
        'output path [.audit-reports/adapter/adapter-readiness.md]: '
      );

      return {
        adapterReportFile:
          adapterPrompt.trim() || '.audit-reports/adapter/adapter-real-session-report.md',
        outFile: outPrompt.trim() || '.audit-reports/adapter/adapter-readiness.md',
      };
    };

    const askPhase5ExecutionClosureStatus = async (): Promise<{
      phase5BlockersReportFile: string;
      consumerUnblockReportFile: string;
      adapterReadinessReportFile: string;
      outFile: string;
      requireAdapterReadiness: boolean;
    }> => {
      const blockersPrompt = await rl.question(
        'phase5 blockers report path [.audit-reports/phase5/phase5-blockers-readiness.md]: '
      );
      const consumerPrompt = await rl.question(
        'consumer unblock report path [.audit-reports/consumer-triage/consumer-startup-unblock-status.md]: '
      );
      const adapterPrompt = await rl.question(
        'adapter readiness report path [.audit-reports/adapter/adapter-readiness.md]: '
      );
      const requireAdapterPrompt = await rl.question(
        'require adapter readiness verdict READY? [no]: '
      );
      const outPrompt = await rl.question(
        'output path [.audit-reports/phase5/phase5-execution-closure-status.md]: '
      );

      return {
        phase5BlockersReportFile:
          blockersPrompt.trim() || '.audit-reports/phase5/phase5-blockers-readiness.md',
        consumerUnblockReportFile:
          consumerPrompt.trim() || '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
        adapterReadinessReportFile:
          adapterPrompt.trim() || '.audit-reports/adapter/adapter-readiness.md',
        outFile:
          outPrompt.trim() || '.audit-reports/phase5/phase5-execution-closure-status.md',
        requireAdapterReadiness:
          requireAdapterPrompt.trim().toLowerCase().startsWith('y'),
      };
    };

    const askPhase5ExecutionClosure = async (): Promise<{
      repo: string;
      limit: number;
      outDir: string;
      runWorkflowLint: boolean;
      includeAuthPreflight: boolean;
      repoPath?: string;
      actionlintBin?: string;
      includeAdapter: boolean;
      requireAdapterReadiness: boolean;
    }> => {
      const repoPrompt = await rl.question(
        'consumer repo (owner/repo) [owner/repo]: '
      );
      const limitPrompt = await rl.question('runs to inspect [20]: ');
      const outDirPrompt = await rl.question(
        'output directory [.audit-reports/phase5]: '
      );
      const workflowLintPrompt = await rl.question(
        'include workflow lint? [yes]: '
      );
      const authPreflightPrompt = await rl.question(
        'run auth preflight and fail-fast on auth block? [yes]: '
      );
      const includeAdapterPrompt = await rl.question(
        'include adapter diagnostics? [yes]: '
      );
      const requireAdapterPrompt = await rl.question(
        'require adapter readiness verdict READY? [no]: '
      );

      const runWorkflowLint = !workflowLintPrompt.trim()
        ? true
        : workflowLintPrompt.trim().toLowerCase().startsWith('y');
      const includeAuthPreflight = !authPreflightPrompt.trim()
        ? true
        : authPreflightPrompt.trim().toLowerCase().startsWith('y');
      const includeAdapter = !includeAdapterPrompt.trim()
        ? true
        : includeAdapterPrompt.trim().toLowerCase().startsWith('y');
      const requireAdapterReadiness = includeAdapter
        ? requireAdapterPrompt.trim().toLowerCase().startsWith('y')
        : false;

      let repoPath: string | undefined;
      let actionlintBin: string | undefined;

      if (runWorkflowLint) {
        const repoPathPrompt = await rl.question(
          `consumer repo path [${DEFAULT_CONSUMER_REPO_PATH}]: `
        );
        const actionlintBinPrompt = await rl.question(
          `actionlint binary [${DEFAULT_ACTIONLINT_BIN}]: `
        );

        repoPath = repoPathPrompt.trim() || DEFAULT_CONSUMER_REPO_PATH;
        actionlintBin = actionlintBinPrompt.trim() || DEFAULT_ACTIONLINT_BIN;
      }

      return {
        repo: repoPrompt.trim() || 'owner/repo',
        limit: Number.parseInt(limitPrompt.trim() || '20', 10) || 20,
        outDir: outDirPrompt.trim() || '.audit-reports/phase5',
        runWorkflowLint,
        includeAuthPreflight,
        repoPath,
        actionlintBin,
        includeAdapter,
        requireAdapterReadiness,
      };
    };

    const askValidationArtifactsCleanup = async (): Promise<{
      dryRun: boolean;
    }> => {
      const dryRunPrompt = await rl.question('dry-run only? [yes]: ');
      const dryRun = !dryRunPrompt.trim()
        ? true
        : dryRunPrompt.trim().toLowerCase().startsWith('y');
      return { dryRun };
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
        label: 'Build adapter session status report (optional diagnostics)',
        execute: async () => {
          const report = await askAdapterSessionStatusReport();
          await runAdapterSessionStatusReport(report);
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
        label: 'Build adapter real-session report (optional diagnostics)',
        execute: async () => {
          const report = await askAdapterRealSessionReport();
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
          const triage = await askConsumerStartupTriage();
          await runConsumerStartupTriage(triage);
        },
      },
      {
        id: '20',
        label: 'Build phase5 blockers readiness report',
        execute: async () => {
          const report = await askPhase5BlockersReadiness();
          await runPhase5BlockersReadiness(report);
        },
      },
      {
        id: '21',
        label: 'Build adapter readiness report',
        execute: async () => {
          const report = await askAdapterReadiness();
          await runAdapterReadiness(report);
        },
      },
      {
        id: '22',
        label: 'Build phase5 execution closure status report',
        execute: async () => {
          const report = await askPhase5ExecutionClosureStatus();
          await runPhase5ExecutionClosureStatus(report);
        },
      },
      {
        id: '23',
        label: 'Run phase5 execution closure (one-shot orchestration)',
        execute: async () => {
          const params = await askPhase5ExecutionClosure();
          await runPhase5ExecutionClosure(params);
        },
      },
      {
        id: '24',
        label: 'Clean local validation artifacts',
        execute: async () => {
          const params = await askValidationArtifactsCleanup();
          await runAndPrintExitCode(() => runValidationArtifactsCleanup(params));
        },
      },
      {
        id: '25',
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

      if (selected.id === '25') {
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
