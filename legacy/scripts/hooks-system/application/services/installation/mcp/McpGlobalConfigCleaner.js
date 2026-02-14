const fs = require('fs');
const path = require('path');

class McpGlobalConfigCleaner {
    constructor(targetRoot, logger, logInfo) {
        this.targetRoot = targetRoot;
        this.logger = logger;
        this.logInfo = logInfo;
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
                    this.logInfo?.(`Removed ${id} from global config (now project-scoped)`);
                }
            });

            if (modified) {
                fs.writeFileSync(globalConfigPath, JSON.stringify(existing, null, 2));
                this.logger?.info?.('MCP_GLOBAL_CLEANUP', { removedForRepo: this.targetRoot });
            }
        } catch (error) {
            if (process.env.DEBUG) {
                process.stderr.write(`[MCP] cleanupGlobalConfig failed: ${error.message}\n`);
            }
        }
    }

    getGlobalWindsurfConfigPath() {
        const os = require('os');
        return path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
    }
}

module.exports = McpGlobalConfigCleaner;
