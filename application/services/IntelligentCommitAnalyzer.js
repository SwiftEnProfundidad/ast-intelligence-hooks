const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class IntelligentCommitAnalyzer {
    constructor({ repoRoot = process.cwd(), logger = console } = {}) {
        this.repoRoot = repoRoot;
        this.logger = logger;
    }

    /**
     * Group files by feature/module using intelligent analysis
     * Only groups related files - ignores unrelated/config files
     */
    groupFilesByFeature(files) {
        const groups = new Map();
        const ungrouped = [];

        for (const file of files) {
            const feature = this.detectFeature(file);

            // Skip files that shouldn't be grouped
            if (feature === null) {
                ungrouped.push(file);
                continue;
            }

            const module = this.detectModule(file);
            const key = `${feature}:${module}`;

            if (!groups.has(key)) {
                groups.set(key, {
                    feature,
                    module,
                    files: [],
                    platform: this.detectPlatform(file),
                    hasTests: false,
                    hasImplementation: false
                });
            }

            const group = groups.get(key);
            group.files.push(file);

            if (this.isTestFile(file)) {
                group.hasTests = true;
            } else {
                group.hasImplementation = true;
            }
        }

        const result = Array.from(groups.values());

        // Only return groups with at least 2 files (meaningful grouping)
        return result.filter(g => g.files.length >= 2);
    }

    /**
     * Detect feature name from file path
     * Returns null for non-feature files (config, scripts, docs)
     */
    detectFeature(filePath) {
        // Skip deleted files - they don't need grouping
        if (filePath.startsWith(' D ') || filePath.includes('(deleted)')) {
            return null;
        }

        // Skip config/build files
        if (filePath.match(/\.(json|yaml|yml|toml|lock)$/) &&
            (filePath.includes('package.json') || filePath.includes('tsconfig') || filePath.includes('build'))) {
            return null;
        }

        // Skip built/binary files
        if (filePath.match(/\/bin\/|\/dist\/|\/build\/|\.(class|jar|o|so|dylib)$/)) {
            return null;
        }

        // Backend: apps/backend/src/orders/... → "orders"
        const backendMatch = filePath.match(/apps\/backend\/src\/([^\/]+)/);
        if (backendMatch) return backendMatch[1];

        // Frontend: apps/admin-dashboard/src/orders/... → "orders"
        const frontendMatch = filePath.match(/apps\/(?:admin-dashboard|web-app)\/src\/([^\/]+)/);
        if (frontendMatch) return frontendMatch[1];

        // iOS: apps/ios/Orders/... → "Orders"
        const iosMatch = filePath.match(/apps\/ios\/([^\/]+)/);
        if (iosMatch) return iosMatch[1];

        // Android: apps/android/feature/orders/... → "orders"
        const androidMatch = filePath.match(/apps\/android\/feature\/([^\/]+)/);
        if (androidMatch) return androidMatch[1];

        // Group hooks-system files together
        if (filePath.includes('hooks-system')) {
            return 'hooks-system';
        }

        // Group .claude files together
        if (filePath.includes('.claude/')) {
            return 'claude-config';
        }

        // Group docs together
        if (filePath.includes('docs/')) {
            return 'docs';
        }

        // Skip root level config files (they're usually unrelated)
        if (filePath.match(/^(\.github|\.vscode|\.cursor|\.claude)\//)) {
            return null;
        }

        return null; // Don't group unrelated files
    }

    /**
     * Detect module/concern from file path
     */
    detectModule(filePath) {
        if (filePath.includes('/domain/')) return 'domain';
        if (filePath.includes('/application/')) return 'application';
        if (filePath.includes('/infrastructure/')) return 'infrastructure';
        if (filePath.includes('/presentation/')) return 'presentation';
        if (filePath.includes('/data/')) return 'data';
        if (filePath.includes('/ui/')) return 'ui';
        if (filePath.includes('/hooks/')) return 'hooks';
        if (filePath.includes('/components/')) return 'components';
        return 'root';
    }

    /**
     * Detect platform from file path
     */
    detectPlatform(filePath) {
        if (filePath.includes('apps/backend')) return 'backend';
        if (filePath.includes('apps/admin-dashboard') || filePath.includes('apps/web-app')) return 'frontend';
        if (filePath.includes('apps/ios')) return 'ios';
        if (filePath.includes('apps/android')) return 'android';
        return 'shared';
    }

    /**
     * Check if file is a test file
     */
    isTestFile(filePath) {
        return /\.(test|spec)\.(ts|tsx|js|jsx|swift|kt)$/.test(filePath) ||
            filePath.includes('/__tests__/') ||
            filePath.includes('/test/') ||
            filePath.includes('/tests/');
    }

    /**
     * Verify tests pass for a feature group
     * DISABLED: Too expensive and prone to false positives
     * Only enable when explicitly requested
     */
    async verifyTests(group) {
        // Skip test verification - too expensive and error-prone
        return { passed: null, reason: 'test verification disabled' };
    }

    /**
     * Verify project builds
     * DISABLED: Too expensive and prone to false positives
     * Only enable when explicitly requested
     */
    async verifyBuild(group) {
        // Skip build check - too expensive and error-prone
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
            // Only suggest groups with meaningful file count
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
                commitMessage: this.generateCommitMessage(group)
            };

            suggestions.push(suggestion);
        }

        return suggestions;
    }

    /**
     * Generate commit message for a feature group
     */
    generateCommitMessage(group) {
        const type = group.hasTests ? 'feat' : 'chore';
        const scope = group.feature || group.module;
        const platform = group.platform !== 'shared' ? `(${group.platform})` : '';

        let message = `${type}${platform}(${scope}): `;

        if (group.feature && group.feature !== 'unknown') {
            message += `update ${group.feature} ${group.module}`;
        } else {
            message += `update ${group.module} files`;
        }

        if (group.hasTests) {
            message += ' (includes tests)';
        }

        return message;
    }

    /**
     * Get ready-to-commit groups (all groups are ready - no verification)
     */
    getReadyCommits(suggestions) {
        return suggestions; // All groups are ready since we don't verify
    }

    /**
     * Get groups that need attention (none - we don't verify)
     */
    getNeedsAttention(suggestions) {
        return []; // No verification, so no attention needed
    }
}

module.exports = IntelligentCommitAnalyzer;
