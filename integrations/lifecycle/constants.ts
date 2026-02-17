export const PUMUKI_MANAGED_BLOCK_START = '# >>> PUMUKI MANAGED START >>>';
export const PUMUKI_MANAGED_BLOCK_END = '# <<< PUMUKI MANAGED END <<<';

export const PUMUKI_CONFIG_KEYS = {
  installed: 'pumuki.installed',
  version: 'pumuki.version',
  hooks: 'pumuki.hooks',
  installedAt: 'pumuki.installed-at',
} as const;

export const PUMUKI_MANAGED_HOOKS = ['pre-commit', 'pre-push'] as const;

export type PumukiManagedHook = (typeof PUMUKI_MANAGED_HOOKS)[number];
