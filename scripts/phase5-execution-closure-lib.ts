export type Phase5ExecutionClosureOptions = {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  repoPath?: string;
  actionlintBin?: string;
  includeAdapter: boolean;
  requireAdapterReadiness: boolean;
};

export type Phase5ExecutionClosureOutputs = {
  adapterSessionStatus: string;
  adapterRealSessionReport: string;
  adapterReadiness: string;
  consumerStartupTriageReport: string;
  consumerStartupUnblockStatus: string;
  phase5BlockersReadiness: string;
  phase5ExecutionClosureStatus: string;
  closureRunReport: string;
};

export type Phase5ExecutionClosureCommand = {
  id:
    | 'adapter-session-status'
    | 'adapter-real-session-report'
    | 'adapter-readiness'
    | 'consumer-startup-triage'
    | 'phase5-blockers-readiness'
    | 'phase5-execution-closure-status';
  description: string;
  script: string;
  args: string[];
  required: boolean;
  outputFiles: string[];
};

export type Phase5ExecutionClosureExecution = {
  command: Phase5ExecutionClosureCommand;
  exitCode: number;
  ok: boolean;
  error?: string;
};

const joinPath = (base: string, leaf: string): string => {
  return `${base.replace(/\/$/, '')}/${leaf}`;
};

export const resolvePhase5ExecutionClosureOutputs = (
  outDir: string
): Phase5ExecutionClosureOutputs => {
  return {
    adapterSessionStatus: joinPath(outDir, 'adapter-session-status.md'),
    adapterRealSessionReport: joinPath(outDir, 'adapter-real-session-report.md'),
    adapterReadiness: joinPath(outDir, 'adapter-readiness.md'),
    consumerStartupTriageReport: joinPath(outDir, 'consumer-startup-triage-report.md'),
    consumerStartupUnblockStatus: joinPath(outDir, 'consumer-startup-unblock-status.md'),
    phase5BlockersReadiness: joinPath(outDir, 'phase5-blockers-readiness.md'),
    phase5ExecutionClosureStatus: joinPath(
      outDir,
      'phase5-execution-closure-status.md'
    ),
    closureRunReport: joinPath(outDir, 'phase5-execution-closure-run-report.md'),
  };
};

export const buildPhase5ExecutionClosureCommands = (
  options: Phase5ExecutionClosureOptions
): Phase5ExecutionClosureCommand[] => {
  if (!options.repo.trim()) {
    throw new Error('Missing required option: repo');
  }

  if (options.requireAdapterReadiness && !options.includeAdapter) {
    throw new Error(
      'Cannot require adapter readiness when adapter flow is disabled (--skip-adapter).'
    );
  }

  const outputs = resolvePhase5ExecutionClosureOutputs(options.outDir);
  const commands: Phase5ExecutionClosureCommand[] = [];

  if (options.includeAdapter) {
    commands.push(
      {
        id: 'adapter-session-status',
        description: 'Generate adapter session status report',
        script: 'scripts/build-adapter-session-status.ts',
        args: ['--out', outputs.adapterSessionStatus],
        required: options.requireAdapterReadiness,
        outputFiles: [outputs.adapterSessionStatus],
      },
      {
        id: 'adapter-real-session-report',
        description: 'Generate adapter real-session report',
        script: 'scripts/build-adapter-real-session-report.ts',
        args: [
          '--status-report',
          outputs.adapterSessionStatus,
          '--out',
          outputs.adapterRealSessionReport,
        ],
        required: options.requireAdapterReadiness,
        outputFiles: [outputs.adapterRealSessionReport],
      },
      {
        id: 'adapter-readiness',
        description: 'Generate adapter readiness report',
        script: 'scripts/build-adapter-readiness.ts',
        args: [
          '--adapter-report',
          outputs.adapterRealSessionReport,
          '--out',
          outputs.adapterReadiness,
        ],
        required: options.requireAdapterReadiness,
        outputFiles: [outputs.adapterReadiness],
      }
    );
  }

  const triageArgs = [
    '--repo',
    options.repo,
    '--limit',
    String(options.limit),
    '--out-dir',
    options.outDir,
  ];

  if (options.runWorkflowLint) {
    const repoPath = options.repoPath?.trim();
    const actionlintBin = options.actionlintBin?.trim();
    if (!repoPath || !actionlintBin) {
      throw new Error(
        'Workflow lint requires --repo-path and --actionlint-bin (or use --skip-workflow-lint).'
      );
    }
    triageArgs.push('--repo-path', repoPath, '--actionlint-bin', actionlintBin);
  } else {
    triageArgs.push('--skip-workflow-lint');
  }

  commands.push({
    id: 'consumer-startup-triage',
    description: 'Generate consumer startup triage bundle',
    script: 'scripts/build-consumer-startup-triage.ts',
    args: triageArgs,
    required: true,
    outputFiles: [
      outputs.consumerStartupTriageReport,
      outputs.consumerStartupUnblockStatus,
    ],
  });

  const blockersArgs = [
    '--consumer-triage-report',
    outputs.consumerStartupTriageReport,
    '--out',
    outputs.phase5BlockersReadiness,
  ];

  if (options.requireAdapterReadiness) {
    blockersArgs.push(
      '--require-adapter-report',
      '--adapter-report',
      outputs.adapterRealSessionReport
    );
  }

  commands.push({
    id: 'phase5-blockers-readiness',
    description: 'Generate Phase 5 blockers readiness report',
    script: 'scripts/build-phase5-blockers-readiness.ts',
    args: blockersArgs,
    required: true,
    outputFiles: [outputs.phase5BlockersReadiness],
  });

  const closureStatusArgs = [
    '--phase5-blockers-report',
    outputs.phase5BlockersReadiness,
    '--consumer-unblock-report',
    outputs.consumerStartupUnblockStatus,
    '--out',
    outputs.phase5ExecutionClosureStatus,
  ];

  if (options.requireAdapterReadiness) {
    closureStatusArgs.push(
      '--adapter-readiness-report',
      outputs.adapterReadiness,
      '--require-adapter-readiness'
    );
  } else if (options.includeAdapter) {
    closureStatusArgs.push('--adapter-readiness-report', outputs.adapterReadiness);
  }

  commands.push({
    id: 'phase5-execution-closure-status',
    description: 'Generate Phase 5 execution closure status snapshot',
    script: 'scripts/build-phase5-execution-closure-status.ts',
    args: closureStatusArgs,
    required: true,
    outputFiles: [outputs.phase5ExecutionClosureStatus],
  });

  return commands;
};

