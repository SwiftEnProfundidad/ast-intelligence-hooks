#!/usr/bin/env node

const { runTsEntry } = require('./_run-ts-entry');

process.exit(runTsEntry('integrations/lifecycle/cli.ts', process.argv.slice(2)));
