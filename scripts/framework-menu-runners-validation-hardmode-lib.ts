export const runHardModeEnforcementConfig = async (): Promise<number> => {
  process.stdout.write(
    [
      '',
      '[pumuki] Hard Mode Enforcement Config',
      '- Current hard mode toggle: set PUMUKI_HARD_MODE=1 to enable strict enforcement.',
      '- Current profile toggle: set PUMUKI_HARD_MODE_PROFILE=critical-high to block HIGH/CRITICAL.',
      '- Next phase: persist these values in project config and surface them in evidence.',
      '',
    ].join('\n')
  );

  return 0;
};
