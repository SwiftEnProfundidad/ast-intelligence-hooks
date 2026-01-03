const env = require('../../config/env');
const AuditLogger = require('../../application/services/logging/AuditLogger');

const IGitQueryPort = require('../../domain/ports/IGitQueryPort');
const GitCommandRunner = require('./git/GitCommandRunner');
const GitQueryService = require('./git/GitQueryService');

class GitQueryAdapter extends IGitQueryPort {
    constructor(config = {}) {
        super();
        this.repoRoot = config.repoRoot || process.cwd();
        this.logger = config.logger || console;
        this.auditLogger = new AuditLogger({ repoRoot: this.repoRoot, logger: this.logger });
        this.protectedBranches = config.protectedBranches || ['main', 'master', 'develop'];

        this.runner = new GitCommandRunner(this.repoRoot, this.logger);
        this.queryService = new GitQueryService(this.runner);
    }

    getCurrentBranch() {
        return this.queryService.getCurrentBranch();
    }

    isProtectedBranch() {
        const current = this.getCurrentBranch();
        return this.protectedBranches.includes(current);
    }

    getUncommittedChanges() {
        return this.queryService.getUncommittedChanges();
    }

    getStagedFiles() {
        return this.queryService.getStagedFiles();
    }

    hasUncommittedChanges() {
        return this.queryService.hasUncommittedChanges();
    }

    hasStagedChanges() {
        return this.queryService.hasStagedChanges();
    }

    getRecentCommits(count = 5) {
        return this.queryService.getRecentCommits(count);
    }

    getDiff(cached = false) {
        return this.queryService.getDiff(cached);
    }

    getStatusShort() {
        return this.queryService.getStatusShort();
    }

    getLog(count = 10) {
        return this.queryService.getLog(count);
    }
}

module.exports = GitQueryAdapter;
