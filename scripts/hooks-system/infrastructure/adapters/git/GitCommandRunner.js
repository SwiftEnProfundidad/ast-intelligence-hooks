const { execSync } = require('child_process');

class GitCommandRunner {
    constructor(repoRoot, logger = console) {
        this.repoRoot = repoRoot;
        this.logger = logger;
    }

    exec(command) {
        try {
            if (this.logger && this.logger.debug) {
                this.logger.debug('GIT_EXEC', { command });
            }

            return execSync(command, {
                cwd: this.repoRoot,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe']
            }).trim();
        } catch (error) {
            if (this.logger && this.logger.error) {
                this.logger.error('GIT_EXEC_FAILED', { command, error: error.message });
            }
            return null;
        }
    }
}

module.exports = GitCommandRunner;
