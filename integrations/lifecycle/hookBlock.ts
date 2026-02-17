import {
  PUMUKI_MANAGED_BLOCK_END,
  PUMUKI_MANAGED_BLOCK_START,
  type PumukiManagedHook,
} from './constants';

const HOOK_COMMANDS: Record<PumukiManagedHook, string> = {
  'pre-commit': 'pumuki-pre-commit',
  'pre-push': 'pumuki-pre-push',
};

const trimTrailingWhitespace = (value: string): string =>
  value.replace(/[ \t]+\n/g, '\n').trimEnd();

const collapseBlankLines = (value: string): string =>
  value.replace(/\n{3,}/g, '\n\n');

export const hasPumukiManagedBlock = (contents: string): boolean =>
  contents.includes(PUMUKI_MANAGED_BLOCK_START) &&
  contents.includes(PUMUKI_MANAGED_BLOCK_END);

const managedBlockPattern = new RegExp(
  `${PUMUKI_MANAGED_BLOCK_START}[\\s\\S]*?${PUMUKI_MANAGED_BLOCK_END}\\n?`,
  'g'
);

export const buildPumukiManagedHookBlock = (hook: PumukiManagedHook): string => {
  const cli = HOOK_COMMANDS[hook];

  return [
    PUMUKI_MANAGED_BLOCK_START,
    'if command -v npx >/dev/null 2>&1; then',
    `  npx --yes ${cli}`,
    '  status=$?',
    '  if [ "$status" -ne 0 ]; then',
    '    exit "$status"',
    '  fi',
    'else',
    '  echo "[pumuki] npx was not found in PATH." >&2',
    '  exit 1',
    'fi',
    PUMUKI_MANAGED_BLOCK_END,
  ].join('\n');
};

const ensureExecutableHeader = (contents: string): string => {
  const normalized = contents.trim();
  if (normalized.length === 0) {
    return '#!/usr/bin/env sh';
  }
  return contents;
};

export const upsertPumukiManagedBlock = (params: {
  contents: string;
  hook: PumukiManagedHook;
}): string => {
  const block = buildPumukiManagedHookBlock(params.hook);
  const baseline = ensureExecutableHeader(params.contents);

  if (hasPumukiManagedBlock(baseline)) {
    const replaced = baseline.replace(managedBlockPattern, `${block}\n`);
    return `${trimTrailingWhitespace(replaced)}\n`;
  }

  const withSeparator =
    trimTrailingWhitespace(baseline).length > 0
      ? `${trimTrailingWhitespace(baseline)}\n\n${block}`
      : block;
  return `${withSeparator}\n`;
};

export const removePumukiManagedBlock = (contents: string): {
  updated: string;
  removed: boolean;
} => {
  if (!hasPumukiManagedBlock(contents)) {
    return {
      updated: contents,
      removed: false,
    };
  }

  const stripped = trimTrailingWhitespace(
    collapseBlankLines(contents.replace(managedBlockPattern, '\n\n'))
  );
  if (stripped === '' || stripped === '#!/usr/bin/env sh') {
    return {
      updated: '',
      removed: true,
    };
  }

  return {
    updated: `${stripped}\n`,
    removed: true,
  };
};
