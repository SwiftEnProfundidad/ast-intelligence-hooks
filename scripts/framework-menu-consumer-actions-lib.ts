export type ConsumerLegacyMenuAction = {
  id: string;
  label: string;
  execute: () => Promise<void>;
};

export type ConsumerLegacyMenuContext = {
  runFullAudit: () => Promise<void>;
  runStrictRepoAndStaged: () => Promise<void>;
  runStrictStagedOnly: () => Promise<void>;
  runStandardCriticalHigh: () => Promise<void>;
  runPatternChecks: () => Promise<void>;
  runEslintAudit: () => Promise<void>;
  runAstIntelligence: () => Promise<void>;
  runFileDiagnostics: () => Promise<void>;
  runExportMarkdown: () => Promise<void>;
};

export const createConsumerLegacyMenuActions = (
  params: ConsumerLegacyMenuContext
): ReadonlyArray<ConsumerLegacyMenuAction> => {
  return [
    {
      id: '1',
      label: 'Full audit (repo analysis · PRE_COMMIT)',
      execute: params.runFullAudit,
    },
    {
      id: '2',
      label: 'Strict REPO+STAGING (CI/CD · PRE_PUSH)',
      execute: params.runStrictRepoAndStaged,
    },
    {
      id: '3',
      label: 'Strict STAGING only (dev · PRE_COMMIT)',
      execute: params.runStrictStagedOnly,
    },
    {
      id: '4',
      label: 'Standard CRITICAL/HIGH (working tree · PRE_PUSH)',
      execute: params.runStandardCriticalHigh,
    },
    {
      id: '5',
      label: 'Pattern checks',
      execute: params.runPatternChecks,
    },
    {
      id: '6',
      label: 'ESLint Admin+Web',
      execute: params.runEslintAudit,
    },
    {
      id: '7',
      label: 'AST Intelligence',
      execute: params.runAstIntelligence,
    },
    {
      id: '8',
      label: 'Export Markdown',
      execute: params.runExportMarkdown,
    },
    {
      id: '9',
      label: 'File diagnostics (top violated files)',
      execute: params.runFileDiagnostics,
    },
    {
      id: '10',
      label: 'Exit',
      execute: async () => {},
    },
  ];
};
