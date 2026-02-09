import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildAdapterReadinessCommandArgs,
  buildAdapterRealSessionReportCommandArgs,
  buildCleanValidationArtifactsCommandArgs,
  buildConsumerStartupTriageCommandArgs,
  buildMockConsumerAbReportCommandArgs,
  buildPhase5BlockersReadinessCommandArgs,
  buildPhase5ExecutionClosureCommandArgs,
  buildPhase5ExecutionClosureStatusCommandArgs,
  buildPhase5ExternalHandoffCommandArgs,
  buildSkillsLockCheckCommandArgs,
  buildValidationDocsHygieneCommandArgs,
} from './framework-menu-builders';

export const DEFAULT_ACTIONLINT_BIN = '/tmp/actionlint-bin/actionlint';
export const DEFAULT_CONSUMER_REPO_PATH =
  process.env.PUMUKI_CONSUMER_REPO_PATH?.trim() || '/path/to/consumer-repo';

const runGit = (args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
};

export const resolveDefaultRangeFrom = (): string => {
  try {
    return runGit(['rev-parse', '@{u}']);
  } catch {
    return 'HEAD~1';
  }
};

export const runAndPrintExitCode = async (run: () => Promise<number>): Promise<void> => {
  const code = await run();
  process.stdout.write(`\nExit code: ${code}\n`);
};

