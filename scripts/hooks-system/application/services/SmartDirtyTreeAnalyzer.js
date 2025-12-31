const FeatureDetector = require('./commit/FeatureDetector');
const FileContextGrouper = require('./smart-commit/FileContextGrouper');
const CommitMessageSuggester = require('./smart-commit/CommitMessageSuggester');
const SmartCommitSummaryBuilder = require('./smart-commit/SmartCommitSummaryBuilder');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class SmartDirtyTreeAnalyzer {
    constructor({
        platformDetector = null,
        repoRoot = process.cwd(),
        logger = console
    } = {}) {
        const m_constructor = createMetricScope({
            hook: 'smart_dirty_tree_analyzer',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = repoRoot;
        this.logger = logger;

        this.featureDetector = new FeatureDetector(logger);
        this.grouper = new FileContextGrouper(this.featureDetector, platformDetector);
        this.suggester = new CommitMessageSuggester(this.featureDetector);
        this.summaryBuilder = new SmartCommitSummaryBuilder();
        m_constructor.success();
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

        if (this.logger.debug) {
            this.logger.debug(`[SmartDirtyTreeAnalyzer] Analyzing ${files.length} files`);
        }

        const { groups, orphans } = this.grouper.group(files);
        const suggestions = groups.map(g => this.suggester.suggest(g));
        const summary = this.summaryBuilder.build(suggestions, orphans);

        const shouldAlert = orphans.length > 0 || groups.length > 3;

        return {
            groups,
            suggestions,
            orphans,
            shouldAlert,
            summary
        };
    }

    formatNotification(analysis) {
        if (!analysis || !analysis.shouldAlert) {
            return null;
        }
        return this.summaryBuilder.formatNotification(
            analysis.suggestions,
            analysis.orphans,
            analysis.summary
        );
    }
}

module.exports = SmartDirtyTreeAnalyzer;
