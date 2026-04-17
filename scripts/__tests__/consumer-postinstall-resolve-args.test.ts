import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  resolveConsumerPostinstallInstallExtras,
  normalizeExplicitAgent,
} = require('../consumer-postinstall-resolve-args.cjs') as {
  resolveConsumerPostinstallInstallExtras: (
    consumerRoot: string,
    env?: NodeJS.ProcessEnv
  ) => { extras: string[]; reason: string };
  normalizeExplicitAgent: (raw: string | undefined) => string;
};

const testNormalizeExplicitAgent = () => {
  assert.equal(normalizeExplicitAgent('cursor'), 'cursor');
  assert.equal(normalizeExplicitAgent('  CODEX  '), 'codex');
  assert.equal(normalizeExplicitAgent('none'), '');
  assert.equal(normalizeExplicitAgent('0'), '');
  assert.equal(normalizeExplicitAgent('unknown-agent'), '');
};

const testResolveNoMcpByDefault = () => {
  const r = resolveConsumerPostinstallInstallExtras('/any/root', {});
  assert.deepEqual(r.extras, []);
  assert.equal(r.reason, 'disabled_default');
};

const testResolveOptInDefaultRepoMcpFlag = () => {
  const r = resolveConsumerPostinstallInstallExtras('/any/root', {
    PUMUKI_POSTINSTALL_WITH_MCP: '1',
  });
  assert.deepEqual(r.extras, ['--with-mcp', '--agent=repo']);
  assert.equal(r.reason, 'explicit_repo_flag');
};

const testResolveExplicitAgentPrecedesFlag = () => {
  const r = resolveConsumerPostinstallInstallExtras('/any/root', {
    PUMUKI_POSTINSTALL_WITH_MCP: '1',
    PUMUKI_POSTINSTALL_MCP_AGENT: 'codex',
  });
  assert.deepEqual(r.extras, ['--with-mcp', '--agent=codex']);
  assert.equal(r.reason, 'explicit_agent');
};

const testResolveExplicitAgent = () => {
  const r = resolveConsumerPostinstallInstallExtras('/any/root', {
    PUMUKI_POSTINSTALL_MCP_AGENT: 'claude',
  });
  assert.deepEqual(r.extras, ['--with-mcp', '--agent=claude']);
  assert.equal(r.reason, 'explicit_agent');
};

const testResolveSkipMcp = () => {
  const r = resolveConsumerPostinstallInstallExtras('/any/root', {
    PUMUKI_POSTINSTALL_SKIP_MCP: '1',
  });
  assert.deepEqual(r.extras, []);
  assert.equal(r.reason, 'skip_mcp');
};

testNormalizeExplicitAgent();
testResolveNoMcpByDefault();
testResolveOptInDefaultRepoMcpFlag();
testResolveExplicitAgentPrecedesFlag();
testResolveExplicitAgent();
testResolveSkipMcp();
