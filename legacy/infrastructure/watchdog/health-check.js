#!/usr/bin/env node

const impl = require('../../scripts/hooks-system/infrastructure/watchdog/health-check.js');

if (require.main === module) {
    impl.runHealthCheck()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('[health-check] Execution failed', error);
            process.exit(1);
        });
}

module.exports = impl;
