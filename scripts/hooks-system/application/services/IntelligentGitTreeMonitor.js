const IntelligentCommitAnalyzer = require('./IntelligentCommitAnalyzer');
const { getGitTreeState } = require('./GitTreeState');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class IntelligentGitTreeMonitor {
    constructor({
        repoRoot = process.cwd(),
        notifier = console,
        logger = console,
        autoCommitEnabled = false
    } = {}) {
        const m_constructor = createMetricScope({
            hook: 'intelligent_git_tree_monitor',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = repoRoot;
        this.notifier = notifier;
        this.logger = logger;
        this.autoCommitEnabled = autoCommitEnabled;
        this.analyzer = new IntelligentCommitAnalyzer({ repoRoot, logger });
        m_constructor.success();
    }

    /**
     * Analyze git tree and suggest intelligent actions
     */
    async analyze() {
        const state = getGitTreeState({ repoRoot: this.repoRoot });

        if (state.uniqueCount === 0) {
            return { action: 'clean', message: 'Git tree is clean' };
        }

        const allFiles = [...state.stagedFiles, ...state.workingFiles];

        const suggestions = await this.analyzer.analyzeAndSuggestCommits(allFiles);
        const readyCommits = this.analyzer.getReadyCommits(suggestions);
        const needsAttention = this.analyzer.getNeedsAttention(suggestions);

        if (readyCommits.length > 0) {
            return {
                action: 'suggest_commit',
                readyCommits,
                message: `Found ${readyCommits.length} feature(s) ready to commit`,
                suggestions: readyCommits.map(c => ({
                    files: c.files,
                    fileCount: c.fileCount || c.files.length,
                    message: c.commitMessage,
                    feature: c.feature,
                    module: c.module,
                    platform: c.platform
                }))
            };
        }

        if (suggestions.length > 10) {
            return {
                action: 'too_many_features',
                suggestions,
                message: `Found ${suggestions.length} different features/modules. Consider splitting into separate commits.`,
                groups: suggestions.map(s => ({
                    feature: s.feature,
                    fileCount: s.fileCount,
                    files: s.files.slice(0, 3)
                }))
            };
        }

        return {
            action: 'info',
            suggestions,
            message: `Analyzed ${state.uniqueCount} files, found ${suggestions.length} feature groups`,
            groups: suggestions
        };
    }

    /**
     * Notify user with intelligent suggestions
     */
    async notify() {
        const analysis = await this.analyze();

        switch (analysis.action) {
            case 'clean':
                break;

            case 'suggest_commit':
                const featureList = analysis.suggestions
                    .slice(0, 3)
                    .map(s => {
                        const count = s.fileCount || (s.files ? s.files.length : 0);
                        return `${s.feature || 'unknown'} (${count} files)`;
                    })
                    .join(', ');
                const moreText = analysis.suggestions.length > 3 ? ` +${analysis.suggestions.length - 3} more` : '';

                this.notifier({
                    title: '📦 Atomic Commit Suggestions',
                    subtitle: `${analysis.readyCommits.length} feature group(s) detected`,
                    message: `${featureList}${moreText}`,
                    sound: 'Ping',
                    action: 'suggest_commit',
                    data: analysis.suggestions
                });
                break;

            case 'too_many_features':
                this.notifier({
                    title: '📦 Multiple Features Detected',
                    subtitle: `${analysis.suggestions.length} different features`,
                    message: 'Consider splitting into separate atomic commits',
                    sound: 'Submarine',
                    action: 'too_many_features',
                    data: analysis.groups
                });
                break;

            default:
                this.logger.info('Git tree analysis:', analysis);
        }
    }
}

module.exports = IntelligentGitTreeMonitor;
