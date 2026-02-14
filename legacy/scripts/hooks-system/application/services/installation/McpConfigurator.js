const fs = require('fs');
const path = require('path');
const AuditLogger = require('../logging/AuditLogger');
const McpServerConfigBuilder = require('./mcp/McpServerConfigBuilder');
const McpProjectConfigWriter = require('./mcp/McpProjectConfigWriter');

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
        this.serverConfigBuilder = new McpServerConfigBuilder(targetRoot, hookSystemRoot, logger);
        this.projectWriter = new McpProjectConfigWriter(targetRoot, logger, this.logSuccess.bind(this), this.logWarning.bind(this), this.logInfo.bind(this));
    }

    configure() {
        if (this.logger) this.logger.info('MCP_CONFIGURATION_STARTED');

        const { serverId, mcpConfig } = this.serverConfigBuilder.build();
        this.projectWriter.configureProjectScoped(mcpConfig, serverId);
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
