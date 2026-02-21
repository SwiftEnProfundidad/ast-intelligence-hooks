import { createAdapterPrompts } from './framework-menu-prompts-adapter';
import { createConsumerPrompts } from './framework-menu-prompts-consumer';
import { createPhase5Prompts } from './framework-menu-prompts-phase5';
import { parsePositive, type Questioner } from './framework-menu-prompt-types';
import type { HardModeProfile } from './framework-menu-runners-validation-hardmode-lib';

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

  const askHardModeProfile = async (): Promise<HardModeProfile> => {
    const profilePrompt = await rl.question(
      'Hard mode profile [critical-high|all-severities] (default: critical-high): '
    );
    const normalized = profilePrompt.trim().toLowerCase();
    if (normalized === 'all-severities') {
      return 'all-severities';
    }
    return 'critical-high';
  };

  const askSystemNotificationsEnabled = async (): Promise<boolean> => {
    const enabledPrompt = await rl.question('Enable macOS system notifications? [yes]: ');
    return !enabledPrompt.trim() ? true : parsePositive(enabledPrompt);
  };

  return {
    askRange,
    ...createAdapterPrompts(rl),
    ...createConsumerPrompts(rl),
    ...createPhase5Prompts(rl),
    askValidationArtifactsCleanup,
    askHardModeProfile,
    askSystemNotificationsEnabled,
  };
};
