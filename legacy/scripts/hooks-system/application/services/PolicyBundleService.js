const crypto = require('crypto');

class PolicyBundleService {
    createBundle({ platforms, mandatory, enforcedAt, rulesSources = [] }) {
        const bundleId = this._generateBundleId(platforms, rulesSources);
        const ttlMinutes = 10;
        const createdAt = new Date();
        const expiresAt = new Date(createdAt.getTime() + ttlMinutes * 60000);

        return {
            policy_bundle_id: bundleId,
            platforms,
            mandatory,
            enforcedAt,
            rules_sources: rulesSources,
            createdAt: createdAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            ttl_minutes: ttlMinutes
        };
    }

    validateMandatory(bundle) {
        if (!bundle || typeof bundle.mandatory !== 'boolean') {
            return false;
        }

        return bundle.mandatory === true;
    }

    isExpired(bundle) {
        if (!bundle || !bundle.expiresAt) {
            return true;
        }

        const expiresAt = new Date(bundle.expiresAt);
        return Date.now() >= expiresAt.getTime();
    }

    isValid(bundle) {
        return bundle &&
            bundle.policy_bundle_id &&
            this.validateMandatory(bundle) &&
            !this.isExpired(bundle);
    }

    _generateBundleId(platforms, rulesSources) {
        const platformsStr = platforms.sort().join(',');
        const sourcesStr = rulesSources.map(s => `${s.file}:${s.sha256}`).join('|');
        const input = `${platformsStr}:${sourcesStr}:${Date.now()}`;
        return `bundle-${crypto.createHash('sha256').update(input, 'utf8').digest('hex').substring(0, 16)}`;
    }
}

module.exports = PolicyBundleService;
