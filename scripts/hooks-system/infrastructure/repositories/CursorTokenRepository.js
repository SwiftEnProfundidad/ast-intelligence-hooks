const fs = require('fs');
const path = require('path');
const { DomainError } = require('../../../domain/errors');
const ICursorTokenRepository = require('../../domain/repositories/ICursorTokenRepository');

const DEFAULT_MAX_TOKENS = 1_000_000;

class CursorTokenRepository extends ICursorTokenRepository {
    constructor({
        usageFile = path.join(process.cwd(), '.audit_tmp', 'token-usage.jsonl'),
        apiUrl = process.env.CURSOR_API_URL,
        apiToken = process.env.CURSOR_API_TOKEN,
        fetchImpl = typeof fetch === 'function' ? fetch.bind(globalThis) : null,
        logger = console
    } = {}) {
        super();
        this.usageFile = usageFile;
        this.apiUrl = apiUrl;
        this.apiToken = apiToken;
        this.fetch = fetchImpl;
        this.logger = logger;
    }

    /**
     * Fetches token usage from API with exponential backoff retry policy.
     */
    async getUsageFromApi(maxRetries = 3, initialDelayMs = 1000) {
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

                    return this._normalizePayload(payload, 'api');
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
                    this.logger.warn?.('CURSOR_REPO_API_FAILED', { error: error.message, attempts: attempt + 1 });
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

    async getUsageFromFile() {
        try {
            await fs.promises.access(this.usageFile, fs.constants.F_OK);
        } catch (error) {
            this.logger.debug?.('CURSOR_REPO_FILE_NOT_FOUND', { path: this.usageFile, error: error.message });
            return null;
        }

        try {
            const content = await fs.promises.readFile(this.usageFile, 'utf8');
            const lines = content.trimEnd().split('\n');
            for (let index = lines.length - 1; index >= 0; index -= 1) {
                const line = lines[index].trim();
                if (!line) {
                    continue;
                }
                try {
                    const parsed = JSON.parse(line);
                    if (parsed && typeof parsed === 'object') {
                        return this._normalizePayload(parsed, 'file');
                    }
                } catch (error) {
                    this.logger.debug?.('CURSOR_REPO_MALFORMED_LINE', { error: error.message });
                }
            }
            return null;
        } catch (error) {
            this.logger.error?.('CURSOR_REPO_FILE_READ_FAILED', { error: error.message });
            return null;
        }
    }

    _normalizePayload(payload, defaultSource) {
        const tokensUsed = this._coerceNumber(payload.tokensUsed) ?? 0;
        const maxTokens = this._coerceNumber(payload.maxTokens) ?? DEFAULT_MAX_TOKENS;
        const percentUsed = this._coerceNumber(payload.percentUsed) ?? (tokensUsed / maxTokens) * 100;
        const timestamp = payload.timestamp || new Date().toISOString();

        let source = defaultSource;
        if (payload.source) {
            source = payload.source === 'heuristic' ? 'heuristic' : payload.source;
        }

        return {
            tokensUsed,
            maxTokens,
            percentUsed,
            timestamp,
            source,
            untrusted: source === 'heuristic'
        };
    }

    _coerceNumber(value) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
        return null;
    }
}

module.exports = CursorTokenRepository;
