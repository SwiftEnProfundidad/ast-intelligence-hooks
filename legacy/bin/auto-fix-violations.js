#!/usr/bin/env node
/**
 * Script Wrapper
 * Redirects to the centralized implementation in scripts/hooks-system
 */
const path = require('path');
const { spawnSync } = require('child_process');

const implPath = path.join(__dirname, '..', 'scripts', 'hooks-system', 'bin', 'auto-fix-violations.js');

if (require.main === module) {
    const res = spawnSync(process.execPath, [implPath, ...process.argv.slice(2)], {
        stdio: 'inherit',
        env: process.env
    });
    process.exit(res.status ?? 1);
}

module.exports = require(implPath);
