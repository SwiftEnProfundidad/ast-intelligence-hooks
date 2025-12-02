#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const MCP_CONFIG = {
    mcpServers: {
        'gitflow-automation-watcher': {
            command: 'node',
            type: 'stdio',
            args: ['./scripts/hooks-system/infrastructure/mcp/gitflow-automation-watcher.js'],
            env: {
                REPO_ROOT: process.cwd()
            }
        }
    }
};

function detectIDE() {
    const cursorConfig = path.join(os.homedir(), '.cursor');
    const windsurfConfig = path.join(os.homedir(), '.windsurf');
    const vscodeConfig = path.join(os.homedir(), '.vscode');

    if (fs.existsSync(cursorConfig)) return { name: 'Cursor', path: cursorConfig };
    if (fs.existsSync(windsurfConfig)) return { name: 'Windsurf', path: windsurfConfig };
    if (fs.existsSync(vscodeConfig)) return { name: 'VSCode', path: vscodeConfig };

    return null;
}

function configureMCP() {
    const cwd = process.cwd();
    console.log('🔌 Pumuki Hooks - MCP Configuration\n');

    const ide = detectIDE();
    if (!ide) {
        console.log('⚠️  No supported IDE detected (Cursor, Windsurf, VSCode)');
        console.log('   Creating local .cursor/mcp.json instead.\n');
    } else {
        console.log(`✅ Detected IDE: ${ide.name}`);
    }

    const mcpDir = path.join(cwd, '.cursor');
    const mcpFile = path.join(mcpDir, 'mcp.json');

    if (!fs.existsSync(mcpDir)) {
        fs.mkdirSync(mcpDir, { recursive: true });
    }

    const config = JSON.parse(JSON.stringify(MCP_CONFIG));
    config.mcpServers['gitflow-automation-watcher'].args[0] =
        path.join(cwd, 'scripts/hooks-system/infrastructure/mcp/gitflow-automation-watcher.js');
    config.mcpServers['gitflow-automation-watcher'].env.REPO_ROOT = cwd;

    if (fs.existsSync(mcpFile)) {
        const existing = JSON.parse(fs.readFileSync(mcpFile, 'utf8'));
        existing.mcpServers = { ...existing.mcpServers, ...config.mcpServers };
        fs.writeFileSync(mcpFile, JSON.stringify(existing, null, 2));
        console.log('✅ Updated existing .cursor/mcp.json');
    } else {
        fs.writeFileSync(mcpFile, JSON.stringify(config, null, 2));
        console.log('✅ Created .cursor/mcp.json');
    }

    console.log('\n📋 MCP Server configured:');
    console.log('   - gitflow-automation-watcher');
    console.log('\n🔄 Restart your IDE to activate the MCP server.');
}

if (require.main === module) {
    configureMCP();
}

module.exports = { configureMCP, detectIDE };
