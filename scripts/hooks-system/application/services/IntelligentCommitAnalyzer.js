const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const FeatureDetector = require('./commit/FeatureDetector');
const CommitMessageGenerator = require('./commit/CommitMessageGenerator');
const UnifiedLogger = require('./logging/UnifiedLogger');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class IntelligentCommitAnalyzer {
    constructor({ repoRoot = process.cwd(), logger = null } = {}) {
        const m_constructor = createMetricScope({
            hook: 'intelligent_commit_analyzer',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = repoRoot;
        this.logger = logger || console;
        this.featureDetector = new FeatureDetector(this.logger);
        this.messageGenerator = new CommitMessageGenerator(this.logger);
        m_constructor.success();
    }

    detectFeature(filePath) {
        return this.featureDetector.detectFeature(filePath);
    }

    detectModule(filePath) {
        return this.featureDetector.detectModule(filePath);
    }

    detectPlatform(filePath) {
        return this.featureDetector.detectPlatform(filePath);
    }

    isTestFile(filePath) {
        return this.featureDetector.isTestFile(filePath);
    }

    generateCommitMessage(group) {
        return this.messageGenerator.generate(group);
    }

    /**
     * Group files by feature/module using intelligent analysis
     * Only groups related files - ignores unrelated/config files
     */
    groupFilesByFeature(files) {
        this.logger.debug('ANALYZING_FILES', { count: files.length });
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
        const filtered = result.filter(g => g.files.length >= 2);

        this.logger.info('ANALYSIS_COMPLETE', {
            totalFiles: files.length,
            groupsFound: filtered.length,
            ungroupedCount: ungrouped.length
        });

        return filtered;
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
        const m_get_ready_commits = createMetricScope({
            hook: 'intelligent_commit_analyzer',
            operation: 'get_ready_commits'
        });

        m_get_ready_commits.started();
        m_get_ready_commits.success();
        return suggestions;
    }

    /**
     * Get groups that need attention (none - we don't verify)
     */
    getNeedsAttention(suggestions) {
        const m_get_needs_attention = createMetricScope({
            hook: 'intelligent_commit_analyzer',
            operation: 'get_needs_attention'
        });

        m_get_needs_attention.started();
        m_get_needs_attention.success();
        return [];
    }
}

module.exports = IntelligentCommitAnalyzer;
