const env = require('../../../config/env.js');

const { DomainError } = require('../../../domain/errors');

class CursorApiDataSource {
    constructor({
        apiUrl = process.env.CURSOR_API_URL,
        apiToken = process.env.CURSOR_API_TOKEN,
        fetchImpl = typeof fetch === 'function' ? fetch.bind(globalThis) : null,
        logger = console
    } = {}) {
        this.apiUrl = apiUrl;
        this.apiToken = apiToken;
        this.fetch = fetchImpl;
        this.logger = logger;
        this.failureCount = 0;
        this.failureThreshold = 5;
        this.circuitOpenUntil = null;
        this.circuitResetTimeoutMs = 60000;
    }

    isCircuitOpen() {
        if (!this.circuitOpenUntil) return false;
        if (Date.now() >= this.circuitOpenUntil) {
            this.circuitOpenUntil = null;
            this.failureCount = 0;
            return false;
        }
        return true;
    }

    recordFailure() {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.circuitOpenUntil = Date.now() + this.circuitResetTimeoutMs;
            if (this.logger && this.logger.warn) {
                this.logger.warn('CURSOR_API_CIRCUIT_BREAKER_OPEN', {
                    failureCount: this.failureCount,
                    resetTimeoutMs: this.circuitResetTimeoutMs
                });
            }
        }
    }

    recordSuccess() {
        this.failureCount = 0;
        this.circuitOpenUntil = null;
    }

    circuitBreaker() {
        return this.isCircuitOpen();
    }

    async fetchUsage(maxRetries = 3, initialDelayMs = 1000) {
        if (!this.apiUrl || !this.fetch) {
            return null;
        }

        if (this.isCircuitOpen()) {
            if (this.logger && this.logger.warn) {
                this.logger.warn('CURSOR_API_CIRCUIT_BREAKER_OPEN', { message: 'Circuit is open, skipping request' });
            }
            return null;
        }

        const retryPolicy = { maxAttempts: maxRetries, backoff: 'exponential' };
        const requestTimeoutMs = 30000;

        for (let attempt = 0; attempt <= retryPolicy.maxAttempts; attempt++) {
            try {
                const abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
                const timeoutId = abortController ? setTimeout(() => abortController.abort(), requestTimeoutMs) : null;

                try {
                    const response = await this.fetch(this.apiUrl, {
                        headers: this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : {},
                        signal: abortController?.signal
                    });

                    if (timeoutId) clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new DomainError(`Cursor API error: status ${response.status}`, 'API_ERROR');
                    }

                    const payload = await response.json();
                    if (!payload) {
                        return null;
                    }

                    this.recordSuccess();
                    return payload;
                } catch (fetchError) {
                    if (timeoutId) clearTimeout(timeoutId);
                    if (fetchError.name === 'AbortError') {
                        throw new DomainError(`Request timeout after ${requestTimeoutMs}ms`, 'TIMEOUT_ERROR');
                    }
                    throw fetchError;
                }
            } catch (error) {
                const isLastAttempt = attempt === retryPolicy.maxAttempts;
                if (isLastAttempt) {
                    this.recordFailure();
                    if (this.logger && this.logger.warn) {
                        this.logger.warn('CURSOR_API_DATASOURCE_FAILED', { error: error.message, attempts: attempt + 1 });
                    }
                    return null;
                }

                if (retryPolicy.backoff === 'exponential') {
                    const delayMs = initialDelayMs * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        }
        return null;
    }
}

module.exports = CursorApiDataSource;
