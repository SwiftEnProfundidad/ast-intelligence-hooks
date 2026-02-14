const AuditLogger = require('../logging/AuditLogger');

class SmartCommitSummaryBuilder {
    constructor() {
        this.auditLogger = new AuditLogger({ repoRoot: process.cwd() });
    }

    build(suggestions, orphans) {
        const lines = [];

        if (suggestions.length > 0) {
            lines.push('📦 Suggested commits:');
            suggestions.forEach((suggestion, i) => {
                lines.push(`  ${i + 1}. ${suggestion.message} (${suggestion.files} files)`);
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

    formatNotification(suggestions, orphans, summary) {
        if (suggestions.length === 0 && orphans.length === 0) {
            return null;
        }

        let message = '';

        if (suggestions.length > 0) {
            message += `${suggestions.length} commit groups detected:\n`;
            suggestions.forEach((suggestion, i) => {
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

module.exports = SmartCommitSummaryBuilder;
