const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');
const env = require('../../../../config/env.js');

function slugifyId(input) {
    return String(input || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
}

class McpServerConfigBuilder {
    constructor(targetRoot, hookSystemRoot, logger = null) {
        this.targetRoot = targetRoot;
        this.hookSystemRoot = hookSystemRoot;
        this.logger = logger;
    }

    build() {
        const serverId = this.computeServerIdForRepo(this.targetRoot);
        const evidenceWatcherServerId = this.computeEvidenceWatcherServerIdForRepo(this.targetRoot);
        const entrypoint = this.resolveAutomationEntrypoint();
        const evidenceEntrypoint = this.resolveEvidenceWatcherEntrypoint();
        const nodePath = this.resolveNodeBinary();

        const stableAutomationAlias = 'ast-intelligence-automation-hooks';
        const stableEvidenceAlias = 'ai-evidence-watcher-hooks';

        const mcpConfig = {
            mcpServers: {
                [serverId]: {
                    command: nodePath,
                    args: [entrypoint],
                    env: {
                        REPO_ROOT: this.targetRoot,
                        AUTO_COMMIT_ENABLED: 'false',
                        AUTO_PUSH_ENABLED: 'false',
                        AUTO_PR_ENABLED: 'false'
                    }
                },
                [evidenceWatcherServerId]: {
                    command: nodePath,
                    args: [evidenceEntrypoint],
                    env: {
                        REPO_ROOT: this.targetRoot,
                        MCP_MAC_NOTIFICATIONS: 'true'
                    }
                },
                [stableAutomationAlias]: {
                    command: nodePath,
                    args: [entrypoint],
                    env: {
                        REPO_ROOT: this.targetRoot,
                        AUTO_COMMIT_ENABLED: 'false',
                        AUTO_PUSH_ENABLED: 'false',
                        AUTO_PR_ENABLED: 'false'
                    }
                },
                [stableEvidenceAlias]: {
                    command: nodePath,
                    args: [evidenceEntrypoint],
                    env: {
                        REPO_ROOT: this.targetRoot,
                        MCP_MAC_NOTIFICATIONS: 'true'
                    }
                }
            }
        };

        return { serverId, mcpConfig };
    }

    resolveAutomationEntrypoint() {
        const candidates = [
            this.hookSystemRoot
                ? path.join(this.hookSystemRoot, 'infrastructure', 'mcp', 'ast-intelligence-automation.js')
                : null,
            path.join(this.targetRoot, 'scripts', 'hooks-system', 'infrastructure', 'mcp', 'ast-intelligence-automation.js')
        ].filter(Boolean);

        for (const candidate of candidates) {
            try {
                if (fs.existsSync(candidate)) return candidate;
            } catch (error) {
                this.logger?.warn?.('MCP_ENTRYPOINT_CHECK_FAILED', { candidate, error: error.message });
            }
        }

        return path.join(this.targetRoot, 'scripts/hooks-system/infrastructure/mcp/ast-intelligence-automation.js');
    }

    resolveEvidenceWatcherEntrypoint() {
        const candidates = [
            this.hookSystemRoot
                ? path.join(this.hookSystemRoot, 'infrastructure', 'mcp', 'evidence-watcher.js')
                : null,
            path.join(this.targetRoot, 'scripts', 'hooks-system', 'infrastructure', 'mcp', 'evidence-watcher.js')
        ].filter(Boolean);

        for (const candidate of candidates) {
            try {
                if (fs.existsSync(candidate)) return candidate;
            } catch (error) {
                this.logger?.warn?.('MCP_EVIDENCE_ENTRYPOINT_CHECK_FAILED', { candidate, error: error.message });
            }
        }

        return path.join(this.targetRoot, 'scripts/hooks-system/infrastructure/mcp/evidence-watcher.js');
    }

    resolveNodeBinary() {
        let nodePath = process.execPath;
        if (nodePath && fs.existsSync(nodePath)) return nodePath;

        try {
            return execSync('which node', { encoding: 'utf-8' }).trim();
        } catch (error) {
            if (process.env.DEBUG) {
                process.stderr.write(`[MCP] which node failed: ${error && error.message ? error.message : String(error)}\n`);
            }
            return 'node';
        }
    }

    computeServerIdForRepo(repoRoot) {
        const legacyServerId = 'ast-intelligence-automation';
        const forced = (env.get('MCP_SERVER_ID', '') || '').trim();
        if (forced.length > 0) return forced;

        const repoName = path.basename(repoRoot || process.cwd());
        const slug = slugifyId(repoName) || 'repo';
        const fp = this.computeRepoFingerprint(repoRoot);
        return `${legacyServerId}-${slug}-${fp}`;
    }

    computeEvidenceWatcherServerIdForRepo(repoRoot) {
        const legacyServerId = 'ai-evidence-watcher';
        const forced = (env.get('MCP_EVIDENCE_SERVER_ID', '') || '').trim();
        if (forced.length > 0) return forced;

        const repoName = path.basename(repoRoot || process.cwd());
        const slug = slugifyId(repoName) || 'repo';
        const fp = this.computeRepoFingerprint(repoRoot);
        return `${legacyServerId}-${slug}-${fp}`;
    }

    computeRepoFingerprint(repoRoot) {
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
}

module.exports = McpServerConfigBuilder;
