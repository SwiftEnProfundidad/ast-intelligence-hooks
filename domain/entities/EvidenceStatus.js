class EvidenceStatus {
    constructor({ timestamp, ageSeconds, maxAgeSeconds, sessionId, workType, platforms, branch, filesModified, infraModified }) {
        if (!(timestamp instanceof Date)) {
            throw new Error('EvidenceStatus.timestamp must be a Date');
        }
        this.timestamp = timestamp;
        this.ageSeconds = typeof ageSeconds === 'number' ? ageSeconds : 0;
        this.maxAgeSeconds = typeof maxAgeSeconds === 'number' ? maxAgeSeconds : 0;
        this.sessionId = sessionId || null;
        this.workType = workType || null;
        this.platforms = Array.isArray(platforms) ? platforms : [];
        this.branch = branch || null;
        this.filesModified = Array.isArray(filesModified) ? filesModified : [];
        this.infraModified = Array.isArray(infraModified) ? infraModified : [];
    }

    isStale() {
        if (!this.maxAgeSeconds || this.maxAgeSeconds <= 0) {
            return false;
        }
        return this.ageSeconds > this.maxAgeSeconds;
    }

    getStatus() {
        if (!this.timestamp) {
            return 'invalid';
        }
        return this.isStale() ? 'stale' : 'fresh';
    }

    toJSON() {
        return {
            timestamp: this.timestamp.toISOString(),
            ageSeconds: this.ageSeconds,
            maxAgeSeconds: this.maxAgeSeconds,
            sessionId: this.sessionId,
            workType: this.workType,
            platforms: this.platforms,
            branch: this.branch,
            filesModified: this.filesModified,
            infraModified: this.infraModified,
            status: this.getStatus()
        };
    }

    static fromEvidenceJson(evidenceJson, options) {
        if (!evidenceJson || typeof evidenceJson !== 'object') {
            throw new Error('EvidenceStatus.fromEvidenceJson requires an object');
        }
        const now = (options && options.now) instanceof Date ? options.now : new Date();
        const maxAgeSeconds = options && typeof options.maxAgeSeconds === 'number' ? options.maxAgeSeconds : 0;
        const timestampString = evidenceJson.timestamp;
        if (!timestampString) {
            throw new Error('Evidence JSON is missing timestamp');
        }
        const timestamp = new Date(timestampString);
        if (Number.isNaN(timestamp.getTime())) {
            throw new Error('Evidence JSON has invalid timestamp');
        }
        const ageSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
        const platforms = Array.isArray(evidenceJson.platforms) ? evidenceJson.platforms : [];
        const filesModified = Array.isArray(evidenceJson.files_modified) ? evidenceJson.files_modified : [];
        const infraModified = Array.isArray(evidenceJson.infra_modified) ? evidenceJson.infra_modified : [];
        return new EvidenceStatus({
            timestamp,
            ageSeconds,
            maxAgeSeconds,
            sessionId: evidenceJson.session_id || null,
            workType: evidenceJson.work_type || null,
            platforms,
            branch: evidenceJson.current_context && evidenceJson.current_context.branch ? evidenceJson.current_context.branch : null,
            filesModified,
            infraModified
        });
    }
}

module.exports = EvidenceStatus;
