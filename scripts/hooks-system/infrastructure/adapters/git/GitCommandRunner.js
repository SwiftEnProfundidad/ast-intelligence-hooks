const { execSync } = require('child_process');
const { ConfigurationError } = require('../../../domain/errors');
const AuditLogger = require('../../../application/services/logging/AuditLogger');

class GitCommandRunner {
    constructor(repoRoot, logger = console, options = {}) {
        this.repoRoot = repoRoot;
        this.logger = logger;
        this.auditLogger = new AuditLogger({ repoRoot, logger });
        this.options = {
            timeout: options.timeout || 30000, // 30s default timeout
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            ...options
        };
    }

    exec(command, options = {}) {
        const timeout = options.timeout || this.options.timeout;
        const maxRetries = options.retries !== undefined ? options.retries : this.options.maxRetries;
        let attempt = 0;
        let lastError = null;

        while (attempt <= maxRetries) {
            try {
                if (this.logger && this.logger.debug) {
                    this.logger.debug('GIT_EXEC', { command, attempt: attempt + 1, timeout });
                }

                return execSync(command, {
                    cwd: this.repoRoot,
                    encoding: 'utf-8',
                    timeout: timeout,
                    stdio: ['pipe', 'pipe', 'pipe']
                }).trim();
            } catch (error) {
                lastError = error;
                const isRetryable = this._isRetryableError(error);

                if (this.logger && this.logger.warn) {
                    this.logger.warn('GIT_EXEC_ATTEMPT_FAILED', {
                        command,
                        attempt: attempt + 1,
                        error: error.message,
                        retryable: isRetryable
                    });
                }

                if (!isRetryable || attempt >= maxRetries) {
                    break;
                }

                this._sleep(this.options.retryDelay * Math.pow(2, attempt)); // Exponential backoff
                attempt++;
            }
        }

        if (this.logger && this.logger.error) {
            this.logger.error('GIT_EXEC_FAILED', { command, error: lastError.message, attempts: attempt + 1 });
        }
        return null;
    }

    _isRetryableError(error) {
        // Retry on lock files or temporary connection issues
        const msg = error.message || '';
        return msg.includes('index.lock') ||
            msg.includes('Temporary failure') ||
            msg.includes('Connection timed out');
    }

    _sleep(ms) {
        const start = Date.now();
        while (Date.now() - start < ms) {
            // Synchronous block for sleep since execSync is sync
        }
    }
}

module.exports = GitCommandRunner;
