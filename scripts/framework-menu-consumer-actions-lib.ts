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
  runEngineStagedNoPreflight: () => Promise<void>;
  runEngineUnstagedNoPreflight: () => Promise<void>;
  runEngineStagedAndUnstagedNoPreflight: () => Promise<void>;
  runEngineFullRepoNoPreflight: () => Promise<void>;
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
      label: 'Full audit (repo analysis)',
      execute: params.runFullAudit,
    },
    {
      id: '2',
      label: 'Strict REPO+STAGING (CI/CD)',
      execute: params.runStrictRepoAndStaged,
    },
    {
      id: '3',
      label: 'Strict STAGING only (dev)',
      execute: params.runStrictStagedOnly,
    },
    {
      id: '4',
      label: 'Standard CRITICAL/HIGH',
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
      label: 'Exit',
      execute: async () => {},
    },
    {
      id: '10',
      label: 'File diagnostics (top violated files)',
      execute: params.runFileDiagnostics,
    },
    {
      id: '11',
      label: 'Engine audit · STAGED only (no preflight · PRE_COMMIT)',
      execute: params.runEngineStagedNoPreflight,
    },
    {
      id: '12',
      label: 'Engine audit · UNSTAGED only (no preflight · PRE_COMMIT)',
      execute: params.runEngineUnstagedNoPreflight,
    },
    {
      id: '13',
      label: 'Engine audit · STAGED + UNSTAGED (no preflight · PRE_COMMIT)',
      execute: params.runEngineStagedAndUnstagedNoPreflight,
    },
    {
      id: '14',
      label: 'Engine audit · tracked repo files (AUTO runtime rules · PRE_COMMIT)',
      execute: params.runEngineFullRepoNoPreflight,
    },
  ];
};
