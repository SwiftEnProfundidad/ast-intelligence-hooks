export const buildFrameworkMenuTsxCommandPrefix = (scriptPath: string): string[] => {
  return ['--yes', 'tsx@4.21.0', scriptPath];
};
