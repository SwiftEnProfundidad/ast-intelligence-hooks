const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

class McpConfigurator {
    constructor(targetRoot, hookSystemRoot, logger = null) {
        this.targetRoot = targetRoot;
        this.hookSystemRoot = hookSystemRoot;
        this.logger = logger;
    }

    configure() {
        if (this.logger) this.logger.info('MCP_CONFIGURATION_STARTED');
        let nodePath = process.execPath;
        if (!nodePath || !fs.existsSync(nodePath)) {
            try {
                nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
            } catch (err) {
                nodePath = 'node';
            }
        }

        const mcpConfig = {
            mcpServers: {
                'ast-intelligence-automation': {
                    command: nodePath,
                    args: [
                        '${workspaceFolder}/scripts/hooks-system/infrastructure/mcp/ast-intelligence-automation.js'
                    ],
                    env: {
                        REPO_ROOT: '${workspaceFolder}',
                        AUTO_COMMIT_ENABLED: 'false',
                        AUTO_PUSH_ENABLED: 'false',
                        AUTO_PR_ENABLED: 'false'
                    }
                }
            }
        };

        const ideConfigs = this.detectIDEs();
        let configuredCount = 0;

        ideConfigs.forEach(ide => {
            if (!fs.existsSync(ide.configDir)) {
                fs.mkdirSync(ide.configDir, { recursive: true });
            }

            const mcpConfigPath = path.join(ide.configDir, 'mcp.json');

            if (!fs.existsSync(mcpConfigPath)) {
                const configToWrite = ide.name === 'Claude Desktop'
                    ? this.adaptConfigForClaudeDesktop(mcpConfig)
                    : mcpConfig;

                fs.writeFileSync(mcpConfigPath, JSON.stringify(configToWrite, null, 2));
                this.logSuccess(`Configured ${ide.configPath}`);
                if (this.logger) this.logger.info('MCP_CONFIGURED', { ide: ide.name, path: ide.configPath });
                configuredCount++;
            } else {
                try {
                    const existing = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
                    if (!existing.mcpServers) {
                        existing.mcpServers = {};
                    }

                    existing.mcpServers['ast-intelligence-automation'] = mcpConfig.mcpServers['ast-intelligence-automation'];

                    fs.writeFileSync(mcpConfigPath, JSON.stringify(existing, null, 2));
                    this.logSuccess(`Updated ${ide.configPath} (merged configuration)`);
                    if (this.logger) this.logger.info('MCP_CONFIG_UPDATED', { ide: ide.name, path: ide.configPath });
                    configuredCount++;
                } catch (mergeError) {
                    this.logWarning(`${ide.configPath} already exists and couldn't be merged, skipping`);
                    if (this.logger) this.logger.warn('MCP_CONFIG_MERGE_FAILED', { ide: ide.name, error: mergeError.message });
                }
            }
        });

        if (configuredCount === 0 && ideConfigs.length === 0) {
            this.configureFallback(mcpConfig);
        }
    }

    configureFallback(mcpConfig) {
        const cursorDir = path.join(this.targetRoot, '.cursor');
        if (!fs.existsSync(cursorDir)) {
            fs.mkdirSync(cursorDir, { recursive: true });
        }
        const fallbackPath = path.join(cursorDir, 'mcp.json');
        if (!fs.existsSync(fallbackPath)) {
            fs.writeFileSync(fallbackPath, JSON.stringify(mcpConfig, null, 2));
            this.logSuccess('Configured .cursor/mcp.json (generic fallback)');
            this.logInfo('Note: MCP servers work with any MCP-compatible IDE');
            if (this.logger) this.logger.info('MCP_FALLBACK_CONFIGURED', { path: fallbackPath });
        } else {
            try {
                const existing = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
                if (!existing.mcpServers) {
                    existing.mcpServers = {};
                }
                existing.mcpServers['ast-intelligence-automation'] = mcpConfig.mcpServers['ast-intelligence-automation'];
                fs.writeFileSync(fallbackPath, JSON.stringify(existing, null, 2));
                this.logSuccess('Updated .cursor/mcp.json (merged configuration)');
                if (this.logger) this.logger.info('MCP_FALLBACK_UPDATED', { path: fallbackPath });
            } catch (mergeError) {
                this.logWarning('.cursor/mcp.json exists and couldn\'t be merged, skipping');
                if (this.logger) this.logger.warn('MCP_FALLBACK_MERGE_FAILED', { error: mergeError.message });
            }
        }
    }

    detectIDEs() {
        const os = require('os');
        const homeDir = os.homedir();
        const ideConfigs = [];

        const cursorProjectPath = path.join(this.targetRoot, '.cursor', 'mcp.json');
        ideConfigs.push({
            name: 'Cursor',
            configDir: path.dirname(cursorProjectPath),
            configPath: '.cursor/mcp.json',
            type: 'project'
        });

        let claudeDesktopConfigDir;
        if (process.platform === 'darwin') {
            claudeDesktopConfigDir = path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
        } else if (process.platform === 'win32') {
            claudeDesktopConfigDir = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
        } else {
            claudeDesktopConfigDir = path.join(homeDir, '.config', 'claude_desktop_config.json');
        }

        if (fs.existsSync(path.dirname(claudeDesktopConfigDir))) {
            ideConfigs.push({
                name: 'Claude Desktop',
                configDir: path.dirname(claudeDesktopConfigDir),
                configPath: claudeDesktopConfigDir,
                type: 'global'
            });
        }

        const windsurfProjectPath = path.join(this.targetRoot, '.windsurf', 'mcp.json');
        if (fs.existsSync(path.dirname(windsurfProjectPath)) || fs.existsSync(path.join(homeDir, '.windsurf'))) {
            ideConfigs.push({
                name: 'Windsurf',
                configDir: path.dirname(windsurfProjectPath),
                configPath: '.windsurf/mcp.json',
                type: 'project'
            });
        }

        return ideConfigs;
    }

    adaptConfigForClaudeDesktop(config) {
        return config;
    }

    logSuccess(msg) { process.stdout.write(`${COLORS.green}✓ ${msg}${COLORS.reset}\n`); }
    logWarning(msg) { process.stdout.write(`${COLORS.yellow}⚠️  ${msg}${COLORS.reset}\n`); }
    logInfo(msg) { process.stdout.write(`${COLORS.cyan}ℹ️  ${msg}${COLORS.reset}\n`); }
}

module.exports = McpConfigurator;
