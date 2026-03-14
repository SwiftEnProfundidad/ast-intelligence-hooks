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
      label: 'Read-only full audit (repo analysis · PRE_COMMIT)',
      execute: params.runFullAudit,
    },
    {
      id: '2',
      label: 'Read-only strict REPO+STAGING (CI/CD · PRE_PUSH)',
      execute: params.runStrictRepoAndStaged,
    },
    {
      id: '3',
      label: 'Read-only strict STAGING only (dev · PRE_COMMIT)',
      execute: params.runStrictStagedOnly,
    },
    {
      id: '4',
      label: 'Read-only audit of STAGED+UNSTAGED working tree (PRE_PUSH policy)',
      execute: params.runStandardCriticalHigh,
    },
    {
      id: '5',
      label: 'Legacy read-only pattern checks snapshot',
      execute: params.runPatternChecks,
    },
    {
      id: '6',
      label: 'Legacy read-only ESLint evidence snapshot',
      execute: params.runEslintAudit,
    },
    {
      id: '7',
      label: 'Legacy read-only AST snapshot',
      execute: params.runAstIntelligence,
    },
    {
      id: '8',
      label: 'Export legacy read-only evidence snapshot',
      execute: params.runExportMarkdown,
    },
    {
      id: '9',
      label: 'Legacy read-only file diagnostics snapshot',
      execute: params.runFileDiagnostics,
    },
    {
      id: '10',
      label: 'Exit',
      execute: async () => {},
    },
  ];
};
