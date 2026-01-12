const crypto = require('crypto');

class RulesDigestService {
    buildEntry({ file, content, path }) {
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return {
                file,
                path: path || null,
                verified: false,
                summary: 'not found',
                sha256: null,
                linesRead: 0
            };
        }

        const sha256 = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
        const linesRead = content.split('\n').length;
        const summary = this._extractSummary(content);

        return {
            file,
            path: path || null,
            verified: true,
            summary,
            sha256,
            linesRead
        };
    }

    _extractSummary(content) {
        const lines = content.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 0 && trimmed !== '---';
        });

        if (lines.length === 0) {
            return 'not found';
        }

        const firstMeaningfulLine = lines.find(line => {
            const trimmed = line.trim();
            return !trimmed.startsWith('#') && !trimmed.startsWith('title:');
        });

        if (!firstMeaningfulLine) {
            return lines[0].trim();
        }

        return firstMeaningfulLine.trim().substring(0, 100);
    }
}

module.exports = RulesDigestService;
