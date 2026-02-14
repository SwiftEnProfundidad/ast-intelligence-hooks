#!/usr/bin/env node
/**
 * Script Wrapper
 * Redirects to the centralized implementation in scripts/hooks-system
 */
const { runCli } = require('../scripts/hooks-system/bin/cli.js');

runCli(process.argv);
