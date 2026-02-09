export const buildPhase5TsxCommandPrefix = (scriptPath: string): string[] => {
  return ['--yes', 'tsx@4.21.0', scriptPath];
};
