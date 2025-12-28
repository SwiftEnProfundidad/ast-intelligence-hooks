#!/usr/bin/env node

const impl = require('../../scripts/hooks-system/infrastructure/watchdog/auto-recovery.js');

if (require.main === module) {
    Promise.resolve()
        .then(() => {
            return;
        })
        .then(() => process.exit(0))
        .catch(error => {
            console.error('[auto-recovery] Execution failed', error);
            process.exit(1);
        });
}

module.exports = impl;
