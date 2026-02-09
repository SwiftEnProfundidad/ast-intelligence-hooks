import type {
  ConsumerStartupTriageCommand,
  ConsumerStartupTriageOptions,
} from './consumer-startup-triage-contract';
import {
  buildConsumerStartupTriageArtifactsCommand,
  buildConsumerStartupTriageAuthCheckCommand,
  buildConsumerStartupTriageStartupUnblockStatusCommand,
  buildConsumerStartupTriageSupportBundleCommand,
  buildConsumerStartupTriageSupportTicketDraftCommand,
  buildConsumerStartupTriageWorkflowLintCommand,
} from './consumer-startup-triage-command-builders-lib';
import { resolveConsumerStartupTriageOutputs } from './consumer-startup-triage-outputs-lib';

export const buildConsumerStartupTriageCommands = (
  options: ConsumerStartupTriageOptions
): ConsumerStartupTriageCommand[] => {
  const outputs = resolveConsumerStartupTriageOutputs(options.outDir);
  const includeAuthCheck = options.includeAuthCheck ?? true;

  const commands: ConsumerStartupTriageCommand[] = [];

  if (includeAuthCheck) {
    commands.push(
      buildConsumerStartupTriageAuthCheckCommand({
        options,
        outputs,
      })
    );
  }

  commands.push(
    buildConsumerStartupTriageArtifactsCommand({
      options,
      outputs,
    })
  );

  if (options.runWorkflowLint) {
    commands.push(
      buildConsumerStartupTriageWorkflowLintCommand({
        options,
        outputs,
      })
    );
  }

  commands.push(
    buildConsumerStartupTriageSupportBundleCommand({
      options,
      outputs,
    }),
    buildConsumerStartupTriageSupportTicketDraftCommand({
      options,
      outputs,
    }),
    buildConsumerStartupTriageStartupUnblockStatusCommand({
      options,
      outputs,
    })
  );

  return commands;
};
