const env = require('../../../config/env');
const AuditLogger = require('../../../application/services/logging/AuditLogger');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EvidenceService {
    constructor(repoRoot, logger) {
        this.repoRoot = repoRoot || process.env.REPO_ROOT || process.cwd();
        this.auditLogger = new AuditLogger({ repoRoot: this.repoRoot, logger });
        this.evidenceFile = path.join(this.repoRoot, '.AI_EVIDENCE.json');
        this.maxEvidenceAge = 180; // 3 minutes
        this.logger = logger;
    }

    getCurrentBranch() {
        try {
            const branch = execSync('git branch --show-current', {
                cwd: this.repoRoot,
                encoding: 'utf-8'
            }).trim();
            return branch || 'unknown';
        } catch (err) {
            if (this.logger) this.logger.warn('GIT_BRANCH_ERROR', { error: err.message });
            return 'unknown';
        }
    }

    checkStatus() {
        try {
            if (!fs.existsSync(this.evidenceFile)) {
                return {
                    status: 'missing',
                    message: '.AI_EVIDENCE.json not found',
                    action: `Run: ai-start ${this.getCurrentBranch()}`,
                    age: null,
                    isStale: true
                };
            }

            const evidence = JSON.parse(fs.readFileSync(this.evidenceFile, 'utf-8'));
            const timestamp = evidence.timestamp;

            if (!timestamp) {
                return {
                    status: 'invalid',
                    message: 'No timestamp in .AI_EVIDENCE.json',
                    action: `Run: ai-start ${this.getCurrentBranch()}`,
                    age: null,
                    isStale: true
                };
            }

            const evidenceTime = new Date(timestamp).getTime();
            const currentTime = Date.now();
            const ageSeconds = Math.floor((currentTime - evidenceTime) / 1000);
            const isStale = ageSeconds > this.maxEvidenceAge;

            const result = {
                status: isStale ? 'stale' : 'fresh',
                message: isStale
                    ? `Evidence is STALE (${ageSeconds}s old, max ${this.maxEvidenceAge}s)`
                    : `Evidence is fresh (${ageSeconds}s old)`,
                action: isStale ? `Run: ai-start ${this.getCurrentBranch()}` : null,
                age: ageSeconds,
                isStale: isStale,
                timestamp: timestamp,
                session: evidence.session || 'unknown',
                currentBranch: this.getCurrentBranch()
            };

            if (this.logger && this.logger.debug) {
                this.logger.debug('EVIDENCE_CHECKED', { status: result.status, age: result.age });
            }

            return result;
        } catch (err) {
            if (this.logger) this.logger.error('EVIDENCE_CHECK_ERROR', { error: err.message });
            return {
                status: 'error',
                message: `Error checking evidence: ${err.message}`,
                action: `Run: ai-start ${this.getCurrentBranch()}`,
                age: null,
                isStale: true
            };
        }
    }
}

module.exports = EvidenceService;
