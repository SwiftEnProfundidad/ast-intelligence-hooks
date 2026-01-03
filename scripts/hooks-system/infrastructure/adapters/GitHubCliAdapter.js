const { execSync } = require('child_process');
const AuditLogger = require('../../application/services/logging/AuditLogger');

class GitHubCliAdapter {
    constructor(repoRoot, logger = console, options = {}) {
        this.repoRoot = repoRoot;
        this.logger = logger;
        this.auditLogger = new AuditLogger({ repoRoot, logger });
        this.options = {
            timeout: options.timeout || 30000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000
        };
    }

    createPullRequest(base, head, title, body) {
        const command = `gh pr create --base ${base} --head ${head} --title "${title}" --body "${body}"`;
        const output = this._execWithRetry(command);

        if (!output) return null;

        const urlMatch = output.match(/https:\/\/github\.com\/.*\/pull\/\d+/);
        return urlMatch ? urlMatch[0] : null;
    }

    mergePullRequest(prUrl) {
        const prNumber = prUrl.split('/').pop();
        const command = `gh pr merge ${prNumber} --merge`;
        return this._execWithRetry(command) !== null;
    }

    isAvailable() {
        return this._execWithRetry('gh auth status', { retries: 0 }) !== null; // Don't retry auth check too much
    }

    _execWithRetry(command, options = {}) {
        const timeout = this.options.timeout;
        const maxRetries = options.retries !== undefined ? options.retries : this.options.maxRetries;
        let attempt = 0;

        while (attempt <= maxRetries) {
            try {
                if (this.logger.debug) {
                    this.logger.debug('GH_EXEC', { command, attempt: attempt + 1 });
                }

                return execSync(command, {
                    cwd: this.repoRoot,
                    encoding: 'utf-8',
                    timeout: timeout,
                    stdio: ['pipe', 'pipe', 'pipe']
                }).trim();
            } catch (error) {
                if (this.logger.warn) {
                    this.logger.warn('GH_EXEC_FAILED', { command, error: error.message, attempt: attempt + 1 });
                }

                // If it's a logic error (e.g. branch not found, auth failed), don't retry?
                // For now, simple retry for network flakes.
                // gh often returns exit code 1 for logic errors.
                // We might want to stop if it says "unknown command" or "not logged in".
                if (this._isFatalError(error.message)) {
                    break;
                }

                if (attempt >= maxRetries) break;

                this._sleep(this.options.retryDelay * Math.pow(2, attempt));
                attempt++;
            }
        }
        return null;
    }

    _isFatalError(message) {
        return message.includes('not logged in') ||
            message.includes('unknown command') ||
            message.includes('pull request already exists');
    }

    _sleep(ms) {
        const start = Date.now();
        while (Date.now() - start < ms) { }
    }
}

module.exports = GitHubCliAdapter;
