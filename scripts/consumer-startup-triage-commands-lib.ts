import type {
  ConsumerStartupTriageCommand,
  ConsumerStartupTriageOptions,
} from './consumer-startup-triage-contract';
import { resolveConsumerStartupTriageOutputs } from './consumer-startup-triage-outputs-lib';

export const buildConsumerStartupTriageCommands = (
  options: ConsumerStartupTriageOptions
): ConsumerStartupTriageCommand[] => {
  const outputs = resolveConsumerStartupTriageOutputs(options.outDir);
  const includeAuthCheck = options.includeAuthCheck ?? true;

  const commands: ConsumerStartupTriageCommand[] = [];

  if (includeAuthCheck) {
    commands.push({
      id: 'auth-check',
      description: 'Check GitHub auth/scopes and billing probe',
      script: 'scripts/check-consumer-ci-auth.ts',
      args: ['--repo', options.repo, '--out', outputs.authReport],
      outputFile: outputs.authReport,
      required: true,
    });
  }

  commands.push({
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
  });

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
