#!/usr/bin/env node

const { runTsEntry } = require('./_run-ts-entry');

process.exit(runTsEntry('integrations/git/prePushBackend.cli.ts', process.argv.slice(2)));
