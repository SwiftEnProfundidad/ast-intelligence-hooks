#!/usr/bin/env node

if (!process.env.REPO_ROOT) {
    process.env.REPO_ROOT = process.cwd();
}

if (!process.env.MCP_SERVER_NAME) {
    const path = require('path');
    const folderName = path.basename(process.env.REPO_ROOT).toLowerCase();
    process.env.MCP_SERVER_NAME = `ast-intelligence-automation-${folderName}`;
}

require('../scripts/hooks-system/infrastructure/mcp/ast-intelligence-automation.js');