export const runConsumerCiArtifactsScan = async (params: {
  repo: string;
  limit: number;
  outFile: string;
}): Promise<void> => {
  const scanScriptPath = resolve(
    process.cwd(),
    'scripts/collect-consumer-ci-artifacts.ts'
  );

  if (!existsSync(scanScriptPath)) {
    process.stdout.write(
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

export const runAdapterSessionStatusReport = async (params: {
  outFile: string;
}): Promise<void> => {
  const reportScriptPath = resolve(
    process.cwd(),
    'scripts/build-adapter-session-status.ts'
  );

  if (!existsSync(reportScriptPath)) {
    process.stdout.write(
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

export const runAdapterRealSessionReport = async (params: {
  statusReportFile: string;
  outFile: string;
}): Promise<void> => {
  const reportScriptPath = resolve(
    process.cwd(),
    'scripts/build-adapter-real-session-report.ts'
  );

  if (!existsSync(reportScriptPath)) {
    process.stdout.write(
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

export const runValidationDocsHygiene = async (): Promise<number> => {
  const scriptPath = resolve(process.cwd(), 'scripts/check-validation-docs-hygiene.ts');

  if (!existsSync(scriptPath)) {
    process.stdout.write(
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

export const runValidationArtifactsCleanup = async (params: {
  dryRun: boolean;
}): Promise<number> => {
  const scriptPath = resolve(process.cwd(), 'scripts/clean-validation-artifacts.ts');

  if (!existsSync(scriptPath)) {
    process.stdout.write(
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

export const runSkillsLockCheck = async (): Promise<number> => {
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

export const runConsumerStartupTriage = async (params: {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  repoPath?: string;
  actionlintBin?: string;
}): Promise<void> => {
  const scriptPath = resolve(process.cwd(), 'scripts/build-consumer-startup-triage.ts');

  if (!existsSync(scriptPath)) {
    process.stdout.write(
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

export const runMockConsumerAbReport = async (params: {
  repo: string;
  outFile: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  blockEvidenceFile: string;
  minimalEvidenceFile: string;
}): Promise<void> => {
  const scriptPath = resolve(process.cwd(), 'scripts/build-mock-consumer-ab-report.ts');

  if (!existsSync(scriptPath)) {
    process.stdout.write(
      '\nCould not find scripts/build-mock-consumer-ab-report.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    buildMockConsumerAbReportCommandArgs({
      scriptPath,
      repo: params.repo,
      outFile: params.outFile,
      blockSummaryFile: params.blockSummaryFile,
      minimalSummaryFile: params.minimalSummaryFile,
      blockEvidenceFile: params.blockEvidenceFile,
      minimalEvidenceFile: params.minimalEvidenceFile,
    }),
    {
      stdio: 'inherit',
    }
  );
};

export const runPhase5BlockersReadiness = async (params: {
  adapterReportFile: string;
  consumerTriageReportFile: string;
  outFile: string;
}): Promise<void> => {
  const scriptPath = resolve(
    process.cwd(),
    'scripts/build-phase5-blockers-readiness.ts'
  );

  if (!existsSync(scriptPath)) {
    process.stdout.write(
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

export const runPhase5ExecutionClosureStatus = async (params: {
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
    process.stdout.write(
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

export const runPhase5ExternalHandoff = async (params: {
  repo: string;
  phase5StatusReportFile: string;
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  mockAbReportFile: string;
  runReportFile: string;
  outFile: string;
  artifactUrls: ReadonlyArray<string>;
  requireArtifactUrls: boolean;
  requireMockAbReport: boolean;
}): Promise<void> => {
  const scriptPath = resolve(process.cwd(), 'scripts/build-phase5-external-handoff.ts');

  if (!existsSync(scriptPath)) {
    process.stdout.write(
      '\nCould not find scripts/build-phase5-external-handoff.ts in current repository.\n'
    );
    return;
  }

  execFileSync(
    'npx',
    buildPhase5ExternalHandoffCommandArgs({
      scriptPath,
      repo: params.repo,
      phase5StatusReportFile: params.phase5StatusReportFile,
      phase5BlockersReportFile: params.phase5BlockersReportFile,
      consumerUnblockReportFile: params.consumerUnblockReportFile,
      mockAbReportFile: params.mockAbReportFile,
      runReportFile: params.runReportFile,
      outFile: params.outFile,
      artifactUrls: params.artifactUrls,
      requireArtifactUrls: params.requireArtifactUrls,
      requireMockAbReport: params.requireMockAbReport,
    }),
    {
      stdio: 'inherit',
    }
  );
};

export const runAdapterReadiness = async (params: {
  adapterReportFile: string;
  outFile: string;
}): Promise<void> => {
  const scriptPath = resolve(
    process.cwd(),
    'scripts/build-adapter-readiness.ts'
  );

  if (!existsSync(scriptPath)) {
    process.stdout.write(
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

export const runPhase5ExecutionClosure = async (params: {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  includeAuthPreflight: boolean;
  repoPath?: string;
  actionlintBin?: string;
  includeAdapter: boolean;
  requireAdapterReadiness: boolean;
  useMockConsumerTriage: boolean;
}): Promise<void> => {
  const scriptPath = resolve(
    process.cwd(),
    'scripts/run-phase5-execution-closure.ts'
  );

  if (!existsSync(scriptPath)) {
    process.stdout.write(
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
      useMockConsumerTriage: params.useMockConsumerTriage,
    }),
    {
      stdio: 'inherit',
    }
  );
};

export const runConsumerCiAuthCheck = async (params: {
  repo: string;
  outFile: string;
}): Promise<void> => {
  const authCheckScriptPath = resolve(
    process.cwd(),
    'scripts/check-consumer-ci-auth.ts'
  );

  if (!existsSync(authCheckScriptPath)) {
    process.stdout.write(
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

export const runConsumerWorkflowLintScan = async (params: {
  repoPath: string;
  actionlintBin: string;
  outFile: string;
}): Promise<void> => {
  const lintScriptPath = resolve(
    process.cwd(),
    'scripts/lint-consumer-workflows.ts'
  );

  if (!existsSync(lintScriptPath)) {
    process.stdout.write(
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

export const runConsumerSupportBundle = async (params: {
  repo: string;
  limit: number;
  outFile: string;
}): Promise<void> => {
  const bundleScriptPath = resolve(
    process.cwd(),
    'scripts/build-consumer-startup-failure-support-bundle.ts'
  );

  if (!existsSync(bundleScriptPath)) {
    process.stdout.write(
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

export const runConsumerSupportTicketDraft = async (params: {
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
    process.stdout.write(
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

export const runConsumerStartupUnblockStatus = async (params: {
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
    process.stdout.write(
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

export const printEvidence = (): void => {
  const evidencePath = resolve(process.cwd(), '.ai_evidence.json');
  if (!existsSync(evidencePath)) {
    process.stdout.write('\n.ai_evidence.json not found in repository root.\n');
    return;
  }

  process.stdout.write('\n');
  process.stdout.write(readFileSync(evidencePath, 'utf8'));
  process.stdout.write('\n');
};
