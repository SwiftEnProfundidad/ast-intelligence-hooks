/**
 * =============================================================================
 * RetryPolicy - Enterprise Resilience for AST Intelligence
 * =============================================================================
 * Configurable retry strategies with exponential backoff, jitter, and hooks
 */

class RetryPolicy {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries ?? 3;
        this.baseDelay = options.baseDelay ?? 1000;
        this.maxDelay = options.maxDelay ?? 30000;
        this.backoffMultiplier = options.backoffMultiplier ?? 2;
        this.jitter = options.jitter ?? true;
        this.retryOn = options.retryOn || this._defaultRetryOn;
        this.onRetry = options.onRetry || (() => { });
    }

    _defaultRetryOn(error) {
        if (error.name === 'CircuitBreakerError') return false;
        if (error.code === 'ECONNREFUSED') return true;
        if (error.code === 'ETIMEDOUT') return true;
        if (error.code === 'ENOTFOUND') return true;
        if (error.message?.includes('timeout')) return true;
        if (error.message?.includes('rate limit')) return true;
        return true;
    }

    _calculateDelay(attempt) {
        let delay = this.baseDelay * Math.pow(this.backoffMultiplier, attempt);
        delay = Math.min(delay, this.maxDelay);

        if (this.jitter) {
            const jitterRange = delay * 0.2;
            delay = delay - jitterRange + (Math.random() * jitterRange * 2);
        }

        return Math.round(delay);
    }

    async execute(fn) {
        let lastError;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (attempt === this.maxRetries) {
                    throw new RetryExhaustedError(
                        `All ${this.maxRetries + 1} attempts failed`,
                        lastError,
                        attempt + 1
                    );
                }

                const shouldRetry = typeof this.retryOn === 'function'
                    ? this.retryOn(error, attempt)
                    : true;

                if (!shouldRetry) {
                    throw error;
                }

                const delay = this._calculateDelay(attempt);

                this.onRetry({
                    attempt: attempt + 1,
                    maxRetries: this.maxRetries,
                    delay,
                    error: error.message
                });

                await this._sleep(delay);
            }
        }

        throw lastError;
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static immediate(maxRetries = 3) {
        return new RetryPolicy({
            maxRetries,
            baseDelay: 0,
            jitter: false
        });
    }

    static linear(maxRetries = 3, delay = 1000) {
        return new RetryPolicy({
            maxRetries,
            baseDelay: delay,
            backoffMultiplier: 1,
            jitter: false
        });
    }

    static exponential(maxRetries = 3, baseDelay = 1000) {
        return new RetryPolicy({
            maxRetries,
            baseDelay,
            backoffMultiplier: 2,
            jitter: true
        });
    }

    static aggressive(maxRetries = 5, baseDelay = 500) {
        return new RetryPolicy({
            maxRetries,
            baseDelay,
            backoffMultiplier: 1.5,
            maxDelay: 10000,
            jitter: true
        });
    }
}

class RetryExhaustedError extends Error {
    constructor(message, lastError, attempts) {
        super(message);
        this.name = 'RetryExhaustedError';
        this.lastError = lastError;
        this.attempts = attempts;
    }
}

async function withRetry(fn, options = {}) {
    const policy = new RetryPolicy(options);
    return policy.execute(fn);
}

module.exports = {
    RetryPolicy,
    RetryExhaustedError,
    withRetry
};
