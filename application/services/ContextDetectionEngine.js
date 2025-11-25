const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class ContextDetectionEngine {
    constructor(repoRoot) {
        this.repoRoot = repoRoot || process.cwd();
        this.cache = {
            context: null,
            timestamp: 0,
            ttl: 10000
        };
    }

    async detectContext() {
        if (this.isCacheValid()) {
            return this.cache.context;
        }

        const context = {
            stagedFiles: this.getStagedFiles(),
            stagedSignature: this.getStagedSignature(),
            recentFiles: this.getRecentlyModifiedFiles(),
            recentCommits: this.getRecentCommitPatterns(),
            branchName: this.getCurrentBranch(),
            openFiles: this.inferFromGitStatus(),
            timestamp: Date.now()
        };

        this.cache = {
            context,
            timestamp: Date.now(),
            ttl: this.cache.ttl
        };

        return context;
    }

    isCacheValid() {
        const age = Date.now() - this.cache.timestamp;
        return this.cache.context && age < this.cache.ttl;
    }

    getStagedFiles() {
        try {
            const output = execSync('git diff --cached --name-only', {
                cwd: this.repoRoot,
                encoding: 'utf-8'
            }).trim();

            return output ? output.split('\n').filter(Boolean) : [];
        } catch (error) {
            return [];
        }
    }

    getStagedSignature() {
        try {
            const patch = execSync('git diff --cached --patch', {
                cwd: this.repoRoot,
                encoding: 'utf-8'
            });

            if (!patch) return '';

            return crypto.createHash('sha1').update(patch).digest('hex');
        } catch (error) {
            return '';
        }
    }

    getRecentlyModifiedFiles() {
        try {
            const output = execSync('git status --short', {
                cwd: this.repoRoot,
                encoding: 'utf-8'
            }).trim();

            if (!output) return [];

            return output
                .split('\n')
                .filter(Boolean)
                .map(line => line.trim().substring(2))
                .filter(file => !file.startsWith('.git'));
        } catch (error) {
            return [];
        }
    }

    getRecentCommitPatterns() {
        try {
            const output = execSync('git log -10 --pretty=format:"%H|%s" --name-only', {
                cwd: this.repoRoot,
                encoding: 'utf-8',
                maxBuffer: 1024 * 1024
            }).trim();

            if (!output) return [];

            const commits = [];
            const lines = output.split('\n');
            let currentCommit = null;

            for (const line of lines) {
                if (line.includes('|')) {
                    if (currentCommit) {
                        commits.push(currentCommit);
                    }
                    const [hash, message] = line.split('|');
                    currentCommit = {
                        hash: hash.trim(),
                        message: message.trim(),
                        files: []
                    };
                } else if (line.trim() && currentCommit) {
                    currentCommit.files.push(line.trim());
                }
            }

            if (currentCommit) {
                commits.push(currentCommit);
            }

            return commits.slice(0, 10);
        } catch (error) {
            return [];
        }
    }

    getCurrentBranch() {
        try {
            return execSync('git branch --show-current', {
                cwd: this.repoRoot,
                encoding: 'utf-8'
            }).trim();
        } catch (error) {
            return 'unknown';
        }
    }

    inferFromGitStatus() {
        const staged = this.getStagedFiles();
        const modified = this.getRecentlyModifiedFiles();

        return [...new Set([...staged, ...modified])];
    }

    parseBranchContext() {
        const branch = this.getCurrentBranch();

        const platformPatterns = {
            backend: ['backend', 'api', 'server'],
            frontend: ['frontend', 'web', 'admin', 'dashboard'],
            ios: ['ios', 'swift'],
            android: ['android', 'kotlin']
        };

        for (const [platform, patterns] of Object.entries(platformPatterns)) {
            if (patterns.some(pattern => branch.toLowerCase().includes(pattern))) {
                return { platform, confidence: 80 };
            }
        }

        return { platform: null, confidence: 0 };
    }

    hasContextChanged(previousContext) {
        if (!previousContext) return true;

        const current = this.cache.context;
        if (!current) return true;

        const stagedChanged = JSON.stringify(current.stagedFiles) !== JSON.stringify(previousContext.stagedFiles);
        const signatureChanged = (current.stagedSignature || '') !== (previousContext.stagedSignature || '');
        const branchChanged = current.branchName !== previousContext.branchName;

        return stagedChanged || signatureChanged || branchChanged;
    }

    clearCache() {
        this.cache = {
            context: null,
            timestamp: 0,
            ttl: this.cache.ttl
        };
    }
}

module.exports = ContextDetectionEngine;

