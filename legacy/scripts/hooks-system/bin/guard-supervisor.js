#!/usr/bin/env node
/**
 * Script Wrapper
 * Redirects to the centralized implementation in scripts/hooks-system
 */
const env = require('../config/env');
require('../scripts/hooks-system/bin/guard-supervisor.js');
