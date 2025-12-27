const path = require('path');

class SmartDirtyTreeAnalyzer {
    constructor({
        platformDetector = null,
        repoRoot = process.cwd(),
        logger = console
    } = {}) {
        this.platformDetector = platformDetector;
        this.repoRoot = repoRoot;
        this.logger = logger;
        this.platformPatterns = {
            backend: [/\.js$/, /\.ts$/, /\.mjs$/, /\.cjs$/],
            frontend: [/\.jsx$/, /\.tsx$/, /\.css$/, /\.scss$/, /\.vue$/, /\.svelte$/],
            ios: [/\.swift$/, /Package\.swift$/, /\.xcodeproj/, /\.pbxproj$/],
            android: [/\.kt$/, /\.java$/, /build\.gradle/, /\.xml$/],
            config: [/\.json$/, /\.yaml$/, /\.yml$/, /\.toml$/, /\.env/],
            docs: [/\.md$/, /\.txt$/, /README/, /CHANGELOG/],
            test: [/\.spec\./, /\.test\./, /__tests__/]
        };
        this.commitTypePatterns = {
            feat: ['feature/', 'feat/', 'add', 'new', 'create', 'implement'],
            fix: ['fix/', 'bugfix/', 'hotfix/', 'patch'],
            refactor: ['refactor/', 'clean', 'restructure'],
            docs: ['docs/', 'documentation', 'readme', 'changelog'],
            test: ['test/', 'spec/', '__tests__'],
            chore: ['chore/', 'config/', 'build/', 'ci/'],
            style: ['style/', 'css/', 'scss/', 'styling']
        };
    }

    analyze(files) {
        if (!files || !Array.isArray(files) || files.length === 0) {
            return {
                groups: [],
                suggestions: [],
                orphans: [],
                shouldAlert: false,
                summary: 'No files to analyze'
            };
        }

        this.logger.debug(`[SmartDirtyTreeAnalyzer] Analyzing ${files.length} files`);

        const groups = this.groupByContext(files);
        const suggestions = groups.map(g => this.suggestCommitMessage(g));
        const groupedFiles = new Set(groups.flatMap(g => g.files));
        const orphans = files.filter(f => !groupedFiles.has(f));

        const shouldAlert = orphans.length > 0 || groups.length > 3;

        return {
            groups,
            suggestions,
            orphans,
            shouldAlert,
            summary: this.buildSummary(groups, orphans)
        };
    }

    groupByContext(files) {
        const byDirectory = new Map();
        const byPlatform = new Map();

        for (const file of files) {
            const dir = this.getContextDirectory(file);
            const platform = this.detectPlatform(file);

            if (!byDirectory.has(dir)) {
                byDirectory.set(dir, []);
            }
            byDirectory.get(dir).push(file);

            if (!byPlatform.has(platform)) {
                byPlatform.set(platform, []);
            }
            byPlatform.get(platform).push(file);
        }

        const groups = [];
        const assigned = new Set();

        for (const [dir, dirFiles] of byDirectory.entries()) {
            if (dirFiles.length >= 2) {
                const unassigned = dirFiles.filter(f => !assigned.has(f));
                if (unassigned.length >= 2) {
                    const platform = this.detectPlatform(unassigned[0]);
                    const commitType = this.inferCommitType(unassigned, dir);
                    groups.push({
                        context: dir,
                        platform,
                        commitType,
                        files: unassigned
                    });
                    unassigned.forEach(f => assigned.add(f));
                }
            }
        }

        for (const [platform, platformFiles] of byPlatform.entries()) {
            const unassigned = platformFiles.filter(f => !assigned.has(f));
            if (unassigned.length >= 2) {
                const commitType = this.inferCommitType(unassigned, platform);
                groups.push({
                    context: platform,
                    platform,
                    commitType,
                    files: unassigned
                });
                unassigned.forEach(f => assigned.add(f));
            }
        }

        const remaining = files.filter(f => !assigned.has(f));
        if (remaining.length > 0) {
            const testFiles = remaining.filter(f => this.isTestFile(f));
            const nonTestFiles = remaining.filter(f => !this.isTestFile(f));

            if (testFiles.length >= 2) {
                groups.push({
                    context: 'tests',
                    platform: 'test',
                    commitType: 'test',
                    files: testFiles
                });
                testFiles.forEach(f => assigned.add(f));
            }

            if (nonTestFiles.length >= 2) {
                groups.push({
                    context: 'misc',
                    platform: 'other',
                    commitType: 'chore',
                    files: nonTestFiles
                });
                nonTestFiles.forEach(f => assigned.add(f));
            }
        }

        return groups;
    }

