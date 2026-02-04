#!/usr/bin/env node

const impl = require('../../scripts/hooks-system/infrastructure/watchdog/token-monitor.js');

if (require.main === module) {
    impl.runTokenMonitor()
        .then(({ exitCode }) => process.exit(exitCode))
        .catch(error => {
            console.error('[token-monitor] Execution failed', error);
            process.exit(1);
        });
}

module.exports = impl;
