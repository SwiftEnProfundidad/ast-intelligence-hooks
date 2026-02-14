const env = require('../../config/env');

const path = require('path');
const ICursorTokenRepository = require('../../domain/repositories/ICursorTokenRepository');
const CursorApiDataSource = require('./datasources/CursorApiDataSource');
const CursorFileDataSource = require('./datasources/CursorFileDataSource');

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
        this.apiDataSource = new CursorApiDataSource({ apiUrl, apiToken, fetchImpl, logger });
        this.fileDataSource = new CursorFileDataSource({ usageFile, logger });
        this.logger = logger;
    }

    /**
     * Fetches token usage from API with exponential backoff retry policy.
     */
    async getUsageFromApi(maxRetries = 3, initialDelayMs = 1000) {
        const payload = await this.apiDataSource.fetchUsage(maxRetries, initialDelayMs);
        if (!payload) {
            return null;
        }
        return this._normalizePayload(payload, 'api');
    }

    async getUsageFromFile() {
        const payload = await this.fileDataSource.readUsage();
        if (!payload) {
            return null;
        }
        return this._normalizePayload(payload, 'file');
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
