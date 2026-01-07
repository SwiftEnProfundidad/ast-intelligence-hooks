const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');
const os = require('os');
const env = require('../../../config/env.js');
const AuditLogger = require('../logging/AuditLogger');

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function slugifyId(input) {
    return String(input || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
}

function computeRepoFingerprint(repoRoot) {
    try {
        const real = fs.realpathSync(repoRoot);
        return crypto.createHash('sha1').update(real).digest('hex').slice(0, 8);
    } catch (error) {
        if (process.env.DEBUG) {
            process.stderr.write(`[MCP] computeRepoFingerprint fallback: ${error && error.message ? error.message : String(error)}\n`);
        }
        return crypto.createHash('sha1').update(String(repoRoot || '')).digest('hex').slice(0, 8);
    }
}

function computeServerIdForRepo(repoRoot) {
    const legacyServerId = 'ast-intelligence-automation';
    const forced = (env.get('MCP_SERVER_ID', '') || '').trim();
    if (forced.length > 0) return forced;

    const repoName = path.basename(repoRoot || process.cwd());
    const slug = slugifyId(repoName) || 'repo';
    const fp = computeRepoFingerprint(repoRoot);
    return `${legacyServerId}-${slug}-${fp}`;
}

class McpConfigurator {
    constructor(targetRoot, hookSystemRoot, logger = null) {
        this.targetRoot = targetRoot;
        this.hookSystemRoot = hookSystemRoot;
        this.logger = logger;
    }

    resolveAutomationEntrypoint() {
        // Prefer dependency-installed hook system (node_modules) to avoid requiring scripts/hooks-system in consumer repos
        // Fallback to repo-local hook system if it exists.
        const candidates = [
            this.hookSystemRoot
                ? path.join(this.hookSystemRoot, 'infrastructure', 'mcp', 'ast-intelligence-automation.js')
                : null,
            path.join(this.targetRoot, 'scripts', 'hooks-system', 'infrastructure', 'mcp', 'ast-intelligence-automation.js')
        ].filter(Boolean);

        for (const c of candidates) {
            try {
                if (fs.existsSync(c)) return c;
            } catch (error) {
                // Log error but continue checking other candidates
                console.warn(`Failed to check path ${c}:`, error.message);
            }
        }

        // Last resort: keep previous behaviour
        return path.join(this.targetRoot, 'scripts/hooks-system/infrastructure/mcp/ast-intelligence-automation.js');
    }

    disableDuplicateServersForRepo(existing, currentServerId) {
        if (!existing || !existing.mcpServers) return;

        Object.entries(existing.mcpServers).forEach(([id, server]) => {
            if (!server || id === currentServerId) return;
            const envObj = server.env || {};
            const repoRoot = envObj.REPO_ROOT;
            if (repoRoot !== this.targetRoot) return;

            const args0 = Array.isArray(server.args) ? String(server.args[0] || '') : '';
            // Disable legacy server pointing to repo-local scripts/hooks-system when we already configure the canonical one
            if (args0.includes('/scripts/hooks-system/') || args0.includes('\\scripts\\hooks-system\\')) {
                server.disabled = true;
            }
        });
    }

    getGlobalWindsurfConfigPath() {
        return path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
    }

    configure() {
        if (this.logger) this.logger.info('MCP_CONFIGURATION_STARTED');

        let nodePath = process.execPath;
        if (!nodePath || !fs.existsSync(nodePath)) {
            try {
                nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
            } catch (error) {
                if (process.env.DEBUG) {
                    process.stderr.write(`[MCP] which node failed: ${error && error.message ? error.message : String(error)}\n`);
                }
                nodePath = 'node';
            }
        }

        const serverId = computeServerIdForRepo(this.targetRoot);
        const entrypoint = this.resolveAutomationEntrypoint();
        const mcpConfig = {
            mcpServers: {
                [serverId]: {
                    command: nodePath,
                    args: [
                        entrypoint
                    ],
                    env: {
                        REPO_ROOT: this.targetRoot,
                        AUTO_COMMIT_ENABLED: 'false',
                        AUTO_PUSH_ENABLED: 'false',
                        AUTO_PR_ENABLED: 'false'
                    }
                }
            }
        };

        this.configureProjectScoped(mcpConfig, serverId);
        this.cleanupGlobalConfig(serverId);
    }

    configureProjectScoped(mcpConfig, serverId) {
        const windsurfProjectDir = path.join(this.targetRoot, '.windsurf');
        const windsurfProjectPath = path.join(windsurfProjectDir, 'mcp.json');

        try {
            if (!fs.existsSync(windsurfProjectDir)) {
                fs.mkdirSync(windsurfProjectDir, { recursive: true });
            }

            let finalConfig = mcpConfig;
            if (fs.existsSync(windsurfProjectPath)) {
                const existing = JSON.parse(fs.readFileSync(windsurfProjectPath, 'utf8'));
                if (!existing.mcpServers) existing.mcpServers = {};
                Object.keys(existing.mcpServers).forEach(id => {
                    if (id.startsWith('ast-intelligence-automation-') && id !== serverId) {
                        delete existing.mcpServers[id];
                    }
                });
                existing.mcpServers[serverId] = mcpConfig.mcpServers[serverId];
                finalConfig = existing;
            }

            fs.writeFileSync(windsurfProjectPath, JSON.stringify(finalConfig, null, 2));
            this.logSuccess(`Configured project-scoped Windsurf MCP at ${windsurfProjectPath}`);
            if (this.logger) this.logger.info('MCP_PROJECT_CONFIGURED', { path: windsurfProjectPath, serverId });
        } catch (error) {
            this.logWarning(`Failed to configure project-scoped MCP: ${error.message}`);
            if (this.logger) this.logger.warn('MCP_PROJECT_CONFIGURE_FAILED', { error: error.message });
        }

        const cursorProjectDir = path.join(this.targetRoot, '.cursor');
        const cursorProjectPath = path.join(cursorProjectDir, 'mcp.json');

        try {
            if (!fs.existsSync(cursorProjectDir)) {
                fs.mkdirSync(cursorProjectDir, { recursive: true });
            }

            let finalConfig = mcpConfig;
            if (fs.existsSync(cursorProjectPath)) {
                const existing = JSON.parse(fs.readFileSync(cursorProjectPath, 'utf8'));
                if (!existing.mcpServers) existing.mcpServers = {};
                Object.keys(existing.mcpServers).forEach(id => {
                    if (id.startsWith('ast-intelligence-automation-') && id !== serverId) {
                        delete existing.mcpServers[id];
                    }
                });
                existing.mcpServers[serverId] = mcpConfig.mcpServers[serverId];
                finalConfig = existing;
            }

            fs.writeFileSync(cursorProjectPath, JSON.stringify(finalConfig, null, 2));
            this.logSuccess(`Configured project-scoped Cursor MCP at ${cursorProjectPath}`);
            if (this.logger) this.logger.info('MCP_CURSOR_CONFIGURED', { path: cursorProjectPath, serverId });
        } catch (error) {
            this.logWarning(`Failed to configure Cursor MCP: ${error.message}`);
            if (this.logger) this.logger.warn('MCP_CURSOR_CONFIGURE_FAILED', { error: error.message });
        }
    }

    cleanupGlobalConfig(currentServerId) {
        const globalConfigPath = this.getGlobalWindsurfConfigPath();

        try {
            if (!fs.existsSync(globalConfigPath)) return;

            const existing = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));
            if (!existing.mcpServers) return;

            let modified = false;
            Object.keys(existing.mcpServers).forEach(id => {
                const server = existing.mcpServers[id];
                if (!server || !server.env) return;

                if (server.env.REPO_ROOT === this.targetRoot) {
                    delete existing.mcpServers[id];
                    modified = true;
                    this.logInfo(`Removed ${id} from global config (now project-scoped)`);
                }
            });

            if (modified) {
                fs.writeFileSync(globalConfigPath, JSON.stringify(existing, null, 2));
                if (this.logger) this.logger.info('MCP_GLOBAL_CLEANUP', { removedForRepo: this.targetRoot });
            }
        } catch (error) {
            if (process.env.DEBUG) {
                process.stderr.write(`[MCP] cleanupGlobalConfig failed: ${error.message}\n`);
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
