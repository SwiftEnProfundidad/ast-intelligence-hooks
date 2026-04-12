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
      label: 'Consumer preflight + gate: ALL tracked files (PRE_COMMIT · writes evidence)',
      execute: params.runFullAudit,
    },
    {
      id: '2',
      label: 'Consumer preflight + gate: REPO+index contract (PRE_PUSH · disk skip risk if evidence tracked)',
      execute: params.runStrictRepoAndStaged,
    },
    {
      id: '3',
      label: 'Consumer preflight + gate: STAGED only (PRE_COMMIT)',
      execute: params.runStrictStagedOnly,
    },
    {
      id: '4',
      label: 'Consumer preflight + gate: working tree (PRE_PUSH policy · disk skip risk if evidence tracked)',
      execute: params.runStandardCriticalHigh,
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
      label: 'Engine audit · FULL tracked repo (no preflight · PRE_COMMIT)',
      execute: params.runEngineFullRepoNoPreflight,
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
