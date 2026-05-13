#!/usr/bin/env node

const { runTsEntry } = require('./_run-ts-entry');
const { runChainedPreWriteIfNeeded } = require('./_chained-pre-write');

const preWriteStatus = runChainedPreWriteIfNeeded(runTsEntry);
if (preWriteStatus !== 0) {
  process.exit(preWriteStatus);
}
process.exit(runTsEntry('integrations/git/prePushBackend.cli.ts', process.argv.slice(2)));
