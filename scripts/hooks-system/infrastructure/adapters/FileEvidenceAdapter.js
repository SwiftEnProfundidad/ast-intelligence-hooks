/**
 * FileEvidenceAdapter
 *
 * Infrastructure adapter implementing IEvidencePort using file system.
 */
const env = require('../../config/env');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ConfigurationError } = require('../../domain/errors');
const AuditLogger = require('../../application/services/logging/AuditLogger');

function resolveUpdateEvidenceScript(repoRoot) {
    const candidates = [
        path.join(repoRoot, 'scripts/hooks-system/bin/update-evidence.sh'),
        path.join(repoRoot, 'node_modules/@pumuki/ast-intelligence-hooks/bin/update-evidence.sh'),
        path.join(repoRoot, 'bin/update-evidence.sh')
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

class FileEvidenceAdapter {
    constructor(config = {}) {
        this.repoRoot = config.repoRoot || process.cwd();
        this.evidencePath = config.evidencePath || path.join(this.repoRoot, '.AI_EVIDENCE.json');
        this.updateScriptPath = config.updateScriptPath || resolveUpdateEvidenceScript(this.repoRoot);
        this.staleThreshold = config.staleThreshold || 180;
    }

    read() {
        try {
            if (!this.exists()) {
                return null;
            }
            const content = fs.readFileSync(this.evidencePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error('[FileEvidenceAdapter] Error reading evidence:', error.message);
            return null;
        }
    }

    write(evidence) {
        try {
            const content = JSON.stringify(evidence, null, 2);
            fs.writeFileSync(this.evidencePath, content, 'utf-8');
            return true;
        } catch (error) {
            console.error('[FileEvidenceAdapter] Error writing evidence:', error.message);
            return false;
        }
    }

    exists() {
        return fs.existsSync(this.evidencePath);
    }

    getAgeSeconds() {
        try {
            if (!this.exists()) {
                return Infinity;
            }
            const stats = fs.statSync(this.evidencePath);
            const now = Date.now();
            const mtime = stats.mtime.getTime();
            return Math.floor((now - mtime) / 1000);
        } catch (error) {
            console.error('[FileEvidenceAdapter] Error getting age:', error.message);
            return Infinity;
        }
    }

    isStale(thresholdSeconds = this.staleThreshold) {
        return this.getAgeSeconds() > thresholdSeconds;
    }

    refresh(options = {}) {
        try {
            const platforms = options.platforms || 'backend';
            const mode = options.mode || '--auto';

            if (!this.updateScriptPath || !fs.existsSync(this.updateScriptPath)) {
                throw new ConfigurationError('update-evidence.sh not found', 'updateScriptPath');
            }

            execSync(`bash "${this.updateScriptPath}" ${mode} --platforms ${platforms}`, {
                cwd: this.repoRoot,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe']
            });

            return true;
        } catch (error) {
            console.error('[FileEvidenceAdapter] Error refreshing evidence:', error.message);
            return false;
        }
    }

    getSession() {
        const evidence = this.read();
        return evidence?.session || null;
    }

    getPlatforms() {
        const evidence = this.read();
        if (!evidence?.platforms_detected) {
            return [];
        }
        return Object.keys(evidence.platforms_detected).filter(
            p => evidence.platforms_detected[p] === true
        );
    }

    getModifiedFiles() {
        const evidence = this.read();
        return evidence?.files_modified || [];
    }

    getTimestamp() {
        const evidence = this.read();
        return evidence?.timestamp || null;
    }

    getRulesRead() {
        const evidence = this.read();
        return evidence?.rules_read || {};
    }

    getAstSummary() {
        const evidence = this.read();
        return evidence?.ast_summary || null;
    }
}

module.exports = FileEvidenceAdapter;
