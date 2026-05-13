const PRE_WRITE_ENTRY = 'integrations/lifecycle/cli.ts';
const PRE_WRITE_ARGS = ['sdd', 'validate', '--stage=PRE_WRITE'];

function shouldRunChainedPreWrite(env = process.env) {
  if (env.PUMUKI_SKIP_CHAINED_PRE_WRITE === '1') {
    return false;
  }
  return env.PUMUKI_CHAINED_PRE_WRITE_DONE !== '1';
}

function runChainedPreWriteIfNeeded(runTsEntry, env = process.env) {
  if (!shouldRunChainedPreWrite(env)) {
    return 0;
  }
  env.PUMUKI_CHAINED_PRE_WRITE_DONE = '1';
  return runTsEntry(PRE_WRITE_ENTRY, PRE_WRITE_ARGS);
}

module.exports = {
  runChainedPreWriteIfNeeded,
  shouldRunChainedPreWrite,
};
