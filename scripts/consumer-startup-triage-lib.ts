export type ConsumerStartupTriageOptions = {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  repoPath?: string;
  actionlintBin?: string;
};

export type ConsumerStartupTriageOutputs = {
  authReport: string;
  artifactsReport: string;
  workflowLintReport: string;
  supportBundleReport: string;
  supportTicketDraft: string;
  startupUnblockStatus: string;
  triageReport: string;
};

export type ConsumerStartupTriageCommand = {
  id:
    | 'auth-check'
    | 'ci-artifacts'
    | 'workflow-lint'
    | 'support-bundle'
    | 'support-ticket-draft'
    | 'startup-unblock-status';
  description: string;
  script: string;
  args: string[];
  outputFile: string;
  required: boolean;
};

export type ConsumerStartupTriageExecution = {
  command: ConsumerStartupTriageCommand;
  exitCode: number;
  ok: boolean;
  error?: string;
};

const joinPath = (base: string, leaf: string): string => {
  return `${base.replace(/\/$/, '')}/${leaf}`;
};

export const resolveConsumerStartupTriageOutputs = (
  outDir: string
): ConsumerStartupTriageOutputs => {
  return {
    authReport: joinPath(outDir, 'consumer-ci-auth-check.md'),
    artifactsReport: joinPath(outDir, 'consumer-ci-artifacts-report.md'),
    workflowLintReport: joinPath(outDir, 'consumer-workflow-lint-report.md'),
    supportBundleReport: joinPath(outDir, 'consumer-startup-failure-support-bundle.md'),
    supportTicketDraft: joinPath(outDir, 'consumer-support-ticket-draft.md'),
    startupUnblockStatus: joinPath(outDir, 'consumer-startup-unblock-status.md'),
    triageReport: joinPath(outDir, 'consumer-startup-triage-report.md'),
  };
};

export const buildConsumerStartupTriageCommands = (
  options: ConsumerStartupTriageOptions
): ConsumerStartupTriageCommand[] => {
  const outputs = resolveConsumerStartupTriageOutputs(options.outDir);

  const commands: ConsumerStartupTriageCommand[] = [
    {
      id: 'auth-check',
      description: 'Check GitHub auth/scopes and billing probe',
      script: 'scripts/check-consumer-ci-auth.ts',
      args: ['--repo', options.repo, '--out', outputs.authReport],
      outputFile: outputs.authReport,
      required: true,
    },
    {
      id: 'ci-artifacts',
      description: 'Collect recent CI runs and artifact status',
      script: 'scripts/collect-consumer-ci-artifacts.ts',
      args: [
        '--repo',
        options.repo,
        '--limit',
        String(options.limit),
        '--out',
        outputs.artifactsReport,
      ],
      outputFile: outputs.artifactsReport,
      required: true,
    },
  ];

  if (options.runWorkflowLint) {
    const repoPath = options.repoPath?.trim();
    const actionlintBin = options.actionlintBin?.trim();

    if (!repoPath || !actionlintBin) {
      throw new Error(
        'Workflow lint requires --repo-path and --actionlint-bin (or use --skip-workflow-lint).'
      );
    }

    commands.push({
      id: 'workflow-lint',
      description: 'Run semantic workflow lint on consumer repository',
      script: 'scripts/lint-consumer-workflows.ts',
      args: [
        '--repo-path',
        repoPath,
        '--actionlint-bin',
        actionlintBin,
        '--out',
        outputs.workflowLintReport,
      ],
      outputFile: outputs.workflowLintReport,
      required: false,
    });
  }

  commands.push(
    {
      id: 'support-bundle',
      description: 'Build startup-failure support bundle',
      script: 'scripts/build-consumer-startup-failure-support-bundle.ts',
      args: [
        '--repo',
        options.repo,
        '--limit',
        String(options.limit),
        '--out',
        outputs.supportBundleReport,
      ],
      outputFile: outputs.supportBundleReport,
      required: true,
    },
    {
      id: 'support-ticket-draft',
      description: 'Build support ticket draft from auth + support bundle',
      script: 'scripts/build-consumer-support-ticket-draft.ts',
      args: [
        '--repo',
        options.repo,
        '--support-bundle',
        outputs.supportBundleReport,
        '--auth-report',
        outputs.authReport,
        '--out',
        outputs.supportTicketDraft,
      ],
      outputFile: outputs.supportTicketDraft,
      required: true,
    },
    {
      id: 'startup-unblock-status',
      description: 'Build consolidated startup-unblock status report',
      script: 'scripts/build-consumer-startup-unblock-status.ts',
      args: [
        '--repo',
        options.repo,
        '--support-bundle',
        outputs.supportBundleReport,
        '--auth-report',
        outputs.authReport,
        '--workflow-lint-report',
        outputs.workflowLintReport,
        '--out',
        outputs.startupUnblockStatus,
      ],
      outputFile: outputs.startupUnblockStatus,
      required: true,
    }
  );

  return commands;
};

export const buildConsumerStartupTriageReportMarkdown = (params: {
  generatedAt: string;
  repo: string;
  outDir: string;
  commands: ReadonlyArray<ConsumerStartupTriageCommand>;
  executions: ReadonlyArray<ConsumerStartupTriageExecution>;
}): string => {
  const lines: string[] = [];

  const requiredFailures = params.executions.filter(
    (entry) => entry.command.required && !entry.ok
  );

  lines.push('# Consumer Startup Triage Report');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- target_repo: \`${params.repo}\``);
  lines.push(`- output_directory: \`${params.outDir}\``);
  lines.push(`- verdict: ${requiredFailures.length === 0 ? 'READY' : 'BLOCKED'}`);
  lines.push('');

  lines.push('## Executions');
  lines.push('');
  lines.push('| id | required | exit_code | status | output |');
  lines.push('| --- | --- | --- | --- | --- |');

  for (const execution of params.executions) {
    lines.push(
      `| ${execution.command.id} | ${execution.command.required ? 'yes' : 'no'} | ${execution.exitCode} | ${execution.ok ? 'ok' : 'failed'} | \`${execution.command.outputFile}\` |`
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
    lines.push('- Triage outputs are ready for review and escalation workflow.');
  } else {
    for (const failure of requiredFailures) {
      lines.push(
        `- Resolve failed required step \`${failure.command.id}\` and rerun startup triage.`
      );
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
