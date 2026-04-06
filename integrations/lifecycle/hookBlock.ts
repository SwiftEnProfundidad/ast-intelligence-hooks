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

const toHookRunner = (params: {
  hook: PumukiManagedHook;
  runner: string;
}): string => {
  if (params.hook === 'pre-push') {
    return `  PUMUKI_PRE_PUSH_STDIN="$PUMUKI_PRE_PUSH_STDIN" ${params.runner} "$@"`;
  }
  return `  ${params.runner}`;
};

export const buildPumukiManagedHookBlock = (hook: PumukiManagedHook): string => {
  const cli = HOOK_COMMANDS[hook];
  const localBinPath = `./node_modules/.bin/${cli}`;
  const localNodeEntry = `./node_modules/pumuki/bin/${cli}.js`;

  return [
    PUMUKI_MANAGED_BLOCK_START,
    ...(hook === 'pre-push' ? ['PUMUKI_PRE_PUSH_STDIN="$(cat)"'] : []),
    `if [ -x "${localBinPath}" ]; then`,
    toHookRunner({
      hook,
      runner: localBinPath,
    }),
    `elif [ -f "${localNodeEntry}" ] && command -v node >/dev/null 2>&1; then`,
    toHookRunner({
      hook,
      runner: `node ${localNodeEntry}`,
    }),
    `elif command -v ${cli} >/dev/null 2>&1; then`,
    toHookRunner({
      hook,
      runner: cli,
    }),
    'elif command -v npx >/dev/null 2>&1; then',
    toHookRunner({
      hook,
      runner: `npx --yes --package pumuki@latest ${cli}`,
    }),
    'else',
    `  echo "[pumuki] unable to resolve ${cli} runner. Install dependencies or ensure npx is available." >&2`,
    '  exit 1',
    'fi',
    '  status=$?',
    '  if [ "$status" -ne 0 ]; then',
    '    exit "$status"',
    '  fi',
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

const isPreCommitFrameworkWithExecTerminator = (contents: string): boolean => {
  if (!contents.includes('pre-commit.com') && !contents.includes('pre_commit')) {
    return false;
  }
  return /\bexec\b/.test(contents);
};

const prependManagedBlockAfterShebang = (params: {
  contents: string;
  block: string;
}): string => {
  const trimmed = trimTrailingWhitespace(params.contents);
  const firstNewline = trimmed.indexOf('\n');
  const shebangLine = firstNewline === -1 ? trimmed : trimmed.slice(0, firstNewline);
  const rest =
    firstNewline === -1 ? '' : trimmed.slice(firstNewline + 1).replace(/^\n+/, '');
  const header = shebangLine.startsWith('#!') ? shebangLine : '#!/usr/bin/env sh';
  const bodyAfterShebang = shebangLine.startsWith('#!') ? rest : trimmed;
  const tail = trimTrailingWhitespace(bodyAfterShebang);
  return tail.length > 0
    ? `${header}\n${params.block}\n\n${tail}\n`
    : `${header}\n${params.block}\n`;
};

export const upsertPumukiManagedBlock = (params: {
  contents: string;
  hook: PumukiManagedHook;
}): string => {
  const block = buildPumukiManagedHookBlock(params.hook);
  const baseline = ensureExecutableHeader(params.contents);
  const hadManagedBlock = hasPumukiManagedBlock(baseline);
  const core = collapseBlankLines(
    trimTrailingWhitespace(
      hadManagedBlock ? baseline.replace(managedBlockPattern, '\n') : baseline
    )
  );

  if (
    params.hook === 'pre-commit' &&
    core.length > 0 &&
    isPreCommitFrameworkWithExecTerminator(core)
  ) {
    const merged = prependManagedBlockAfterShebang({ contents: core, block });
    return `${trimTrailingWhitespace(merged)}\n`;
  }

  if (hadManagedBlock || core.length > 0) {
    const withSeparator = core.length > 0 ? `${core}\n\n${block}` : block;
    return `${trimTrailingWhitespace(withSeparator)}\n`;
  }

  return `${block}\n`;
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
