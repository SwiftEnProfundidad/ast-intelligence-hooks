const { DomainError } = require('../../../../domain/errors');

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
    }

    async fetchUsage(maxRetries = 3, initialDelayMs = 1000) {
        if (!this.apiUrl || !this.fetch) {
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
