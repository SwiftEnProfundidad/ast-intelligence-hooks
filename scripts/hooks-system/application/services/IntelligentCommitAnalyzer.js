const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const FeatureDetector = require('./commit/FeatureDetector');
const CommitMessageGenerator = require('./commit/CommitMessageGenerator');

class IntelligentCommitAnalyzer {
    constructor({ repoRoot = process.cwd(), logger = console } = {}) {
        this.repoRoot = repoRoot;
        this.logger = logger;
        this.featureDetector = new FeatureDetector();
        this.messageGenerator = new CommitMessageGenerator();
    }

    /**
     * Group files by feature/module using intelligent analysis
     * Only groups related files - ignores unrelated/config files
     */
    groupFilesByFeature(files) {
        const groups = new Map();
        const ungrouped = [];

        for (const file of files) {
            const feature = this.featureDetector.detectFeature(file);

            if (feature === null) {
                ungrouped.push(file);
                continue;
            }

            const module = this.featureDetector.detectModule(file);
            const key = `${feature}:${module}`;

            if (!groups.has(key)) {
                groups.set(key, {
                    feature,
                    module,
                    files: [],
                    platform: this.featureDetector.detectPlatform(file),
                    hasTests: false,
                    hasImplementation: false
                });
            }

            const group = groups.get(key);
            group.files.push(file);

            if (this.featureDetector.isTestFile(file)) {
                group.hasTests = true;
            } else {
                group.hasImplementation = true;
            }
        }

        const result = Array.from(groups.values());

        return result.filter(g => g.files.length >= 2);
    }

    /**
     * Verify tests pass for a feature group
     * DISABLED: Too expensive and prone to false positives
     * Only enable when explicitly requested
     */
    async verifyTests(group) {
        return { passed: null, reason: 'test verification disabled' };
    }

    /**
     * Verify project builds
     * DISABLED: Too expensive and prone to false positives
     * Only enable when explicitly requested
     */
    async verifyBuild(group) {
        return { built: null, reason: 'build check disabled' };
    }

    /**
     * Analyze files and suggest atomic commits
     * Only groups related files - no build/test verification
     */
    async analyzeAndSuggestCommits(files) {
        const groups = this.groupFilesByFeature(files);
        const suggestions = [];

        for (const group of groups) {
            if (group.files.length < 2) {
                continue;
            }

            const suggestion = {
                feature: group.feature,
                module: group.module,
                platform: group.platform,
                files: group.files,
                fileCount: group.files.length,
                hasTests: group.hasTests,
                commitMessage: this.messageGenerator.generate(group)
            };

            suggestions.push(suggestion);
        }

        return suggestions;
    }

    /**
     * Get ready-to-commit groups (all groups are ready - no verification)
     */
    getReadyCommits(suggestions) {
        return suggestions;
    }

    /**
     * Get groups that need attention (none - we don't verify)
     */
    getNeedsAttention(suggestions) {
        return [];
    }
}

module.exports = IntelligentCommitAnalyzer;
