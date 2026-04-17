'use strict';

const KNOWN_MCP_AGENTS = new Set(['cursor', 'codex', 'claude', 'repo']);

const normalizeExplicitAgent = (raw) => {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) {
    return '';
  }
  const lower = trimmed.toLowerCase();
  if (lower === '0' || lower === 'none' || lower === 'false') {
    return '';
  }
  if (!KNOWN_MCP_AGENTS.has(lower)) {
    return '';
  }
  return lower;
};

const resolveConsumerPostinstallInstallExtras = (_consumerRoot, env = process.env) => {
  if (env.PUMUKI_POSTINSTALL_SKIP_MCP === '1') {
    return { extras: [], reason: 'skip_mcp' };
  }
  const withMcpFlag =
    env.PUMUKI_POSTINSTALL_WITH_MCP === '1' ||
    env.PUMUKI_POSTINSTALL_WITH_MCP?.toLowerCase() === 'true';
  const explicit = normalizeExplicitAgent(env.PUMUKI_POSTINSTALL_MCP_AGENT);
  if (explicit) {
    return { extras: ['--with-mcp', `--agent=${explicit}`], reason: 'explicit_agent' };
  }
  if (withMcpFlag) {
    return { extras: ['--with-mcp', '--agent=repo'], reason: 'explicit_repo_flag' };
  }
  return {
    extras: [],
    reason: 'disabled_default',
  };
};

module.exports = {
  KNOWN_MCP_AGENTS,
  resolveConsumerPostinstallInstallExtras,
  normalizeExplicitAgent,
};
