const fs = require('fs');
const path = require('path');

class McpProjectConfigWriter {
    constructor(targetRoot, logger, logSuccess, logWarning, logInfo) {
        this.targetRoot = targetRoot;
        this.logger = logger;
        this.logSuccess = logSuccess;
        this.logWarning = logWarning;
        this.logInfo = logInfo;
    }

    configureProjectScoped(mcpConfig, serverId) {
        this.writeWindsurfConfig(mcpConfig, serverId);
        this.writeCursorConfig(mcpConfig, serverId);
    }

    writeWindsurfConfig(mcpConfig, serverId) {
        const windsurfProjectDir = path.join(this.targetRoot, '.windsurf');
        const windsurfProjectPath = path.join(windsurfProjectDir, 'mcp.json');
        this.writeProjectConfig(windsurfProjectDir, windsurfProjectPath, mcpConfig, serverId, 'Windsurf', 'MCP_PROJECT_CONFIGURED', 'MCP_PROJECT_CONFIGURE_FAILED');
    }

    writeCursorConfig(mcpConfig, serverId) {
        const cursorProjectDir = path.join(this.targetRoot, '.cursor');
        const cursorProjectPath = path.join(cursorProjectDir, 'mcp.json');
        this.writeProjectConfig(cursorProjectDir, cursorProjectPath, mcpConfig, serverId, 'Cursor', 'MCP_CURSOR_CONFIGURED', 'MCP_CURSOR_CONFIGURE_FAILED');
    }

    writeProjectConfig(dir, filePath, mcpConfig, serverId, label, successEvent, errorEvent) {
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            let finalConfig = mcpConfig;
            if (fs.existsSync(filePath)) {
                const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                if (!existing.mcpServers) existing.mcpServers = {};
                Object.keys(existing.mcpServers).forEach(id => {
                    if (id.startsWith('ast-intelligence-automation-') && id !== serverId) {
                        delete existing.mcpServers[id];
                    }
                });
                existing.mcpServers[serverId] = mcpConfig.mcpServers[serverId];
                finalConfig = existing;
            }

            fs.writeFileSync(filePath, JSON.stringify(finalConfig, null, 2));
            this.logSuccess?.(`Configured project-scoped ${label} MCP at ${filePath}`);
            this.logger?.info?.(successEvent, { path: filePath, serverId });
        } catch (error) {
            this.logWarning?.(`Failed to configure ${label} MCP: ${error.message}`);
            this.logger?.warn?.(errorEvent, { error: error.message });
        }
    }
}

module.exports = McpProjectConfigWriter;
