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
            linesRead,
            content
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

    generateCompactDigest(rulesSources, rulesContent) {
        if (!rulesContent || typeof rulesContent !== 'string') {
            return {
                never_do: [],
                must_do: [],
                sources: rulesSources || [],
                digest_sha256: null,
                generated_at: new Date().toISOString()
            };
        }

        const lines = rulesContent.split('\n');
        const neverRules = [];
        const mustRules = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('❌') || /nunca|never|prohibido|forbidden/i.test(trimmed.toLowerCase())) {
                if (trimmed.startsWith('❌') || trimmed.toLowerCase().includes('nunca') || trimmed.toLowerCase().includes('never')) {
                    neverRules.push(trimmed.substring(0, 150));
                }
            } else if (trimmed.startsWith('✅')) {
                mustRules.push(trimmed.substring(0, 150));
            }
        }

        const digest = {
            never_do: neverRules.slice(0, 20),
            must_do: mustRules.slice(0, 20),
            sources: rulesSources || [],
            generated_at: new Date().toISOString()
        };

        const digestContent = JSON.stringify(digest);
        const sha256 = crypto.createHash('sha256').update(digestContent, 'utf8').digest('hex');
        digest.digest_sha256 = sha256;

        return digest;
    }
}

module.exports = RulesDigestService;
