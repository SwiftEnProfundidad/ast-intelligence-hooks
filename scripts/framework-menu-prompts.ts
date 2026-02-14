import { createAdapterPrompts } from './framework-menu-prompts-adapter';
import { createConsumerPrompts } from './framework-menu-prompts-consumer';
import { createPhase5Prompts } from './framework-menu-prompts-phase5';
import { parsePositive, type Questioner } from './framework-menu-prompt-types';

export const createFrameworkMenuPrompts = (rl: Questioner) => {
  const askRange = async (fromDefault: string = 'HEAD~1'): Promise<{ fromRef: string; toRef: string }> => {
    const fromPrompt = await rl.question(`fromRef [${fromDefault}]: `);
    const toPrompt = await rl.question('toRef [HEAD]: ');

    return {
      fromRef: fromPrompt.trim() || fromDefault,
      toRef: toPrompt.trim() || 'HEAD',
    };
  };

  const askValidationArtifactsCleanup = async (): Promise<{ dryRun: boolean }> => {
    const dryRunPrompt = await rl.question('dry-run only? [yes]: ');

    return {
      dryRun: !dryRunPrompt.trim() ? true : parsePositive(dryRunPrompt),
    };
  };

  return {
    askRange,
    ...createAdapterPrompts(rl),
    ...createConsumerPrompts(rl),
    ...createPhase5Prompts(rl),
    askValidationArtifactsCleanup,
  };
};
