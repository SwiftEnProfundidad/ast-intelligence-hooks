import type { createFrameworkMenuPrompts } from './framework-menu-prompts';

type FrameworkMenuPrompts = ReturnType<typeof createFrameworkMenuPrompts>;

export type MenuAction = {
  id: string;
  label: string;
  execute: () => Promise<void>;
};

export type FrameworkMenuActionContext = {
  prompts: FrameworkMenuPrompts;
  runStaged: () => Promise<void>;
  runRange: (params: { fromRef: string; toRef: string; stage: 'PRE_PUSH' | 'CI' }) => Promise<void>;
  runRepoAudit: () => Promise<void>;
  runRepoAndStagedAudit: () => Promise<void>;
  runStagedAndUnstagedAudit: () => Promise<void>;
  resolveDefaultRangeFrom: () => string;
  printActiveSkillsBundles: () => void;
};
