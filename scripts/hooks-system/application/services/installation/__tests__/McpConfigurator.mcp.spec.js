const fs = require('fs');
const os = require('os');
const path = require('path');

const McpServerConfigBuilder = require('../mcp/McpServerConfigBuilder');
const McpProjectConfigWriter = require('../mcp/McpProjectConfigWriter');

describe('MCP installer (project-scoped)', () => {
    let testRoot;

    beforeEach(() => {
        testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ast-hooks-mcp-'));
        fs.mkdirSync(path.join(testRoot, 'scripts', 'hooks-system', 'infrastructure', 'mcp'), { recursive: true });
        fs.writeFileSync(
            path.join(testRoot, 'scripts', 'hooks-system', 'infrastructure', 'mcp', 'ast-intelligence-automation.js'),
            '#!/usr/bin/env node\nprocess.stdin.resume();\n'
        );
        fs.writeFileSync(
            path.join(testRoot, 'scripts', 'hooks-system', 'infrastructure', 'mcp', 'evidence-watcher.js'),
            '#!/usr/bin/env node\nprocess.stdin.resume();\n'
        );
    });

    afterEach(() => {
        if (testRoot && fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
    });

    it('should write Cursor and Windsurf MCP configs with automation + evidence watcher servers', () => {
        const builder = new McpServerConfigBuilder(testRoot, null, null);
        const { serverId, mcpConfig } = builder.build();

        const writer = new McpProjectConfigWriter(testRoot, null, null, null, null);
        writer.configureProjectScoped(mcpConfig, serverId);

        const cursorPath = path.join(testRoot, '.cursor', 'mcp.json');
        const windsurfPath = path.join(testRoot, '.windsurf', 'mcp.json');

        expect(fs.existsSync(cursorPath)).toBe(true);
        expect(fs.existsSync(windsurfPath)).toBe(true);

        const cursor = JSON.parse(fs.readFileSync(cursorPath, 'utf8'));
        const windsurf = JSON.parse(fs.readFileSync(windsurfPath, 'utf8'));

        const cursorServers = Object.keys(cursor.mcpServers || {});
        const windsurfServers = Object.keys(windsurf.mcpServers || {});

        expect(cursorServers.some(id => id.startsWith('ast-intelligence-automation-'))).toBe(true);
        expect(cursorServers.some(id => id.startsWith('ai-evidence-watcher-'))).toBe(true);

        expect(cursorServers).toContain('ast-intelligence-automation-hooks');
        expect(cursorServers).toContain('ai-evidence-watcher-hooks');

        expect(windsurfServers.some(id => id.startsWith('ast-intelligence-automation-'))).toBe(true);
        expect(windsurfServers.some(id => id.startsWith('ai-evidence-watcher-'))).toBe(true);

        expect(windsurfServers).toContain('ast-intelligence-automation-hooks');
        expect(windsurfServers).toContain('ai-evidence-watcher-hooks');
    });

    it('should be idempotent and not duplicate servers across runs', () => {
        const builder = new McpServerConfigBuilder(testRoot, null, null);
        const { serverId, mcpConfig } = builder.build();

        const writer = new McpProjectConfigWriter(testRoot, null, null, null, null);
        writer.configureProjectScoped(mcpConfig, serverId);
        writer.configureProjectScoped(mcpConfig, serverId);

        const cursorPath = path.join(testRoot, '.cursor', 'mcp.json');
        const cursor = JSON.parse(fs.readFileSync(cursorPath, 'utf8'));

        const ids = Object.keys(cursor.mcpServers || {});
        const automation = ids.filter(id => id.startsWith('ast-intelligence-automation-') && id !== 'ast-intelligence-automation-hooks');
        const evidence = ids.filter(id => id.startsWith('ai-evidence-watcher-') && id !== 'ai-evidence-watcher-hooks');

        expect(automation.length).toBe(1);
        expect(evidence.length).toBe(1);

        expect(ids.filter(id => id === 'ast-intelligence-automation-hooks').length).toBe(1);
        expect(ids.filter(id => id === 'ai-evidence-watcher-hooks').length).toBe(1);
    });
});
