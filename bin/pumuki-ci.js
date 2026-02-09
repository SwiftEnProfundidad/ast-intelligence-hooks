#!/usr/bin/env node

const { runTsEntry } = require('./_run-ts-entry');

process.exit(runTsEntry('integrations/git/ciBackend.cli.ts', process.argv.slice(2)));
