const env = require('../../config/env');
const AuditLogger = require('../../application/services/logging/AuditLogger');

const GitCommandRunner = require('./git/GitCommandRunner');

class GitCliAdapter {
    constructor(config = {}) {
        this.repoRoot = config.repoRoot || process.cwd();
        this.logger = config.logger || console;
        this.auditLogger = new AuditLogger({ repoRoot: this.repoRoot, logger: this.logger });
        this.protectedBranches = config.protectedBranches || ['main', 'master', 'develop'];
        this.runner = new GitCommandRunner(this.repoRoot, this.logger);
    }

    exec(command, options = {}) {
        return this.runner.exec(command, options);
    }
}

module.exports = GitCliAdapter;
