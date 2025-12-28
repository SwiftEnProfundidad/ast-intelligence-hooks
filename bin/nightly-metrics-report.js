#!/usr/bin/env node
const impl = require('../scripts/hooks-system/bin/nightly-metrics-report.js');

if (require.main === module) {
    impl.run();
}

module.exports = impl;
