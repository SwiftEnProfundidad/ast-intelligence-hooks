class CommitMessageGenerator {
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

        return message;
    }
}

module.exports = CommitMessageGenerator;
