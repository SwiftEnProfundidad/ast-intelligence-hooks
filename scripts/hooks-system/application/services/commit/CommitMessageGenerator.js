const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class CommitMessageGenerator {
    constructor(logger = console) {
        const m_constructor = createMetricScope({
            hook: 'commit_message_generator',
            operation: 'constructor'
        });

        m_constructor.started();
        this.logger = logger;
        m_constructor.success();
    }

    /**
     * Generate commit message for a feature group
     */
    generate(group) {
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

        if (this.logger && this.logger.debug) {
            this.logger.debug('COMMIT_MESSAGE_GENERATED', { group: group.module, message });
        }

        return message;
    }
}

module.exports = CommitMessageGenerator;