export const buildPhase5ExecutionClosureRunReportMarkdown = (params: {
  generatedAt: string;
  repo: string;
  options: Omit<
    Phase5ExecutionClosureOptions,
    'repoPath' | 'actionlintBin'
  > & { repoPathProvided: boolean; actionlintBinProvided: boolean };
  commands: ReadonlyArray<Phase5ExecutionClosureCommand>;
  executions: ReadonlyArray<Phase5ExecutionClosureExecution>;
}): string => {
  const lines: string[] = [];
  const requiredFailures = params.executions.filter(
    (entry) => entry.command.required && !entry.ok
  );

  lines.push('# Phase 5 Execution Closure Run Report');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- target_repo: \`${params.repo}\``);
  lines.push(`- out_dir: \`${params.options.outDir}\``);
  lines.push(`- include_adapter: ${params.options.includeAdapter ? 'YES' : 'NO'}`);
  lines.push(
    `- require_adapter_readiness: ${params.options.requireAdapterReadiness ? 'YES' : 'NO'}`
  );
  lines.push(`- run_workflow_lint: ${params.options.runWorkflowLint ? 'YES' : 'NO'}`);
  lines.push(`- repo_path_provided: ${params.options.repoPathProvided ? 'YES' : 'NO'}`);
  lines.push(
    `- actionlint_bin_provided: ${params.options.actionlintBinProvided ? 'YES' : 'NO'}`
  );
  lines.push(`- verdict: ${requiredFailures.length === 0 ? 'READY' : 'BLOCKED'}`);
  lines.push('');

  lines.push('## Executions');
  lines.push('');
  lines.push('| id | required | exit_code | status | outputs |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const execution of params.executions) {
    lines.push(
      `| ${execution.command.id} | ${execution.command.required ? 'yes' : 'no'} | ${execution.exitCode} | ${execution.ok ? 'ok' : 'failed'} | ${execution.command.outputFiles.map((file) => `\`${file}\``).join(', ')} |`
    );
  }
  lines.push('');

  lines.push('## Command Plan');
  lines.push('');
  for (const command of params.commands) {
    lines.push(`- ${command.id}: ${command.description}`);
    lines.push(
      `  - run: \`npx --yes tsx@4.21.0 ${command.script} ${command.args.join(' ')}\``
    );
  }
  lines.push('');

  lines.push('## Next Actions');
  lines.push('');
  if (requiredFailures.length === 0) {
    lines.push('- Closure run completed. Review generated reports and attach artifact links.');
  } else {
    for (const failure of requiredFailures) {
      lines.push(
        `- Resolve failed required step \`${failure.command.id}\` and rerun this command.`
      );
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
