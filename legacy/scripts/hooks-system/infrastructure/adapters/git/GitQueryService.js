const AuditLogger = require('../../../application/services/logging/AuditLogger');

class GitQueryService {
    constructor(commandRunner) {
        this.runner = commandRunner;
        this.auditLogger = new AuditLogger({ repoRoot: process.cwd() });
    }

    getCurrentBranch() {
        return this.runner.exec('git branch --show-current') || 'unknown';
    }

    getUncommittedChanges() {
        return this.runner.exec('git status --porcelain') || '';
    }

    getStagedFiles() {
        const output = this.runner.exec('git diff --cached --name-only');
        if (!output) return [];
        return output.split('\n').filter(f => f.trim().length > 0);
    }

    hasUncommittedChanges() {
        const changes = this.getUncommittedChanges();
        return changes.length > 0;
    }

    hasStagedChanges() {
        const staged = this.getStagedFiles();
        return staged.length > 0;
    }

    getRecentCommits(count = 5) {
        const output = this.runner.exec(`git log -${count} --oneline`);
        if (!output) return [];
        return output.split('\n').filter(l => l.trim().length > 0);
    }

    getDiff(cached = false) {
        const flag = cached ? '--cached' : '';
        return this.runner.exec(`git diff ${flag} --patch`) || '';
    }

    getStatusShort() {
        return this.runner.exec('git status --short') || '';
    }

    getLog(count = 10) {
        return this.runner.exec(`git log -${count} --pretty=format:"%H|%s" --name-only`) || '';
    }
}

module.exports = GitQueryService;
