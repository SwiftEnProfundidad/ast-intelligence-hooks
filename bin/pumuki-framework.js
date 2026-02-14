#!/usr/bin/env node

const { runTsEntry } = require('./_run-ts-entry');

process.exit(runTsEntry('scripts/framework-menu.cli.ts', process.argv.slice(2)));
