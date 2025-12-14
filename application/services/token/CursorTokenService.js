const fs = require('fs');
const path = require('path');

const DEFAULT_MAX_TOKENS = 1_000_000;

class CursorTokenService {
    constructor({
        repoRoot = process.cwd(),
        usageFile = path.join(process.cwd(), '.audit_tmp', 'token-usage.jsonl'),
        apiUrl = process.env.CURSOR_API_URL,
        apiToken = process.env.CURSOR_API_TOKEN,
        fetchImpl = typeof fetch === 'function' ? fetch.bind(globalThis) : null,
        logger = console
    } = {}) {
        this.repoRoot = repoRoot;
        this.usageFile = usageFile;
        this.apiUrl = apiUrl;
        this.apiToken = apiToken;
        this.fetch = fetchImpl;
        this.logger = logger;
    }

    async getCurrentUsage() {
        const apiUsage = await this.fetchFromApi();
        if (apiUsage) {
            return apiUsage;
        }

        const fileUsage = await this.fetchFromFile();
        if (fileUsage) {
            return fileUsage;
        }

        return null;
    }

    async fetchFromApi() {
        if (!this.apiUrl || !this.fetch) {
            return null;
        }

        try {
            const response = await this.fetch(this.apiUrl, {
                headers: this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : {}
            });
            if (!response.ok) {
                throw new Error(`status ${response.status}`);
            }
            const payload = await response.json();
            if (!payload) {
                return null;
            }
            const tokensUsed = this.coerceNumber(payload.tokensUsed) ?? 0;
            const maxTokens = this.coerceNumber(payload.maxTokens) ?? DEFAULT_MAX_TOKENS;
            const percentUsed = this.coerceNumber(payload.percentUsed) ?? (tokensUsed / maxTokens) * 100;
            const timestamp = payload.timestamp || new Date().toISOString();

            return {
                tokensUsed,
                maxTokens,
                percentUsed,
                timestamp,
                source: 'api'
            };
        } catch (error) {
            this.logger.warn?.('CURSOR_TOKEN_SERVICE_API_FAILED', { error: error.message });
            return null;
        }
    }

    async fetchFromFile() {
        try {
            await fs.promises.access(this.usageFile, fs.constants.F_OK);
        } catch (error) {
            this.logger.debug?.('CURSOR_TOKEN_SERVICE_FILE_NOT_FOUND', { path: this.usageFile, error: error.message });
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
                        return this.normalizeFileRecord(parsed);
                    }
                } catch (error) {
                    this.logger.debug?.('CURSOR_TOKEN_SERVICE_MALFORMED_LINE', { error: error.message });
                }
            }
            return null;
        } catch (error) {
            this.logger.error?.('CURSOR_TOKEN_SERVICE_FILE_FAILED', { error: error.message });
            return null;
        }
    }

    normalizeFileRecord(record) {
        const tokensUsed = this.coerceNumber(record.tokensUsed) ?? 0;
        const maxTokens = this.coerceNumber(record.maxTokens) ?? DEFAULT_MAX_TOKENS;
        const percentUsed = this.coerceNumber(record.percentUsed) ?? (tokensUsed / maxTokens) * 100;
        const timestamp = record.timestamp || new Date().toISOString();
        const rawSource = typeof record.source === 'string' ? record.source : 'file';
        const source = rawSource === 'heuristic' ? 'heuristic' : 'file';

        return {
            tokensUsed,
            maxTokens,
            percentUsed,
            timestamp,
            source,
            untrusted: source === 'heuristic'
        };
    }

    coerceNumber(value) {
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

module.exports = CursorTokenService;