    getContextDirectory(file) {
        const parts = file.split(path.sep);
        if (parts.length <= 2) {
            return parts[0] || 'root';
        }
        return parts.slice(0, 2).join(path.sep);
    }

    detectPlatform(file) {
        if (this.platformDetector && typeof this.platformDetector.detectPlatformFromFile === 'function') {
            const detected = this.platformDetector.detectPlatformFromFile(file);
            if (detected && detected !== 'other') {
                return detected;
            }
        }

        for (const [platform, patterns] of Object.entries(this.platformPatterns)) {
            if (patterns.some(p => p.test(file))) {
                return platform;
            }
        }

        return 'other';
    }

    inferCommitType(files, context) {
        const lowerContext = (context || '').toLowerCase();

        for (const [type, patterns] of Object.entries(this.commitTypePatterns)) {
            if (patterns.some(p => lowerContext.includes(p))) {
                return type;
            }
        }

        if (files.some(f => this.isTestFile(f))) {
            return 'test';
        }

        if (files.some(f => /\.md$/.test(f))) {
            return 'docs';
        }

        if (files.some(f => /\.json$|\.yaml$|\.yml$/.test(f))) {
            return 'chore';
        }

        return 'feat';
    }

    isTestFile(file) {
        return /\.spec\.|\.test\.|__tests__/.test(file);
    }

    suggestCommitMessage(group) {
        const { context, platform, commitType, files } = group;
        const scope = this.inferScope(context, platform);
        const action = this.inferAction(files);

        return {
            type: commitType,
            scope,
            message: `${commitType}(${scope}): ${action}`,
            files: files.length,
            fileList: files.slice(0, 5)
        };
    }

    inferScope(context, platform) {
        if (context && context !== 'misc' && context !== 'other') {
            const parts = context.split(path.sep);
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.length <= 20) {
                return lastPart.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            }
        }

        if (platform && platform !== 'other') {
            return platform;
        }

        return 'general';
    }

    inferAction(files) {
        if (files.length === 1) {
            const basename = path.basename(files[0]);
            return `update ${basename}`;
        }

        const extensions = new Set(files.map(f => path.extname(f)).filter(Boolean));
        if (extensions.size === 1) {
            const ext = Array.from(extensions)[0];
            return `update ${files.length} ${ext} files`;
        }

        return `update ${files.length} files`;
    }

    buildSummary(groups, orphans) {
        const lines = [];

        if (groups.length > 0) {
            lines.push('📦 Suggested commits:');
            groups.forEach((g, i) => {
                const suggestion = this.suggestCommitMessage(g);
                lines.push(`  ${i + 1}. ${suggestion.message} (${g.files.length} files)`);
            });
        }

        if (orphans.length > 0) {
            lines.push('');
            lines.push(`⚠️ Ungrouped files (${orphans.length}):`);
            orphans.slice(0, 5).forEach(f => {
                lines.push(`  - ${f}`);
            });
            if (orphans.length > 5) {
                lines.push(`  ... and ${orphans.length - 5} more`);
            }
        }

        return lines.join('\n');
    }

    formatNotification(analysis) {
        if (!analysis.shouldAlert) {
            return null;
        }

        const { groups, orphans, summary } = analysis;

        if (groups.length === 0 && orphans.length === 0) {
            return null;
        }

        let message = '';

        if (groups.length > 0) {
            message += `${groups.length} commit groups detected:\n`;
            groups.forEach((g, i) => {
                const suggestion = this.suggestCommitMessage(g);
                message += `${i + 1}. ${suggestion.message}\n`;
            });
        }

        if (orphans.length > 0) {
            message += `\n⚠️ ${orphans.length} files need review`;
        }

        return {
            title: 'Smart Commit Suggestions',
            message: message.trim(),
            level: orphans.length > 0 ? 'warn' : 'info',
            summary
        };
    }
}

module.exports = SmartDirtyTreeAnalyzer;
